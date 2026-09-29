"""Team photos: the five portraits from the deck's ĐỘI NGŨ page, and their cut-outs for ch10.

    uv run --with numpy --with pillow python tools/team.py extract
    uv run --with numpy --with pillow --with scipy --with opencv-python-headless python tools/team.py cut [--out dir]

extract: the page (PDF page 13, refs/slide-13.png) embeds each member's photo as its own image object. Three carry a
soft mask: the circle crops of photos 1 and 2, and the deck's own cut-out of photo 4 (outside it the stored pixels are
black). Each file written to assets/team/ is the embedded image exactly as stored, pixel for pixel, with its soft mask
as the alpha channel when it has one: no resampling, no colour change. Photo 5 is stored as a JPEG; qpdf, Pillow and
poppler decode it to identical pixels. The images are tagged with Skia's sRGB profile (its colorants are sRGB's), so
the stored values are sRGB and the PNGs carry no profile.

cut: the portraits as ch10 shows them, a hand-cut paper bust per member. Only two things happen to a photo, as
CLAUDE.md allows: a cutout (a matte and a cut line) and a colour treatment. The matte is the photo's own background
removed by colour (near-white pixels connected to the photo's edge; photo 4 keeps the deck's mask, minus the chair
behind the sitter, cut by hand). The cut line follows the silhouette a few px outside it, round the head, and below
the chin it is a U hanging from the chin line (the bust). Every head is scaled to the same height, so the five read as
one set; photo 1's circle ends at the scarf, and it sets that height (its bust just clears the 300 px floor, plus the
cut's jitter). No pixel is moved: scaling is one plain Lanczos resample from the photo, straight to 2x the stage size
(the browser only halves it), and nothing is warped, sharpened, smoothed, retouched or generated. So photos 1, 2 and 4,
enlarged 1.48-1.75x, are exactly as sharp as their few pixels allow.
Writes, per member, <out>/<stem>.png (RGBA at 2x the stage size: the treated photo, transparent outside the matte)
and docs/team.json (stage px: size, the cut outline, the face's centre, the head and bust heights).
The treatment: TREAT below (the film shows the photos in their own colours).

Band order, as in scenes/ch10.js (top to bottom) and on the deck's page (left to right).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'refs/pitchdeck.pdf'
OUT = ROOT / 'assets/team'

# (file stem, PDF object of the image, of its soft mask or None, expected size)
TEAM = [
    ('1-nguyen-van-thai-hung', 130, 1001, (240, 240)),
    ('2-nguyen-hoang-son', 131, 1002, (240, 240)),
    ('3-nguyen-thai-son', 1004, None, (337, 421)),
    ('4-pham-ngoc-lam', 1012, 1380, (324, 576)),
    ('5-cong-bao-chau', 1007, None, (455, 683)),
]


def image(obj, size, channels):
    """The image object's decoded samples (qpdf undoes Flate and DCT), as an h x w (x channels) array."""
    data = subprocess.run(['qpdf', f'--show-object={obj}', '--filtered-stream-data', str(PDF)],
                          check=True, capture_output=True).stdout
    w, h = size
    a = np.frombuffer(data, np.uint8)
    if a.size != w * h * channels:
        raise SystemExit(f'object {obj}: {a.size} bytes, expected {w}x{h}x{channels}')
    return a.reshape(h, w, channels) if channels > 1 else a.reshape(h, w)


def extract():
    OUT.mkdir(parents=True, exist_ok=True)
    for stem, obj, smask, size in TEAM:
        rgb = image(obj, size, 3)
        if smask is None:
            out = Image.fromarray(rgb, 'RGB')
        else:
            alpha = image(smask, size, 1)
            out = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
        path = OUT / f'{stem}.png'
        out.save(path, optimize=True)
        print(f'{path.relative_to(ROOT)}  {size[0]}x{size[1]}  {"RGBA (deck mask)" if smask else "RGB"}')


# ---- cut ----------------------------------------------------------------------------------------------------------

HEAD = 238  # stage px from the top of the hair to the chin, the same for all five
BUST = 308  # stage px from the top of the scissor line to the bottom of the bust: 300 px of photo, plus the cut's jitter
RIM = 5  # stage px of paper left outside the silhouette by the cut
S = 2  # the images are written at 2x the stage size

# Measured on each photo (source px): the chin, the face's centre line, and the matte's white threshold above and
# below the chin (a white shirt on white needs the higher one; None: photo 4 keeps the deck's mask). rx: the bust's
# half-width at the chin line, in stage px.
# The head's height is measured from the top of the hair mass, found on the matte: the first row at least CROWN of
# the head's width (a stray tuft above it doesn't make one head smaller than the others).
CROWN = 0.3
MEMBERS = {
    1: dict(chin=192, cx=118, white=(222, 244), rx=104),
    2: dict(chin=172, cx=148, white=(226, 246), rx=112),
    3: dict(chin=328, cx=172, white=(230, 244), rx=104),
    4: dict(chin=432, cx=158, white=None, rx=104,
            # The deck's cut-out keeps the chair's wings beside the head; cut them off by hand (source px polygons).
            drop=[[(207, 340), (324, 340), (324, 470), (280, 462), (240, 452), (205, 444), (193, 432), (200, 410),
                   (206, 385)],
                  [(0, 380), (104, 380), (108, 400), (113, 420), (122, 436), (130, 444), (100, 452), (60, 460),
                   (0, 470)]]),
    5: dict(chin=395, cx=226, white=(232, 246), rx=110),
}

PAL = dict(black=(21, 19, 17), orange=(255, 124, 0), cream=(244, 236, 220))

# The colour treatment. 'colour' (the film's: the user's pick, 2026-09-29) keeps the photo's own colours, untouched.
# 'duotone' (the other option shown, kept for reference: --treat duotone) maps its luminance onto the film's palette,
# black -> orange -> cream (two inks on cream paper), keyed to each face's own lit skin (the KEY percentile of the
# luminance over the face, FACE stage px round its centre) so the five print alike. Before the map, a light
# edge-preserving smoothing (bilateral, SMOOTH) keeps the enlarged 240 px photos' compression blocks from printing.
TREAT = 'colour'
DUO = [(0.0, 'black'), (0.32, 'black'), (0.88, 'orange'), (1.08, 'cream')]  # (luminance / lit skin, colour)
KEY = 70
FACE = (60, 70)  # half-width, half-height
SMOOTH = dict(sigmaColor=14, sigmaSpace=1.5)  # sigmaSpace in stage px


def load(k):
    stem = TEAM[k - 1][0]
    return stem, np.asarray(Image.open(OUT / f'{stem}.png').convert('RGBA')).astype(np.float32)


def matte(k, im):
    """The person, True where the photo shows them (source px)."""
    from PIL import ImageDraw
    from scipy import ndimage as ndi
    m = MEMBERS[k]
    outside = im[..., 3] < 128
    if m['white'] is None:
        person = ~outside
    else:
        th = np.full(im.shape[:2], m['white'][1], np.float32)
        th[:m['chin']] = m['white'][0]
        white = (im[..., :3].min(-1) >= th) | outside
        lab, _ = ndi.label(white)
        edge = np.zeros_like(white)
        edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
        edge |= ndi.binary_dilation(outside, iterations=2)
        keep = np.unique(lab[edge & white])
        person = ~np.isin(lab, keep[keep > 0])
    if m.get('drop'):
        cut = Image.new('L', (im.shape[1], im.shape[0]), 0)
        for poly in m['drop']:
            ImageDraw.Draw(cut).polygon(poly, fill=255)
        person &= ~(np.asarray(cut) > 0)
    person = ndi.binary_fill_holes(person)
    person = ndi.binary_opening(person, iterations=2)
    lab, n = ndi.label(person)
    if n > 1:
        sizes = ndi.sum(person, lab, range(1, n + 1))
        person = lab == (1 + int(np.argmax(sizes)))
    return person


def cut(k, treat=None):
    """The member's bust: (RGBA image at S x stage size, geometry in stage px)."""
    import cv2
    treat = treat or TREAT
    m = MEMBERS[k]
    stem, im = load(k)
    person = matte(k, im)
    widths = person[:m['chin']].sum(1)
    crown = int(np.argmax(widths >= CROWN * widths.max()))
    s = HEAD / (m['chin'] - crown)  # stage px per source px
    # A generous canvas round the head (stage px, at S x), cropped to the cut paper at the end.
    x0, top = m['cx'] - 170 / s, crown - 60 / s
    W, Hh = int(340 * S), int((60 + HEAD + 150) * S)
    M = np.array([[s * S, 0, -x0 * s * S], [0, s * S, -top * s * S]], np.float32)
    rgb = cv2.warpAffine(im[..., :3], M, (W, Hh), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    inside = cv2.warpAffine((im[..., 3] > 127).astype(np.float32), M, (W, Hh), flags=cv2.INTER_LINEAR) > 0.5
    pm = cv2.warpAffine(person.astype(np.float32), M, (W, Hh), flags=cv2.INTER_LINEAR)
    yy, xx = np.mgrid[0:Hh, 0:W] / S
    chin, cx = (m['chin'] - top) * s, 170.0
    # The scissor line round the head: the silhouette smoothed (scissors don't follow single hairs); strays outside it
    # are left out. The bust's bottom is BUST below the top of that line; below the chin line only what lies inside a
    # U hanging from it (a half-ellipse, rx wide) is kept. Photo 1's circle ends at the scarf, and sets that bottom.
    raw = (pm > 0.5) & inside
    smooth = cv2.GaussianBlur(raw.astype(np.float32), (0, 0), 4 * S) > 0.35
    head_top = np.where(smooth.any(1))[0][0] / S
    bottom = min(head_top + BUST, (np.where(inside.any(1))[0][-1] + 1) / S)
    u = ((xx - cx) / m['rx']) ** 2 + ((yy - chin) / (bottom - chin)) ** 2 <= 1
    keep = ((yy < chin) | u) & (yy <= bottom) & inside
    disk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * RIM * S + 1,) * 2)
    paper = (cv2.dilate(smooth.astype(np.uint8), disk) > 0) & keep
    body = raw & keep & (cv2.dilate(smooth.astype(np.uint8), disk) > 0)
    # Crop to the paper (plus 1 px).
    ys, xs = np.where(paper)
    c0, c1 = max(xs.min() - S, 0), min(xs.max() + S + 1, W)
    r0, r1 = max(ys.min() - S, 0), min(ys.max() + S + 1, Hh)
    c0, r0 = c0 - c0 % S, r0 - r0 % S
    c1, r1 = c1 + (-c1) % S, r1 + (-r1) % S
    rgb, paper, body = rgb[r0:r1, c0:c1], paper[r0:r1, c0:c1], body[r0:r1, c0:c1]
    ox, oy = c0 / S, r0 / S
    w, h = int(c1 - c0) // S, int(r1 - r0) // S
    cs, _ = cv2.findContours(paper.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, 0.8 * S, True)[:, 0, :].astype(np.float64) / S
    # Clockwise on screen (y down), as lib/paper.js rough() expects: the shoelace sum is positive.
    area = 0.5 * np.sum(c[:, 0] * np.roll(c[:, 1], -1) - np.roll(c[:, 0], -1) * c[:, 1])
    if area < 0:
        c = c[::-1]
    # The photo, treated, with the matte as alpha (feathered by a third of a stage px).
    alpha = cv2.GaussianBlur(body.astype(np.float32), (0, 0), 0.35 * S)
    if treat == 'colour':
        out = rgb
    else:
        y = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        y = cv2.bilateralFilter(y, d=0, sigmaColor=SMOOTH['sigmaColor'], sigmaSpace=SMOOTH['sigmaSpace'] * S)
        y = cv2.GaussianBlur(y, (0, 0), 0.6 * S)
        fx, fy = cx - ox, (crown - top) * s + 0.62 * HEAD - oy
        yy2, xx2 = np.mgrid[0:y.shape[0], 0:y.shape[1]] / S
        face = (((xx2 - fx) / FACE[0]) ** 2 + ((yy2 - fy) / FACE[1]) ** 2 <= 1) & body
        y = y / float(np.percentile(y[face], KEY))
        stops = np.array([p for p, _ in DUO])
        pal = np.array([PAL[n] for _, n in DUO], np.float32)
        out = np.stack([np.interp(np.clip(y, 0, stops[-1]), stops, pal[:, i]) for i in range(3)], -1)
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).round().astype(np.uint8)
    photo_top = np.where(body.any(1))[0][0] / S
    tall = bottom - oy - photo_top
    if tall < 303:
        raise SystemExit(f'member {k}: the bust is {tall:.1f} px tall, under 300 px plus the cut jitter')
    geom = dict(
        w=w, h=h,
        outline=[[round(float(x), 1), round(float(y), 1)] for x, y in c],
        face=[round(float(cx - ox), 1), round(float((crown - top) * s + 0.62 * HEAD - oy), 1)],  # eyes-to-mouth centre
        top=round(float(photo_top), 1), chin=round(float(chin - oy), 1), bottom=round(float(bottom - oy), 1),
        tall=round(float(tall), 1),  # the photo's height on screen, top of the hair to the bottom of the bust
        scale=round(float(s), 4),  # stage px per photo px (> 1: the photo is enlarged)
    )
    return stem, rgba, geom


def cut_all(out_dir):
    out_dir = (ROOT / out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = {'generated_by': 'tools/team.py cut', 'treatment': TREAT, 'head': HEAD, 'bust': BUST, 'rim': RIM,
           'scale': S, 'members': []}
    for k in sorted(MEMBERS):
        stem, rgba, geom = cut(k)
        path = out_dir / f'{stem}.png'
        Image.fromarray(rgba, 'RGBA').save(path, optimize=True)
        doc['members'].append({'file': str(path.relative_to(ROOT)), 'source': f'assets/team/{stem}.png', **geom})
        print(f'{path.relative_to(ROOT)}  {geom["w"]}x{geom["h"]} stage px, {geom["tall"]} px tall, '
              f'photo x{geom["scale"]}, {len(geom["outline"])} outline points')
    # One line per value (an outline is one long line), so a diff shows which member changed.
    text = json.dumps(doc, ensure_ascii=False, indent=1)
    text = re.sub(r'\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]', r'[\1, \2]', text)
    text = re.sub(r'\[\n\s+(\[[^\n]*\],?\n\s+)+\]', lambda m: '[' + ' '.join(m.group(0)[1:-1].split()) + ']', text)
    (ROOT / 'docs/team.json').write_text(text + '\n')
    print('docs/team.json')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'extract':
        extract()
    elif cmd == 'cut':
        args = sys.argv[2:]
        if '--treat' in args:
            TREAT = args[args.index('--treat') + 1]
        cut_all(args[args.index('--out') + 1] if '--out' in args else OUT / 'cut')
    else:
        print(__doc__)
        sys.exit(2)
