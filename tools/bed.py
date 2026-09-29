"""The film's music bed: "Upbeat Jazz" by Francisco Alvear (Mixkit), stretched to 108 BPM and arranged to 3:00.

The track (audio/music/upbeat-jazz_francisco-alvear_mixkit.mp3, 1:50) runs at 110.005 BPM: a line fitted through its
tracked beats, 6 ms of jitter. Rubberband (ffmpeg) stretches it to exactly 108 BPM, so each of its 4/4 bars lasts one
of the film's bars (2.2222 s). At 108 BPM its first downbeat is at 0.083 s and its form, in 50 bars, is:

  intro 1-9 (bar 1 fades in; groups 2-5 and 6-9) | A1 10-17 | B1 18-24 | A2 25-32 | B2 33-39 | A3 40-47 |
  coda 48-49 | final chord 50

(A: 8 bars, two 4-bar groups; B: 7 bars, a 4-bar and a 3-bar group; the A/B pair repeats every 15 bars.)

The film has 81 bars. PLAN repeats sections at phrase boundaries, joined on bar lines, to follow the film's mood:
sparse to ch05 (the intro and its groups), the track's own lift on ch05's first downbeat, the body through ch07, the
loudest section (A3) from ch08, and the coda with the final chord on the film's last bar. Each join is chosen where
the bar before it sounds like the bar the incoming section follows in the recording, and made with a 10 ms
equal-power crossfade that ends 2 ms before the bar line: the outgoing bar plays to its end and the incoming
downbeat comes whole from its own recording.

Writes out/sound/bed.wav (film time from 0, 48 kHz stereo float, unmastered) and out/sound/bed.json: the plan, each
join, and the pitch classes sounding on every beat (chroma and bass chroma), for effects that play notes over it.

Usage: uv run python tools/bed.py [--out out/sound/bed.wav]
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
SRC = ROOT / "audio/music/upbeat-jazz_francisco-alvear_mixkit.mp3"
SRC_BPM = 110.005  # measured (±0.002)
BPM = 108
BEAT = 60 / BPM
BAR = 4 * BEAT
FIRST_DOWNBEAT = 0.083  # s, in the stretched track
# (film bar, source bar, bars), 1-based: every run starts and ends on a phrase boundary
PLAN = [
    (1, 1, 9),    # intro, as recorded (bar 1 fades in)                                       ch01-ch02
    (10, 2, 8),   # the intro's phrase again (after bar 9, as after the fade-in)               ch02-ch03
    (18, 2, 8),   # and again                                                                  ch03-ch04
    (26, 6, 42),  # its second group (bar 9 sounds like bar 5, which leads into 6), then the   ch04-ch09
                  # lift on ch05's downbeat (bar 30) and A1 B1 A2 B2 A3 as recorded
    (68, 33, 11), # B2 and A3's first group again (A3's end, bar 47, is A2's end, bar 32)    ch09-ch11
    (79, 48, 3),  # the coda (A3's group end, bar 43, is its end, bar 47); final chord on 81   ch11
]
XF = 0.010  # crossfade length, s: it ends 2 ms before the bar line, so the incoming downbeat is whole
# Where the intro's phrase starts again (after its pull-back bar 9, which in the recording leads into the lift), its
# first bars are quieter than bar 9: +3 dB on the restart, easing to 0 dB by the second group (source bar 6), keeps
# the restart from dropping (-4.2 dB -> about -1 dB). Segments (from film bar, to film bar, dB, dB), linear in dB.
RIDE = [(10, 14, 3.0, 0.0), (18, 22, 3.0, 0.0)]


def stretched():
    """The track at exactly 108 BPM (rubberband, stereo kept together), 48 kHz stereo."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(SRC), "-af",
                          f"aresample={SR},rubberband=tempo={BPM / SRC_BPM:.8f}:channels=together",
                          "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def src_time(bar):
    return FIRST_DOWNBEAT + (bar - 1) * BAR


def join_point(a, b):
    """Crossfade centre, s before the bar line: the fade ends 2 ms before the line, so the outgoing bar plays to its
    end and the incoming downbeat's attack comes whole from its own recording (and masks the cut). Also returns how
    different the two sides are over the fade (0 = identical), for the record."""
    lead = 0.002 + XF / 2
    mid = len(a) // 2
    c, w = mid - int(lead * SR), int(XF * SR / 2)
    d = np.sqrt(np.mean((a[c - w:c + w] - b[c - w:c + w]) ** 2))
    e = np.sqrt(np.mean(a[c - w:c + w] ** 2) + np.mean(b[c - w:c + w] ** 2)) + 1e-9
    return lead, d / e


def pitch_classes(x):
    """Chroma and bass chroma for every beat of x (stretched-track time), from the first downbeat."""
    import librosa
    y = librosa.resample(x.mean(axis=1).astype(np.float32), orig_sr=SR, target_sr=22050)
    hop = 512
    ch = librosa.feature.chroma_cqt(y=y, sr=22050, hop_length=hop)
    bass = librosa.feature.chroma_cqt(y=y, sr=22050, hop_length=hop, fmin=librosa.note_to_hz("C1"), n_octaves=3)
    t = librosa.frames_to_time(np.arange(ch.shape[1]), sr=22050, hop_length=hop)
    beats = []
    k = 0
    while True:
        t0 = FIRST_DOWNBEAT + k * BEAT
        if t0 + BEAT > len(x) / SR:
            break
        sel = (t >= t0) & (t < t0 + BEAT)
        c, b = ch[:, sel].mean(axis=1), bass[:, sel].mean(axis=1)
        beats.append((c / (c.max() + 1e-9), b / (b.max() + 1e-9)))
        k += 1
    return beats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/sound/bed.wav")
    a = ap.parse_args()
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    assert abs(tl["bpm"] - BPM) < 1e-9 and tl["bars"] == sum(n for _, _, n in PLAN), "the plan must fill the timeline"
    x = stretched()
    n_film = int(round(tl["end"] * SR))
    out = np.zeros((n_film + SR, 2))
    pad = int(0.1 * SR)
    joins = []
    runs = []
    for i, (fbar, sbar, n) in enumerate(PLAN):
        f0 = (fbar - 1) * BAR  # film time of the run's first bar line
        s0 = src_time(sbar)
        # the run's audio, with `pad` before and after its bar lines for the crossfades
        i0 = int(round((s0 * SR))) - pad
        seg = np.zeros((int(round(n * BAR * SR)) + 2 * pad, 2))
        lo, hi = max(0, i0), min(len(x), i0 + len(seg))
        seg[lo - i0: hi - i0] = x[lo:hi]
        runs.append((f0, seg, fbar, sbar, n))
    # lay the runs, joining each to the previous one before its first bar line
    for i, (f0, seg, fbar, sbar, n) in enumerate(runs):
        j0 = int(round(f0 * SR)) - pad
        if i == 0:
            body = seg[pad:]
            out[int(round(f0 * SR)): int(round(f0 * SR)) + len(body)] += body
            continue
        prev_f0, prev_seg, pfbar, psbar, pn = runs[i - 1]
        line = int(round(f0 * SR))  # the film sample of the join's bar line
        # the previous run's continuation past its end and this run's pre-roll, both around the bar line
        a_ = prev_seg[len(prev_seg) - 2 * pad:]
        b_ = seg[:2 * pad]
        lead, diff = join_point(a_.mean(axis=1), b_.mean(axis=1))
        c = line - int(lead * SR)  # crossfade centre
        h = int(XF * SR / 2)
        # out already holds the previous run up to its end + pad; cut it with a fade-out, then add this run
        prev_end = int(round(prev_f0 * SR)) + len(prev_seg) - pad  # last sample written by the previous run
        ramp = np.linspace(0, math.pi / 2, 2 * h)
        out[c - h: c + h] *= np.cos(ramp)[:, None]
        out[c + h: prev_end] = 0
        body = seg[pad - (line - (c - h)):]  # this run from the crossfade's start
        start = c - h
        body = body.copy()
        body[: 2 * h] *= np.sin(ramp)[:, None]
        out[start: start + len(body)] += body[: len(out) - start]
        joins.append({"film_bar": fbar, "film_time": round(f0, 4), "from_source_bar": psbar + pn - 1, "to_source_bar": sbar,
                      "crossfade_ms_before_line": round(1000 * lead, 1), "difference": round(float(diff), 3)})
    out = out[:n_film]
    # the ride on the intro's restarts (a gain curve in dB, linear between breakpoints, 0 dB outside them)
    t = np.arange(n_film) / SR
    ride = np.zeros(n_film)
    for b0, b1, g0, g1 in RIDE:
        a_, z_ = (b0 - 1) * BAR, (b1 - 1) * BAR
        sel = (t >= a_) & (t < z_)
        ride[sel] = g0 + (g1 - g0) * (t[sel] - a_) / (z_ - a_)
    out *= (10 ** (ride / 20))[:, None]
    # the last run ends the film with the track's final chord ringing; a short fade at the cut is left to the master
    beats = pitch_classes(x)
    film_beats = []
    for fbar, sbar, n in PLAN:
        for k in range(4 * n):
            sb = 4 * (sbar - 1) + k
            c, b = beats[min(sb, len(beats) - 1)]
            film_beats.append({"t": round(((fbar - 1) * 4 + k) * BEAT, 4), "source_beat": sb,
                               "chroma": [round(float(v), 3) for v in c], "bass": [round(float(v), 3) for v in b]})
    path = ROOT / a.out
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, SR, out.astype(np.float32))
    info = {"source": str(SRC.relative_to(ROOT)), "source_bpm": SRC_BPM, "bpm": BPM, "stretch": BPM / SRC_BPM,
            "first_downbeat": FIRST_DOWNBEAT, "plan": [{"film_bars": [f, f + n - 1], "source_bars": [s, s + n - 1],
                                                        "film_time": [round((f - 1) * BAR, 3), round((f + n - 1) * BAR, 3)]}
                                                       for f, s, n in PLAN],
            "joins": joins, "beats": film_beats}
    path.with_suffix(".json").write_text(json.dumps(info, indent=1))
    print(f"{path.relative_to(ROOT)}: {len(out) / SR:.3f} s, {len(PLAN)} runs, {len(joins)} joins")
    for j in joins:
        print(f"  join at film bar {j['film_bar']} ({j['film_time']:.2f} s): source bar {j['from_source_bar']} -> {j['to_source_bar']},"
              f" crossfade {j['crossfade_ms_before_line']} ms before the line (difference {j['difference']})")


if __name__ == "__main__":
    main()
