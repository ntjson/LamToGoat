// Shared building blocks for chapters, so every chapter's tags, fields, numbers and UI plates look and move alike.
// Build them in build(); drive them from render(t). Nothing here animates by itself. See docs/ANIMATION_GUIDE.md.
import { spring, step } from './motion.js';
import { el, rough, rect, clip, pathData } from './paper.js';

export const W = 1920;
export const H = 1080;
const SVG = 'http://www.w3.org/2000/svg';

// On-screen text: NFC, and " / " is a line break (the shotlist's notation). Text never wraps by itself (see text()).
export const txt = (s) => s.normalize('NFC').split(' / ').join('<br>');

// A text block. cls: 'disp' (DISPLAY caps; add 'cut-text' for the hand-cut edge), 'label' or 'mono'. It never
// wraps: break lines with " / ". Returns { el, w, h } with the layout size (transforms don't change it).
export function text(parent, cls, s, { size, color, lh, ...style } = {}) {
  const line = lh ?? (cls.includes('disp') ? 1.1 : 1.2);
  const e = el(parent, cls, { fontSize: `${size}px`, lineHeight: line, color, whiteSpace: 'nowrap', ...style }, txt(s));
  return { el: e, w: e.offsetWidth, h: e.offsetHeight };
}

// A cut-paper tag: text on a rough-edged paper rectangle sized to the text. rot in degrees (a hand-placed tilt).
// Use grained: true when the tag sits on ctx.top (above the stage grain), so it still looks like paper.
// Returns { el, w, h, label }; move el as a whole.
export function tag(parent, s, { cls = 'label', size = 48, color, bg, padX = 0.5, padY = 0.28, seed = 1, amp = 3, rot = 0, lh, grained = false } = {}) {
  // The tilt lives on an inner layer, so a transform set on el positions the tag without rotating the offset.
  const box = el(parent, '', { transformOrigin: '50% 50%' });
  const inner = el(box, '', { transformOrigin: '50% 50%' });
  const paper = el(inner, grained ? 'grained' : '', { backgroundColor: bg });
  const label = text(inner, cls, s, { size, color, lh });
  const px = Math.round(size * padX);
  const py = Math.round(size * padY);
  const w = label.w + 2 * px;
  const h = label.h + 2 * py;
  Object.assign(box.style, { width: `${w}px`, height: `${h}px` });
  Object.assign(inner.style, { width: `${w}px`, height: `${h}px`, transform: `rotate(${rot}deg)` });
  Object.assign(paper.style, { width: `${w}px`, height: `${h}px`, clipPath: clip(rough(rect(0, 0, w, h), { seed, amp })) });
  Object.assign(label.el.style, { left: `${px}px`, top: `${py}px` });
  return { el: box, w, h, label: label.el };
}

// A full-frame paper field with hand-cut edges, `pad` px larger than the frame on every side, so only the edge that
// is inside the frame shows while it slides (a WIPE). Position it with transform: translate(...).
// grained: true for a field on ctx.top; its texture lines up with the stage's when it rests at translate(0, 0).
export function field(parent, color, { seed = 1, amp = 5, pad = 60, grained = false } = {}) {
  const w = W + 2 * pad;
  const h = H + 2 * pad;
  return el(parent, grained ? 'grained' : '', {
    left: `${-pad}px`, top: `${-pad}px`, width: `${w}px`, height: `${h}px`, backgroundColor: color,
    backgroundPosition: `${pad}px ${pad}px`,
    clipPath: clip(rough(rect(0, 0, w, h), { seed, amp, wave: 80, spacing: 10 })),
  });
}

// A covering WIPE over a previous chapter that has UI plates on its top layer (ch05, ch07). Plates sit above every
// chapter's paper, so the covering field must travel on ctx.top while the previous chapter still paints, then drop
// to ctx.root, where the rest of your chapter lives, once it has landed. The two copies are identical (the top one
// carries a stage-aligned copy of the grain), so the swap is invisible.
// place(x, y, onTop): position both copies and show one. Pass onTop = t < underlap, and be at (0, 0) by then.
export function cover(ctx, color, opts = {}) {
  const top = field(ctx.top, color, { ...opts, grained: true });
  const root = field(ctx.root, color, opts);
  return {
    top,
    root,
    place(x, y, onTop) {
      for (const e of [top, root]) e.style.transform = `translate(${x}px, ${y}px)`;
      top.style.visibility = onTop ? 'inherit' : 'hidden';
      root.style.visibility = onTop ? 'hidden' : 'inherit';
    },
  };
}

// A paper sheet with a window cut in it (an aperture). The window's edge overlaps what is behind it by `overlap` px on
// every side of { x, y, w, h }. For a UI plate, put the aperture on ctx.top above the plate, with grained: true.
export function aperture(parent, color, { x, y, w, h, overlap = 4, sheet = [0, 0, W, H], seed = 1, amp = 3, grained = true }) {
  const [sx, sy, sw, sh] = sheet;
  const win = rough(rect(x - sx + overlap, y - sy + overlap, w - 2 * overlap, h - 2 * overlap), { seed, amp });
  const outer = rough(rect(0, 0, sw, sh), { seed: seed + 1, amp });
  return el(parent, grained ? 'grained' : '', {
    left: `${sx}px`, top: `${sy}px`, width: `${sw}px`, height: `${sh}px`, backgroundColor: color, clipPath: clip(outer, win),
    backgroundPosition: `${-sx}px ${-sy}px`,
  });
}

// A number whose digits roll in fixed slots, like an odometer (tabular figures). s: "1.363", "17%", "32,4", "96–120".
// Non-digits stay put. Returns { el, w, h, roll(t, t0, opts) }: roll() moves every digit from 0 up to its value
// on a spring starting at t0, one slot after another from the left; digits after the first make one extra turn,
// so the number visibly counts. Call roll() every frame (before t0 it shows zeros).
export function odometer(parent, s, { cls = 'disp', size, color, lh = 1.0, ...style } = {}) {
  const box = el(parent, cls, { fontSize: `${size}px`, lineHeight: lh, color, whiteSpace: 'nowrap', display: 'flex', ...style });
  const cell = size * lh;
  const slots = [];
  for (const ch of s.normalize('NFC')) {
    const span = document.createElement('span');
    Object.assign(span.style, { display: 'block', height: `${cell}px`, overflow: 'hidden', whiteSpace: 'pre' });
    if (/[0-9]/.test(ch)) {
      const col = document.createElement('span');
      col.style.display = 'block';
      col.innerHTML = Array.from({ length: 22 }, (_, i) => `<span style="display:block;height:${cell}px">${i % 10}</span>`).join('');
      span.appendChild(col);
      slots.push({ col, digit: Number(ch) });
    } else {
      span.textContent = ch;
    }
    box.appendChild(span);
  }
  const roll = (t, t0, { preset = 'count', stagger = 0.06 } = {}) => {
    slots.forEach((sl, i) => {
      const v = spring(t, t0 + i * stagger, 0, sl.digit + (i > 0 ? 10 : 0), preset);
      sl.col.style.transform = `translateY(${(-v * cell).toFixed(2)}px)`;
    });
  };
  // place(vals): put digit slot k at an explicit position vals[k] (in digits, 0-21; the slot shows vals[k] mod 10),
  // for counts that drive each slot with their own springs.
  const place = (vals) => slots.forEach((sl, i) => {
    sl.col.style.transform = `translateY(${(-vals[i] * cell).toFixed(2)}px)`;
  });
  roll(0, 1);
  return { el: box, w: box.offsetWidth, h: box.offsetHeight, roll, place, digits: slots.map((sl) => sl.digit) };
}

const images = new Map();
function image(ctx, src) {
  if (!images.has(src)) images.set(src, ctx.image(src));
  return images.get(src);
}

// A real screenshot crop, straight from docs/crops.json (by shot id, e.g. '5.5a'): a window of the crop's on-screen
// size showing the untouched image laid out at the measured scale. No redraw, no filter, no rotation, no glow.
// backing: colour of a hard cut-paper backing offset by `offset` px down-right (or null for none, e.g. when the
// plate sits in an aperture). Put plates on ctx.top so the grain doesn't cover the UI.
// zoom multiplies the measured scale (only ever > 1, for a PUSH; the minimum text size only grows).
// Returns { el, win, img, w, h, crop }; move el as a whole. Must be awaited in build().
export async function plate(ctx, shot, { parent = ctx.top, backing = null, offset = 14, seed = 1, zoom = 1 } = {}) {
  const c = ctx.crop(shot);
  const [x, y, cw, ch] = c.crop;
  const s = c.scale * zoom;
  const w = Math.round(cw * s);
  const h = Math.round(ch * s);
  const img = await image(ctx, `/${c.file}`);
  const box = el(parent, '', { width: `${w}px`, height: `${h}px` });
  if (backing) {
    el(box, 'grained', {
      left: `${offset}px`, top: `${offset}px`, width: `${w}px`, height: `${h}px`, backgroundColor: backing,
      clipPath: clip(rough(rect(0, 0, w, h), { seed, amp: 3 })),
    });
  }
  const win = el(box, '', { width: `${w}px`, height: `${h}px`, overflow: 'hidden' });
  const im = img.cloneNode();
  im.className = 'abs';
  Object.assign(im.style, {
    width: `${(img.naturalWidth * s).toFixed(2)}px`, height: `${(img.naturalHeight * s).toFixed(2)}px`,
    left: `${(-x * s).toFixed(2)}px`, top: `${(-y * s).toFixed(2)}px`,
  });
  win.appendChild(im);
  return { el: box, win, img: im, w, h, crop: c };
}

// FLIP: a panel turning on its vertical axis. Returns { sx, back }: set transform scaleX(sx) (origin at the panel's
// centre) and show the back face when back is true.
export function flip(t, t0, preset = 'flip') {
  const a = spring(t, t0, 0, Math.PI, preset);
  return { sx: Math.max(0.001, Math.abs(Math.cos(a))), back: a > Math.PI / 2 };
}

// An SVG layer of size w x h at (x, y), for strokes (scissor lines, brackets, arrows).
export function svg(parent, w = W, h = H, x = 0, y = 0) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('width', w);
  s.setAttribute('height', h);
  s.setAttribute('class', 'abs');
  Object.assign(s.style, { left: `${x}px`, top: `${y}px`, overflow: 'visible' });
  parent.appendChild(s);
  return s;
}

// A stroked path in an svg() layer. pts: [[x, y], ...] or a path-data string. Returns the <path>; draw it on with
// drawOn(path, u) where u goes 0 -> 1 (from a spring).
export function stroke(layer, pts, { color, width = 6, closed = false, cap = 'round' } = {}) {
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', typeof pts === 'string' ? pts : pathData(pts, closed));
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', color);
  p.setAttribute('stroke-width', width);
  p.setAttribute('stroke-linejoin', 'round');
  p.setAttribute('stroke-linecap', cap);
  layer.appendChild(p);
  p.__len = p.getTotalLength();
  p.setAttribute('stroke-dasharray', `${p.__len} ${p.__len}`);
  p.setAttribute('stroke-dashoffset', '0');
  return p;
}

export function drawOn(p, u) {
  p.setAttribute('stroke-dashoffset', `${(p.__len * (1 - Math.min(1, Math.max(0, u)))).toFixed(2)}`);
}

// Shorthands used everywhere in render(): show/hide, and a spring-driven 0 -> 1 progress.
export const vis = (e, on) => {
  e.style.visibility = on ? 'inherit' : 'hidden';
  return on;
};
export const prog = (t, t0, preset = 'slide') => step(t - t0, preset);
