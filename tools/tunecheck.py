"""Check the pitched effects' tuning from the finished stems: every note the score logs, measured where it sounds.

For each pitched note in the score (`inst` bass, piano, vibes, brass, arco, tick, bell, tone, ...; `midi` its notes) it finds
that note's fundamental in the stem it is on: the strongest spectral peak within 60 cents of where A4 = 441.3 Hz says the
note should be, from a long Hann-windowed FFT of the note's steady part, refined by parabolic interpolation. It reports the
error in cents (positive = sharp). The Mixkit bed sits at +5 cents on A4 = 440, that is A4 = 441.3.

Stems come from `tools/sound.py --stem-dir DIR`. Notes that share a stem with another sound closer than 60 cents in that
window (a semitone cluster) are skipped and counted.

Usage: uv run --with numpy --with scipy python tools/tunecheck.py [--stem-dir out/sound/stems] [--score out/sound/score.json]
       [--a4 441.3] [--json out/sound/tunecheck.json]
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
STEM = {"bass": "bass", "arco": "bass", "piano": "piano", "vibes": "vibes", "brass": "brass", "tick": "tone", "bell": "tone",
        "tone": "tone", "slab": "tone"}


def measure(x, f_expected, t0, dur):
    """Cents (measured over expected) of the strongest peak within 60 cents of f_expected in x[t0 : t0 + dur]."""
    a = int((t0) * SR)
    b = min(len(x), a + int(dur * SR))
    seg = x[a:b]
    if len(seg) < 0.05 * SR:
        return None
    seg = seg.mean(axis=1) if seg.ndim == 2 else seg
    n = 1 << 19
    X = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n))
    f = np.fft.rfftfreq(n, 1 / SR)
    lo, hi = f_expected * 2 ** (-60 / 1200), f_expected * 2 ** (60 / 1200)
    sel = np.flatnonzero((f >= lo) & (f <= hi))
    if len(sel) < 3:
        return None
    i = sel[np.argmax(X[sel])]
    if X[i] < 1e-6 or i <= 0 or i >= len(X) - 1:
        return None
    y0, y1, y2 = np.log(X[i - 1] + 1e-12), np.log(X[i] + 1e-12), np.log(X[i + 1] + 1e-12)
    d = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2) if (y0 - 2 * y1 + y2) != 0 else 0.0
    fm = (i + d) * SR / n
    # the peak must stand well above its surroundings (not just the edge of a louder neighbour)
    ring = X[(f >= f_expected * 2 ** (-150 / 1200)) & (f <= f_expected * 2 ** (150 / 1200))]
    if X[i] < 0.5 * ring.max():
        return None
    return 1200 * math.log2(fm / f_expected)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stem-dir", default="out/sound/stems")
    ap.add_argument("--score", default="out/sound/score.json")
    ap.add_argument("--a4", type=float, default=441.3)
    ap.add_argument("--json", default=None)
    a = ap.parse_args()
    d = ROOT / a.stem_dir
    score = json.loads((ROOT / a.score).read_text())
    stems = {}
    rows, skipped = [], 0
    for e in score["events"]:
        if "inst" not in e or e["inst"] not in STEM or not e.get("midi"):
            continue
        name = STEM[e["inst"]]
        if name not in stems:
            sr, x = wavfile.read(d / f"{name}.wav")
            assert sr == SR
            stems[name] = x.astype(np.float64)
        t0 = e["t"] - score["t0"]
        # the steady part: after the attack, as long as the note lasts (at most 1.5 s; the bass needs it long)
        start = t0 + (0.03 if e["inst"] in ("tick",) else 0.06)
        dur = min(1.5, max(0.08, e["dur"] - 0.08))
        for m in e["midi"]:
            f0 = a.a4 * 2 ** ((m - 69) / 12)
            c = measure(stems[name], f0, start, dur)
            if c is None:
                skipped += 1
                continue
            rows.append({"inst": e["inst"], "what": e.get("what", ""), "ch": e["ch"], "t": e["t"], "midi": m,
                         "hz": round(f0, 2), "cents": round(c, 1)})
    cs = np.array([r["cents"] for r in rows])
    print(f"tuning, A4 = {a.a4} Hz: {len(rows)} notes measured, {skipped} skipped (masked or too short)")
    print(f"error in cents: median {np.median(cs):+.1f}, 95 % within {np.percentile(np.abs(cs), 95):.1f}, worst {cs[np.argmax(np.abs(cs))]:+.1f}")
    by = {}
    for r in rows:
        by.setdefault((r["inst"], r["what"]), []).append(r["cents"])
    for k, v in sorted(by.items()):
        print(f"  {k[0]:6s} {k[1]:16s} n={len(v):3d} median {np.median(v):+5.1f}  worst {max(v, key=abs):+5.1f}")
    if a.json:
        (ROOT / a.json).write_text(json.dumps({"a4": a.a4, "notes": rows}, indent=0))


if __name__ == "__main__":
    main()
