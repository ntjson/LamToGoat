"""The Mixkit bed's harmony as it is played: a chord chart per source beat, for effects that sound notes.

Why: an effect that sounds a pitch must sit in the chord the track plays at that bar, tuned to the track (A4 = 441.3 Hz).
The chroma in out/sound/bed.json cannot name chords: the bass's overtones dominate it. So this tool measures what is really
sounding, beat by beat, on the stretched track (tools/bed.py; source bar n starts at 0.083 + (n - 1) * 2.2222 s), and
merges it with a chart read from that evidence.

Measured, per source beat (200 = 50 bars x 4):
- `bass`: the bass line's note, from a harmonic-weighted FFT peak (34-130 Hz) in each 8th (0.22 s, zero-padded), as MIDI at
  A4 = 441.3, one octave down where the fundamental below has real energy. `bass_beat` is the note on the beat, `bass_and`
  the note on the "&" when the line moves there; `bass` is the note the chord stands on (a passing or approach note on the
  beat gives way to the "&" if that is a chord tone).
- `notes`: the notes above the bass (E3-C6) sounding on the beat, by non-negative least squares on a 36-per-octave CQT with
  harmonic-series note templates (bass overtones are explained by the bass, not taken for notes), with cymbal and hat noise
  (adjacent semitones of equal strength) filtered out; strength is relative to the beat's strongest note.
Read by hand from those numbers (CHART below, with a note per bar): `chord`, from which `root`, `quality`, `tones`. From the
notes: `ext` (extensions the track itself plays over the chord), `avoid` (a semitone above a chord tone that the track does not
sound), `safe` (chord tones and extensions, minus `avoid`, the third and the seventh first) and `hold` (the pitch classes of
`safe` that stay consonant through this beat and the next three: for a sound that rings). `auto` is the label the evidence
alone gives (a second opinion), `explained` the share of the sounding notes' strength the chord's tones and extensions cover.
Verification (`--check`), all independent of how the chart was read:
- the measured bass pitch class is a chord tone of the chart's chord;
- an STFT chroma of 300-2500 Hz (not the NNLS notes), plus the bass, is compared with the chart chord's template: cosine
  similarity, and the chart chord's rank among every root and quality of its size that contains the bass note.
Two constant lines (a D3/F#3 drone, `DRONE`) run under the whole track; they are not part of the chart.

Run: uv run --with numpy --with scipy python tools/bedharmony.py [--check] [--cues] [--review FIRST LAST] [--out FILE]
Deterministic: the same audio, the same file.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import nnls

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import bed  # noqa: E402  (stretched(), the track's constants)

A4 = 441.3
SR = bed.SR
BEAT, BAR, T0 = bed.BEAT, bed.BAR, bed.FIRST_DOWNBEAT
PC = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def nm(m):
    return f"{PC[m % 12]}{m // 12 - 1}"


def midi_of(f):
    return 69 + 12 * math.log2(f / A4)


# ---------------------------------------------------------------------------------------------------- features
def mono():
    return bed.stretched().mean(axis=1)


def bass_fft(x, a, b, lo=34.0, hi=130.0):
    """The bass's fundamental in x[a:b] (seconds): the peak of |FFT| scored on its 1st, 2nd and 3rd harmonics. Returns
    (f0 in Hz, MIDI as float, level in dB re the window's mean spectrum, low-octave ratio: energy at f0/2 over f0)."""
    seg = x[int(a * SR):int(b * SR)]
    seg = seg * np.hanning(len(seg))
    n = 1 << 18
    s = np.abs(np.fft.rfft(seg, n))
    df = SR / n
    fs = np.arange(int(lo / df), int(hi / df) + 1) * df
    sc = np.array([s[int(round(f / df))] + 0.7 * s[int(round(2 * f / df))] + 0.5 * s[int(round(3 * f / df))] for f in fs])
    i = int(np.argmax(sc))
    f0 = fs[i]
    # parabolic refinement on the fundamental's own peak
    j = int(round(f0 / df))
    if 1 < j < len(s) - 2 and s[j] > 0:
        y0, y1, y2 = s[j - 1], s[j], s[j + 1]
        d = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-18)
        f0 = (j + max(-0.5, min(0.5, d))) * df
    lower = s[int(round(0.5 * f0 / df))] / (s[int(round(f0 / df))] + 1e-18) if f0 / 2 >= 36 else 0.0
    return f0, midi_of(f0), 20 * math.log10(max(sc[i], 1e-12) / (sc.mean() + 1e-12)), lower


NOTES = np.arange(28, 97)  # E1..C7


def cqt_nnls(x48):
    """Note activations (len(NOTES) x frames, 11.6 ms hop) from an NNLS fit of harmonic-series note templates to a CQT."""
    import librosa
    sr = 22050
    y = librosa.resample(x48.astype(np.float32), orig_sr=SR, target_sr=sr)
    hop = 256
    tun = 1200 * math.log2(A4 / 440.0) / (1200 / 36)  # A4 = 441.3, in fractions of a 36-per-octave bin
    C = np.abs(librosa.cqt(y, sr=sr, hop_length=hop, fmin=librosa.note_to_hz("C1"), n_bins=36 * 7, bins_per_octave=36,
                           tuning=tun, filter_scale=0.85))
    t = librosa.frames_to_time(np.arange(C.shape[1]), sr=sr, hop_length=hop)
    fr = librosa.cqt_frequencies(n_bins=C.shape[0], fmin=librosa.note_to_hz("C1") * 2 ** (tun / 36), bins_per_octave=36)
    logf = np.log2(fr)
    f0 = A4 * 2 ** ((NOTES - 69) / 12)
    T = np.zeros((C.shape[0], len(NOTES)))
    for j, f in enumerate(f0):
        for k in range(1, 13):
            if f * k > fr[-1]:
                break
            T[:, j] += 0.65 ** (k - 1) * np.exp(-0.5 * ((logf - math.log2(f * k)) * 36 / 0.7) ** 2)
    T /= T.sum(axis=0, keepdims=True)
    Cm = C ** 0.6
    B = np.zeros((len(NOTES), C.shape[1]), dtype=np.float32)
    for i in range(C.shape[1]):
        B[:, i], _ = nnls(T, Cm[:, i], maxiter=300)
    return B, t, T, Cm


def peaky(v, lo=52, hi=88):
    """Keep the notes of an activation vector that stand out from their neighbours: a note beside a note of the same
    strength is noise (a cymbal's or a hat's adjacent semitones), a real note has a peak."""
    out = np.zeros_like(v)
    idx = {int(n): i for i, n in enumerate(NOTES)}
    for n in range(lo, hi + 1):
        i = idx[n]
        nb = max(v[idx[n - 1]], v[idx[n + 1]])
        if v[i] > 1.25 * nb:
            out[i] = v[i]
    return out


def eighth(bar, k):
    """(start, end) s of the k-th 8th (0..7) of source bar `bar`, trimmed of the attack's smear and the next hit."""
    a = T0 + (bar - 1) * BAR + k * BEAT / 2
    return a + 0.04, a + BEAT / 2 - 0.03


def measure():
    x = mono()
    B, t, T, Cm = cqt_nnls(x)
    beats = []
    for bar in range(1, 51):
        for beat in range(1, 5):
            sb = 4 * (bar - 1) + beat - 1
            e8 = []
            for h in range(2):
                k = 2 * (beat - 1) + h
                a, b = eighth(bar, k)
                f0, m, lvl, low = bass_fft(x, a, b)
                s = (t >= a) & (t < b)
                v = B[:, s].mean(axis=1) if s.any() else np.zeros(len(NOTES))
                rms = float(np.sqrt(np.mean(x[int(a * SR):int(b * SR)] ** 2)))
                e8.append({"f0": f0, "m": m, "lvl": lvl, "low": low, "v": v, "rms": rms})
            beats.append({"sb": sb, "bar": bar, "beat": beat, "e8": e8})
    return x, B, t, T, Cm, beats


# ---------------------------------------------------------------------------------------------------- chords
NOTE = {n: i for i, n in enumerate(PC)}
NOTE.update({"Db": 1, "Gb": 6, "A#": 10, "D#": 3, "G#": 8})
# Intervals (semitones from the root) of the chord tones each quality names: the third and the seventh define a chord.
QUAL = {"": (0, 4, 7), "m": (0, 3, 7), "7": (0, 4, 7, 10), "m7": (0, 3, 7, 10), "maj7": (0, 4, 7, 11), "6": (0, 4, 7, 9),
        "m6": (0, 3, 7, 9), "m7b5": (0, 3, 6, 10), "dim7": (0, 3, 6, 9), "7sus": (0, 5, 7, 10), "sus": (0, 5, 7),
        "5": (0, 7), "maj7#5": (0, 4, 8, 11), "m9": (0, 3, 7, 10, 2)}
# The colour tones a quality usually carries above its chord tones (9th, 11th, 13th and the usual alterations): what
# the automatic labeler forgives; the notes the track really plays over a chord are measured, not assumed.
COLOUR = {"": (2, 9, 6), "m": (2, 5, 9), "7": (2, 9, 5, 3, 6, 8, 1), "m7": (2, 5, 9), "maj7": (2, 6, 9), "6": (2, 6, 11),
          "m6": (2, 5, 11), "m7b5": (5, 8, 1), "dim7": (2, 5, 11), "7sus": (2, 9, 4), "sus": (2, 9, 10), "5": (2, 4, 3, 10, 9, 5),
          "maj7#5": (2, 9, 6), "m9": (5, 9)}


def parse(sym):
    """'Db7' -> (root pc, quality, bass pc or None); 'C7/G' -> (0, '7', 7)."""
    body, _, bs = sym.partition("/")
    r = body[:2] if len(body) > 1 and body[1] in "#b" else body[:1]
    q = body[len(r):]
    if q not in QUAL:
        raise ValueError(f"unknown quality {q!r} in {sym!r}")
    return NOTE[r], q, (NOTE[bs] if bs else None)


def tones_of(sym):
    r, q, _ = parse(sym)
    return [(r + i) % 12 for i in QUAL[q]]


# The chart, read by hand from the evidence (`--review`), one symbol per beat: what the track plays, bar by bar. The
# label the evidence alone gives is computed too (`auto`) and the disagreements are listed by `--check`, so a misreading
# shows. tier: H the evidence is clear, M it is clear on some beats, L the texture is ambiguous (the reading is the most
# likely one). Source bars; the film repeats them (bed.PLAN).
CHART = {
    # intro: a D pedal (the bass pulses D2 on every 8th, Eb2 on the "&" of 4) under the constant D3/F#3 drone (see DRONE).
    1: ("D D D D", "L", "the fade-in: the pulse and the drone only"),
    2: ("D D D D", "M", "D pedal; a pickup flourish on 4 (Eb bass, G/B/C#/E on top)"),
    3: ("D D D D", "M", "as bar 2"),
    4: ("D D D D", "M", "as bar 2"),
    5: ("D D D C", "M", "D pedal; C on 4 (V of F) leads into 6"),
    # intro, second group: F comes in over the same drone
    6: ("F F F F", "M", "F (A, C, and B natural on top) over the D/F# drone"),
    7: ("Fm9 Fm9 Fm9 Fm9", "M", "F minor: Ab bass on 3, C/Eb/G on top (Abmaj7 over F); the bass chromatic around F on 4"),
    8: ("F F F F", "M", "as bar 6"),
    9: ("F F Eb Eb", "L", "F over D pulses, then Eb (G/Bb/C on top): the pull-back into A"),
    # A1: an F minor blues turnaround: Fm7 | Db7 C7 (the bass F F Db C)
    10: ("Fm7 Fm7 Db7 C7sus", "H", "Ab/C/Eb on top; B3 (Cb) is Db7's 7th, Bb3 (with G, D, F) is C7sus's"),
    11: ("Fm7 Fm7 Db7 C7sus", "H", "Fm7(11): Bb on top"),
    12: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    13: ("F7sus F7sus F7sus F7sus", "M", "F, C, G, Eb and B natural over F; the bass walks F G Bb into 14; no third"),
    14: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    15: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    16: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    17: ("Fm7 Fm7 Fm7 C7", "H", "Fm7 whole; C7 (#9) on 4 into B1"),
    # B1: ii-V-I in Ab (Bbm7 Eb7 Abmaj7), ii-V-i in F minor (Gm7 Gm7b5 C7 Fm7), and G7sus F#7 into A2
    18: ("Bbm7 Bbm7 Eb7 Eb7", "H", "Ab/Db/F on top; Eb7: G and Db"),
    19: ("Abmaj7 Bb7sus Abmaj7/C Abmaj7", "M", "C-G shell; Bb over C and Ab (no third: sus); Ab-C with G and Bb on 3; the bass walks Ab Bb C Ab"),
    20: ("Gm7 Gm7b5 C7 C7/G", "M", "F/Bb/G, then Db (the b5); C7 on 3, over G then F# on 4"),
    21: ("Fm7 Fm7 Fm7 F6", "M", "Ab/C/Eb; on 4 F, A, C, D, G (F6/9: F major, once) over the bass E then C"),
    22: ("Bbm7 Bbm7 Eb6 Eb6", "M", "as 18 but Eb6 (G, Ab, C: no Db); Bbm7 with G (13th)"),
    23: ("Abmaj7 Ab/Eb Abmaj7 Abmaj7", "H", "C/G/Ab/F on top; the bass Ab Eb Ab"),
    24: ("G7sus G7sus F#7 F#7", "M", "G, C, F over G; F# with E, C#, Ab (G#): F#7(9) into F"),
    # A2
    25: ("Fm7 Fm7 Db7 C7", "M", "sparse comping: C4 only on 1-2; C9 on 4"),
    26: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    27: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    28: ("F7sus F7sus F7sus C7", "L", "as 13; the bass F F F C E C with B natural on 4"),
    29: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    30: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    31: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    32: ("Fm7 Fm7 Fm7 C7", "M", "as 17, into B2"),
    # B2
    33: ("Bbm7 Bbm7 Eb7 Eb7", "H", "as 18"),
    34: ("Abmaj7 Abmaj7/C Abmaj7/Eb Bb7sus", "M", "C/Eb/G/F on top all bar (Abmaj7 6/9) over the bass run Ab Bb C Db Eb Db C Bb; on 4 the bass Bb under Ab, C, Eb, G: Bb9sus"),
    35: ("Gm7b5 Gm7b5 C7 C7", "H", "Bb/Db/F over G; C7(b9) on 3, C7alt (Eb, Ab) on 4"),
    36: ("Fm7 Fm7 Fm7 Fm7", "H", "Ab/C/Eb/F; the bass F C on the 8ths"),
    37: ("Bbm7 Bbm7 Eb7 Eb7", "H", "as 18; Eb with a Gb (#9) on 3"),
    38: ("Abmaj7 Abmaj7 Abmaj7 Abmaj7", "M", "F/G/C/Eb on top (Ab6/9); the bass Ab C Eb C Ab Ab G Bb"),
    39: ("Gm7b5 Gm7b5 C7 C7/F#", "H", "Bb/Db/F over G; C7 (G Bb C E) on 3; the same over F# on 4"),
    # A3
    40: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    41: ("Fm7 Fm7 Db7 C7", "H", "as 10"),
    42: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    43: ("F5 F5 F5 F6", "M", "F and C on top (E in passing), the third only in passing: F major, open; A and G on 4"),
    44: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    45: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    46: ("Fm7 Fm7 Db7 C7sus", "H", "as 10"),
    47: ("Fm7 Fm7 Fm7 C7sus", "M", "as 17: F4 Ab4 C5 F5, then C, F, G on 4"),
    # coda and the final chord
    48: ("G7 G7 C7 F6", "M", "G7(b9) over a bass F Ab B (its 7th, b9, 3rd); C7alt (E, Eb, Ab); F6/9 (F G D E)"),
    49: ("Cmaj7#5 Cmaj7#5 F6 Fm", "L", "C, Ab, B, D then E: C maj7#5 (bass C G, then Ab D); F and A; Ab and C"),
    50: ("Fm Fm6 Fm6 Fm6", "L", "the last chord: bass D2 and Ab2 ring, F Ab C D above (Dm7b5 = Fm6), cymbal wash"),
}
SECTIONS = [("intro", 1, 9), ("A1", 10, 17), ("B1", 18, 24), ("A2", 25, 32), ("B2", 33, 39), ("A3", 40, 47), ("coda", 48, 49),
            ("final chord", 50, 50)]
# The two constant lines: exact integer multiples of the beat rate (110.005/60 = 1.8334 Hz: the 82nd and the 102nd),
# present at the same level through all 50 bars and ducked at each bar line: a drone under the whole track. Measured
# on the unstretched MP3 (0.011 Hz resolution). Sharp of the 441.3 grid by 35 and 15 cents.
DRONE = {"hz": [150.333, 186.996], "notes": ["D3", "F#3"], "cents_vs_441_3": [35, 15],
         "note": "constant through the whole track, ducked at bar lines; audible mostly where the texture is sparse "
                 "(the intro). A D-F# major third: it is not part of the chord chart, and it is why the intro reads as D."}


def chord_fields(sym, notes, bass_pcs):
    """tones, ext, avoid and safe for a chord symbol given the notes really sounding (list of (midi, strength))."""
    r, q, bs = parse(sym)
    tones = [(r + i) % 12 for i in QUAL[q]]
    ext = []
    for m, w in notes:
        pc = m % 12
        if w >= 0.45 and m <= 84 and pc not in tones and pc not in ext:
            ext.append(pc)
    have = set(tones) | set(ext) | set(bass_pcs)
    avoid = []
    for t in tones:
        a = (t + 1) % 12
        if a not in have and a not in avoid:
            avoid.append(a)
    # preference: the third and the seventh first (they colour the chord), then the root, the fifth, then the extensions
    order = [(r + i) % 12 for i in (3, 4, 10, 11, 9, 0, 7, 5, 6) if i in QUAL[q]]
    safe = [p for p in order + ext if p not in avoid]
    seen = []
    for p in safe:
        if p not in seen:
            seen.append(p)
    return tones, ext, avoid, seen


def auto_label(bass_pc, upper):
    """The chord the evidence alone gives: upper = weight per pitch class (12), bass_pc the bass line's note. Scores every
    root and quality by the weight of the notes it explains, minus the weight it cannot, with the bass as the root."""
    tot = upper.sum() + 1e-9
    best = []
    for r in range(12):
        for q, iv in QUAL.items():
            tn = {(r + i) % 12 for i in iv}
            col = {(r + i) % 12 for i in COLOUR[q]}
            key = {(r + i) % 12 for i in (iv[1], iv[-1])} if len(iv) > 2 else set()
            s = sum(upper[p] for p in tn) + 0.35 * sum(upper[p] for p in col - tn) - 0.9 * sum(upper[p] for p in range(12) if p not in tn | col)
            s /= tot
            s += 0.25 * sum(1 for p in key if upper[p] > 0.15 * upper.max())
            if bass_pc is not None:
                s += 0.5 if bass_pc == r else (0.2 if bass_pc in tn else -0.3)
            s -= 0.04 * len(iv)
            best.append((s, r, q))
    best.sort(reverse=True)
    s, r, q = best[0]
    return f"{PC[r]}{q}", round(float(s), 2), [f"{PC[b[1]]}{b[2]}" for b in best[1:3]]


# ---------------------------------------------------------------------------------------------------- review view
def review(beats, first, last):
    for r in beats:
        if not first <= r["bar"] <= last:
            continue
        if r["beat"] == 1:
            print(f"--- bar {r['bar']}")
        bs = []
        up = np.zeros(len(NOTES))
        for e in r["e8"]:
            bs.append(f"{PC[int(round(e['m'])) % 12]}{int(round((e['m'] - round(e['m'])) * 100)):+d}")
            up = np.maximum(up, peaky(e["v"]))
        hi = up.copy()
        m = hi.max()
        top = [i for i in np.argsort(-hi) if m > 0 and hi[i] >= 0.3 * m][:7]
        print(f"  b{r['beat']}: bass {' '.join(bs):16s} up: " + " ".join(f"{nm(int(NOTES[i]))}:{int(round(hi[i] / m * 9.99))}" for i in sorted(top)))


def bass_midi(e):
    """The bass note of one 8th as MIDI: the measured pitch, one octave down where the fundamental one octave below has
    real energy (the bass is F1, its 2nd harmonic often the louder line); None in the fade-in."""
    if e["rms"] < 3e-4:
        return None
    m = int(round(e["m"]))
    if e["low"] >= 0.25 and m - 12 >= 28:
        m -= 12
    return m


def chord_bass(b0, b1, tones):
    """The bass note the chord stands on: the note on the beat, unless it is a passing or approach note (not a chord tone,
    next to or leading to the note on the "&", which is one)."""
    if b0 is None:
        return b1 % 12 if b1 is not None else None
    if b1 is not None and b0 % 12 not in tones and b1 % 12 in tones:
        return b1 % 12
    return b0 % 12


def upper_notes(r):
    """The notes above the bass on one beat: the peaks of both 8ths, strongest first, relative to the strongest."""
    up = np.zeros(len(NOTES))
    for e in r["e8"]:
        up = np.maximum(up, peaky(e["v"]))
    m = up.max()
    if m <= 0:
        return []
    idx = [i for i in np.argsort(-up) if up[i] >= 0.25 * m][:8]
    return [(int(NOTES[i]), float(up[i] / m)) for i in idx]


def build(beats):
    out = []
    for r in beats:
        bar, beat = r["bar"], r["beat"]
        sym = CHART[bar][0].split()[beat - 1]
        b0, b1 = bass_midi(r["e8"][0]), bass_midi(r["e8"][1])
        notes = upper_notes(r)
        bass_pcs = [m % 12 for m in (b0, b1) if m is not None]
        tones, ext, avoid, safe = chord_fields(sym, notes, bass_pcs)
        root, qual, sl = parse(sym)
        w = np.zeros(12)
        for m, s_ in notes:
            if 52 <= m <= 88:
                w[m % 12] += s_
        cb = chord_bass(b0, b1, tones)
        auto, score, alts = auto_label(cb, w)
        # explained: the share of the sounding notes' strength the label's tones and colour account for
        have = set(tones) | set(ext) | ({sl} if sl is not None else set())
        expl = sum(s_ for m, s_ in notes if m % 12 in have) / (sum(s_ for m, s_ in notes) + 1e-9) if notes else 0.0
        out.append({
            "sb": r["sb"], "bar": bar, "beat": beat,
            "bass": (b0 if (b0 is not None and b0 % 12 == cb) else b1 if (b1 is not None and b1 % 12 == cb) else b0),
            "bass_beat": b0, "bass_and": b1 if (b1 is not None and cb is not None and b1 % 12 != cb) else None,
            "bass_pc": cb,
            "notes": [[m, round(s_, 2)] for m, s_ in notes],
            "chord": sym, "root": root, "quality": qual or "maj", "tones": tones, "ext": ext, "avoid": avoid, "safe": safe,
            "auto": auto, "auto_score": score, "explained": round(float(expl), 2), "tier": CHART[bar][1],
        })
    for i, o in enumerate(out):
        o["bass_next"] = out[i + 1]["bass"] if i + 1 < len(out) else None
        win = out[i:i + 4]
        sets = [set(w["tones"]) | set(w["ext"]) for w in win]
        common = [p for p in o["safe"] if all(p in st for st in sets)]
        if not common:
            common = [p for p in o["safe"] if sum(p in st for st in sets) >= max(1, len(sets) - 1)]
        o["hold"] = common
    return out


def stft_chroma(x, lo=300.0, hi=2500.0):
    """A second, independent view of the harmony: a chroma from a plain STFT (8192 points, 170 ms) of 300-2500 Hz, spectral
    peaks only (a peak's magnitude, compressed, goes to its pitch class at A4 = 441.3), per beat. Returns 200 x 12."""
    n, hop = 8192, 1024
    win = np.hanning(n)
    fr = np.fft.rfftfreq(n, 1 / SR)
    sel = (fr >= lo) & (fr <= hi)
    fsel = fr[sel]
    pcs = np.round(69 + 12 * np.log2(fsel / A4)).astype(int) % 12
    out = np.zeros((200, 12))
    for sb in range(200):
        a0 = T0 + sb * BEAT + 0.05
        b0 = T0 + (sb + 1) * BEAT - 0.05
        acc = np.zeros(12)
        i = int(a0 * SR)
        while i + n <= int(b0 * SR) + n // 2 and i + n <= len(x):
            m = np.abs(np.fft.rfft(x[i:i + n] * win))[sel] ** 0.5
            pk = (m[1:-1] > m[:-2]) & (m[1:-1] >= m[2:]) & (m[1:-1] > 1.5 * np.median(m))
            idx = np.flatnonzero(pk) + 1
            for j in idx:
                acc[pcs[j]] += m[j]
            i += hop
        out[sb] = acc / (acc.sum() + 1e-12)
    return out


def verify(beats, entries, x):
    """The chart against the STFT chroma and the measured bass. For each beat: the cosine similarity of the chroma with the
    chart chord's tones (third and seventh weighted highest) plus the bass note; its rank among every root and quality
    of the same size that contains the bass note (the bass is measured independently of the harmony reading); and whether the
    bass note is a chord tone. Returns per-beat dicts (None where there is nothing to measure)."""
    ch = stft_chroma(x)
    res = []
    wt = {0: 1.0, 2: 0.5, 3: 1.0, 4: 1.0, 5: 0.9, 6: 0.7, 7: 0.6, 8: 0.7, 9: 0.85, 10: 1.0, 11: 1.0}

    def vec(r, q):
        v = np.zeros(12)
        for i in QUAL[q]:
            v[(r + i) % 12] += wt[i]
        return v

    def cos(a, b):
        return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))

    for r, e in zip(beats, entries):
        if e["bass_pc"] is None:
            res.append(None)
            continue
        obs = ch[r["sb"]].copy()  # (the bass: e["bass_pc"], the note the chord stands on)
        bp = e["bass_pc"]
        obs = obs / (obs.max() + 1e-12)
        obs[bp] += 0.6  # the bass note, measured on its own
        root, q, sl = parse(e["chord"])
        mine = cos(obs, vec(root, e["quality"] if e["quality"] != "maj" else ""))
        n = len(QUAL[q])
        cand = []
        for rt in range(12):
            for qq in QUAL:
                if len(QUAL[qq]) != n:
                    continue
                tn = {(rt + i) % 12 for i in QUAL[qq]}
                if bp in tn:
                    cand.append((cos(obs, vec(rt, qq)), rt, qq))
        cand.sort(reverse=True)
        rank = 1 + sum(1 for c in cand if c[0] > mine + 1e-9)
        res.append({"cos": mine, "cos_mean": float(np.mean([c[0] for c in cand])), "rank": rank, "of": len(cand),
                    "best": f"{PC[cand[0][1]]}{cand[0][2]}", "bass_is_tone": bp in e["tones"] or (sl is not None and bp == sl)})
    return res


def cue_table(entries):
    """Every pitched cue: film time -> film beat -> source beat (bed.PLAN) -> the chart."""
    cues = json.loads((ROOT / "out/sound/cues.json").read_text())["cues"]
    names = {"stab", "alarm", "drop", "chime", "bell", "climb", "band", "slab", "push", "bubble", "split", "chord"}
    rows = []
    for q in cues:
        if q["name"] not in names or (q["name"] == "bubble" and "land" not in q):
            continue
        t = q.get("land", q["t"]) if q["name"] in ("slab", "band", "bubble") else q["t"]
        fb = int(t / BAR + 1e-9) + 1  # film bar
        beat = int((t - (fb - 1) * BAR) / BEAT + 1e-6) + 1
        pos = (t - (fb - 1) * BAR) / BEAT - (beat - 1)  # where in the beat the cue falls, 0..1
        sb = None
        for f0, s0, n in bed.PLAN:
            if f0 <= fb < f0 + n:
                sb = s0 + (fb - f0)
        if sb is None:
            continue
        e = entries[4 * (sb - 1) + beat - 1]
        nxt = entries[min(199, 4 * (sb - 1) + beat)]
        rows.append((q["ch"], q["name"], t, fb, beat, sb, e, pos, nxt))
    return rows


def show(row):
    ch, name, t, fb, beat, sb, e, pos, nxt = row
    nn = " ".join(nm(m) for m, _ in e["notes"][:5])
    bs = nm(e["bass"]) if e["bass"] is not None else "--"
    if e["bass_and"] is not None:
        bs += "/" + nm(e["bass_and"])
    tail = f"  (then {nxt['chord']})" if pos > 0.6 else ""
    return (f"{ch} {name:6s} {t:8.3f}s film bar {fb:2d} b{beat}+{pos:.2f} -> source bar {sb:2d} b{beat}: {e['chord']:9s}{tail} bass {bs:7s} "
            f"sounding: {nn}   safe: {' '.join(PC[p] for p in e['safe'])}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--review", nargs=2, type=int, metavar=("FIRST", "LAST"))
    ap.add_argument("--out", default="docs/bed_harmony.json")
    ap.add_argument("--check", action="store_true", help="print the verification and the label disagreements")
    ap.add_argument("--cues", action="store_true", help="print the pitched cues against the chart")
    ap.add_argument("--no-verify", action="store_true")
    a = ap.parse_args()
    x, B, t, T, Cm, beats = measure()
    if a.review:
        review(beats, *a.review)
        return
    entries = build(beats)
    ver = None if a.no_verify else verify(beats, entries, x)
    if ver:
        for e, v in zip(entries, ver):
            tier = {"H": 1.0, "M": 0.7, "L": 0.4}[e["tier"]]
            if v:
                e["cos"], e["rank"] = round(v["cos"], 3), f"{v['rank']}/{v['of']}"
                rs = 1.0 if v["rank"] == 1 else 0.85 if v["rank"] == 2 else 0.7 if v["rank"] == 3 else 0.5 if v["rank"] <= 5 else 0.3 if v["rank"] <= 10 else 0.15
                # bars 1-5: the chord is the bass pulse and the drone, below the range the chroma sees: no check, the tier alone
                e["conf"] = round(tier if e["bar"] <= 5 else 0.5 * tier + 0.5 * rs, 2)
            else:
                e["conf"] = round(tier, 2)
    bars = []
    for bar in range(1, 51):
        syms = CHART[bar][0].split()
        spans, i = [], 0
        while i < 4:
            j = i
            while j + 1 < 4 and syms[j + 1] == syms[i]:
                j += 1
            spans.append({"beat": i + 1, "beats": j - i + 1, "chord": syms[i]})
            i = j + 1
        bars.append({"bar": bar, "chords": spans, "tier": CHART[bar][1], "note": CHART[bar][2]})
    devs = []
    for r in beats:
        for e in r["e8"]:
            if e["rms"] > 3e-4 and r["bar"] >= 10:
                devs.append((e["m"] - round(e["m"])) * 100)
    up = []
    seg_ = x[int(bed.src_time(10) * SR):int(bed.src_time(48) * SR)]
    from scipy.signal import find_peaks, welch
    ff, PP = welch(seg_, fs=SR, nperseg=1 << 17, noverlap=1 << 16, window="hann")
    sel_ = (ff >= 200) & (ff <= 2000)
    ff, PPd = ff[sel_], 10 * np.log10(PP[sel_] + 1e-20)
    pk_, _ = find_peaks(PPd, prominence=8, distance=6)
    for i_ in pk_:
        if min(abs(ff[i_] - d_) for d_ in DRONE["hz"]) < 4:
            continue
        up.append(((69 + 12 * math.log2(ff[i_] / A4)) % 1.0, PP[sel_][i_]))
    dev_up = [((c_ + 0.5) % 1.0 - 0.5) * 100 for c_, _ in up]
    doc = {
        "a4": A4,
        "method": "tools/bedharmony.py: bass by harmonic-weighted FFT per 8th; upper notes by NNLS on a CQT with harmonic note "
                  "templates, noise-filtered; chords read by hand from those (CHART) and verified against the bass and an "
                  "independent STFT chroma",
        "source": str(bed.SRC.relative_to(ROOT)), "bpm": bed.BPM, "first_downbeat": bed.FIRST_DOWNBEAT,
        "tuning_check": {"bass_notes_median_cents_vs_441_3": round(float(np.median(devs)), 1),
                         "upper_partials_median_cents_vs_441_3": round(float(np.median(dev_up)), 1), "upper_partials_n": len(dev_up),
                         "bass_notes_p10_p90_cents": [round(float(np.percentile(devs, 10)), 1), round(float(np.percentile(devs, 90)), 1)]},
        "sections": [{"name": n, "bars": [a_, b_]} for n, a_, b_ in SECTIONS],
        "plan": [{"film_bars": [f, f + n - 1], "source_bars": [sb, sb + n - 1]} for f, sb, n in bed.PLAN],
        "film_sb": [4 * (sb - 1) + 4 * k + b_ for f, sb, n in bed.PLAN for k in range(n) for b_ in range(4)],
        "drone": DRONE, "bars": bars, "beats": entries,
    }
    if ver:
        ok = [v for v in ver if v]
        doc["verify"] = {"beats": len(ok), "mean_cos_chart": round(float(np.mean([v["cos"] for v in ok])), 3),
                         "mean_cos_candidates": round(float(np.mean([v["cos_mean"] for v in ok])), 3),
                         "top1": sum(1 for v in ok if v["rank"] == 1), "top3": sum(1 for v in ok if v["rank"] <= 3),
                         "median_rank": float(np.median([v["rank"] for v in ok])),
                         "bass_is_chord_tone": round(sum(1 for v in ok if v["bass_is_tone"]) / len(ok), 3)}
    p = ROOT / a.out
    p.write_text(json.dumps(doc, indent=1))
    print(f"{p.relative_to(ROOT)}: {len(entries)} beats, {len(bars)} bars")
    if a.check:
        print("\nauto label differs from the chart (chart | auto, alternatives):")
        for e in entries:
            ra, qa, _ = parse(e["auto"])
            rc, qc, _ = parse(e["chord"])
            ta, tc = {(ra + i) % 12 for i in QUAL[qa]}, {(rc + i) % 12 for i in QUAL[qc]}
            if not (ra == rc and (ta <= tc or tc <= ta)):
                print(f"  bar {e['bar']:2d} b{e['beat']}: {e['chord']:7s} | {e['auto']:7s} ({e['auto_score']})  explained {e['explained']}  tier {e['tier']}")
        if ver:
            print("\nper bar: mean cosine of the chart's chord with the STFT chroma+bass | mean over its candidates | rank of the chart's chord per beat | best candidate | bass a chord tone")
            for bar in range(1, 51):
                vs = [v for e, v in zip(entries, ver) if e["bar"] == bar and v]
                if vs:
                    print(f"  bar {bar:2d}: {np.mean([v['cos'] for v in vs]):.3f} | {np.mean([v['cos_mean'] for v in vs]):.3f} | "
                          f"ranks {[v['rank'] for v in vs]} best {[v['best'] for v in vs]} bass-in-chord {sum(v['bass_is_tone'] for v in vs)}/{len(vs)}  {CHART[bar][1]}")
            print("verify:", doc["verify"])
    if a.cues:
        print()
        for row in cue_table(entries):
            print(show(row))


if __name__ == "__main__":
    main()
