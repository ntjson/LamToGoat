"""List the white card rectangles in a screenshot, so crops can be specified in exact source pixels.

Usage: uv run --with pillow --with scipy python tools/find_cards.py IMAGE [--min-area 20000]
Cards are pure-white regions on the light grey page background; each is reported as x,y,w,h.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def cards(path, min_area):
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    white = (a == 255).all(axis=2)
    # Close tiny gaps (text anti-aliasing) so a card is one component, then label.
    closed = ndimage.binary_closing(white, structure=np.ones((5, 5)))
    labels, n = ndimage.label(closed)
    out = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if w * h >= min_area:
            out.append((sl[1].start, sl[0].start, w, h))
    return sorted(out, key=lambda r: (r[1], r[0]))


if __name__ == "__main__":
    args = sys.argv[1:]
    min_area = 20000
    if "--min-area" in args:
        i = args.index("--min-area")
        min_area = int(args[i + 1])
        del args[i : i + 2]
    for p in args:
        print(p.split("/")[-1])
        for x, y, w, h in cards(p, min_area):
            print(f"  {x},{y} {w}x{h}")
