"""Check the paper and UI sounds against the music, from the finished stems (no shared state with the mix).

For every paper/UI event in the score log (`fx` entries with a `cls`, written by tools/sound.py) it measures, in the
stems as they sit in the master, how far the event pokes out of the music (tools/meter.py: its loudest 100 ms window,
in loudness and in the 250 Hz - 4 kHz mids, against the music's level around it; the 1/3-octave bands are shown as a
diagnostic).

Stems come from `tools/sound.py --stem-dir DIR`: `sfx.wav` (the paper and UI sounds; pitched hits are on the piano,
bass, vibes and brass stems) and `bed.wav`. `bed_ref.wav`, when there, is the bed without its designed dips and its
opening fade: it is the music the effects are judged against inside those dips.

Usage: uv run --with numpy --with scipy python tools/sfxcheck.py [--stem-dir out/sound/stems] [--score out/sound/score.json]
       [--limit 3.0] [--json out/sound/sfxcheck.json]
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import meter  # noqa: E402

SR = meter.SR
HOP = 0.025


def load(p):
    sr, x = wavfile.read(p)
    assert sr == SR
    return x.astype(np.float64)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stem-dir", default="out/sound/stems")
    ap.add_argument("--score", default="out/sound/score.json")
    ap.add_argument("--limit", type=float, default=3.0, help="dB an effect may poke out of the music")
    ap.add_argument("--band-cap", type=float, default=14.0, help="dB a single band from 500 Hz up may stand over the music")
    ap.add_argument("--json", default=None)
    ap.add_argument("--worst", type=int, default=12)
    a = ap.parse_args()
    d = ROOT / a.stem_dir
    score = json.loads((ROOT / a.score).read_text())
    t0 = score["t0"]
    sfx = load(d / "sfx.wav")
    ref_file = d / "bed_ref.wav"
    bed = load(ref_file if ref_file.exists() else d / "bed.wav")
    n = min(len(sfx), len(bed))
    print(f"stems: {n / SR:.1f} s; music reference: {'bed_ref.wav (no dips, no fade-in)' if ref_file.exists() else 'bed.wav'}")
    L_sfx = meter.levels(sfx[:n], HOP)
    R_ref = meter.reference(bed[:n], HOP)
    nfr = len(L_sfx["loud"])
    events = [e for e in score["events"] if "fx" in e and e.get("cls")]
    rows = []
    for e in events:
        at = e["at"] - t0
        dur = e.get("dur", 0.4)
        f0 = max(0, int(round((at - 0.03) / HOP)))
        f1 = min(nfr, int(round((at + dur) / HOP)) + 1)
        if f1 <= f0:
            continue
        ev = {k: (v[f0:f1] if k != "bands" else v[:, f0:f1]) for k, v in L_sfx.items()}
        r = meter.poke(ev, R_ref, f0)
        bands = np.where(np.isnan(r["bands"]), -99, r["bands"])
        rows.append({**{k: e[k] for k in ("fx", "ch", "cls", "t", "at", "dur")}, "poke": round(r["poke"], 2),
                     "loud": round(r["loud"], 2), "mids": round(r["mids"], 2), "guard": round(r["guard"], 2),
                     "band_hz": round(float(meter.CENTRES[int(np.argmax(bands))])), "band_max": round(float(bands.max()), 1),
                     "designed_dip": bool(e.get("dip"))})
    pk = np.array([r["poke"] for r in rows])
    gd = np.array([r["guard"] for r in rows])
    print(f"{len(rows)} paper/UI events; poke-out over the music (loudness and 250 Hz-4 kHz mids, the larger): median "
          f"{np.median(pk):+.1f} dB, max {pk.max():+.1f} dB, {int(np.sum(pk > a.limit))} over {a.limit:+.1f} dB")
    print(f"single-band guard (any 1/3-octave band from 500 Hz up over the music): median {np.median(gd):+.1f} dB, "
          f"max {gd.max():+.1f} dB, {int(np.sum(gd > a.band_cap))} over {a.band_cap:+.1f} dB")
    by = {}
    for r in rows:
        by.setdefault(r["fx"], []).append(r["poke"])
    print("per effect (n, median, max):")
    for k, v in sorted(by.items(), key=lambda kv: -max(kv[1])):
        print(f"  {k:10s} {len(v):4d}  {np.median(v):+5.1f}  {max(v):+5.1f}")
    chs = {}
    for r in rows:
        chs.setdefault(r["ch"], []).append(r["poke"])
    print("per chapter (n, median, max): " + ", ".join(f"{c} {len(v)} {np.median(v):+.1f} {max(v):+.1f}" for c, v in sorted(chs.items())))
    print(f"worst {a.worst}:")
    for r in sorted(rows, key=lambda r: -r["poke"])[: a.worst]:
        print(f"  {r['poke']:+5.1f} dB (loud {r['loud']:+5.1f}, mids {r['mids']:+5.1f}; top band {r['band_hz']} Hz {r['band_max']:+.0f}, guard {r['guard']:+.0f})  {r['fx']:9s} {r['ch']} {r['t']:8.3f} s ({r['cls']})"
              + ("  [designed dip]" if r["designed_dip"] else ""))
    # unpitched? the share of each event's energy in narrow standing peaks (tools/meter.tonality: 0 = noise, 1 = a pure tone)
    ton = {}
    for e in events:
        i0 = max(0, int((e["at"] - t0 - 0.01) * SR))
        i1 = min(n, int((e["at"] - t0 + max(0.06, min(e.get("dur", 0.4), 0.6))) * SR))
        if i1 - i0 > 1024:
            ton.setdefault(e["cls"], []).append(meter.tonality(sfx[i0:i1]))
    print("tonality of the paper and UI sounds in the mix (0 = noise, 1 = a pure tone; a note reads above 0.3):")
    for c, v in ton.items():
        print(f"  {c:9s} median {np.median(v):.3f}, max {max(v):.3f}, {sum(1 for x in v if x > 0.3)} of {len(v)} above 0.3")
    # where the excess sits: the median over each class's events, per 1/3-octave band (dB over the music around them)
    cls_bands = {}
    for e, r_ in zip(events, rows):
        f0, f1 = meter.event_frames(e["at"] - t0, e.get("dur", 0.4), nfr, HOP)
        ev = {k: (v[f0:f1] if k != "bands" else v[:, f0:f1]) for k, v in L_sfx.items()}
        cls_bands.setdefault(r_["cls"], []).append(meter.poke(ev, R_ref, f0)["bands"])
    print("median excess over the music per 1/3-octave band, by class (dB; . = the class is not sounding there):")
    print("  class     " + " ".join(f"{int(c):>5d}" for c in meter.CENTRES))
    for c, v in cls_bands.items():
        with np.errstate(all="ignore"):
            m = np.nanmedian(np.array(v), axis=0)
        print(f"  {c:9s} " + " ".join(f"{x:5.0f}" if not np.isnan(x) else "    ." for x in m) + f"   n={len(v)}")
    # the gaps: does the effects' spectrum fall where the music's is thin? (Pearson r of the two fine structures, 150 Hz - 5 kHz)
    t5 = next((c for c in json.loads((ROOT / "docs" / "timeline.json").read_text())["chapters"] if c["id"] == "ch05"))["start"]
    for part, (lo, hi) in {"intro": (max(t0, 4 * 0.5555555), t5), "body": (max(t0, t5), t0 + n / SR)}.items():
        i0, i1 = int((lo - t0) * SR), int((hi - t0) * SR)
        if i1 - i0 > 6 * SR:
            fc, dm = meter.fine_structure(bed[i0:i1])
            _, ds = meter.fine_structure(sfx[i0:i1])
            print(f"gaps ({part}): the effects' spectral fine structure against the music's: r = {np.corrcoef(dm, ds)[0, 1]:+.2f} "
                  f"(negative = the effects sound where the music is thin)")
    dips = [r for r in rows if r["designed_dip"]]
    if dips:
        audible = load(d / "bed.wav")[:n]
        R_dip = meter.reference(audible, HOP)
        vs = []
        for e in events:
            if not e.get("dip"):
                continue
            f0, f1 = meter.event_frames(e["at"] - t0, e.get("dur", 0.4), nfr, HOP)
            ev = {k: (v[f0:f1] if k != "bands" else v[:, f0:f1]) for k, v in L_sfx.items()}
            vs.append(meter.poke(ev, R_dip, f0)["poke"])
        print(f"{len(dips)} events sound inside the two designed dips (ch01's drop to ch02, ch07's push to ch08): over the music "
              f"they replace, up to {max(r['poke'] for r in dips):+.1f} dB; over the dipped bed that is actually playing, "
              f"{np.min(vs):+.0f} to {np.max(vs):+.0f} dB")
    # the pitched hits (not held to the +3 dB rule): where each stands over the music against the level it was set to
    hits = [e for e in score["events"] if "hit" in e]
    if hits:
        mus = sum(load(d / f"{k}.wav") for k in ("piano", "bass", "vibes", "tone", "brass", "drums") if (d / f"{k}.wav").exists())[:n]
        L_mus = meter.levels(mus, HOP)
        span = {"thump": 0.5, "skyline thump": 0.5, "climb": 0.4, "chime": 0.6, "bell": 0.6, "cluster": 1.0, "stab": 1.0, "soft stab": 1.0, "alarm": 0.8,
                "warm chord": 1.0, "falls a fifth": 1.0, "low sustained note": 2.5, "rising tone": 0.9}
        by_hit = {}
        for e in hits:
            f0, f1 = meter.event_frames(e["at"] - t0, span.get(e["hit"], 0.8), nfr, HOP)
            over = meter.db(L_mus["loud"][f0:f1].max()) - meter.db(R_ref["loud"][f0: f0 + 8].mean())  # the music at the note's start
            by_hit.setdefault(e["hit"], []).append((e["rel"], over))
        print("pitched hits, loudest 100 ms over the music (target -> measured; overlapping notes of a run add up):")
        for k, v in by_hit.items():
            print(f"  {k:19s} n={len(v):2d}  target {np.median([x[0] for x in v]):+5.1f}  measured median {np.median([x[1] for x in v]):+5.1f}, "
                  f"range {min(x[1] for x in v):+5.1f} .. {max(x[1] for x in v):+5.1f}")
    if a.json:
        (ROOT / a.json).write_text(json.dumps({"limit": a.limit, "events": rows}, indent=0))


if __name__ == "__main__":
    main()
