"""What the Mixkit bed itself plays, and when: onsets classified by instrument, for judging what an effect would double.

Measured on the bed (docs/bed_kit.md): a hi-hat burst on every straight 8th, from film bar 2 to the last bar; a bass
note on every 8th (soft attack, gated near 200 ms, fundamental-heavy, centred; in the intro a gated tone near 69 Hz on
every beat instead); keys chords all over the 16th grid, strongest on the beats (about 10 mid-band events a bar);
seven short accents on the 4& of film bars 5, 9, 13, 17, 21, 25 and 29 (a louder open-hat burst; class `crash` here).
There is no kick, no snare, no ride and no noise cymbal: the final chord's tail is tonal.
Against the film's 8th grid (T0 = 83 ms, the beat tracker's): the hats' edge comes 18 ms early, the bass's steepest
rise 5 ms late (its attack takes 25 ms, so it starts about 10 ms early), the keys' attacks about 17 ms early.

hits(x, t0, t1) works on any array at 48 kHz, in that array's own time. It reads the signal in five bands and keeps
one event stream per instrument, so a hat and a bass note on the same beat are two events:
  hat     air band (9-16 kHz) rise of 10 dB or more
  crash   an air-band burst that is 25 dB up, 4 dB louder than the hats around it, with a tail (floor above -24 dB)
  ride    the same with 6 or more tonal peaks in 2-9 kHz
  kick    a fast sub-band rise (10-90 % in under 8 ms), a noisy mid-band click, a downward sweep, decaying 15 dB in 150 ms
  snare   a noise burst: high and air rises, flat 1-8 kHz spectrum, body under 300 Hz, short
  bass    a sub/low-band rise with a pitched peak (`note` = MIDI number, A4 = 441.3 Hz)
  keys    a mid-band rise with at least two harmonic peaks (`notes` = the strongest, 200-1100 Hz)
Each event: t (s, the steepest rise of its band's envelope), cls, rise_db (rise of its band over the 50 ms before),
rel_db (its band's peak against the whole bed's level over +-0.5 s), attack_ms (10-90 % rise), band, and note(s)
where pitched (`note` is the strongest partial in 32-300 Hz: it can sit an octave above the bass's fundamental).
Only hat, bass and keys are validated on the bed itself; the other classes are strict rules that fire on nothing
else there (see --selftest for what tools/sound.py's own kick, snare, ride, crash, bass and piano look like on it).

    python tools/bedhits.py --cues        # what the bed plays under each instrument-like cue (writes cue_hits.json)
    python tools/bedhits.py --selftest    # sounds from tools/sound.py laid on the bed: which are seen, and as what
    python tools/bedhits.py --scan        # the whole bed: counts per class, timing against the film's 8th grid
(no flag: --scan and --cues)
Usage: uv run --with numpy --with scipy python tools/bedhits.py [--bed out/sound/bed.wav] [--cues out/sound/cues.json]
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, find_peaks, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
A4 = 441.3
HOP = 96  # 2 ms
BANDS = {"sub": (35, 110), "low": (110, 300), "mid": (300, 2500), "high": (2500, 9000), "air": (9000, 16000)}
CUE_CLASSES = ("stab", "alarm", "drop", "chime", "bell", "climb", "band", "slab", "push", "thud", "stamp", "slam",
               "caption", "punch", "bubble", "split")
AT_LAND = {"stamp", "thud", "slab", "bubble"}  # the effect's hit is at `land`


def midi_of(f):
    return 69 + 12 * math.log2(f / A4)


def name_of(m):
    return ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"][m % 12] + str(m // 12 - 1)


# smoothing of each band's envelope, s: short for the bright bands (a hat's edge is 6 ms), long for the low ones
SMOOTH = {"sub": 0.016, "low": 0.010, "mid": 0.006, "high": 0.004, "air": 0.003}


def _envelopes(m):
    """Linear envelopes of the five bands (time domain, same length as m) and their dB levels on the 2 ms grid."""
    env, L = {}, {}
    for k, (lo, hi) in BANDS.items():
        sos = butter(4, [lo, hi], btype="bandpass", fs=SR, output="sos")
        z = sosfiltfilt(sos, m)
        env[k] = np.sqrt(uniform_filter1d(z * z, max(1, int(SMOOTH[k] * SR))))
        L[k] = 20 * np.log10(env[k][::HOP] + 1e-9)
    return env, L


def _rise(L, win=0.05, delta=0.004):
    fps = SR / HOP
    W, d = int(win * fps), int(delta * fps)
    mn = minimum_filter1d(L, size=W, mode="nearest")
    prev = np.roll(mn, W // 2 + d)
    prev[: W // 2 + d] = L[: W // 2 + d]
    return L - prev


def _times(env, p):
    """(edge, start, attack_ms) of the rise that peaks at grid frame p: the steepest rise of the linear envelope, the
    time it was 10 % of the way up, and the 10-90 % rise time."""
    i = p * HOP
    a, b = max(0, i - int(0.07 * SR)), min(len(env), i + int(0.02 * SR))
    e = env[a:b]
    j = int(np.argmax(np.diff(e)))
    edge = a + j
    lo_ = a + int(np.argmin(e[: max(2, j + 1)]))
    pk = env[edge: min(len(env), edge + int(0.04 * SR))].max()
    floor = env[lo_]
    span = max(pk - floor, 1e-12)
    up = np.flatnonzero(env[lo_:edge + 1] >= floor + 0.1 * span)
    start = lo_ + (up[0] if len(up) else edge - lo_)
    seg = env[start: start + int(0.06 * SR)]
    t10 = int(np.argmax(seg >= floor + 0.1 * span))
    t90 = int(np.argmax(seg >= floor + 0.9 * span))
    return edge / SR, start / SR, max(0.0, (t90 - t10) / SR * 1000)


def _flatness(x):
    x = np.maximum(x, 1e-12)
    return float(np.exp(np.mean(np.log(x))) / np.mean(x))


def _peaks_midi(seg, lo, hi, n=6, prom_db=10.0):
    """The strongest spectral peaks of seg in [lo, hi] Hz as MIDI numbers (strongest first)."""
    N = 16384
    w = np.hanning(len(seg))
    S = np.abs(np.fft.rfft(seg * w, N))
    f = np.fft.rfftfreq(N, 1 / SR)
    sel = (f >= lo) & (f <= hi)
    db = 20 * np.log10(S[sel] + 1e-12)
    db -= db.max()
    pk, pr = find_peaks(db, prominence=prom_db, distance=max(1, int(12 / (f[1] - f[0]))))
    order = np.argsort(-db[pk])[:n]
    out = []
    for i in order:
        m = int(round(midi_of(f[sel][pk[i]])))
        if m not in out:
            out.append(m)
    return out


def _f0(seg):
    """The strongest peak in 32-300 Hz of seg (Hz), parabolic interpolation."""
    N = 16384
    S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), N))
    f = np.fft.rfftfreq(N, 1 / SR)
    sel = (f >= 32) & (f <= 300)
    kk = np.flatnonzero(sel)[0] + int(np.argmax(S[sel]))
    if 0 < kk < len(S) - 1:
        a, b, c = np.log(S[kk - 1] + 1e-12), np.log(S[kk] + 1e-12), np.log(S[kk + 1] + 1e-12)
        kk = kk + 0.5 * (a - c) / (a - 2 * b + c)
    return kk * SR / N


def _analyze(m, t_off=0.0):
    """All events of a mono array (its own time + t_off)."""
    fps = SR / HOP
    env, L = _envelopes(m)
    tot = 20 * np.log10(uniform_filter1d(np.abs(m), int(0.5 * SR))[::HOP] + 1e-9)
    tot_local = uniform_filter1d(tot, int(1.0 * fps))
    R = {k: _rise(L[k]) for k in L}
    ev = []

    def add(cls, band, p, **kw):
        edge, start, att = _times(env[band], p)
        ev.append({"t": round(float(edge + t_off), 4), "cls": cls, "band": band,
                   "rise_db": round(float(R[band][p]), 1),
                   "rel_db": round(float(L[band][p:p + int(0.03 * fps) + 1].max() - tot_local[min(p, len(tot_local) - 1)]), 1),
                   "attack_ms": round(att, 1), **kw})

    def floor_rel(band, p, a_ms=150, b_ms=250):
        """The band's level between hits (its minimum in [a, b] ms after p) against its peak: how far it falls."""
        j0, j1 = p + int(a_ms * fps / 1000), min(len(L[band]), p + int(b_ms * fps / 1000) + 1)
        if j1 <= j0:
            return 0.0
        return float(L[band][j0:j1].min() - L[band][p:p + int(0.02 * fps) + 1].max())

    # ---- air band: hats, and the cymbals that look like them (a cymbal is a long tail AND clearly louder than the hats)
    pk, _ = find_peaks(R["air"], height=10.0, distance=int(0.05 * fps))
    cand = []
    for p in pk:
        fl = floor_rel("air", p)
        i0 = int(p * HOP)
        rel = float(L["air"][p:p + int(0.03 * fps) + 1].max() - tot_local[min(p, len(tot_local) - 1)])
        peak = float(L["air"][p:p + int(0.03 * fps) + 1].max())
        hi_rise = R["high"][max(0, p - 4):p + 5].max()
        cand.append((p, fl, i0, rel, peak, hi_rise))
    peaks_db = np.array([c[4] for c in cand]) if cand else np.zeros(0)
    times_c = np.array([c[0] / fps for c in cand]) if cand else np.zeros(0)
    for p, fl, i0, rel, peak, hi_rise in cand:
        near = peaks_db[(np.abs(times_c - p / fps) < 1.5) & (np.abs(times_c - p / fps) > 1e-6)]
        louder = len(near) >= 3 and peak >= np.median(near) + 4.0  # against the hats around it
        loud = R["air"][p] >= 25 and hi_rise >= 8 and louder
        if loud and fl > -24:
            add("crash", "air", p, floor_db=round(fl, 1), over_hats_db=round(float(peak - np.median(near)), 1))
        elif loud and fl > -28 and len(_peaks_midi(m[i0 + int(0.02 * SR): i0 + int(0.14 * SR)], 2000, 9000, 8, 12.0)) >= 6:
            add("ride", "air", p, floor_db=round(fl, 1), over_hats_db=round(float(peak - np.median(near)), 1))
        else:
            add("hat", "air", p, floor_db=round(fl, 1))
    # ---- sub + low: bass notes (pitched) and kicks (a fast attack, a click and a downward sweep)
    seen = []
    for band, thr in (("sub", 9.0), ("low", 12.0)):
        pk, _ = find_peaks(R[band], height=thr, distance=int(0.09 * fps))
        for p in pk:
            edge, start, att = _times(env[band], p)
            rel = float(L[band][p:p + int(0.03 * fps) + 1].max() - tot_local[min(p, len(tot_local) - 1)])
            if rel < (-12.0 if band == "sub" else -2.0) or any(abs(edge - s) < 0.09 for s in seen):  # the intro's pulse is far under its pad
                continue
            i0 = int(start * SR)
            seg = m[i0 + int(0.02 * SR): i0 + int(0.15 * SR)]
            if len(seg) < 2000:
                continue
            f0 = _f0(seg)
            click = max(R["high"][max(0, p - 4):p + 5].max(), R["mid"][max(0, p - 4):p + 5].max())
            early, late = m[i0: i0 + int(0.04 * SR)], m[i0 + int(0.04 * SR): i0 + int(0.08 * SR)]
            sweep = len(late) == int(0.04 * SR) and _f0(late) < 0.85 * _f0(early)
            click = R["mid"][max(0, p - 4):p + 5].max()  # the mids only: a hat on the same beat clicks in the high band
            cs = m[i0: i0 + int(0.03 * SR)]
            Sc = np.abs(np.fft.rfft(cs * np.hanning(len(cs)), 4096)) ** 2
            fc = np.fft.rfftfreq(4096, 1 / SR)
            noisy = _flatness(Sc[(fc >= 300) & (fc <= 4000)]) > 0.25  # a chord's attack is peaky, a beater's click is not
            if band == "sub" and att < 8 and click >= 8 and noisy and sweep and R["sub"][p] >= 15 and floor_rel(band, p, 120, 180) < -15:
                add("kick", band, p)
            else:
                add("bass", band, p, note=int(round(midi_of(f0))), f0=round(float(f0), 1))
            seen.append(edge)
    # ---- mids: keys chords (rolled chords are one hit), snares
    pk, _ = find_peaks(R["mid"], height=8.0, distance=int(0.07 * fps))
    for p in pk:
        edge, start, att = _times(env["mid"], p)
        i0 = int(start * SR)
        seg = m[i0 + int(0.010 * SR): i0 + int(0.110 * SR)]
        if len(seg) < 3000:
            continue
        S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), 8192)) ** 2
        f = np.fft.rfftfreq(8192, 1 / SR)
        flat = _flatness(S[(f >= 1000) & (f <= 8000)])
        body = R["low"][max(0, p - 4):p + 6].max()
        hi = R["high"][max(0, p - 4):p + 6].max()
        rel = float(L["mid"][p:p + int(0.03 * fps) + 1].max() - tot_local[min(p, len(tot_local) - 1)])
        if flat > 0.40 and hi >= 14 and R["air"][max(0, p - 4):p + 6].max() >= 10 and body >= 8 and att < 8 and floor_rel("mid", p, 150, 250) < -12:
            add("snare", "mid", p, flatness=round(flat, 2))
        elif rel >= -9:
            notes = sorted(_peaks_midi(seg, 200, 1100, 4, 10.0))
            if len(notes) >= 2:
                add("keys", "mid", p, notes=notes, flatness=round(flat, 3))
    ev.sort(key=lambda e: e["t"])
    return ev


def hits(x, t0=None, t1=None, sr=SR):
    """Onsets in [t0, t1] (s of x's own time) on a mono or stereo array at 48 kHz, classified (see the module doc)."""
    assert sr == SR, "resample to 48 kHz first"
    m = np.asarray(x, np.float64)
    if m.ndim > 1:
        m = m.mean(axis=1)
    t0 = 0.0 if t0 is None else t0
    t1 = len(m) / SR if t1 is None else t1
    block, margin = 12.0, 0.7
    out, a = [], t0
    while a < t1 - 1e-9:
        b = min(t1, a + block)
        i0, i1 = max(0, int((a - margin) * SR)), min(len(m), int((b + margin) * SR))
        for e in _analyze(m[i0:i1], i0 / SR):
            if a <= e["t"] < b:
                out.append(e)
        a = b
    return sorted(out, key=lambda e: e["t"])


# ------------------------------------------------------------------------------------------------------ the CLI
def load_bed(path):
    sr, x = wavfile.read(path)
    assert sr == SR
    return x.astype(np.float64)


def cue_onset(q):
    return q["land"] if ("land" in q and (q["name"] in AT_LAND or q["name"] == "bubble")) else q["t"]


def per_cue(bed, cues, before=0.040, after=0.120, tol=0.025):
    """For every instrument-like cue: what the bed plays within [onset - before, onset + after]. `coincides` lists the
    classes with an event within +-tol of the onset (a hit the effect would double); `free` is True when nothing at
    all starts within +-before of it."""
    sel = []
    for q in cues:
        n = q["name"]
        if n in CUE_CLASSES and not (n == "bubble" and "land" not in q) and not (n == "split" and q["ch"] != "ch01"):
            sel.append(q)
    ev = hits(bed, 0.0, len(bed) / SR)
    out = []
    for q in sel:
        t = cue_onset(q)
        near = [e for e in ev if t - before <= e["t"] <= t + after]
        rec = {"ch": q["ch"], "name": q["name"], "t": round(q["t"], 4), "onset": round(t, 4),
               "track": [{"cls": e["cls"], "dt_ms": round((e["t"] - t) * 1000, 1), "rise_db": e["rise_db"],
                          "rel_db": e["rel_db"], **({"note": name_of(e["note"])} if "note" in e else {}),
                          **({"notes": [name_of(n) for n in e["notes"]]} if "notes" in e else {})} for e in near]}
        rec["coincides"] = sorted({e["cls"] for e in near if abs(e["t"] - t) <= tol})
        rec["free"] = not any(abs(e["t"] - t) <= before for e in near)
        out.append(rec)
    return out, ev


def verdict(rec):
    """One line: the classes the bed plays at this cue's onset."""
    by = {}
    for e in rec["track"]:
        by.setdefault(e["cls"], []).append(e)
    bits = []
    for c in ("crash", "ride", "kick", "snare", "bass", "keys", "hat"):
        if c in by:
            e = by[c][0]
            extra = f" {e['note']}" if "note" in e else (f" {'/'.join(e['notes'])}" if "notes" in e else "")
            bits.append(f"{c}{extra} ({e['dt_ms']:+.0f} ms)")
    return ", ".join(bits) if bits else "nothing"


def selftest(bed):
    """Play tools/sound.py's kick (at the bed's level: at -4 dB the bass masks it), snare, ride, crash, a bass note and a
    piano chord (4 dB under it) over the bed and report what the classifier calls each. The bed alone is scanned first."""
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    import sound
    mono = bed.mean(axis=1)
    base = hits(bed, 60.0, 78.0)
    counts = {}
    for e in base:
        counts[e["cls"]] = counts.get(e["cls"], 0) + 1
    print("bed alone, 60-78 s (film bars 28-35):", counts)
    piano = sound.piano(["F3", "A3", "C4", "Eb4"], 1.0, 0.9, seed=1)
    beat = 60 / 108
    slot5 = lambda bar: (bar - 1) * 4 * beat + 5 * beat / 4 - 0.018  # a 16th where the bed has no hat or bass onset
    tests = [("kick", slot5(29), sound.kick(0.9, seed=1), ("kick", "bass"), 0), ("snare", slot5(30), sound.snare(0.9, seed=1), ("snare", "keys", "crash"), -4),
             ("ride", slot5(31), sound.ride(0.9, seed=1, dur=1.4), ("ride", "crash", "hat"), -4), ("crash", slot5(32), sound.crash(2.0, 0.9, seed=1), ("crash", "ride"), -4),
             ("bass note C2", slot5(33), sound.pluck_bass(sound.hz("C2"), 0.5, 0.9, seed=1), ("bass",), -4),
             ("piano chord", slot5(34), piano.mean(axis=1), ("keys",), -4)]
    found = 0
    for label, t, sig, plausible, db in tests:
        y = bed.copy()
        s = sig if sig.ndim == 1 else sig.mean(axis=1)
        lvl = np.sqrt(np.mean(mono[int((t - 0.5) * SR): int((t + 0.5) * SR)] ** 2))
        g = lvl * 10 ** (db / 20) / max(np.sqrt(np.mean(s[: int(0.3 * SR)] ** 2)), 1e-9)
        i = int(round(t * SR))
        y[i:i + len(s)] += (g * s)[:, None]
        got = [e for e in hits(y, t - 0.06, t + 0.12) if abs(e["t"] - t) < 0.035]
        before = [e for e in base if abs(e["t"] - t) < 0.035]
        new = [e for e in got if not any(abs(e["t"] - b["t"]) < 0.01 and e["cls"] == b["cls"] for b in before)]
        classes = sorted({e["cls"] for e in new})
        found += bool(new)
        extra = ""
        for e in new:
            if "note" in e:
                extra += f" note {name_of(e['note'])}"
            if "notes" in e:
                extra += " notes " + "/".join(name_of(n) for n in e["notes"][:5])
        status = ("seen as " + "/".join(classes) + extra) if new else "not seen: masked by the bed at that level"
        print(f"  {label:12s} at {t:5.1f} s, {db:+d} dB re the bed's level: {status}")
    print(f"selftest: {found} of {len(tests)} added sounds seen; the bed's own stream classes are hat, bass, keys and the group-end accents (docs/bed_kit.md)")
    return found


def scan(bed):
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    beat = tl["beat"]
    ev = hits(bed, 0.0, len(bed) / SR)
    cnt = {}
    for e in ev:
        cnt[e["cls"]] = cnt.get(e["cls"], 0) + 1
    print("events on the whole bed:", cnt)
    # hat and bass placement against the film's 8th grid
    for cls in ("hat", "bass"):
        d = [((e["t"] / (beat / 2)) % 1.0) for e in ev if e["cls"] == cls and 64.5 < e["t"] < 148]
        off = np.array([((v + 0.5) % 1.0 - 0.5) * (beat / 2) * 1000 for v in d])
        print(f"  {cls}: n={len(off)}, start {np.median(off):+.1f} ms from the film's 8th (IQR {np.percentile(off, 25):+.1f}..{np.percentile(off, 75):+.1f})")
    for cls in ("crash", "ride", "kick", "snare"):
        print(f"  {cls}:", [(round(e['t'], 2), e['rise_db']) for e in ev if e["cls"] == cls][:12])
    return ev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bed", default="out/sound/bed.wav")
    ap.add_argument("--cues", nargs="?", const="out/sound/cues.json", default=None,
                    help="report what the bed plays under each instrument-like cue (default file out/sound/cues.json)")
    ap.add_argument("--out", default="out/tmp/remake/kit/cue_hits.json")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--scan", action="store_true")
    a = ap.parse_args()
    bed = load_bed(ROOT / a.bed)
    if not (a.selftest or a.scan or a.cues):
        a.scan, a.cues = True, "out/sound/cues.json"
    if a.selftest:
        selftest(bed)
    if a.scan:
        scan(bed)
    if a.cues:
        cues = json.loads((ROOT / a.cues).read_text())["cues"]
        recs, ev = per_cue(bed, cues)
        p = ROOT / a.out
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps({"window_ms": [-40, 120], "cues": recs}, indent=1))
        for r in recs:
            print(f"{r['ch']} {r['name']:8s} t={r['onset']:8.3f}  the bed plays: {verdict(r)}")
        print(f"{p.relative_to(ROOT)}: {len(recs)} cues")
        by = {}
        for r in recs:
            d = by.setdefault(r["name"], {"n": 0, "free": 0, "hat": 0, "bass": 0, "keys": 0, "other": 0})
            d["n"] += 1
            d["free"] += r["free"]
            for c in r["coincides"]:
                d[c if c in ("hat", "bass", "keys") else "other"] += 1
        print("per effect name: cues, free (nothing within 40 ms), and how many land within 25 ms of a bed hat / bass note / keys chord / other class")
        for n, d in sorted(by.items()):
            print(f"  {n:8s} {d['n']:3d} cues: free {d['free']:3d}; hat {d['hat']:3d}, bass {d['bass']:3d}, keys {d['keys']:3d}, other {d['other']:3d}")


if __name__ == "__main__":
    main()
