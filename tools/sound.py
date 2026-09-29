"""The film's sound: the music bed and the sound effects, mixed to -14 LUFS / -1 dBTP.

Reads docs/timeline.json (tempo, bars, chapters) and out/sound/cues.json (the scenes' own event times, written by
tools/cues.mjs) and writes a stereo 48 kHz WAV for the selected chapters (default: the whole film).

The music is "Upbeat Jazz" by Francisco Alvear (Mixkit), stretched to 108 BPM and arranged to the film's 81 bars by
tools/bed.py (out/sound/bed.wav): `--music bed`, the default. It dips where the score breaks: from ch01's drop to ch02,
and from ch07's push to ch08, where it thins to a dark trace under one held low note. `--music synth` is the old
synthesized score (walking bass, brushes, vibraphone, swung 8ths, minor to major to D): kept, no longer used, and no
longer the byte-for-byte rebuild of ch01's approved sketch it once was, since its synths are the ones the effects now use.

The effects are synthesized in code (tools/synth.py): the cue vocabulary of docs/ANIMATION_GUIDE.md, section 12, on the
cue times. Two families, mixed by rule:
- **Paper and UI sounds** (ticks, stamps, snips, slides, tears, flips, ...) are unpitched noise. Each belongs to a
  class (`CLASSES`) whose EQ keeps it off the bass and away from the dense low mids and carves the music's own
  spectral gaps in (tools/meter.fine_structure), and every event is set to a level over the music around it: at most
  +3 dB, in loudness and in the 250 Hz - 4 kHz mids (tools/meter.py; tools/sfxcheck.py checks it from the stems).
- **Pitched sounds** (the stabs, the alarm, the warm chords, the chime, the bell, the climb, the thumps, the held low
  note, the bass bend, ch01's cluster) are tuned to the bed's A4 = 441.3 Hz and play the chord the bed plays at their bar.
Everything is seeded, so the same inputs always give the same file.

Usage: uv run --with numpy --with scipy python tools/sound.py [--chapters ch01,ch02] [--out out/sound/film.wav]
       [--cues out/sound/cues.json] [--music bed|synth] [--stems] [--stem-dir DIR] [--score out/sound/score.json]
"""
import argparse
import json
import math
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
from scipy.signal import lfilter, resample_poly

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import meter  # noqa: E402
from synth import (NOTE, SR, arco, band, bass_note, bell_fx, brass, brush_slap, brush_swish, cell_fx, click_fx,  # noqa: E402
                   crash, creak_fx, cut_rasp, flip_fx, flutter_fx, friction_fx, hz, kick, keys, lock_fx, midi, midi_hz,
                   paper_tick, piano, piano_comp, pin_fx, pluck_bass, pop, punch_fx, rattle, ride, rising_tone,
                   rng_for, scratch_fx, shape, slab_fx, snap_fx, snare, snip, stamp, stamp_deep, sweep_fx, swoosh, tap,
                   tear, thud_fx, tone_glide, tone_tick, vibes)

TARGET_LUFS = -14.0
TP_CEIL = -1.2  # dBTP after limiting: 0.2 dB under the -1 dBTP rule, for the AAC encode
AAC_CEIL = -1.2  # dBTP the film's AAC encode may reach when decoded (render.mjs muxes AAC 320 kbps, 48 kHz)
SWING = 0.6  # the old synthesized score's swung 8ths (the off-beat at 60 % of the beat); the bed and the effects are straight
HOP = 0.025  # s: the level frames of tools/meter.py
POKE_LIMIT = 3.0  # dB: the most a paper or UI sound may poke out of the music (loudness and 250 Hz - 4 kHz mids)


# ---------------------------------------------------------------------------------------------------- the mix bus
# Stem levels (dB) applied at mixdown. The effects set their own levels from the music (Film.fx, Film.hit), so these
# only balance the old synthesized score's stems.
STEMS = {"bass": -11.0, "drums": -2.0, "piano": 0.0, "sfx": 0.0, "vibes": 0.0, "brass": 0.0, "tone": 0.0, "bed": 0.0}
BED = ROOT / "out" / "sound" / "bed.wav"  # tools/bed.py writes it (and bed.json beside it)
BED_GAIN = -17.5  # dB: the Mixkit track (about -11 LUFS in its body) as a bed under the effects, where the old score sat
BED_INTRO_DB = 4.0  # the sparse intro (film start to ch05) this much higher, so it is heard under ch01-ch04; the lift
# on ch05's downbeat (+8.6 dB in the recording) stays a lift
BED_RESOLVE_DB = -2.5  # ch10-ch11 resolve: the bed eases down this much over ch10's first two bars and stays there


def pan_stereo(sig, pan):
    """A mono signal placed at `pan` (-1 left ... 1 right), constant power, unity per channel at the centre."""
    if sig.ndim == 2:
        return sig
    th = (max(-1, min(1, pan)) + 1) * math.pi / 4
    return np.stack([sig * math.cos(th), sig * math.sin(th)], axis=1) * math.sqrt(2)


class Bus:
    """Stereo stems; add() places a mono or stereo signal at a time, gain and pan."""

    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.stems = {k: np.zeros((self.n, 2)) for k in STEMS}

    def add(self, sig, at, gain_db=0.0, pan=0.0, stem="sfx"):
        if at < 0:
            sig = sig[int(-at * SR):]
            at = 0
        g = 10 ** (gain_db / 20)
        i = int(round(at * SR))
        sig = pan_stereo(sig, pan)
        j = min(self.n, i + len(sig))
        if j > i:
            self.stems[stem][i:j] += g * sig[: j - i]

    def mix(self):
        return sum(x * 10 ** (STEMS[k] / 20) for k, x in self.stems.items())


# ---------------------------------------------------------------------------------------------------- paper and UI classes
# Each class of paper/UI sound has a `poke`, how far its loudest 100 ms stands over the music around it (the film's limit
# is +3 dB in loudness and in the 250 Hz - 4 kHz mids; the classes sit a little under it, and a cue may go lower still
# with `rel`), and a designed spectrum: a tilt (dB per octave, about pink), a low cut `fh` (Hz, 12 dB/oct) that keeps it off
# the bass and the dense low mids, and a high roll-off `fl` (Hz, 12 dB/oct) above which the bed is 30 dB down. Each class's
# EQ is matched to that spectrum (Film.finalize), with the music's own gaps carved in on top (Film.eq_points).
CLASSES = {
    "hit": {"poke": 2.7, "tilt": -3.0, "fh": 300, "fl": 6500},  # struck sounds: stamps, snaps, pins, clicks, thuds, punches
    "cut": {"poke": 2.7, "tilt": -1.5, "fh": 700, "fl": 9000},  # the crisp ones: scissors, tears
    "move": {"poke": 1.7, "tilt": -3.0, "fh": 250, "fl": 5500},  # everything that travels: slides, wipes, swooshes, flips
    "tick": {"poke": 1.7, "tilt": -1.0, "fh": 900, "fl": 7000},  # small ticks: chat bubbles, tick marks
    "texture": {"poke": -3.0, "tilt": -2.0, "fh": 800, "fl": 6000},  # runs of tiny sounds: cells, rattles, sweeps, flutter
}
BAND_CAP = 14.0  # dB: no single 1/3-octave band from 500 Hz up may stand more than this over the music
MATCH_BOOST, MATCH_CUT = 12.0, 40.0  # dB: the most the matching EQ lifts or cuts a band
GAP_K, GAP_MAX = 0.8, 4.0  # the carve: -0.8 dB per dB of the music's fine structure, at most 4 dB



# ---------------------------------------------------------------------------------------------------- loudness (BS.1770-4)
def k_weight(x):
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    y = k_weight(x)
    block, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + block] ** 2, axis=0).sum() for i in range(0, len(y) - block + 1, hop)])
    l = -0.691 + 10 * np.log10(np.maximum(z, 1e-12))
    z1 = z[l > -70]
    rel = -0.691 + 10 * np.log10(np.mean(z1)) - 10
    return -0.691 + 10 * np.log10(np.mean(z[l > rel]))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limit(x, ceiling_db):
    """Look-ahead peak limiter on the 4x-oversampled envelope: gain never lets a true peak pass the ceiling."""
    c = 10 ** (ceiling_db / 20)
    env = resample_poly(np.max(np.abs(x), axis=1), 4, 1)
    env = np.maximum.reduceat(np.abs(env), np.arange(0, len(env), 4))[: len(x)]
    need = np.minimum(1.0, c / np.maximum(env, 1e-12))
    look = int(0.004 * SR)
    # attack: the minimum over a ±4 ms window (look-ahead); release: a one-pole recovery (80 ms)
    g = minimum_filter1d(need, size=2 * look + 1)
    rel = math.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else v + (cur - v) * rel
        out[i] = cur
    return x * out[:, None]


def limit_tp(x, ceiling_db):
    """The same limiter on the exact true-peak envelope: each channel 4x oversampled, then the loudest of the four
    sub-samples and of the two channels, per sample."""
    c = 10 ** (ceiling_db / 20)
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=0)), axis=1)
    env = np.maximum.reduceat(up, np.arange(0, len(up), 4))[: len(x)]
    need = np.minimum(1.0, c / np.maximum(env, 1e-12))
    look = int(0.004 * SR)
    g = minimum_filter1d(need, size=2 * look + 1)
    rel = math.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else v + (cur - v) * rel
        out[i] = cur
    return x * out[:, None]


def aac_roundtrip(x):
    """x encoded the way render.mjs muxes it (ffmpeg's AAC, 320 kbps, 48 kHz) and decoded again, sample-aligned."""
    with tempfile.TemporaryDirectory() as d:
        src, enc = Path(d) / "x.wav", Path(d) / "x.m4a"
        wavfile.write(src, SR, x.astype(np.float32))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:a", "aac", "-b:a", "320k", "-ar", str(SR), str(enc)], check=True)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(enc), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                             check=True, capture_output=True).stdout
    y = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)[: len(x)]
    return np.pad(y, ((0, len(x) - len(y)), (0, 0)))


def aac_safe(x, ceiling_db=AAC_CEIL):
    """Keep the true peak of the AAC encode under the ceiling. The encoder rings on the sharpest transients (a snip is a
    fraction of a millisecond of metal) and can overshoot the PCM's peak by more than a dB; where the decoded file
    would pass the ceiling, lower the PCM there by what it needs, over a window wider than an AAC frame, and check
    again. Returns the PCM and the decoded file's true peak."""
    c = 10 ** (ceiling_db / 20)
    look = int(0.024 * SR)
    rel = math.exp(-1 / (0.08 * SR))
    for _ in range(6):
        y = aac_roundtrip(x)
        up = np.max(np.abs(resample_poly(y, 4, 1, axis=0)), axis=1)
        env = np.maximum.reduceat(up, np.arange(0, len(up), 4))[: len(x)]
        if env.max() <= c:
            break
        need = minimum_filter1d(np.minimum(1.0, c / np.maximum(env, 1e-12)), size=2 * look + 1)
        g = np.empty_like(need)
        cur = 1.0
        for i, v in enumerate(need):
            cur = v if v < cur else v + (cur - v) * rel
            g[i] = cur
        x = x * g[:, None]
    return x, 20 * np.log10(env.max())


def master(x):
    """Normalize to TARGET_LUFS with every true peak under TP_CEIL (limit, re-measure, repeat). On a long mix the
    first limiter (whose envelope is the rectified signal's) can leave a true peak a hair over the ceiling; the exact
    true-peak limiter finishes the job. (ch01's sketch never needed it, so it is unchanged.)"""
    for _ in range(6):
        g = 10 ** ((TARGET_LUFS - lufs(x)) / 20)
        x = x * g
        if true_peak_db(x) <= TP_CEIL + 0.02:
            break
        x = limit(x, TP_CEIL - 0.1)
    for _ in range(4):
        if true_peak_db(x) <= TP_CEIL + 0.02:
            break
        x = limit_tp(x, TP_CEIL - 0.1)
        x = x * 10 ** ((TARGET_LUFS - lufs(x)) / 20)
    return x


# ---------------------------------------------------------------------------------------------------- harmony
# Chord symbols are a root and a quality; the intervals are semitones from the root.
QUAL = {"": (0, 4, 7), "m": (0, 3, 7), "6": (0, 4, 7, 9), "69": (0, 4, 7, 9, 14), "7": (0, 4, 7, 10),
        "7sus": (0, 5, 7, 10), "m7": (0, 3, 7, 10), "maj7": (0, 4, 7, 11), "maj9": (0, 4, 7, 11, 14),
        "m7b5": (0, 3, 6, 10)}
# Rootless voicings for the vibraphone and the comping piano: 3rd, 7th (or 6th), 9th, and the 5th or 13th.
VOICE = {"": (4, 9, 14, 7), "m": (3, 10, 14, 7), "6": (4, 9, 14, 7), "69": (4, 9, 14, 7), "7": (4, 10, 14, 9),
         "7sus": (5, 10, 14, 7), "m7": (3, 10, 14, 7), "maj7": (4, 11, 14, 7), "maj9": (4, 11, 14, 7),
         "m7b5": (3, 6, 10, 12)}
VOICE_MINOR_V = (4, 10, 13, 8)  # a dominant in a minor key: 3rd, 7th, b9, b13
SCALE = {"Dm": (2, 4, 5, 7, 9, 10, 0), "D": (2, 4, 6, 7, 9, 11, 1), "G": (7, 9, 11, 0, 2, 4, 6)}
PC_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def name_of(m):
    return f"{PC_NAMES[m % 12]}{m // 12 - 1}"


def chord(sym):
    """'F#m7' -> (root pitch class, quality)."""
    r = sym[:2] if len(sym) > 1 and sym[1] in "#b" else sym[:1]
    return NOTE[r], sym[len(r):]


def tones(sym):
    r, q = chord(sym)
    return {(r + i) % 12 for i in QUAL[q]}


def voicing(sym, key, prev=None, lo=53, hi=72):
    """A close rootless voicing of sym inside [lo, hi] (MIDI), led from prev by the smallest total motion."""
    r, q = chord(sym)
    iv = VOICE_MINOR_V if (q == "7" and key == "Dm") else VOICE[q]
    pcs = sorted({(r + i) % 12 for i in iv})  # close position: each rotation is an inversion spanning under an octave
    best = None
    for rot in range(len(pcs)):
        order = pcs[rot:] + pcs[:rot]
        for base in range(lo, lo + 12):
            if base % 12 != order[0]:
                continue
            v = [base]
            for pc in order[1:]:
                m = v[-1] + 1
                while m % 12 != pc:
                    m += 1
                v.append(m)
            if v[-1] > hi:
                continue
            cost = sum(abs(a - b) for a, b in zip(v, prev)) if prev else abs(sum(v) / len(v) - (lo + hi) / 2)
            if best is None or cost < best[0]:
                best = (cost, v)
    return best[1]


# ---------------------------------------------------------------------------------------------------- the score
# One continuous 4/4 grid from t = 0 at 108 BPM, swung 8ths; chapters are whole bars, so the harmony changes on
# chapter starts. The problem half (ch01-ch04) is D minor and sparse (bass and brushes, as the approved ch01); the
# solution half opens to D major with a vibraphone (ch05-ch06) and lifts to G for the seal and the trace (ch07); the
# market fight and the business drive (ch08-ch09) add a ride, a feathered kick and comping piano; the team and the
# close resolve in D (ch10-ch11) in a two-feel, down to the final chord.
FEEL = {"ch01": "sparse", "ch02": "sparse", "ch03": "sparse", "ch04": "sparse", "ch05": "open", "ch06": "open",
        "ch07": "open", "ch08": "driving", "ch09": "driving", "ch10": "resolving", "ch11": "resolving"}
KEY = {"ch01": "Dm", "ch02": "Dm", "ch03": "Dm", "ch04": "Dm", "ch05": "D", "ch06": "D", "ch07": "G", "ch08": "D",
       "ch09": "D", "ch10": "D", "ch11": "D"}
# The harmony, one entry per bar ("A7:3 D:1" splits a bar by beats; two chords without counts get two beats each).
CHORDS = {
    "ch01": "Dm | Bb | Gm | A7 | Dm",
    "ch02": "Dm7 | Dm7 | Bbmaj7 | A7 | Dm7 | Gm7 | Em7b5 A7 | Dm7 | Dm7 D7",
    "ch03": "Gm7 | C7 | Fmaj7 | Bbmaj7 | Em7b5 A7 | Bbmaj7 A7",  # SAM lands on the deceptive Bbmaj7
    "ch04": "Dm7 | Bbmaj7 | Gm7 | A7 | Dm7 | Bbmaj7 | Gm7 | Em7b5 | A7",
    "ch05": "Dmaj7 | Bm7 | Em7 | A7 | Dmaj7 | Gmaj7 | Em7 | A7",  # opens to major on the doors
    "ch06": "Dmaj7 | Gmaj7 | F#m7 B7 | Em7 | A7 | Dmaj7 | A7 | A7 | Dmaj7 | Gmaj7 | Am7 D7",  # resolves on the person
    "ch07": "Gmaj7 | Em7 | Am7 D7 | Gmaj7 | Cmaj7 | Bm7 E7 | Am7 D7 | Gmaj7 | A7 | A7",
    "ch08": "Bm7 | Gmaj7 | Em7 | A7 | D",
    "ch09": "Dmaj7 | Bm7 | Em7 | A7 | Dmaj7 | Em7 A7sus | Gmaj7 | Em7 A7",  # the stairs climb D-E-F#-G to the stab
    "ch10": "Dmaj7 | Bm7 | Gmaj7 | Em7 A7 | Dmaj7 | Gmaj7 Em7",
    "ch11": "A7sus D69 | D69 | D69 | D69",
}
# ch01's bass line, written out note by note: the approved sketch.
CHARTS = {
    "ch01": [("Dm", ["D2", "F2", "A2", "C3"]), ("Bb", ["Bb1", "D2", "F2", "A1"]), ("Gm", ["G1", "Bb1", "D2", "E2"]),
             ("A7", ["A1", None, None, None]), ("Dm", [None, None, None, None])],
}
# Stab voicings (piano) and bass (two octaves) for the SLAMs the music marks; ch01's is the approved D-F-A-Bb-D.
STABS = {
    "ch01": (["D3", "F3", "A3", "Bb3", "D4"], "D2", "D1"),
    "ch06": (["D3", "A3", "C#4", "E4", "F#4"], "D2", "D1"),  # the "1": Dmaj9
    "ch07": (["D3", "G3", "B3", "E4", "A4"], "G2", "G1"),  # the "2": G6/9, the lift to G
    "ch08": (["D3", "F#3", "A3", "E4", "A4"], "D2", "D1"),  # "CÓ CẢ HAI.": D add9, home after B minor
    "ch09": (["D3", "G3", "B3", "F#4", "A4"], "G2", "G1"),  # "20–25 TÒA": Gmaj9 on top of the stairs
    "ch10": (["F#3", "B3", "E4", "A4", "D5"], "D2", "D1"),  # "ĐỘI KAWAIBU": D6/9
}
ALARM = (["Bb1", "E2", "Bb2"], ["A1", "Eb2", "A2"])  # two tritones, falling a semitone
FINAL = {"piano": ["D2", "A2", "E3", "F#3", "B3"], "vibes": ["F#3", "A3", "B3", "E4", "A4"], "bass": ("D2", "D1")}
# Pitched thumps for runs of rising slabs: D minor pentatonic across ch02's skyline, the line up to G in ch09.
SLABS = {"ch02": ["D2", "F2", "G2", "A2", "C3", "D3", "F3", "G3", "A3", "C4"], "ch03": ["F2"],
         "ch09": ["D3", "E3", "F#3", "G3"]}
SLIDE_STEP = {"ch03": -3, "ch07": 2, "ch08": 1, "ch11": 2}  # semitones per `i` in a run of slides (3.4 descends)

KIT = {  # brushes per feel: swish level; slap on 2 and 4 (vel, dB); swung taps (beat, vel, dB); kick and ride
    "sparse": {"swish": -30, "slap": (0.7, -19), "taps": [(2, 0.35, -26)]},
    "open": {"swish": -30, "slap": (0.7, -19), "taps": [(2, 0.35, -26), (3, 0.28, -28)]},
    "driving": {"swish": -28, "slap": (0.8, -17), "taps": [(0, 0.3, -27), (2, 0.35, -26)], "kick": (0.5, -25),
                "ride": (0.45, -29)},
    "resolving": {"swish": -31, "slap": (0.55, -21), "taps": []},
}
# Comping rhythms, (onset, hold) in beats from the bar line; 0.6 is the swung "and" of 1, -0.4 anticipates the bar.
VIB_PAT = [((0.0, 2.0), (2.6, 1.3)), ((1.6, 2.3),), ((0.0, 1.5), (1.6, 2.3)), ((0.0, 3.8),), ((-0.4, 4.2),)]
PIANO_PAT = [((0.0, 0.5), (1.6, 0.4)), ((1.6, 0.4), (3.6, 0.35)), ((0.0, 0.5), (2.6, 0.4)), ((0.6, 0.4), (2.0, 0.5))]
LO, HI = 28, 50  # the walking bass's range, E1-D3


class Film:
    """The score and the effects for the selected chapters, on one bus. Music follows the timeline's grid; effects
    follow the scenes' cues. `log` keeps every note and effect placed, for the analysis."""

    def __init__(self, tl, cues, chapters, bus, music="bed"):
        self.tl, self.bus = tl, bus
        self.music_mode = music
        self.bed_beats = json.loads(BED.with_suffix(".json").read_text())["beats"] if music == "bed" else None
        self.beat = tl["beat"]
        self.chs = {c["id"]: c for c in tl["chapters"]}
        self.order = [c["id"] for c in tl["chapters"]]
        self.sel = [c for c in self.order if c in chapters]
        self.t0 = min(self.chs[c]["start"] for c in self.sel)
        self.t1 = max(self.chs[c]["end"] for c in self.sel)
        self.by = {}
        for q in cues:
            self.by.setdefault((q["ch"], q["name"]), []).append(q)
        self.log = []
        self.paper = []  # paper and UI events, put on the bus by finalize()
        self.ref = None  # the music's levels (tools/meter.py), which every effect's level is set from
        self.ref_audio = None
        self.gaps = {}  # the music's spectral gaps, by part of the film
        self.eqs = {}
        self.spectra = {}
        self._events = None  # the bed's own hits (tools/bedhits.py), found when first asked
        self.harmony = json.loads((ROOT / "docs" / "bed_harmony.json").read_text()) if music == "bed" else None
        self.dips = []  # (from, to): where the bed dips by design

    # ---- helpers
    def on(self, ch):
        return ch in self.sel

    def add(self, sig, at, gain, pan=0.0, stem="sfx"):
        self.bus.add(sig, at - self.t0, gain, pan=pan, stem=stem)

    def note(self, inst, ch, at, dur, pitches, **kw):
        self.log.append({"inst": inst, "ch": ch, "t": round(at, 4), "dur": round(dur, 4),
                         "midi": [midi(p) if isinstance(p, str) else p for p in pitches], **kw})

    def cue(self, ch, name):
        return self.by.get((ch, name), [])

    def slots(self, ch):
        c = self.chs[ch]
        out = []
        for b, bar in enumerate(CHORDS[ch].split("|")):
            items = bar.split()
            at = c["start"] + 4 * b * self.beat
            for x in items:
                sym, nb = (x.split(":")[0], int(x.split(":")[1])) if ":" in x else (x, 4 // len(items))
                out.append({"ch": ch, "t": at, "beats": nb, "sym": sym, "bar": b})
                at += nb * self.beat
        return out

    def chord_at(self, t):
        for ch in self.order:
            c = self.chs[ch]
            if c["start"] - 1e-6 <= t < c["end"] - 1e-6:
                for s in self.slots(ch):
                    if s["t"] - 1e-6 <= t < s["t"] + s["beats"] * self.beat - 1e-6:
                        return s["sym"], KEY[ch]
        return "D69", "D"

    def bar_at_least(self, t):
        """The first bar line at or after t."""
        n = math.ceil(t / (4 * self.beat) - 1e-9)
        return n * 4 * self.beat

    def alarm_second(self, t):
        """The alarm's second hit: the first beat at least half a beat after the first."""
        return math.ceil((t + 0.5 * self.beat) / self.beat - 1e-9) * self.beat

    def rests(self, ch):
        """Where the band holds off (the stab rings, the alarm hits, the push, the final chord): (from, to) pairs."""
        c = self.chs[ch]
        r = []
        for q in self.cue(ch, "stab"):
            if not q.get("soft"):
                r.append((q["t"] - 0.06, self.bar_at_least(q["t"] + 1.5 * self.beat) - 1e-6))
        for q in self.cue(ch, "alarm"):
            r.append((q["t"] - 0.06, self.alarm_second(q["t"]) + 0.06))
        for q in self.cue(ch, "push"):
            r.append((q["t"] - 0.06, c["end"] + 0.5))
        for q in self.cue(ch, "chord"):
            r.append((q["t"] - 0.06, self.tl["end"] + 10))
        return r

    def takeovers(self):
        """Times where a held note takes the bass: the stabs, both alarm hits, the push, the final chord."""
        out = []
        for ch in self.order:
            out += [q["t"] for q in self.cue(ch, "stab") if not q.get("soft")]
            out += [x for q in self.cue(ch, "alarm") for x in (q["t"], self.alarm_second(q["t"]))]
            out += [q["t"] for q in self.cue(ch, "push") + self.cue(ch, "chord")]
        return out

    def resting(self, ch, t):
        return any(a <= t < b for a, b in self.rests(ch))

    def seed(self, q, k, part=0):
        """ch01 keeps its first-pass seeds (SEED01); every other cue gets its own."""
        if q["ch"] == "ch01" and q["name"] in SEED01:
            s = SEED01[q["name"]]
            return k if s is None else s[part]
        return zlib.crc32(f"{q['ch']}/{q['name']}/{k}/{part}".encode()) % 1000003

    # ---- levels: every effect is set from the music around it
    def set_reference(self, x):
        """The music the effects are measured against: `x`, stereo at bus scale from t0 (the bed without its designed dips,
        or the synthesized score). The bed's first bar fades in: it is replaced, in the reference only, by the second
        bar, so the opening effects are judged against the music that is coming, not its silence. Also keeps the
        music's spectral gaps (its fine structure, in the intro and in the body)."""
        x = x.copy()
        nb = int(round(4 * self.beat * SR))
        if self.t0 < 1e-9 and self.music_mode == "bed" and len(x) > 2 * nb:
            x[:nb] = x[nb: 2 * nb]
        self.ref_audio = x
        self.ref = meter.reference(x, HOP)
        t5 = self.chs["ch05"]["start"]
        for part, (a, b) in {"intro": (max(self.t0, 4 * self.beat), t5), "body": (max(self.t0, t5), self.t1)}.items():
            i0, i1 = int((a - self.t0) * SR), int((b - self.t0) * SR)
            if i1 - i0 > 6 * SR:
                self.gaps[part] = meter.fine_structure(x[i0:i1])

    def class_spectra(self):
        """The raw spectrum of each paper/UI class: the mean over its events of their 1/3-octave levels (dB, each band's
        loudest window), each floored 45 dB under its loudest band."""
        acc = {}
        for e in self.paper:
            pad = np.zeros((max(0, int(0.16 * SR) - len(e["sig"])), 2))
            lv = meter.levels(np.concatenate([e["sig"], pad]), HOP)["bands"]
            lvl = meter.db(lv.max(axis=1))
            acc.setdefault(e["cls"], []).append(np.maximum(lvl, lvl.max() - 45))
        return {c: np.mean(v, axis=0) for c, v in acc.items()}

    def eq_points(self, cls, at):
        """A class's EQ at film time `at` (Hz, dB points): the gains that turn the class's raw spectrum into its designed
        one (CLASSES), lifting at most MATCH_BOOST and cutting at most MATCH_CUT dB, plus the gaps of the music in that
        part of the film carved in (the EQ gains where the music is thin and gives where it is dense, 200 Hz - 4 kHz)."""
        part = "intro" if at < self.chs["ch05"]["start"] else "body"
        if part not in self.gaps:
            part = next(iter(self.gaps), None)
        key = (cls, part)
        if key not in self.eqs:
            spec, f = CLASSES[cls], meter.CENTRES
            target = spec["tilt"] * np.log2(f / 1000) - 12 * np.maximum(0, np.log2(spec["fh"] / f)) \
                - 12 * np.maximum(0, np.log2(f / spec["fl"]))
            g = np.clip(target - self.spectra[cls], -MATCH_CUT, MATCH_BOOST)
            g = np.convolve(np.pad(g, 1, mode="edge"), [0.25, 0.5, 0.25], mode="valid")
            g -= g.max()
            grid = 60 * 2 ** (np.arange(int(6 * math.log2(16000 / 60)) + 1) / 6)
            lg = np.interp(np.log(grid), np.log(f), g)
            lg = np.where(grid < f[0], g[0] - 12 * np.log2(f[0] / grid), lg)  # 12 dB/oct below the first band
            lg = np.where(grid > f[-1], g[-1] - 6 * np.log2(grid / f[-1]), lg)  # 6 dB/oct above the last
            if part is not None:
                fc, dev = self.gaps[part]
                carve = np.interp(np.log(grid), np.log(fc), np.clip(-GAP_K * dev, -GAP_MAX, GAP_MAX))
                taper = np.clip(np.log2(grid / 100), 0, 1) * np.clip(np.log2(8000 / grid), 0, 1)  # in over 100-200 Hz, out over 4-8 kHz
                lg = lg + carve * taper
            self.eqs[key] = tuple((round(float(a), 1), round(float(b), 2)) for a, b in zip(grid, lg))
        return self.eqs[key]

    def ref_db(self, a, key="loud"):
        """The music's level (dB) `a` s after t0, in the reference."""
        j = int(np.clip(round(a / HOP), 0, len(self.ref[key]) - 1))
        return float(meter.db(self.ref[key][j]))

    def fx(self, q, cls, sig, at, pan=0.0, rel=0.0):
        """A paper or UI sound of class `cls` for cue `q`, sounding at film time `at`. Its EQ and its level are set in
        finalize(): the class's spectrum, and the class's `poke` (plus `rel` dB) over the music around it."""
        st = pan_stereo(sig, pan)
        a = at - self.t0
        if a < 0:
            st, a = st[int(-a * SR):], 0.0
        self.paper.append({"q": q, "cls": cls, "sig": st, "at": a, "rel": rel})

    def hit(self, q, layers, at, rel, what):
        """A pitched hit for cue `q`. `layers` is [(stem, sig, gain_db, pan)]: the balance inside the hit (gains before the
        stems' trims). The whole hit is set to `rel` dB over the music around it (loudness, its loudest 100 ms)."""
        n = max(len(sig) for _, sig, _, _ in layers) + SR // 4
        mix = np.zeros((n, 2))
        for stem, sig, g, pan in layers:
            st = pan_stereo(sig, pan) * 10 ** ((g + STEMS[stem]) / 20)
            mix[: len(st)] += st
        peak = float(meter.db(meter.levels(mix, HOP)["loud"].max()))
        shift = self.ref_db(max(at - self.t0, 0.0)) + rel - peak
        for stem, sig, g, pan in layers:
            self.add(sig, at, g + shift, pan=pan, stem=stem)
        self.log.append({"hit": what, "ch": q["ch"], "t": round(q["t"], 4), "at": round(at, 4), "rel": rel, "shift_db": round(shift, 2)})

    def finalize(self):
        """Shape every paper and UI event, set its level and put it on the bus.
        1. Each class's EQ is matched to its designed spectrum (CLASSES) from the events' raw spectra, and the music's gaps
           are carved in.
        2. Each event alone is set so that its loudest 100 ms stands its class's `poke` (plus its `rel`) over the music
           around it, and no single band from 500 Hz up stands more than BAND_CAP over it.
        3. All events together are measured the way tools/sfxcheck.py measures them, and any event that, with its
           neighbours, still pokes out over POKE_LIMIT (or over BAND_CAP in a band) is lowered, with the events it
           overlaps, until none does."""
        ev = self.paper
        if not ev:
            return
        n = self.bus.n
        nf = len(self.ref["loud"])
        self.spectra = self.class_spectra()
        for e in ev:
            e["sig"] = shape(e["sig"], self.eq_points(e["cls"], e["at"] + self.t0))
            pad = np.zeros((max(0, int(0.16 * SR) - len(e["sig"])), 2))
            r = meter.poke(meter.levels(np.concatenate([e["sig"], pad]), HOP), self.ref, int(e["at"] / HOP))
            e["gain"] = min(CLASSES[e["cls"]]["poke"] + e["rel"] - r["poke"], BAND_CAP - r["guard"])
            e["dur"] = len(e["sig"]) / SR
            e["win"] = meter.event_frames(e["at"], e["dur"], nf, HOP)
        pad = int(round(meter.WIN / HOP))  # frames in a level window
        for it in range(10):
            stem = np.zeros((n, 2))
            for e in ev:
                i = int(round(e["at"] * SR))
                j = min(n, i + len(e["sig"]))
                if j > i:
                    stem[i:j] += 10 ** (e["gain"] / 20) * e["sig"][: j - i]
            lv = meter.levels(stem, HOP)
            red = np.zeros(len(ev))
            for a, e in enumerate(ev):
                f0, f1 = e["win"]
                if f1 <= f0:
                    continue
                s = {k: (v[f0:f1] if k != "bands" else v[:, f0:f1]) for k, v in lv.items()}
                r = meter.poke(s, self.ref, f0)
                e["poke"], e["loud"], e["mids"], e["guard"] = r["poke"], r["loud"], r["mids"], r["guard"]
                ex = max(r["poke"] - (POKE_LIMIT - 0.15) if r["poke"] > POKE_LIMIT - 0.05 else 0.0,
                         r["guard"] - (BAND_CAP - 0.15) if r["guard"] > BAND_CAP - 0.05 else 0.0)
                if ex > 0:
                    for b, o in enumerate(ev):  # every event whose sound falls in one of this event's 100 ms windows
                        if o["win"][0] - pad < f1 and f0 - pad < o["win"][1]:
                            red[b] = max(red[b], ex)
            if not red.any():
                break
            for b, o in enumerate(ev):
                o["gain"] -= red[b]
        for e in ev:
            self.bus.add(e["sig"], e["at"], e["gain"], stem="sfx")
            q = e["q"]
            at = e["at"] + self.t0
            self.log.append({"fx": q["name"], "ch": q["ch"], "t": round(q["t"], 4), "at": round(at, 4), "dur": round(e["dur"], 3),
                             "cls": e["cls"], "gain_db": round(e["gain"], 2), "poke": round(e.get("poke", 0.0), 2),
                             "loud": round(e.get("loud", 0.0), 2), "mids": round(e.get("mids", 0.0), 2),
                             "guard": round(e.get("guard", 0.0), 2), "dip": any(a <= at < b for a, b in self.dips)})

    # ---- the bed's harmony and its own hits (docs/bed_harmony.json, tools/bedharmony.py; tools/bedhits.py)
    def harm(self, t):
        """The chart entry (chord, bass, tones, extensions, the pitch classes that are safe and that hold) for the beat that
        contains film time t: a hit on a beat line belongs to the beat it starts."""
        k = int(math.floor(t / self.beat + 1e-3))
        fs = self.harmony["film_sb"]
        return self.harmony["beats"][fs[min(max(k, 0), len(fs) - 1)]]

    def in_dip(self, t):
        return any(a <= t < b for a, b in self.dips)

    def doubled(self, t, window=0.045):
        """Which of the bed's own hits an effect at film time t would double: for the bass and the keys, the offset (ms) of
        the bed's nearest note or chord within `window` s, else None. Nothing is doubled where the bed is dipped out."""
        out = {"bass": None, "keys": None}
        if self.in_dip(t):
            return out
        if self._events is None:
            import bedhits
            self._events = bedhits.hits(bedhits.load_bed(BED), 0.0, None)
        for e in self._events:
            if e["cls"] in out and abs(e["t"] - t) <= window and (out[e["cls"]] is None or abs(e["t"] - t) < abs(out[e["cls"]] / 1000)):
                out[e["cls"]] = round((e["t"] - t) * 1000, 1)
        return out

    def skip(self, q, why, whole=False):
        """Log an effect (`whole`) or a layer of one left out because the bed already plays it."""
        self.log.append({"skipped": q["name"], "ch": q["ch"], "t": round(q["t"], 4), "why": why, **({"whole": True} if whole else {})})

    # ---- music
    def music(self):
        if self.music_mode == "bed":
            self.bed_music()
            return
        if self.on("ch01"):
            self.ch01_music()
        walk = self.walk()
        takes = sorted(self.takeovers())
        for n in walk:
            if self.on(n["ch"]) and not self.resting(n["ch"], n["t"]):
                # one bass: a stab's or an alarm's note (or ch07's bow) damps the walking note under it
                dur = min([n["dur"]] + [c - n["t"] for c in takes if n["t"] + 1e-6 < c < n["t"] + n["dur"]])
                self.add(pluck_bass(hz(name_of(n["m"])), dur, n["vel"], seed=n["seed"]), n["t"], -9, pan=-0.05, stem="bass")
                self.note("bass", n["ch"], n["t"], dur, [n["m"]])
        self.walked = walk
        for ch in self.order[1:]:
            if self.on(ch):
                self.drums(ch)
                self.comping(ch)
        self.moments()
        self.set_reference(self.bus.mix()[: int(round((self.t1 - self.t0) * SR))])

    def bed_music(self):
        """The Mixkit bed (tools/bed.py) under the selected chapters. It dips where the score breaks: nearly out from
        ch01's drop until ch02 (the bass note falls, the hole tears, the question lands alone); and from ch07's push
        until ch08 it thins to a dark, low trace under one held low note on its bass (fx_push)."""
        bed = wavfile.read(BED)[1].astype(np.float64)
        t1 = max(self.chs[c]["end"] for c in self.sel)
        i0, i1 = int(round(self.t0 * SR)), int(round(t1 * SR))
        seg = np.zeros((i1 - i0, 2))
        seg[: max(0, min(len(bed), i1) - i0)] = bed[i0: min(len(bed), i1)]
        t = self.t0 + np.arange(len(seg)) / SR
        g = np.ones(len(seg))  # the bed's gain
        dark = np.zeros(len(seg))  # the low-passed trace's gain
        t5 = self.chs["ch05"]["start"]  # the intro's lift: its extra level ends in a 20 ms ramp onto this downbeat
        g *= 10 ** (BED_INTRO_DB * np.clip((t5 - t) / 0.02, 0, 1) / 20)
        t10 = self.chs["ch10"]["start"]
        g *= 10 ** (BED_RESOLVE_DB * np.clip((t - t10) / (8 * self.beat), 0, 1) / 20)
        g_static = g.copy()  # without the dips: the music the effects are judged against

        def dip(a, b, depth_db, fade_in, fade_out):
            d = 10 ** (depth_db / 20)
            down = np.clip((t - a) / fade_in, 0, 1)  # into the dip
            up = np.clip((t - b) / fade_out, 0, 1)  # out of it, from the next section's first sample
            w = np.sin(0.5 * math.pi * down) ** 2 * (1 - np.sin(0.5 * math.pi * up) ** 2)
            return 1 - (1 - d) * w, w

        for q in self.cue("ch01", "drop"):
            gg, _ = dip(q["t"], self.chs["ch02"]["start"], -32, 0.15, 0.02)
            g *= gg
            self.dips.append((q["t"], self.chs["ch02"]["start"]))
            self.note("bed", "ch01", q["t"], self.chs["ch02"]["start"] - q["t"], [], what="dips out")
        for q in self.cue("ch07", "push"):
            end = self.chs["ch08"]["start"]
            gg, w = dip(q["t"], end, -26, 0.35, 0.02)
            g *= gg
            self.dips.append((q["t"], end))
            dark += 10 ** (-9 / 20) * w
            self.note("bed", "ch07", q["t"], end - q["t"], [], what="thins")
        lp = band(seg, hi=320, order=4)
        self.add(seg * g[:, None] + lp * dark[:, None], self.t0, BED_GAIN, stem="bed")
        self.set_reference(seg * g_static[:, None] * 10 ** (BED_GAIN / 20))

    def ch01_music(self):
        """The approved sketch: walking bass from bar 1, brushes from bar 2 until the drop."""
        c = self.chs["ch01"]
        beat = self.beat
        bars = int(round((c["end"] - c["start"]) / (4 * beat)))
        for b in range(bars):
            name, notes = CHARTS["ch01"][b % len(CHARTS["ch01"])]
            for k, nm in enumerate(notes):
                if not nm:
                    continue
                at = c["start"] + (4 * b + k) * beat
                vel = 0.55 + 0.1 * min(b, 3) + (0.08 if k == 0 else 0)
                self.add(pluck_bass(hz(nm), beat * 1.02, vel, seed=b * 4 + k), at, -9, pan=-0.05, stem="bass")
                self.note("bass", "ch01", at, beat * 1.02, [nm])
        drop = (self.cue("ch01", "drop") or [{"t": c["end"]}])[0]["t"]
        s0 = c["start"] + 4 * beat
        if drop > s0:
            sw = brush_swish(drop - s0, beat, seed=1)
            sw *= np.clip((len(sw) - np.arange(len(sw))) / (0.25 * SR), 0, 1)  # eases out into the drop
            self.add(sw, s0, -30, pan=0.25, stem="drums")
            k = 0
            while s0 + k * beat < drop:
                at = s0 + k * beat
                if k % 2 == 1:
                    self.add(brush_slap(0.7, seed=k), at, -19, pan=0.2, stem="drums")
                if k % 4 == 2:  # a light swung tap on the "and" of 3
                    self.add(brush_slap(0.35, seed=100 + k), at + SWING * beat, -26, pan=0.3, stem="drums")
                k += 1

    def walk(self):
        """The walking bass for ch02-ch11: the chord's root on its first beat, chord and scale tones on the way, and
        the chord's last beat approaching the next root by a semitone or from its fifth. Seeded per chord."""
        beat = self.beat
        slots = [s for ch in self.order[1:] for s in self.slots(ch)]
        prev = midi("D2")
        out = []
        for i, s in enumerate(slots):
            ch, feel = s["ch"], FEEL[s["ch"]]
            rng = rng_for("walk", ch, i)
            nxt = slots[i + 1]["sym"] if i + 1 < len(slots) else s["sym"]
            r, q = chord(s["sym"])
            tn = tones(s["sym"])
            bad = set()
            ivs = QUAL[q]
            if 4 in ivs:
                bad.add((r + 3) % 12)
            if 3 in ivs:
                bad.add((r + 4) % 12)
            if 10 in ivs:
                bad.add((r + 11) % 12)
            if 11 in ivs:
                bad.add((r + 10) % 12)
            if 6 in ivs:
                bad.add((r + 7) % 12)
            allowed = (set(SCALE[KEY[ch]]) - bad) | tn
            root = min((m for m in range(LO, HI + 1) if m % 12 == r), key=lambda m: (abs(m - prev), m))
            nr = min((m for m in range(LO, HI + 1) if m % 12 == chord(nxt)[0]), key=lambda m: (abs(m - root), m))
            apps = [(nr - 1, 0.4), (nr + 1, 0.3), (nr + 7 if nr + 7 <= HI else nr - 5, 0.3)]
            apps = [(m, w) for m, w in apps if LO <= m <= HI and m != root]
            app = apps[int(rng.choice(len(apps), p=np.array([w for _, w in apps]) / sum(w for _, w in apps)))][0]
            nb = s["beats"]
            if feel == "resolving" and nb >= 2:
                # two-feel: the second half note is held, so it is the fifth, or a scale step into the next root
                fifth = min((m for m in range(LO, HI + 1) if m % 12 == (r + 7) % 12), key=lambda m: abs(m - root))
                steps = [m for m in (nr - 2, nr - 1, nr + 1, nr + 2) if LO <= m <= HI and m != root and m % 12 in allowed]
                second = steps[0] if steps and rng.random() < 0.5 else fifth
                line = [(0, root, 2)] + ([(2, second, 2)] if nb == 4 else [])
            else:
                pool = [m for m in range(max(LO, root - 9), min(HI, root + 12) + 1) if m % 12 in allowed]
                if nb == 1:
                    mids = []
                elif nb == 2:
                    mids = []
                else:
                    best = None
                    for x in pool:
                        for y in (pool if nb == 4 else [None]):
                            path = [root, x] + ([y] if y is not None else []) + [app]
                            cost = sum(abs(b - a) for a, b in zip(path, path[1:]))
                            cost += sum(7 for a, b in zip(path, path[1:]) if a == b)  # no repeated notes
                            cost += sum(2.5 for a, b in zip(path, path[2:]) if a == b)  # no back-and-forth
                            cost += sum(2 for a, b in zip(path, path[1:]) if abs(b - a) > 7)
                            cost += sum(0.6 for a, b, c in zip(path, path[1:], path[2:]) if (b - a) * (c - b) < 0)
                            cost += 0.8 * (x % 12 not in tn) + (1.5 * (y % 12 not in tn) if y is not None else 0)
                            cost += rng.random() * 1.5
                            if best is None or cost < best[0]:
                                best = (cost, [m for m in (x, y) if m is not None])
                    mids = best[1]
                ms = [root] + mids + ([app] if nb >= 2 else [])
                line = [(k, m, 1) for k, m in enumerate(ms)]
            for k, m, length in line:
                at = s["t"] + k * beat
                vel = {"sparse": 0.84, "open": 0.84, "driving": 0.9, "resolving": 0.8}[feel]
                vel += (0.06 if at == s["t"] and s["t"] == self.bar_at_least(s["t"] - 1e-6) else 0) + rng.uniform(-0.03, 0.03)
                gi = int(round(at / beat))
                if feel == "driving" and k == len(line) - 1 and nb >= 2 and rng.random() < 0.4:
                    # a skip: the last beat split into a swung pair, the second a ghost of the first
                    out.append({"ch": ch, "t": at, "m": m, "dur": SWING * beat, "vel": vel, "seed": 1000 + gi})
                    out.append({"ch": ch, "t": at + SWING * beat, "m": m, "dur": (1 - SWING) * beat * 1.02,
                                "vel": 0.55 * vel, "seed": 5000 + gi})
                else:
                    out.append({"ch": ch, "t": at, "m": m, "dur": length * beat * 1.02, "vel": vel, "seed": 1000 + gi})
            prev = line[-1][1]
        return out

    def next_bass(self, ch, t):
        """Onset of the first walking note after t that plays (for a held note to stop on)."""
        for n in self.walked:
            if n["t"] > t + 1e-6 and not self.resting(n["ch"], n["t"]):
                return n["t"]
        return self.tl["end"] + 3

    def drums(self, ch):
        """Brushes all through, in the chapter's feel: the swish, slaps on 2 and 4, swung taps; the driving half adds a
        feathered kick and a ride. They stop for the chapter's break (ch07's push, ch11's final chord)."""
        c = self.chs[ch]
        beat = self.beat
        kit = KIT[FEEL[ch]]
        stop = min([c["end"]] + [q["t"] for q in self.cue(ch, "push") + self.cue(ch, "chord")])
        n = int(round((stop - c["start"]) / beat + 1e-6)) if stop < c["end"] else int(round((c["end"] - c["start"]) / beat))
        sw = brush_swish(stop - c["start"], beat, seed=zlib.crc32(f"swish/{ch}".encode()))
        if stop < c["end"]:
            sw *= np.clip((len(sw) - np.arange(len(sw))) / (0.25 * SR), 0, 1)
        self.add(sw, c["start"], kit["swish"], pan=0.25, stem="drums")
        for k in range(n + 1):
            at = c["start"] + k * beat
            if at >= stop - 1e-6:
                break
            gb = int(round(at / beat))
            b = k % 4
            if b % 2 == 1:
                self.add(brush_slap(kit["slap"][0], seed=gb), at, kit["slap"][1], pan=0.2, stem="drums")
            for tb, v, g in kit["taps"]:
                if b == tb and at + SWING * beat < stop:
                    self.add(brush_slap(v, seed=20000 + gb), at + SWING * beat, g, pan=0.3, stem="drums")
            if "kick" in kit:
                v, g = kit["kick"]
                self.add(kick(v if b % 2 == 0 else 0.8 * v, seed=gb), at, g, stem="drums")
            if "ride" in kit:
                v, g = kit["ride"]
                self.add(ride(v * (1.15 if b % 2 else 1.0), seed=gb), at, g, pan=-0.3, stem="drums")
                if b % 2 == 1 and at + SWING * beat < stop:
                    self.add(ride(0.7 * v, seed=40000 + gb, dur=0.8), at + SWING * beat, g, pan=-0.3, stem="drums")
        if ch in ("ch05", "ch08"):  # a soft brush crash where the feel changes
            self.add(crash(2.4, 0.5, seed=zlib.crc32(f"crash/{ch}".encode())), c["start"], -21, pan=0.3, stem="drums")

    def comping(self, ch):
        """Vibraphone chords in the open and resolving feels, short piano chords in the driving one."""
        feel = FEEL[ch]
        if feel == "sparse":
            return
        beat = self.beat
        c = self.chs[ch]
        prev = None
        bars = {}
        for s in self.slots(ch):
            bars.setdefault(s["bar"], []).append(s)
        for b, ss in bars.items():
            if ch == "ch05" and b == 0:
                continue  # the warm chord holds the first bar
            rng = rng_for("comp", ch, b)
            bar_t = ss[0]["t"]
            if feel == "driving":
                pat = PIANO_PAT[int(rng.integers(len(PIANO_PAT)))]
            elif feel == "resolving":
                pat = ((0.0, 3.8),) if len(ss) == 1 else ((0.0, 1.8), (2.0, 1.8))
            else:
                pat = VIB_PAT[int(rng.integers(len(VIB_PAT)))] if len(ss) == 1 else ((0.0, 1.8), (1.6, 2.3))
                if b == 0 and pat[0][0] < 0:
                    pat = VIB_PAT[0]
            for on, hold in pat:
                at = bar_t + on * beat
                if at < c["start"] - 1e-6 or self.resting(ch, at) or self.resting(ch, at + 0.5 * beat):
                    continue
                sym, key = self.chord_at(at + 0.45 * beat)
                if feel == "driving":
                    v = voicing(sym, key, prev, lo=50, hi=72)
                    self.add(piano_comp([name_of(m) for m in v], hold * beat, 0.5, seed=zlib.crc32(f"pc/{ch}/{at:.3f}".encode())),
                             at, -25, stem="piano")
                    self.note("piano", ch, at, hold * beat, v, what="comp")
                else:
                    v = voicing(sym, key, prev)
                    vel = 0.5 if feel == "open" else 0.42
                    dur = hold * beat + 0.6
                    self.add(vibes([name_of(m) for m in v], dur, vel, seed=zlib.crc32(f"vb/{ch}/{at:.3f}".encode()),
                                   at=at, damp=hold * beat), at, -23 if feel == "open" else -24, stem="vibes")
                    self.note("vibes", ch, at, hold * beat, v, what="comp")
                prev = v

    def moments(self):
        """The music's own events: the warm chord where ch05 opens to major, the bow under ch07's push."""
        beat = self.beat
        if self.on("ch05"):
            at = self.chs["ch05"]["start"]
            v = ["F#3", "A3", "C#4", "E4"]
            bar = 4 * beat  # it holds the first bar; the pedal lifts as the comping takes over
            self.add(vibes(v, bar + 0.6, 0.7, seed=5001, at=at, damp=bar), at, -14, stem="vibes")
            self.note("vibes", "ch05", at, bar, v, what="warm chord")
        for q in self.cue("ch07", "push"):
            if self.on("ch07"):
                end = self.chs["ch07"]["end"]
                self.add(arco(hz("A1"), end - q["t"] + 0.02, 0.8, seed=7001), q["t"], -6, stem="bass")
                self.note("arco", "ch07", q["t"], end - q["t"], ["A1"], what="low sustained note")


def place(pcs, lo, hi):
    """Pitch classes as MIDI notes in [lo, hi]: each at its lowest place at or above lo (wrapping down an octave if it
    would pass hi), sorted, without doubles."""
    out = []
    for pc in pcs:
        m = lo + (pc - lo) % 12
        if m > hi:
            m -= 12
        out.append(m)
    return sorted(set(out))


SEED01 = {"complaint": [0], "bubble": None, "caption": None, "scissor": [3], "split": [5, 6, 7], "slide": [8, 9],
          "snip": [10, 11], "drop": [12], "tear": [13], "stab": [14, 99, 98, 15]}
PAN01 = {"complaint": -0.35, "caption": 0.25, "scissor": 0.1, "slide": -0.4, "snip": 0.15, "drop": 0.1, "tear": 0.05}



# ---------------------------------------------------------------------------------------------------- the effects
# The cue vocabulary of docs/ANIMATION_GUIDE.md, section 12. Handlers run name by name in this order (ch01's names
# first, in the first sound pass's order), each over its cues chapter by chapter; k is the cue's place in its
# chapter's run of that name. Paper and UI sounds go through f.fx (a class, a level from the music); pitched hits go
# through f.hit (a level over the music) or f.add.
def fx_complaint(f, q, k, run):
    f.fx(q, "tick", pop(0.9, seed=f.seed(q, k)), q["t"], pan=pan_of(q, "complaint"), rel=0.3)


def fx_bubble(f, q, k, run):
    if "land" in q:  # the hook's bubble comes back and snaps flush: its tick, then a warm chord
        f.fx(q, "tick", tap(2400, 0.0035, 0.3, seed=f.seed(q, k)), q["t"], pan=q.get("pan", -0.3))
        f.fx(q, "hit", snap_fx(0.6, seed=f.seed(q, k, 1)), q["land"], pan=q.get("pan", -0.3), rel=-1.5)
        pitched_warm(f, q, k)
        return
    plain = [x for x in run if "land" not in x]
    i = plain.index(q)
    last = i == len(plain) - 1
    f.fx(q, "tick", tap(2100 + 300 * ((i * 7) % 5), 0.0035, 0.3, seed=f.seed(q, i), dull=last), q["t"],
         pan=0.4 if i % 2 else -0.3, rel=-1.5 if last else 0.0)


def fx_caption(f, q, k, run):
    f.fx(q, "hit", stamp(0.9, seed=f.seed(q, k)), q["t"] - 0.005, pan=pan_of(q, "caption"))


def fx_scissor(f, q, k, run):
    f.fx(q, "cut", cut_rasp(0.42, 0.8, seed=f.seed(q, k)), q["t"], pan=pan_of(q, "scissor"))


def fx_split(f, q, k, run):
    f.fx(q, "move", swoosh(0.6, 1600, 450, 0.7, seed=f.seed(q, k, 0)), q["t"], pan=-0.6)
    f.fx(q, "move", swoosh(0.6, 1500, 420, 0.7, seed=f.seed(q, k, 1)), q["t"] + 0.07, pan=0.6)
    if q["ch"] == "ch01":  # the low cluster under the hook's cut
        pitched_cluster(f, q, k)


def fx_slide(f, q, k, run):
    dur = q.get("land", q["t"] + 0.4) - q["t"] + 0.08
    st = 2 ** (SLIDE_STEP.get(q["ch"], 0) * q.get("i", 0) / 12)
    f.fx(q, "move", swoosh(dur, 700 * st, 1700 * st, 0.6, seed=f.seed(q, k, 0)), q["t"], pan=pan_of(q, "slide"))
    f.fx(q, "hit", stamp(0.35, seed=f.seed(q, k, 1)), q.get("land", q["t"]), pan=q.get("pan", 0.0) * 0.5, rel=-4.0)


def fx_snip(f, q, k, run):
    if q.get("n", 2) == 1:  # one snip, in a run: kept down, as texture
        f.fx(q, "cut", snip(0.7, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.15),
             rel=(-2.5 - 1.5 * (k % 2)) if len(run) > 1 else 0.0)
        return
    f.fx(q, "cut", snip(0.8, seed=f.seed(q, k, 0)), q["t"], pan=pan_of(q, "snip"))
    f.fx(q, "cut", snip(0.75, seed=f.seed(q, k, 1)), q["t"] + 0.11, pan=q.get("pan", 0.2), rel=-1.0)


def fx_drop(f, q, k, run):
    f.fx(q, "move", swoosh(0.55, 1300, 280, 0.6, seed=f.seed(q, k)), q["t"], pan=pan_of(q, "drop"))
    pitched_drop(f, q, k)


def fx_tear(f, q, k, run):
    if "land" in q:
        end = q["land"]
    else:
        stab_t = next((s["t"] for s in f.cue(q["ch"], "stab") if 0 < s["t"] - q["t"] <= 1.5), None)
        end = stab_t if stab_t else q["t"] + 0.65
    f.fx(q, "cut", tear(end - q["t"], 0.85, seed=f.seed(q, k)), q["t"], pan=pan_of(q, "tear"))


def legacy_stab(f, q, k, run):
    """The synthesized score's stab (`--music synth`): piano, bass in two octaves and a brush crash, on the score's own chord."""
    ch = q["ch"]
    at = q["t"]
    if q.get("soft"):  # a small stab: the piano alone, on the chord of the moment with its root
        sym, key = f.chord_at(at + 0.01)
        r = chord(sym)[0]
        root = min((m for m in range(34, 47) if m % 12 == r))
        v = [root] + voicing(sym, key, lo=53, hi=67)
        f.add(piano([name_of(m) for m in v], 2.4, 0.6, seed=f.seed(q, k)), at, -12, stem="piano")
        f.note("piano", ch, at, 2.4, v, what="soft stab")
        return
    notes, b1, b2 = STABS[ch]
    ring = 2.4 if ch == "ch01" else min(2.4, f.next_bass(ch, at) - at + 0.02)
    f.add(piano(notes, 2.6, 0.95, seed=f.seed(q, k, 0)), at, -5, stem="piano")
    f.add(pluck_bass(hz(b1), ring, 1.0, seed=f.seed(q, k, 1)), at, -7, stem="bass")
    f.add(pluck_bass(hz(b2), ring, 0.9, seed=f.seed(q, k, 2)), at, -9, stem="bass")
    f.add(crash(2.6, 0.8, seed=f.seed(q, k, 3)), at, -15, pan=0.3, stem="drums")
    f.note("piano", ch, at, 2.6, notes, what="stab")
    f.note("bass", ch, at, ring, [b1, b2], what="stab")


def legacy_alarm(f, q, k, run):
    ch = q["ch"]
    h1, h2 = q["t"], f.alarm_second(q["t"])
    for j, (at, notes) in enumerate(zip((h1, h2), ALARM)):
        dur = (h2 - h1) if j == 0 else min(1.2, f.next_bass(ch, h2) - h2 + 0.02)
        f.add(brass(notes, min(0.55, dur + 0.1) if j == 0 else 0.7, 0.95, seed=f.seed(q, k, 2 * j)), at, -7, pan=0.05, stem="brass")
        f.add(snare(0.9 if j == 0 else 0.8, seed=f.seed(q, k, 2 * j + 1)), at, -12, pan=0.1, stem="drums")
        f.add(pluck_bass(hz(notes[0]), dur, 0.95, seed=f.seed(q, k, 10 + j)), at, -8, stem="bass")
        f.note("brass", ch, at, dur, notes, what="alarm")


def fx_chord(f, q, k, run):
    if f.music_mode == "bed":
        return  # the bed's own final chord ends the film, on its last bar (tools/bed.py)
    at = q["t"]
    dur = f.tl["end"] - at + 0.05
    f.add(piano(FINAL["piano"], dur, 0.75, seed=f.seed(q, k, 0)), at, -9, stem="piano")
    f.add(vibes(FINAL["vibes"], dur, 0.65, seed=f.seed(q, k, 1), at=at, depth=0.25), at, -13, stem="vibes")
    f.add(pluck_bass(hz(FINAL["bass"][0]), dur, 0.9, seed=f.seed(q, k, 2)), at, -8, stem="bass")
    f.add(pluck_bass(hz(FINAL["bass"][1]), dur, 0.8, seed=f.seed(q, k, 3)), at, -10, stem="bass")
    f.add(crash(3.6, 0.45, seed=f.seed(q, k, 4)), at, -21, pan=0.3, stem="drums")
    f.note("piano", q["ch"], at, dur, FINAL["piano"], what="final chord")
    f.note("vibes", q["ch"], at, dur, FINAL["vibes"], what="final chord")
    f.note("bass", q["ch"], at, dur, list(FINAL["bass"]), what="final chord")


def fx_slam(f, q, k, run):
    f.fx(q, "hit", stamp(0.9, seed=f.seed(q, k)), q["t"] - 0.005, pan=q.get("pan", 0.0))


def fx_stamp(f, q, k, run):
    f.fx(q, "hit", stamp_deep(0.9, seed=f.seed(q, k)), q.get("land", q["t"]) - 0.005, pan=q.get("pan", 0.0))


def fx_rise(f, q, k, run):
    dur = q.get("land", q["t"] + 0.35) - q["t"] + 0.05
    f.fx(q, "move", swoosh(dur, 650, 2100, 0.5, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0), rel=-0.5)


def fx_bar(f, q, k, run):
    dur = q.get("land", q["t"] + 0.3) - q["t"] + 0.05
    f.fx(q, "move", swoosh(dur, 900, 2600, 0.6, seed=f.seed(q, k, 0)), q["t"], pan=q.get("pan", 0.0))
    f.fx(q, "hit", thud_fx(0.6, seed=f.seed(q, k, 1)), q.get("land", q["t"] + 0.3), pan=q.get("pan", 0.0), rel=-2.0)


def fx_wipe(f, q, k, run):
    dur = max(0.35, q.get("land", q["t"] + 0.6) - q["t"] + 0.1)
    f.fx(q, "move", swoosh(dur, 450, 1500, 0.7, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0))


def fx_pan(f, q, k, run):
    dur = max(0.3, q.get("land", q["t"] + 0.6) - q["t"] + 0.1)
    f.fx(q, "move", swoosh(dur, 350, 900, 0.6, seed=f.seed(q, k)), q["t"], pan=q.get("pan", -0.2), rel=-1.5)


def fx_doors(f, q, k, run):
    f.fx(q, "move", swoosh(0.7, 1100, 380, 0.7, seed=f.seed(q, k, 0)), q["t"], pan=-0.6)
    f.fx(q, "move", swoosh(0.7, 1000, 350, 0.7, seed=f.seed(q, k, 1)), q["t"] + 0.05, pan=0.6)


def fx_lift(f, q, k, run):
    f.fx(q, "move", swoosh(0.28, 500, 1800, 0.6, seed=f.seed(q, k, 0)), q["t"], pan=q.get("pan", 0.0))
    f.fx(q, "hit", snap_fx(0.5, seed=f.seed(q, k, 1)), q["t"] + 0.26, pan=q.get("pan", 0.0), rel=-1.5)


def fx_scroll(f, q, k, run):
    f.fx(q, "move", swoosh(0.4, 1400, 800, 0.5, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0), rel=-2.0)


def fx_flip(f, q, k, run):
    f.fx(q, "move", flip_fx(0.7, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0))


def legacy_chime(f, q, k, run):
    notes = ["A4", "E5"]  # an open fifth on A: a chord tone or a tension over every chord under ch04's flips
    f.add(vibes(notes, 2.2, 0.6, seed=f.seed(q, k), at=q["t"], depth=0.15), q["t"], -12, pan=q.get("pan", 0.0), stem="vibes")
    f.note("vibes", q["ch"], q["t"], 2.2, notes, what="chime")


def fx_cell(f, q, k, run):
    f.fx(q, "texture", cell_fx(0.4, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0), rel=-1.5 * ((k * 5) % 3) / 1.0)


def fx_sweep(f, q, k, run):
    dur = max(0.2, q.get("land", q["t"] + 0.6) - q["t"])
    f.fx(q, "texture", sweep_fx(dur, 0.5, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0), rel=1.0)


def fx_count(f, q, k, run):
    land = q.get("land", q["t"] + 0.6)
    if land - q["t"] > 0.08:
        f.fx(q, "texture", rattle(land - q["t"], 0.5, seed=f.seed(q, k, 0)), q["t"], pan=q.get("pan", 0.0))
    f.fx(q, "hit", lock_fx(0.7, seed=f.seed(q, k, 1)), land, pan=q.get("pan", 0.0), rel=-0.5)


def fx_tick(f, q, k, run):
    f.fx(q, "tick", tap(3600, 0.003, 0.25, seed=f.seed(q, k)), q.get("land", q["t"]), pan=q.get("pan", 0.0))


def legacy_climb(f, q, k, run):
    steps = ["D6", "F#6", "A6", "D7"]
    note = steps[min(q.get("i", k), len(steps) - 1)]
    f.add(tone_tick(hz(note), seed=f.seed(q, k)), q["t"], -13, pan=q.get("pan", 0.0), stem="tone")
    f.note("tick", q["ch"], q["t"], 0.1, [note], what="climb")


def fx_pin(f, q, k, run):
    f.fx(q, "hit", pin_fx(0.7, seed=f.seed(q, k)), q.get("land", q["t"]), pan=q.get("pan", 0.0))


def fx_snap(f, q, k, run):
    f.fx(q, "hit", snap_fx(0.7, seed=f.seed(q, k)), q.get("land", q["t"]), pan=q.get("pan", 0.0))


def fx_click(f, q, k, run):
    f.fx(q, "hit", click_fx(0.6, seed=f.seed(q, k)), q.get("land", q["t"]), pan=q.get("pan", 0.0))


def legacy_bell(f, q, k, run):
    note = "D6"
    f.add(bell_fx(note, 0.6, seed=f.seed(q, k)), q["t"], -17, pan=q.get("pan", 0.0), stem="tone")
    f.note("bell", q["ch"], q["t"], 1.8, [note], what="bell")


def fx_open(f, q, k, run):
    f.fx(q, "move", creak_fx(0.45, 0.6, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0))


def legacy_band(f, q, k, run):
    dur = max(0.2, q.get("land", q["t"] + 0.8) - q["t"])
    a, b = "D4", "A4"
    f.add(rising_tone(dur, hz(a), hz(b), 0.5), q["t"], -24, pan=q.get("pan", 0.0), stem="tone")
    f.note("tone", q["ch"], q["t"], dur, [a, b], what="rising tone")


def fx_friction(f, q, k, run):
    land = q.get("land", q["t"] + 0.6)
    f.fx(q, "texture", friction_fx(land - q["t"], 0.6, seed=f.seed(q, k, 0)), q["t"], pan=q.get("pan", 0.0), rel=2.0)
    f.fx(q, "hit", thud_fx(0.8, seed=f.seed(q, k, 1)), land, pan=q.get("pan", 0.0))


def fx_thud(f, q, k, run):
    f.fx(q, "hit", thud_fx(0.8, seed=f.seed(q, k)), q.get("land", q["t"]), pan=q.get("pan", 0.0))


def legacy_slab(f, q, k, run):
    notes = SLABS.get(q["ch"], ["D2"])
    i = q.get("i", k)
    n = len(run)
    name = notes[min(len(notes) - 1, i * len(notes) // max(n, len(notes)))] if n > len(notes) else notes[i % len(notes)]
    f.add(slab_fx(name, 0.7, seed=f.seed(q, k)), q.get("land", q["t"]), -13 - (8 if n > 8 else 0), pan=q.get("pan", 0.0), stem="tone")


def fx_punch(f, q, k, run):
    f.fx(q, "hit", punch_fx(0.8, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0))


def fx_flutter(f, q, k, run):
    f.fx(q, "texture", flutter_fx(1.1, 0.6, seed=f.seed(q, k), strips=1 if q.get("i") is not None else 5), q["t"],
         pan=q.get("pan", 0.0), rel=1.5)


def fx_sly(f, q, k, run):
    land = q.get("land", q["t"] + 0.5)
    f.fx(q, "move", swoosh(land - q["t"] + 0.05, 900, 500, 0.6, seed=f.seed(q, k, 0)), q["t"], pan=q.get("pan", -0.2))
    f.fx(q, "cut", scratch_fx(0.22, 0.6, seed=f.seed(q, k, 1)), land, pan=q.get("pan", -0.2))


def fx_cut(f, q, k, run):
    f.fx(q, "hit", paper_tick(0.5, seed=f.seed(q, k)), q["t"], pan=q.get("pan", 0.0), rel=-1.0)


# ---------------------------------------------------------------------------------------------------- the pitched effects
# Over the bed each one is played on the bed's own voices (synth.keys, synth.bass_note), tuned to A4 = 441.3, on the chord
# the bed plays on its beat (Film.harm), and set to a level over the music (Film.hit). A layer the bed already plays at that
# instant (its bass note or its keys chord within 45 ms) is left out (Film.doubled). Over the synthesized score the old
# handlers (legacy_*) play as they did.
def chord_order(h, ring=False):
    """The chord's pitch classes, best first: the chart's safe list, then the rest of its tones and extensions. For a note
    that rings, the pitch classes that hold over the next four beats come first, chord tones before extensions."""
    order = list(h["safe"])
    for p in list(h["tones"]) + list(h["ext"]):
        if p not in order:
            order.append(p)
    if ring:
        base = list(order)
        order.sort(key=lambda p: (p not in h["tones"], p not in h["hold"], base.index(p)))
    return order


def bar_extras(f, h):
    """The consonant extensions the bed plays somewhere in this beat's bar (its 9th, its 13th on a chord that is not minor,
    its major 7th on a major one) that are not chord tones here and do not clash with it: colour for a ringing voicing."""
    bar = h["bar"]
    seen = set()
    for b in f.harmony["beats"]:
        if b["bar"] == bar:
            seen |= set(b["ext"])
    r, q = h["root"], h["quality"]
    ok = {(r + 2) % 12}
    if "m" not in q or "maj" in q:
        ok.add((r + 9) % 12)
    if "maj" in q or q in ("", "6", "69"):
        ok.add((r + 11) % 12)
    return sorted(p for p in seen & ok if p not in h["tones"] and p not in h["avoid"])


def voice(h, n, lo, hi, ring=False, extras=()):
    """Up to `n` of the chord's pitch classes as MIDI notes in [lo, hi], ascending, each at its lowest place at or above lo;
    `extras` (pitch classes) go above the highest of them, each at its nearest place over it."""
    base = place(chord_order(h, ring)[:n], lo, hi)
    top = max(base)
    return sorted(set(base + [top + 1 + (p - top - 1) % 12 for p in extras]))


def lowest(pc, lo, hi):
    """The lowest MIDI note with pitch class pc in [lo, hi]."""
    return next(m for m in range(lo, hi + 1) if m % 12 == pc)


STAB_REL, STAB_REL_HOOK, SOFT_REL = 9.0, 15.0, 5.0  # dB over the music: the stab, ch01's (the hook's question, over the dipped bed), the soft one


def fx_stab(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_stab(f, q, k, run)
    ch, at, soft = q["ch"], q["t"], bool(q.get("soft"))
    h = f.harm(at)
    dd = f.doubled(at)
    upper = voice(h, 3 if soft else 4, 62, 77, ring=True, extras=[] if soft else bar_extras(f, h)[:2])
    layers, left_out = [], []
    ring = ch == "ch01"  # the hook's question rings out into ch02 (docs/shotlist.md: "stab, ring out")
    if dd["keys"] is None:
        layers.append(("piano", keys(upper, 3.0 if ring else 2.2, 0.9, seed=f.seed(q, k, 0), tau=0.8 if ring else 0.28), 0.0, 0.0))
    else:
        left_out.append(f"the bed's keys chord {dd['keys']:+.0f} ms")
    bass = []
    if not soft:
        if dd["bass"] is None:
            b = lowest(h["bass_pc"], 36, 47)
            bass = [b, b - 12] if ch == "ch01" else [b]
            for i, m in enumerate(bass):
                layers.append(("bass", bass_note(midi_hz(m), 2.6 if ring else 1.4, 0.9 if i == 0 else 0.7, seed=f.seed(q, k, 1 + i), held=True), 0.0 if i == 0 else -3.0, 0.0))
        else:
            left_out.append(f"the bed's bass note {dd['bass']:+.0f} ms")
    if not layers:
        f.skip(q, "; ".join(left_out), whole=True)
        return
    if left_out:
        f.skip(q, "layer left out: " + "; ".join(left_out))
    f.hit(q, layers, at, SOFT_REL if soft else (STAB_REL_HOOK if ch == "ch01" else STAB_REL), "soft stab" if soft else "stab")
    if dd["keys"] is None:
        f.note("piano", ch, at, 2.2, upper, what="soft stab" if soft else "stab")
    if bass:
        f.note("bass", ch, at, 1.4, bass, what="stab")


def fx_alarm(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_alarm(f, q, k, run)
    ch = q["ch"]
    h1, h2 = q["t"], f.alarm_second(q["t"])
    base = lowest(f.harm(h1)["bass_pc"], 50, 61)  # a tritone stack on the chord's root: the alarm clashes with the chord on purpose...
    for j, at in enumerate((h1, h2)):
        block = [base - j + i for i in (0, 6, 12)]  # ...and its second hit falls a semitone (onto the next chord's root, if it falls there)
        layers = [("piano", keys(block, 0.8, 0.9, seed=f.seed(q, k, 2 * j), tau=0.16, bright=5.0, knock=0.12), 0.0, 0.0)]
        if f.doubled(at)["bass"] is None:
            layers.append(("bass", bass_note(midi_hz(block[0] - 12), 0.8, 0.9, seed=f.seed(q, k, 2 * j + 1)), -2.0, 0.0))
        else:
            f.skip(q, f"hit {j + 1}: bass note left out, the bed's own plays {f.doubled(at)['bass']:+.0f} ms from it")
        f.hit(q, layers, at, 9.0 - j, "alarm")
        f.note("piano", ch, at, 0.8, block, what="alarm")


def pitched_drop(f, q, k):
    """ch01's falling bass note: the chord's fifth falls to its root (A1 to D1 over the D pedal)."""
    if f.music_mode != "bed":
        stab_t = next((s["t"] for s in f.cue(q["ch"], "stab") if s["t"] > q["t"]), None)
        ring = (stab_t if stab_t else q["t"] + 1.4) - q["t"] + 0.25
        f.add(pluck_bass(hz("A1"), ring, 0.85, fall=(0.08, 7, 0.7)), q["t"] - 0.08, -9, stem="bass")
        f.note("bass", q["ch"], q["t"] - 0.08, ring, ["A1"], what="falls a fifth")
        return
    h = f.harm(q["t"])
    stab_t = next((s["t"] for s in f.cue(q["ch"], "stab") if s["t"] > q["t"]), None)
    ring = (stab_t if stab_t else q["t"] + 1.4) - q["t"] + 0.25  # it rings on under the tear, no gap
    m = lowest((h["root"] + 7) % 12, 28, 40)
    f.hit(q, [("bass", bass_note(midi_hz(m), ring, 0.9, seed=f.seed(q, k), held=True, bend=(0.08, 7, 0.7)), 0.0, 0.0)],
          q["t"] - 0.08, 6.0, "falls a fifth")
    f.note("bass", q["ch"], q["t"] - 0.08, ring, [m], what="falls a fifth")


def pitched_cluster(f, q, k):
    """ch01's low cluster under the hook's cut: a semitone cluster around the chord's root and its fifth."""
    if f.music_mode != "bed":
        f.add(piano(["C2", "C#2", "D2", "G2"], 2.4, 0.45, seed=f.seed(q, k, 2), spread=0.1), q["t"], -16, stem="piano")
        f.note("piano", "ch01", q["t"], 2.4, ["C2", "C#2", "D2", "G2"], what="cluster")
        return
    h = f.harm(q["t"])
    r = h["root"]
    v = place([(r - 1) % 12, r, (r + 1) % 12, (r + 7) % 12], 49, 61)
    f.hit(q, [("piano", keys(v, 2.4, 0.9, seed=f.seed(q, k, 2), tau=0.5, knock=0.1), 0.0, 0.0)], q["t"], 4.0, "cluster")
    f.note("piano", "ch01", q["t"], 2.4, v, what="cluster")


def pitched_warm(f, q, k):
    """The loop's warm chord (ch07): four of the chord's notes, ringing."""
    if f.music_mode != "bed":
        sym, key = f.chord_at(q["land"] + 0.01)
        v = voicing(sym, key, lo=52, hi=71)
        f.add(vibes([name_of(m) for m in v], 3.4, 0.7, seed=f.seed(q, k, 2), at=q["land"], damp=2.8), q["land"], -15, stem="vibes")
        f.note("vibes", q["ch"], q["land"], 2.8, v, what="warm chord")
        return
    h = f.harm(q["land"])
    v = voice(h, 4, 55, 71, ring=True)
    f.hit(q, [("vibes", keys(v, 3.4, 0.9, seed=f.seed(q, k, 2), tau=0.9, bright=2.0), 0.0, 0.0)], q["land"], 1.0, "warm chord")
    f.note("vibes", q["ch"], q["land"], 2.8, v, what="warm chord")


def fx_push(f, q, k, run):
    """ch07's push: the bed thins to a dark trace (Film.bed_music) under one held low note, the bed's own bass held on the
    chord's bass pitch class until ch08 begins (over the synthesized score, the bowed note in Film.moments)."""
    if f.music_mode != "bed" or not f.on("ch07"):
        return
    end = f.chs["ch08"]["start"]
    m = lowest(f.harm(q["t"])["bass_pc"], 28, 40)
    f.hit(q, [("bass", bass_note(midi_hz(m), end - q["t"] + 0.02, 0.9, seed=7001, held=True), 0.0, 0.0)], q["t"], 2.0,
          "low sustained note")
    f.note("bass", "ch07", q["t"], end - q["t"], [m], what="low sustained note")


def fx_chime(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_chime(f, q, k, run)
    h = f.harm(q["t"])
    notes = place(chord_order(h, ring=True)[:2], 67, 79)
    f.hit(q, [("vibes", keys(notes, 2.2, 0.9, seed=f.seed(q, k), tau=0.7, bright=3.0), 0.0, q.get("pan", 0.0))], q["t"], 5.0, "chime")
    f.note("vibes", q["ch"], q["t"], 2.2, notes, what="chime")


def fx_climb(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_climb(f, q, k, run)
    prev = 76
    for x in run[: run.index(q) + 1]:  # each step a note of its own beat's chord, above the step before it
        cand = place(chord_order(f.harm(x["t"]))[:4], 77, 96)
        cand += [m + 12 for m in cand if m + 12 <= 96]
        prev = min((m for m in cand if m > prev), default=prev + 12)
    f.hit(q, [("tone", keys([prev], 0.5, 0.9, seed=f.seed(q, k), tau=0.10, bright=6.0), 0.0, q.get("pan", 0.0))], q["t"], 1.5, "climb")
    f.note("tone", q["ch"], q["t"], 0.5, [prev], what="climb")


def fx_bell(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_bell(f, q, k, run)
    h = f.harm(q["t"])
    fifth = (h["root"] + 7) % 12
    pc = fifth if fifth in h["tones"] else h["root"]  # a confirmation rings on the chord's fifth, else its root
    m = lowest(pc, 84, 95)
    f.hit(q, [("tone", keys([m], 2.0, 0.9, seed=f.seed(q, k), tau=0.9, bright=9.0), 0.0, q.get("pan", 0.0))], q["t"], 3.0, "bell")
    f.note("tone", q["ch"], q["t"], 1.8, [m], what="bell")


def fx_band(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_band(f, q, k, run)
    dur = max(0.2, q.get("land", q["t"] + 0.8) - q["t"])
    h = f.harm(q.get("land", q["t"]))
    a = lowest(h["root"], 62, 73)
    b = a + 7  # the root up a fifth, both chord tones
    f.hit(q, [("tone", tone_glide(dur, midi_hz(a), midi_hz(b), 0.9), 0.0, q.get("pan", 0.0))], q["t"], -2.0, "rising tone")
    f.note("tone", q["ch"], q["t"], dur, [a, b], what="rising tone", ht=round(q.get("land", q["t"]), 4))


def fx_slab(f, q, k, run):
    if f.music_mode != "bed":
        return legacy_slab(f, q, k, run)
    i, n = q.get("i", k), len(run)
    at = q.get("land", q["t"])
    if n > 8:  # the skyline: every thump a note of the chord, climbing through it
        pcs = chord_order(f.harm(run[n // 2]["t"]))[:4]
        ladder = sorted({m for m in range(53, 85) if m % 12 in pcs})
        m = ladder[min(len(ladder) - 1, i * len(ladder) // n)]
        rel = -7.0  # each note far under the music: twenty-four of them overlap, and the run sums to about +1 dB over it
    else:  # a few steps: each a note of its own chord, at least a minor third above the one before
        prev = 52
        for x in run[: run.index(q) + 1]:
            cand = [m for m in range(prev + 3, 96) if m % 12 in f.harm(x.get("land", x["t"]))["tones"]]
            prev = cand[0]
        m = prev
        rel = 4.0
    f.hit(q, [("tone", keys([m], 0.6, 0.9, seed=f.seed(q, k), tau=0.16, bright=2.0, knock=0.12), 0.0, q.get("pan", 0.0))], at, rel,
          "skyline thump" if n > 8 else "thump")
    f.note("tone", q["ch"], at, 0.6, [m], what="thump")



def pan_of(q, name):
    return q.get("pan", PAN01.get(name, 0.0) if q["ch"] == "ch01" else 0.0)


EFFECTS = {
    # ch01's names first, in the first sound pass's order
    "complaint": fx_complaint, "bubble": fx_bubble, "caption": fx_caption, "scissor": fx_scissor, "split": fx_split,
    "slide": fx_slide, "snip": fx_snip, "drop": fx_drop, "tear": fx_tear, "stab": fx_stab,
    # the rest of the vocabulary
    "alarm": fx_alarm, "chord": fx_chord, "push": fx_push, "slam": fx_slam, "stamp": fx_stamp, "rise": fx_rise,
    "bar": fx_bar, "wipe": fx_wipe, "pan": fx_pan, "doors": fx_doors, "lift": fx_lift, "scroll": fx_scroll,
    "flip": fx_flip, "chime": fx_chime, "cell": fx_cell, "sweep": fx_sweep, "count": fx_count, "tick": fx_tick,
    "climb": fx_climb, "pin": fx_pin, "snap": fx_snap, "click": fx_click, "bell": fx_bell, "open": fx_open,
    "band": fx_band, "friction": fx_friction, "thud": fx_thud, "slab": fx_slab, "punch": fx_punch,
    "flutter": fx_flutter, "sly": fx_sly, "cut": fx_cut,
}


def effects(f):
    for name, h in EFFECTS.items():
        for ch in f.sel:
            run = f.cue(ch, name)
            for k, q in enumerate(run):
                h(f, q, k, run)
                f.log.append({"fx": name, "ch": ch, "t": round(q["t"], 4), **({"land": round(q["land"], 4)} if "land" in q else {})})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chapters", default=None, help="comma-separated chapter ids (default: the whole film)")
    ap.add_argument("--cues", default="out/sound/cues.json")
    ap.add_argument("--out", default="out/sound/film.wav")
    ap.add_argument("--stems", action="store_true", help="print each stem's level before mastering")
    ap.add_argument("--score", default=None, help="write every note and effect placed (JSON), for the analysis")
    ap.add_argument("--stem-dir", default=None, help="also write each stem (at its level in the master) to this directory")
    ap.add_argument("--no-aac-check", action="store_true", help="skip the AAC encode check")
    ap.add_argument("--music", choices=["bed", "synth"], default="bed", help="the Mixkit bed (tools/bed.py) or the synthesized score")
    a = ap.parse_args()
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    cues = json.loads((ROOT / a.cues).read_text())["cues"]
    unknown = sorted({q["name"] for q in cues} - set(EFFECTS))
    if unknown:
        raise SystemExit(f"cue names outside the vocabulary (docs/ANIMATION_GUIDE.md, section 12): {', '.join(unknown)}")
    chapters = a.chapters.split(",") if a.chapters else [c["id"] for c in tl["chapters"]]
    chs = {c["id"]: c for c in tl["chapters"]}
    t0 = min(chs[c]["start"] for c in chapters)
    t1 = max(chs[c]["end"] for c in chapters)
    bus = Bus(t1 - t0)
    film = Film(tl, cues, chapters, bus, music=a.music)
    film.music()
    effects(film)
    film.finalize()
    x = bus.mix()[: int(round((t1 - t0) * SR))]
    if a.stems:
        for k, st in bus.stems.items():
            y = st[: len(x)] * 10 ** (STEMS[k] / 20)
            pk = 20 * np.log10(np.max(np.abs(y)) + 1e-12)
            rms = 20 * np.log10(np.sqrt(np.mean(y[np.max(np.abs(y), axis=1) > 1e-4] ** 2)) + 1e-12) if np.any(np.abs(y) > 1e-4) else -120
            print(f"  stem {k:6s} peak {pk:6.1f} dBFS, active rms {rms:6.1f} dBFS (before mastering)")
    x[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]  # no click at the cut-off
    if a.stem_dir:  # each stem at the level it has in the master (the master's gain, before the limiter)
        g0 = 10 ** ((TARGET_LUFS - lufs(x)) / 20)
        d = ROOT / a.stem_dir
        d.mkdir(parents=True, exist_ok=True)
        for k, st in bus.stems.items():
            wavfile.write(d / f"{k}.wav", SR, (st[: len(x)] * 10 ** (STEMS[k] / 20) * g0).astype(np.float32))
        wavfile.write(d / "bed_ref.wav", SR, (film.ref_audio[: len(x)] * g0).astype(np.float32))  # the music without its dips
    x = master(x)
    aac = ""
    if not a.no_aac_check:
        x, tp_aac = aac_safe(x)
        aac = f"; as AAC 320k {tp_aac:.2f} dBTP"
    out = ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, x.astype(np.float32))
    print(f"{out.relative_to(ROOT)}: {len(x) / SR:.3f} s, {lufs(x):.2f} LUFS, true peak {true_peak_db(x):.2f} dBTP{aac}")
    if a.score:
        p = ROOT / a.score
        rec = {"t0": t0, "t1": t1, "music": a.music, "events": film.log}
        rec.update({"bed": json.loads(BED.with_suffix(".json").read_text())} if a.music == "bed" else {"chords": {c: CHORDS[c] for c in chapters}})
        p.write_text(json.dumps(rec, indent=0))
        print(f"{p.relative_to(ROOT)}: {len(film.log)} notes and effects")


if __name__ == "__main__":
    main()
