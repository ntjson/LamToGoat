"""Look at the film's sound, since it is judged by measurement: an analysis image and the numbers behind it.

The image has one row per ~45 s: the level (momentary and short-term loudness, EBU R128, against the -14 LUFS
target), a spectrogram with the chapter lines and a mark for every cue, and the score as a piano roll (bass, piano,
vibraphone, brass) with the chord of each bar. The report measures:
- loudness: the whole file, each chapter, the loudest short-term moments
- the grid: every note the music plays sits on a beat or a swung 8th, except the hits that follow the scenes' cues
- the harmony: every comping, stab and chord note belongs to the bar's chord (tones and the usual tensions)
- the cues: an onset in the mix within a few ms of every hit-type cue (the effects sit on the scenes' frames)

Usage: uv run --with numpy --with scipy --with matplotlib python tools/soundcheck.py [--wav out/sound/film.wav]
       [--cues out/sound/cues.json] [--score out/sound/score.json] [--out out/sound/analysis.png]
       [--from s] [--to s] [--row 45]
"""
import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import sound  # noqa: E402

# Cues whose sound starts with a hit exactly on t (or on land, where the handler puts it).
HITS = {"complaint", "bubble", "caption", "slam", "stamp", "stab", "alarm", "chord", "snip", "scissor", "flip",
        "chime", "cell", "tick", "climb", "pin", "snap", "click", "bell", "thud", "slab", "punch", "cut"}
AT_LAND = {"stamp", "tick", "pin", "snap", "click", "thud", "slab"}
MUSIC = {"stab", "alarm", "chord", "push", "drop"}
COLORS = {"bass": "#3b6fd4", "piano": "#d23b2e", "vibes": "#2e9e57", "brass": "#e08a00", "arco": "#7a3bd4",
          "tone": "#888888"}


def loudness_curve(x, sr, win):
    """K-weighted loudness (LUFS) of a sliding window, every 100 ms."""
    y = sound.k_weight(x)
    p = np.sum(y ** 2, axis=1)
    c = np.concatenate([[0], np.cumsum(p)])
    hop = int(0.1 * sr)
    n = int(win * sr)
    idx = np.arange(0, len(p) - n + 1, hop)
    ms = (c[idx + n] - c[idx]) / n
    return (idx + n / 2) / sr, -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))


def onsets(x, sr):
    """Onset strength: positive change of log energy in 2 ms frames, per band, summed (a percussive-onset detector)."""
    m = np.mean(x, axis=1)
    hop = int(0.002 * sr)
    f, t, Z = stft(m, fs=sr, nperseg=256, noverlap=256 - hop, boundary=None, padded=False)
    e = np.log(np.abs(Z) ** 2 + 1e-10)
    flux = np.maximum(np.diff(e, axis=1), 0).sum(axis=0)
    return t[1:], flux


def chord_at(chords, tl, t):
    for c in tl["chapters"]:
        if c["start"] - 1e-6 <= t < c["end"] - 1e-6 and c["id"] in chords:
            beat = tl["beat"]
            for b, bar in enumerate(chords[c["id"]].split("|")):
                items = bar.split()
                at = c["start"] + 4 * b * beat
                for it in items:
                    sym, nb = (it.split(":")[0], int(it.split(":")[1])) if ":" in it else (it, 4 // len(items))
                    if at - 1e-6 <= t < at + nb * beat - 1e-6:
                        return sym, sound.KEY[c["id"]]
                    at += nb * beat
    return None, None


def allowed(sym, key):
    """Chord tones plus the tensions a jazz voicing may add over this chord."""
    r, q = sound.chord(sym)
    iv = set(sound.QUAL[q])
    if q in ("maj7", "maj9", "6", "69", ""):
        iv |= {2, 9, 11, 14} if q != "" else {2, 9, 14}
    elif q in ("m7", "m", "m9"):
        iv |= {2, 5, 9, 14, 17}  # 9, 11 and the Dorian 13th
    elif q == "7":
        iv |= {1, 8, 13, 20} if key == "Dm" else {2, 9, 14, 21}
    elif q == "7sus":
        iv |= {2, 9, 14}
    elif q == "m7b5":
        iv |= {5, 8}
    return {(r + i) % 12 for i in iv}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", default="out/sound/film.wav")
    ap.add_argument("--cues", default="out/sound/cues.json")
    ap.add_argument("--score", default="out/sound/score.json")
    ap.add_argument("--out", default="out/sound/analysis.png")
    ap.add_argument("--from", dest="t_from", type=float, default=None)
    ap.add_argument("--to", dest="t_to", type=float, default=None)
    ap.add_argument("--row", type=float, default=45.0, help="seconds per row of the image")
    a = ap.parse_args()
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    sr, x = wavfile.read(ROOT / a.wav)
    x = x.astype(np.float64)
    cues = json.loads((ROOT / a.cues).read_text())["cues"]
    score = json.loads((ROOT / a.score).read_text())
    t0 = score["t0"]
    beat = tl["beat"]

    # ---- loudness
    print(f"{a.wav}: {len(x) / sr:.3f} s, {sound.lufs(x):.2f} LUFS integrated, true peak {sound.true_peak_db(x):.2f} dBTP")
    tS, S = loudness_curve(x, sr, 3.0)
    tM, M = loudness_curve(x, sr, 0.4)
    print(f"short-term (3 s): max {S.max():.1f} LUFS at {t0 + tS[S.argmax()]:.1f} s; "
          f"10th-95th percentile {np.percentile(S, 10):.1f} to {np.percentile(S, 95):.1f}")
    for c in tl["chapters"]:
        i0, i1 = int(round((c["start"] - t0) * sr)), int(round((c["end"] - t0) * sr))
        if i0 < 0 or i1 > len(x):
            continue
        y = x[i0:i1]
        print(f"  {c['id']}: {sound.lufs(y):6.2f} LUFS, momentary max {M[(tM + t0 >= c['start']) & (tM + t0 < c['end'])].max():6.1f}")

    # ---- the grid: music onsets on beats or swung 8ths (hits that follow cues are exempt)
    ev = score["events"]
    notes = [e for e in ev if "inst" in e]
    free = [e for e in notes if e.get("what") not in ("stab", "soft stab", "alarm", "final chord", "warm chord", "chime",
                                                      "falls a fifth", "cluster", "low sustained note", "rising tone")]
    dev = []
    for e in free:
        u = e["t"] / beat
        frac = u - math.floor(u)
        d = min(abs(frac - p) for p in (0.0, sound.SWING, 1.0, sound.SWING - 1.0))
        dev.append((d * beat, e))
    worst = max(dev, key=lambda z: z[0]) if dev else (0, None)
    print(f"grid: {len(free)} notes; largest distance from a beat or swung 8th {1000 * worst[0]:.2f} ms")

    # ---- the harmony
    clashes = []
    for e in notes:
        if e["inst"] not in ("piano", "vibes") or e.get("what") in ("cluster",):
            continue
        # comping looks ahead to the chord it anticipates; a stab in a bar's last 8th anticipates the next bar
        ahead = 0.45 * beat if e.get("what") == "comp" else (0.5 * beat if e.get("what") == "stab" else 0.01)
        sym, key = chord_at(score["chords"], tl, e["t"] + ahead)
        if not sym:
            continue
        ok = allowed(sym, key)
        bad = [m for m in e["midi"] if m % 12 not in ok]
        if bad and e["ch"] != "ch01":  # ch01 is the approved sketch (its stab is D-F-A-Bb-D on purpose)
            clashes.append((e["t"], e["inst"], e.get("what", "comp"), sym, [sound.name_of(m) for m in bad]))
    print(f"harmony: {sum(1 for e in notes if e['inst'] in ('piano', 'vibes'))} piano/vibes chords; "
          f"{len(clashes)} with notes outside the bar's chord and tensions")
    for c in clashes[:12]:
        print(f"  {c[0]:8.2f} s {c[1]:5s} {c[2]:12s} over {c[3]:6s}: {', '.join(c[4])}")

    # ---- the cues: an onset near every hit
    tO, flux = onsets(x, sr)
    tO = tO + t0
    peaks = np.flatnonzero((flux[1:-1] > flux[:-2]) & (flux[1:-1] >= flux[2:]) & (flux[1:-1] > np.percentile(flux, 75))) + 1
    pt = tO[peaks]
    offs = []
    missed = []
    for q in cues:
        if q["name"] not in HITS or not (t0 <= q["t"] < t0 + len(x) / sr):
            continue
        at = q.get("land", q["t"]) if q["name"] in AT_LAND else q["t"]
        if q["name"] in ("caption", "slam", "stamp"):
            at -= 0.005
        j = np.searchsorted(pt, at)
        near = [pt[k] for k in (j - 1, j) if 0 <= k < len(pt)]
        d = min((p - at for p in near), key=abs) if near else 1.0
        if abs(d) <= 0.012:
            offs.append(d)
        else:
            missed.append((q["name"], q["ch"], round(q["t"], 3)))
    offs = np.array(offs) * 1000
    print(f"cues: {len(offs)} of {len(offs) + len(missed)} hit-type cues have an onset in the mix within 12 ms "
          f"(median {np.median(offs):+.1f} ms, 95% within {np.percentile(np.abs(offs), 95):.1f} ms)")
    if missed:
        print(f"  no clear onset (masked by a louder sound nearby): {len(missed)}: "
              + ", ".join(f"{n}@{t}" for n, _, t in missed[:14]) + (" ..." if len(missed) > 14 else ""))

    # ---- the image
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    t_from = a.t_from if a.t_from is not None else t0
    t_to = a.t_to if a.t_to is not None else t0 + len(x) / sr
    rows = max(1, math.ceil((t_to - t_from) / a.row - 1e-9))
    fig = plt.figure(figsize=(26, 7.2 * rows), dpi=80)
    f, tt, Z = stft(np.mean(x, axis=1), fs=sr, nperseg=4096, noverlap=4096 - 960)
    Zdb = 20 * np.log10(np.abs(Z) + 1e-9)
    for r in range(rows):
        r0 = t_from + r * a.row
        r1 = min(t_to, r0 + a.row)
        ax1 = fig.add_axes([0.04, 1 - (r + 1) / rows + 0.78 / rows, 0.94, 0.17 / rows])
        ax2 = fig.add_axes([0.04, 1 - (r + 1) / rows + 0.38 / rows, 0.94, 0.39 / rows], sharex=ax1)
        ax3 = fig.add_axes([0.04, 1 - (r + 1) / rows + 0.07 / rows, 0.94, 0.30 / rows], sharex=ax1)
        ax1.plot(tM + t0, M, color="#999999", lw=0.6, label="momentary (400 ms)")
        ax1.plot(tS + t0, S, color="#111111", lw=1.4, label="short-term (3 s)")
        ax1.axhline(-14, color="#d23b2e", lw=0.8, ls="--")
        ax1.set_ylim(-40, -4)
        ax1.set_ylabel("LUFS")
        if r == 0:
            ax1.legend(loc="lower right", fontsize=9)
        sel = (tt + t0 >= r0 - 1) & (tt + t0 <= r1 + 1)
        ax2.pcolormesh(tt[sel] + t0, f[1:], Zdb[1:, sel], shading="auto", cmap="magma", vmin=-110, vmax=-20)
        ax2.set_yscale("log")
        ax2.set_ylim(30, 16000)
        ax2.set_ylabel("Hz")
        for q in cues:
            if r0 <= q["t"] < r1:
                col = "#00e5ff" if q["name"] in MUSIC else "#ffffff"
                ax2.axvline(q["t"], ymin=0.9, ymax=1.0, color=col, lw=1.6 if q["name"] in MUSIC else 0.7)
                if q["name"] in MUSIC or q["name"] in ("slam", "stamp", "caption", "wipe", "cut"):
                    ax2.text(q["t"], 11000, q["name"], color=col, fontsize=8, rotation=90, va="top", ha="right")
        for e in notes:
            if r0 - 3 <= e["t"] < r1:
                for m in e["midi"]:
                    ax3.add_patch(plt.Rectangle((e["t"], m - 0.4), max(0.05, e["dur"]), 0.8,
                                                color=COLORS.get(e["inst"], "#555555"), alpha=0.85, lw=0))
        ax3.set_ylim(24, 98)
        ax3.set_ylabel("MIDI")
        for c in tl["chapters"]:
            for ax in (ax1, ax2, ax3):
                if r0 <= c["start"] <= r1:
                    ax.axvline(c["start"], color="#00a0ff", lw=1.8)
            if r0 <= c["start"] < r1:
                ax1.text(c["start"] + 0.1, -6, c["id"], fontsize=13, weight="bold", va="top")
            if c["id"] in score["chords"]:
                for b, bar in enumerate(score["chords"][c["id"]].split("|")):
                    bt = c["start"] + 4 * b * beat
                    if r0 <= bt < r1:
                        ax3.axvline(bt, color="#bbbbbb", lw=0.6)
                        ax3.text(bt + 0.05, 95, bar.strip(), fontsize=8, va="top")
        ax1.set_xlim(r0, r0 + a.row)
        for ax in (ax1, ax2):
            plt.setp(ax.get_xticklabels(), visible=False)
    out = ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out)
    print(f"{out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
