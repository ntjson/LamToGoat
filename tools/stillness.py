"""Find where a render holds still: the rhythm check for "a new visual event every 3-4 s" (CLAUDE.md).

Decodes the video at 10 fps as 192x108 grey frames and measures how much each frame differs from the previous one,
as the largest mean absolute difference over a 12 x 9 grid of tiles (0-255; paper grain is static, so a held frame
measures ~0, and a small tag arriving still registers in its tile). Reports every run longer than --hold seconds in
which nothing changes by more than --still, and the longest gaps between clear visual events (a tile changing by
more than --event), with the chapter each falls in.

Usage: uv run --with numpy python tools/stillness.py out/roughcut.mp4 [--hold 2.0] [--still 1.5] [--event 20]
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 192, 108, 10


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--hold", type=float, default=2.0)
    ap.add_argument("--still", type=float, default=1.5)
    ap.add_argument("--event", type=float, default=20.0)
    ap.add_argument("--offset", type=float, default=0.0, help="film time of the video's first frame")
    a = ap.parse_args()
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], check=True, capture_output=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    d = np.abs(np.diff(frames, axis=0))
    diff = d.reshape(len(d), 9, H // 9, 12, W // 12).mean(axis=(2, 4)).max(axis=(1, 2))
    times = a.offset + (np.arange(len(diff)) + 1) / FPS
    chapters = json.loads((ROOT / "docs" / "timeline.json").read_text())["chapters"]
    where = lambda t: next((c["id"] for c in chapters if c["start"] <= t < c["end"]), chapters[-1]["id"])

    print(f"{len(frames)} frames at {FPS} fps, {len(frames) / FPS:.1f} s")
    print(f"\nholds longer than {a.hold} s (every frame-to-frame change under {a.still}):")
    run = 0
    found = 0
    for i, d in enumerate(np.append(diff, np.inf)):
        if d < a.still:
            run += 1
            continue
        if run / FPS > a.hold:
            t1 = times[i - 1] if i else a.offset
            t0 = t1 - run / FPS
            print(f"  {t0:7.1f}-{t1:6.1f} s  {run / FPS:4.1f} s  {where(t0)}")
            found += 1
        run = 0
    if not found:
        print("  none")

    ev = times[diff > a.event]
    gaps = sorted(((b - x, x, b) for x, b in zip(ev[:-1], ev[1:])), reverse=True)[:8]
    print(f"\nlongest gaps between visual events (frame change over {a.event}):")
    for g, x, b in gaps:
        print(f"  {x:7.1f}-{b:6.1f} s  {g:4.1f} s  {where(x)}")


if __name__ == "__main__":
    main()
