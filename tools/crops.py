"""Measure the real-screenshot crops for ch05/ch07 and write docs/crops.json (scenes read it; no hard-coded rects).

For each crop: source rect, on-screen scale at 1080p, and the smallest text's on-screen size, measured from the
cap height (or ascender-to-descender height) of a probe glyph. Every crop must keep that at 28 px or more.
Usage: uv run --with pillow python tools/crops.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
S = ROOT / "assets" / "screens"

# shot, file, crop (x, y, w, h), scale, content, probe (label, glyph box, height/em ratio, how to find the ink)
SPEC = [
    ("5.3a", "app/android-light-12-report-form@3x.png", (0, 0, 1170, 690), 0.8, "header + empty report box",
     ("Đ of the placeholder", (90, 393, 126, 453), 0.711, "dark")),
    ("5.3b", "app/flow-00-picker@3x.png", (0, 0, 1170, 900), 0.8, "location picker, first rows",
     ("K of Khu tiện ích", (93, 270, 129, 327), 0.711, "dark")),
    ("5.3c", "app/flow-01-form-filled@3x.png", (48, 780, 1074, 1035), 0.8,
     "location, photo, submit (the test-string description box is excluded)",
     ("C of Chỉ bạn", (252, 1080, 279, 1122), 0.711, "dark")),
    ("5.4", "app/flow-02-submitted@3x.png", (48, 1347, 1074, 342), 0.9333, "confirmation banner + notify pill",
     ("P of Phản ánh của bạn", (177, 1383, 213, 1443), 0.711, "dark")),
    ("5.5a", "web/desktop-report-triage@4x.png", (1184, 856, 2608, 972), 0.55, "report #7 card",
     ("V of the Vị trí label", (1272, 1208, 1328, 1272), 0.716, "dark")),
    ("5.5b", "web/desktop-report-triage@4x.png", (1184, 2096, 2608, 1156), 0.575, "AI suggestion card",
     ("C of Có thể thiếu", (1272, 2448, 1320, 2520), 0.716, "dark")),
    ("5.6a", "web/desktop-report-triage@4x.png", (3920, 716, 1680, 1000), 0.575,
     "confirm panel: title, Danh mục, Mức khẩn", ("B of Bước tiếp theo", (3996, 800, 4040, 864), 0.716, "dark")),
    ("5.6b", "web/desktop-report-triage@4x.png", (4000, 2760, 1520, 176), 0.55, "Xác nhận phân loại button",
     ("X of Xác nhận", (4460, 2800, 4520, 2880), 0.716, "light")),
    ("5.6c", "web/desktop-report-triage@4x.png", (64, 3188, 870, 194), 0.65, "manager identity: avatar, Kawaibu, email",
     ("email line, ascender to descender", (268, 3300, 1000, 3352), 0.95, "dark170")),
    ("5.6d", "web/desktop-case-completed@4x.png", (1184, 4328, 2848, 440), 0.575,
     "case #2 accountability chain, all Hoàn tất", ("H of Hoàn tất", (1396, 4616, 1444, 4680), 0.716, "dark")),
    ("7.2a", "web/desktop-proposal-new@4x.png", (4240, 892, 1280, 464), 0.55, "publish lock note",
     ("V of Việc", (4424, 960, 4476, 1032), 0.716, "dark")),
    ("7.2b", "web/desktop-proposal-new@4x.png", (1248, 5140, 2040, 144), 0.525, "confirm checkbox line",
     ("T of Tôi", (1392, 5176, 1440, 5248), 0.716, "dark")),
    ("7.2c", "web/desktop-proposal-new@4x.png", (1280, 5492, 632, 176), 0.55, "Công bố đề xuất button",
     ("C of Công", (1360, 5540, 1410, 5620), 0.716, "light")),
    ("7.3a", "app/android-light-07-ledger-detail@3x.png", (48, 192, 1074, 1044), 0.8333,
     "verified header + amount/contractor", ("S of the Số tiền label", (96, 687, 120, 729), 0.711, "dark")),
    ("7.3b", "app/android-light-07-ledger-detail@3x.png", (0, 1300, 1170, 1232), 0.8333, "Chuỗi trách nhiệm steps",
     ("C of Cảm biến (step 1 detail)", (225, 1725, 251, 1766), 0.711, "dark")),
    ("7.3c", "app/android-light-06-issue-detail@3x.png", (0, 168, 1170, 402), 0.9333,
     "Phản ánh #2 header: badge, title, location", ("G of Goldmark", (117, 489, 153, 546), 0.711, "dark")),
    ("7.4", "web/desktop-explorer-verified@5x.png", (1750, 2995, 3700, 315), 0.48,
     "integrity card header, verified badge", ("badge text, ascender to descender", (4385, 3110, 5300, 3200), 0.95, "green")),
    ("7.6", "web/desktop-explorer-mismatch@5x.png", (1750, 2995, 3700, 315), 0.48,
     "same crop, mismatch badge; 7.7 pushes to 0.96", ("badge text, ascender to descender", (4385, 3110, 5300, 3200), 0.95, "red")),
]


def ink_height(path, box, how):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(int)
    x0, y0, x1, y1 = box
    sub = rgb[y0:y1, x0:x1]
    lum = sub.mean(axis=2)
    m = {
        "dark": lum < 150,
        "dark170": lum < 170,
        "light": lum > 200,
        "red": (sub[..., 0] > 150) & (sub[..., 1] < 110),
        "green": (sub[..., 1] > sub[..., 0] + 40) & (sub[..., 1] < 170),
    }[how]
    ys = np.where(m.any(axis=1))[0]
    if not len(ys):
        raise SystemExit(f"no ink in probe box {box} of {path.name}")
    return int(ys.max() - ys.min() + 1)


def main():
    out, low = [], []
    for shot, f, (x, y, w, h), sc, what, (label, box, ratio, how) in SPEC:
        path = S / f
        assert Image.open(path).size[0] >= x + w and Image.open(path).size[1] >= y + h, f"{shot} crop outside {f}"
        px = ink_height(path, box, how) / ratio * sc
        if px < 28:
            low.append(f"{shot}: {px:.1f} px")
        out.append({"shot": shot, "file": f"assets/screens/{f}", "crop": [x, y, w, h], "scale": sc,
                    "screen": [round(w * sc), round(h * sc)], "what": what,
                    "min_text_px": round(px, 1), "min_text_probe": label})
        print(f"{shot:5s} {f.split('/')[-1]:40s} {x},{y} {w}x{h} @{sc} -> {round(w*sc)}x{round(h*sc)}  "
              f"min text {px:.1f} px ({label})")
    doc = {"note": "Real-screenshot crops for ch05/ch07, measured on the final @3x/@4x/@5x set by tools/crops.py. "
                   "crop = x,y,w,h in source px; scale = on-screen px per source px at 1080p; "
                   "min_text_px = smallest text on screen.",
           "crops": out}
    (ROOT / "docs" / "crops.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if low:
        raise SystemExit("below 28 px: " + ", ".join(low))


if __name__ == "__main__":
    main()
