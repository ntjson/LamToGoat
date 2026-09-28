"""Music bed and sound effects, synthesized in code (no samples, no stock audio), mixed to -14 LUFS / -1 dBTP.

Reads docs/timeline.json (tempo and bars) and out/sound/cues.json (the scenes' own event times, written by
tools/cues.mjs) and writes a stereo 48 kHz WAV for the selected chapters. Follows the shotlist's Sound section:
a walking upright-bass line, brushed snare and piano stabs at 108 BPM with swung eighths, minor and sparse for
ch01-ch04; effects from the palette (bubble tick, paper slide, snip, tear, stamp, stab...) on the cue times.
Everything is seeded, so the same inputs always give the same file.

Usage: uv run --with numpy --with scipy python tools/sound.py --chapters ch01 --out out/sound/ch01.wav
"""
import argparse
import json
import math
import zlib
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, lfilter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
TARGET_LUFS = -14.0
TP_CEIL = -1.2  # dBTP after limiting: 0.2 dB under the -1 dBTP rule, for the AAC encode
SWING = 0.6  # swung 8ths: the off-beat falls at 60 % of the beat

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
NOTE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})


def hz(name):
    """'D2' -> Hz (A4 = 440)."""
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[pitch] + 12 * (octave + 1) - 69) / 12)


def rng_for(*keys):
    # zlib.crc32, not hash(): Python salts str hashes per process, and every render must be identical.
    return np.random.default_rng([zlib.crc32(k.encode()) if isinstance(k, str) else int(k) for k in keys])


# ---------------------------------------------------------------------------------------------------- DSP helpers
def band(x, lo=None, hi=None, order=2):
    if lo and hi:
        sos = butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    elif lo:
        sos = butter(order, lo, btype="highpass", fs=SR, output="sos")
    else:
        sos = butter(order, hi, btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def decay(dur, tau, attack=0.002):
    t = tt(dur)
    a = np.minimum(1, t / attack) if attack else 1
    return a * np.exp(-t / tau)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def resonator(x, f, q):
    """Two-pole resonant band-pass at f with quality q (metal, strings)."""
    w = 2 * math.pi * f / SR
    r = math.exp(-w / (2 * q))
    return lfilter([1 - r], [1, -2 * r * math.cos(w), r * r], x)


def glide_sine(dur, f0, f1, shape=1.0):
    """A sine whose pitch glides from f0 to f1 (exponentially), phase-continuous."""
    t = tt(dur)
    u = (t / dur) ** shape
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------------------------------------------- instruments
def pluck_bass(f0, dur, vel=0.8, seed=0, fall=None):
    """Upright bass: Karplus-Strong string (finger pluck, dark), a body low-pass and a soft thump; `fall` = (start s,
    semitones, length s) bends the note down, for a note that falls."""
    n = int(dur * SR)
    rng = rng_for("bass", seed)
    if fall:
        # A falling note: additive, so the pitch can glide.
        t = tt(dur)
        start, semis, length = fall
        u = np.clip((t - start) / length, 0, 1)
        u = u * u * (3 - 2 * u)
        f = f0 * 2 ** (-semis * u / 12)
        ph = 2 * math.pi * np.cumsum(f) / SR
        y = sum((0.9 ** k) / k * np.sin(k * ph) * np.exp(-t * (0.9 + 0.5 * k)) for k in range(1, 9))
        y *= np.minimum(1, t / 0.004)
        return norm(band(y, hi=1400), 0.9 * vel)
    N = max(2, int(round(SR / f0 - 0.5)))
    exc = np.zeros(n)
    burst = rng.standard_normal(N) * np.hanning(N)
    burst = lfilter([0.25], [1, -0.75], burst)  # finger, not pick: a dark excitation
    exc[:N] = burst
    a = np.zeros(N + 2)
    a[0] = 1
    a[N] = a[N + 1] = -0.4985
    y = lfilter([1.0], a, exc)
    t = tt(dur)
    y = band(y, hi=650, order=4) + 0.35 * np.max(np.abs(y)) * np.sin(2 * math.pi * f0 * t) * np.exp(-t / 0.09)
    rel = np.clip((dur - t) / 0.05, 0, 1)  # the next note damps this one
    return norm(y * rel, vel)


def piano(names, dur, vel=0.8, seed=0, spread=0.3):
    """Additive piano: inharmonic partials, two detuned strings per note, faster decay for upper partials, a
    two-stage envelope and a hammer knock. Returns stereo (n, 2), spread across the stereo field by pitch."""
    rng = rng_for("piano", seed)
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for i, name in enumerate(names):
        f0 = hz(name)
        K = max(3, min(16, int(9000 / f0)))
        y = np.zeros_like(t)
        for k in range(1, K + 1):
            fk = k * f0 * math.sqrt(1 + 0.00035 * k * k)
            ak = vel ** (0.4 + 0.12 * k) / k ** 1.15
            tau = 2.2 * (261.6 / f0) ** 0.45 / (1 + 0.28 * (k - 1))
            det = 1 + 0.0008 * (rng.random() - 0.5)
            ph1, ph2 = rng.random() * 6.28, rng.random() * 6.28
            y += ak * np.exp(-t / tau) * 0.5 * (np.sin(2 * math.pi * fk * t + ph1) + np.sin(2 * math.pi * fk * det * t + ph2))
        y *= 0.55 * np.exp(-t / 0.18) + 0.45  # the quick drop after the hammer, then the long ring
        knock = band(rng.standard_normal(len(t)), 900, 4000) * np.exp(-t / 0.006) * 0.25 * vel
        y = (y + knock) * np.minimum(1, t / 0.002)
        pan = spread * ((math.log2(f0 / 261.6)) / 2)
        th = (max(-1, min(1, pan)) + 1) * math.pi / 4
        out[:, 0] += y * math.cos(th)
        out[:, 1] += y * math.sin(th)
    return norm(out, vel)


def brush_slap(vel=0.7, seed=0):
    rng = rng_for("slap", seed)
    d = 0.25
    t = tt(d)
    noise = band(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t / 0.07)
    body = np.sin(2 * math.pi * 185 * t) * np.exp(-t / 0.045) * 0.5
    return norm((noise + body) * np.minimum(1, t / 0.003), vel)


def brush_swish(dur, beat, seed=0):
    """The brush circling on the snare head: band-passed noise swelling once per beat."""
    rng = rng_for("swish", seed)
    t = tt(dur)
    x = band(rng.standard_normal(len(t)), 1800, 9000)
    phase = (t / beat) % 1.0
    env = 0.35 + 0.65 * np.sin(math.pi * phase) ** 2
    return x * env


def crash(dur=2.6, vel=0.8, seed=0):
    """A brush crash on a ride cymbal: bright noise and a few inharmonic metal modes, long decay."""
    rng = rng_for("crash", seed)
    t = tt(dur)
    wash = band(rng.standard_normal(len(t)), 3500, 14000) * np.exp(-t / 0.9)
    metal = sum(np.sin(2 * math.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
                for f, tau in [(3240, 0.7), (4710, 0.55), (5930, 0.5), (7350, 0.4), (8820, 0.35)])
    y = (wash + 0.12 * metal) * np.minimum(1, t / 0.004)
    return norm(y, vel)


# ---------------------------------------------------------------------------------------------------- effects
def tick(pitch=1650, muffled=False, vel=0.6, seed=0):
    """A chat bubble arriving: a short pitched 'tick' with a tiny click."""
    rng = rng_for("tick", seed)
    d = 0.09
    t = tt(d)
    y = glide_sine(d, pitch * 1.3, pitch, 0.25) * np.exp(-t / 0.016)
    y += band(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.002) * 0.4
    if muffled:
        y = band(y, hi=700) * 1.4
    return norm(y * np.minimum(1, t / 0.0008), vel)


def pop(vel=0.8, seed=0):
    """The complaint landing: a rounder pop with a little paper in it."""
    rng = rng_for("pop", seed)
    d = 0.2
    t = tt(d)
    y = glide_sine(d, 640, 390, 0.3) * np.exp(-t / 0.05)
    y += band(rng.standard_normal(len(t)), 400, 2600) * np.exp(-t / 0.035) * 0.35
    return norm(y * np.minimum(1, t / 0.001), vel)


def stamp(vel=0.8, seed=0):
    """A paper strip slammed down (caption, SLAM): a low thump, the paper's slap and a crack."""
    rng = rng_for("stamp", seed)
    d = 0.35
    t = tt(d)
    thump = glide_sine(d, 120, 55, 0.4) * np.exp(-t / 0.085)
    slap = band(rng.standard_normal(len(t)), 300, 3200) * np.exp(-t / 0.04) * 0.6
    crack = band(rng.standard_normal(len(t)), 3000, None) * np.exp(-t / 0.006) * 0.35
    return norm((thump + slap + crack) * np.minimum(1, t / 0.0015), vel)


def snip(vel=0.7, seed=0):
    """One scissor snip: blades meeting (a metallic ring) and paper giving way."""
    rng = rng_for("snip", seed)
    d = 0.12
    t = tt(d)
    n = rng.standard_normal(len(t))
    y = resonator(n, 4300, 14) * np.exp(-t / 0.02) * 0.6 + band(n, 3000, 11000) * np.exp(-t / 0.012)
    y += np.sin(2 * math.pi * 2650 * t) * np.exp(-t / 0.01) * 0.3
    return norm(y * np.minimum(1, t / 0.0007), vel)


def cut_rasp(dur, vel=0.7, seed=0):
    """Scissors running through paper: a crackling rasp that ends in a snip."""
    rng = rng_for("rasp", seed)
    t = tt(dur)
    crackle = np.zeros(len(t))
    k = 0
    while True:
        k += rng.exponential(1 / 110)
        if k >= dur:
            break
        crackle[int(k * SR)] = rng.uniform(0.3, 1)
    grains = lfilter([1], [1, -0.94], crackle)  # each click rings ~ a millisecond
    body = band(rng.standard_normal(len(t)), 2200, 7000) * 0.25
    y = band(grains, 1500, 8000) + body
    env = np.clip(t / (0.3 * dur), 0, 1) * np.clip((dur - t) / 0.03, 0, 1)
    y = y * env
    y = np.concatenate([y, snip(1.0, seed + 1)])
    return norm(y, vel)


def swoosh(dur, f0, f1, vel=0.6, seed=0):
    """Paper sliding: noise whose band moves from f0 to f1 (a bank of bands, cross-faded in log frequency)."""
    rng = rng_for("swoosh", seed)
    t = tt(dur)
    centres = np.geomspace(250, 6000, 10)
    x = rng.standard_normal(len(t))
    lf = np.log(f0) + (np.log(f1) - np.log(f0)) * (t / dur)
    y = np.zeros(len(t))
    for c in centres:
        w = np.exp(-((np.log(c) - lf) ** 2) / (2 * 0.35**2))
        y += band(x, c / 1.35, c * 1.35) * w
    env = np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return norm(y * env, vel)


def tear(dur, vel=0.8, seed=0):
    """Paper tearing open: fibres snapping faster and faster, over a dry rip."""
    rng = rng_for("tear", seed)
    t = tt(dur)
    crackle = np.zeros(len(t))
    k = 0.0
    while k < dur:
        rate = 60 + 700 * (k / dur) ** 1.5
        k += rng.exponential(1 / rate)
        if k < dur:
            crackle[int(k * SR)] = rng.uniform(0.2, 1)
    grains = lfilter([1], [1, -0.9], crackle)
    rip = band(rng.standard_normal(len(t)), 700, 5000) * (0.2 + 0.8 * (t / dur) ** 2) * 0.4
    y = band(grains, 900, 7000) + rip
    return norm(y * np.clip((dur - t) / 0.01, 0, 1), vel)


# ---------------------------------------------------------------------------------------------------- the mix bus
# Stem levels (dB) applied at mixdown: the music is a bed under the effects, the stab is the loudest moment.
STEMS = {"bass": -11.0, "drums": -2.0, "piano": 0.0, "sfx": 0.0}


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
        if sig.ndim == 1:
            th = (max(-1, min(1, pan)) + 1) * math.pi / 4
            sig = np.stack([sig * math.cos(th), sig * math.sin(th)], axis=1) * math.sqrt(2)
        j = min(self.n, i + len(sig))
        if j > i:
            self.stems[stem][i:j] += g * sig[: j - i]

    def mix(self):
        return sum(x * 10 ** (STEMS[k] / 20) for k, x in self.stems.items())


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


def master(x):
    """Normalize to TARGET_LUFS with every true peak under TP_CEIL (limit, re-measure, repeat)."""
    for _ in range(6):
        g = 10 ** ((TARGET_LUFS - lufs(x)) / 20)
        x = x * g
        if true_peak_db(x) <= TP_CEIL + 0.02:
            break
        x = limit(x, TP_CEIL - 0.1)
    return x


# ---------------------------------------------------------------------------------------------------- composition
# The problem half (ch01-ch04) is minor and sparse; later chapters get their own charts when the whole film is done.
CHARTS = {
    "ch01": [("Dm", ["D2", "F2", "A2", "C3"]), ("Bb", ["Bb1", "D2", "F2", "A1"]), ("Gm", ["G1", "Bb1", "D2", "E2"]),
             ("A7", ["A1", None, None, None]), ("Dm", [None, None, None, None])],
}


def compose(bus, tl, cues, chapters):
    beat = tl["beat"]
    chs = {c["id"]: c for c in tl["chapters"]}
    t0 = min(chs[c]["start"] for c in chapters)
    by = {}
    for q in cues:
        by.setdefault(q["name"], []).append(q)

    for ch in chapters:
        c = chs[ch]
        bars = int(round((c["end"] - c["start"]) / (4 * beat)))
        chart = CHARTS.get(ch, CHARTS["ch01"])
        for b in range(bars):
            name, notes = chart[b % len(chart)]
            for k, nm in enumerate(notes):
                if not nm:
                    continue
                at = c["start"] + (4 * b + k) * beat
                vel = 0.55 + 0.1 * min(b, 3) + (0.08 if k == 0 else 0)
                bus.add(pluck_bass(hz(nm), beat * 1.02, vel, seed=b * 4 + k), at - t0, -9, pan=-0.05, stem="bass")
        # Brushes from bar 2 to the drop: the swish, and slaps on 2 and 4 (swung pickup taps before 4).
        drop = by.get("drop", [{"t": c["end"]}])[0]["t"]
        s0 = c["start"] + 4 * beat
        if drop > s0:
            sw = brush_swish(drop - s0, beat, seed=1)
            sw *= np.clip((len(sw) - np.arange(len(sw))) / (0.25 * SR), 0, 1)  # eases out into the drop
            bus.add(sw, s0 - t0, -30, pan=0.25, stem="drums")
            k = 0
            while s0 + k * beat < drop:
                at = s0 + k * beat
                if k % 2 == 1:
                    bus.add(brush_slap(0.7, seed=k), at - t0, -19, pan=0.2, stem="drums")
                if k % 4 == 2:  # a light swung tap on the "and" of 3
                    bus.add(brush_slap(0.35, seed=100 + k), at + SWING * beat - t0, -26, pan=0.3, stem="drums")
                k += 1

    # Effects on the scenes' own frames.
    for q in by.get("complaint", []):
        bus.add(pop(0.9, seed=0), q["t"] - t0, -11, pan=-0.35)
    bubbles = by.get("bubble", [])
    for i, q in enumerate(bubbles):
        last = i == len(bubbles) - 1
        bus.add(tick(1500 + 180 * ((i * 7) % 5), muffled=last, seed=i), q["t"] - t0, -17 if not last else -19,
                pan=0.4 if i % 2 else -0.3)
    for i, q in enumerate(by.get("caption", [])):
        bus.add(stamp(0.9, seed=i), q["t"] - t0 - 0.005, -9, pan=0.25)
    for q in by.get("scissor", []):
        bus.add(cut_rasp(0.42, 0.8, seed=3), q["t"] - t0, -13, pan=0.1)
    for q in by.get("split", []):
        bus.add(swoosh(0.6, 1600, 450, 0.7, seed=5), q["t"] - t0, -15, pan=-0.6)
        bus.add(swoosh(0.6, 1500, 420, 0.7, seed=6), q["t"] - t0 + 0.07, -15, pan=0.6)
        bus.add(piano(["C2", "C#2", "D2", "G2"], 2.4, 0.45, seed=7, spread=0.1), q["t"] - t0, -16, stem="piano")  # low cluster
    for q in by.get("slide", []):
        dur = q.get("land", q["t"] + 0.4) - q["t"] + 0.08
        bus.add(swoosh(dur, 700, 1700, 0.6, seed=8), q["t"] - t0, -17, pan=-0.4)
        bus.add(stamp(0.35, seed=9), q.get("land", q["t"]) - t0, -21)
    for q in by.get("snip", []):
        bus.add(snip(0.8, seed=10), q["t"] - t0, -12, pan=0.15)
        bus.add(snip(0.75, seed=11), q["t"] - t0 + 0.11, -13, pan=0.2)
    stab_t = by.get("stab", [{}])[0].get("t")
    for q in by.get("drop", []):
        bus.add(swoosh(0.55, 1300, 280, 0.6, seed=12), q["t"] - t0, -18, pan=0.1)
        ring = (stab_t if stab_t else q["t"] + 1.4) - q["t"] + 0.25  # it rings on under the tear, no gap
        bus.add(pluck_bass(hz("A1"), ring, 0.85, fall=(0.08, 7, 0.7)), q["t"] - t0 - 0.08, -9, stem="bass")  # one bass note falls
    for q in by.get("tear", []):
        end = stab_t if stab_t else q["t"] + 0.65
        bus.add(tear(end - q["t"], 0.85, seed=13), q["t"] - t0, -12, pan=0.05)
    if stab_t:
        at = stab_t - t0
        bus.add(piano(["D3", "F3", "A3", "Bb3", "D4"], 2.6, 0.95, seed=14), at, -5, stem="piano")
        bus.add(pluck_bass(hz("D2"), 2.4, 1.0, seed=99), at, -7, stem="bass")
        bus.add(pluck_bass(hz("D1"), 2.4, 0.9, seed=98), at, -9, stem="bass")
        bus.add(crash(2.6, 0.8, seed=15), at, -15, pan=0.3, stem="drums")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chapters", default="ch01")
    ap.add_argument("--cues", default="out/sound/cues.json")
    ap.add_argument("--out", default="out/sound/ch01.wav")
    ap.add_argument("--stems", action="store_true", help="print each stem's level before mastering")
    a = ap.parse_args()
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    cues = json.loads((ROOT / a.cues).read_text())["cues"]
    chapters = a.chapters.split(",")
    chs = {c["id"]: c for c in tl["chapters"]}
    t0 = min(chs[c]["start"] for c in chapters)
    t1 = max(chs[c]["end"] for c in chapters)
    bus = Bus(t1 - t0)
    compose(bus, tl, cues, chapters)
    x = bus.mix()[: int(round((t1 - t0) * SR))]
    if a.stems:
        g = None
        for k, st in bus.stems.items():
            y = st[: len(x)] * 10 ** (STEMS[k] / 20)
            pk = 20 * np.log10(np.max(np.abs(y)) + 1e-12)
            rms = 20 * np.log10(np.sqrt(np.mean(y[np.max(np.abs(y), axis=1) > 1e-4] ** 2)) + 1e-12) if np.any(np.abs(y) > 1e-4) else -120
            print(f"  stem {k:6s} peak {pk:6.1f} dBFS, active rms {rms:6.1f} dBFS (before mastering)")
    x[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]  # no click at the cut-off
    x = master(x)
    out = ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, x.astype(np.float32))
    print(f"{out.relative_to(ROOT)}: {len(x) / SR:.3f} s, {lufs(x):.2f} LUFS, true peak {true_peak_db(x):.2f} dBTP")


if __name__ == "__main__":
    main()
