// Cut-paper props for showing recordings of the real app (lib/footage.js): a generic phone, the hand that holds it,
// the hand that taps it, a generic laptop and a cursor. They are overlays around real UI, never UI themselves: plain
// slabs with no logo, no camera island and no status bar (the recordings have none, and UI is never drawn). Every
// piece is paper on ctx.top (it overlaps the recording): hand-cut edges, the paper grain (.grained) and the film's
// small hard shadow. Build them in build(); move them in render() with transforms only.
import { C, el, rough, clip } from './paper.js';

const SVG = 'http://www.w3.org/2000/svg';
let sampler = null;

// Sample an SVG path into a polygon, one point every `step` units.
export function outline(d, step = 3) {
  if (!sampler) {
    sampler = document.createElementNS(SVG, 'svg');
    Object.assign(sampler.style, { position: 'absolute', width: '0', height: '0' });
    document.body.appendChild(sampler);
  }
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', d);
  sampler.appendChild(p);
  const len = p.getTotalLength();
  const pts = [];
  for (let l = 0; l < len; l += step) {
    const q = p.getPointAtLength(l);
    pts.push([q.x, q.y]);
  }
  p.remove();
  return pts;
}

// A rounded rectangle as path data (clockwise).
export const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

// A finger: a capsule from its base (bx, by) to its tip (tx, ty), w wide, round at the tip and square at the base.
export function finger(bx, by, tx, ty, w) {
  const L = Math.hypot(tx - bx, ty - by);
  const ux = (tx - bx) / L;
  const uy = (ty - by) / L;
  const nx = -uy * (w / 2);
  const ny = ux * (w / 2);
  const cx = tx - ux * (w / 2);
  const cy = ty - uy * (w / 2);
  return `M${bx - nx} ${by - ny}L${cx - nx} ${cy - ny}A${w / 2} ${w / 2} 0 0 1 ${cx + nx} ${cy + ny}L${bx + nx} ${by + ny}Z`;
}

const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';

// One piece of paper cut to path `d` (in the parent's units), its edge jittered inward like a scissor cut.
// Returns its wrapper (move that).
export function piece(parent, d, color, { seed = 1, amp = 1.7, wave = 70, shadow = true, step = 3 } = {}) {
  const pts = outline(d, step);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs)) - 2;
  const y0 = Math.floor(Math.min(...ys)) - 2;
  const w = Math.ceil(Math.max(...xs)) + 2 - x0;
  const h = Math.ceil(Math.max(...ys)) + 2 - y0;
  const poly = rough(pts.map(([x, y]) => [x - x0, y - y0]), { seed, amp, wave, spacing: 6 });
  const wrap = el(parent, '', { left: `${x0}px`, top: `${y0}px`, width: `${w}px`, height: `${h}px`, filter: shadow ? SHADOW : 'none' });
  el(wrap, 'grained', { width: '100%', height: '100%', backgroundColor: color, backgroundPosition: `${-x0}px ${-y0}px`, clipPath: clip(poly) });
  return wrap;
}

// A sheet with a window cut in it, both rounded rectangles in the parent's units; the window's edge is jittered
// into the sheet's paper (the window grows by up to amp, never shrinks), so it can overlap what is under it by a
// fixed amount at most.
function ringSheet(parent, outer, win, color, { seed, amp, w, h }) {
  const sheet = el(parent, 'grained', { width: `${w}px`, height: `${h}px`, backgroundColor: color });
  const o = rough(outline(outer, 3), { seed, amp, wave: 50, spacing: 5 });
  const i = rough(outline(win, 3).reverse(), { seed: seed + 1, amp, wave: 50, spacing: 5 });
  sheet.style.clipPath = clip(o, i);
  return sheet;
}

// The phone, in its own units: CSS px of the 390 x 844 recording. Body 438 x 892, the display at (24, 24), its
// corners rounded 40. `screen` is where the recording goes (overflow hidden, rounded like the display); the black
// glass ring above it overlaps the recording by 3 units at most.
export const PHONE = { w: 438, h: 892, sx: 24, sy: 24, sw: 390, sh: 844 };
export function phone(parent, { body = C.orange, seed = 520 } = {}) {
  const P = PHONE;
  const g = el(parent, '', { width: `${P.w}px`, height: `${P.h}px` });
  piece(g, rr(P.w - 6, 196, 12, 92, 4), body, { seed: seed + 1, shadow: false, amp: 1 }); // the side keys
  piece(g, rr(P.w - 6, 312, 12, 54, 4), body, { seed: seed + 2, shadow: false, amp: 1 });
  piece(g, rr(0, 0, P.w, P.h, 66), body, { seed: seed + 3, amp: 2.2 });
  const screen = el(g, '', { left: `${P.sx}px`, top: `${P.sy}px`, width: `${P.sw}px`, height: `${P.sh}px`, overflow: 'hidden', borderRadius: '40px' });
  ringSheet(g, rr(P.sx - 6, P.sy - 6, P.sw + 12, P.sh + 12, 46), rr(P.sx + 3, P.sy + 3, P.sw - 6, P.sh - 6, 37), C.black, { seed: seed + 4, amp: 1.6, w: P.w, h: P.h });
  return { el: g, screen };
}

// The left hand holding the phone, in the phone's units: the palm and wrist behind its lower half (`under`), the
// thumb along its left edge and four fingertips round its right edge (`over`). None of it covers the display.
export function holdHand(under, over, { seed = 540 } = {}) {
  const W = PHONE.w;
  piece(under, `M-60 690 C-100 744 -108 820 -62 888 C-34 930 6 962 38 986 L26 1600 L336 1600 L352 996
    C404 972 440 934 452 880 L${W} 870 L${W} 560 C380 540 120 600 -60 690Z`, C.black, { seed, amp: 1.9 });
  piece(over, finger(-66, 880, -16, 520, 72), C.black, { seed: seed + 1 });
  piece(over, 'M-44 852 Q-62 772 -50 690 Q-54 774 -36 850Z', C.cream, { seed: seed + 2, amp: 0.6, shadow: false, step: 2 });
  [[560, 58], [622, 58], [684, 54], [742, 48]].forEach(([y, w], i) => piece(over, finger(W + 74, y + 16, W - 7, y, w), C.black, { seed: seed + 3 + i }));
}

// The right hand that taps: seen from the back, index finger out, drawn pointing straight up with the contact point
// of its fingertip (under the nail) at its origin, the finger 100 units wide. place(x, y, angle, k, press): contact
// point at (x, y) of the parent, leaning `angle` degrees (negative leans the finger left, the arm comes from the
// lower right), scaled by k; press (0-1) is how far the fingertip is down on the glass: the hand sinks a little and
// its shadow tightens.
export const HOT = 46;
export function pointHand(parent, { seed = 560 } = {}) {
  const g = el(parent, '', { width: '1px', height: '1px', transformOrigin: '0 0' });
  const inner = el(g, '', { left: '0px', top: `${-HOT}px` });
  const hand = piece(inner, `M-50 62 C-50 22 -28 0 0 0 C28 0 50 22 50 62 L52 236 C70 226 118 226 136 250 C156 244 190 252 200 276
    C222 276 238 296 236 326 C234 384 224 436 196 474 C180 500 166 520 160 548 L178 1500 L-46 1500 L-38 548
    C-46 522 -66 504 -82 486 C-114 452 -118 404 -98 374 C-86 352 -70 336 -52 326 C-51 296 -50 270 -50 236Z`, C.black, { seed, amp: 2.2 });
  const detail = (d, s) => piece(inner, d, C.cream, { seed: s, amp: 0.8, shadow: false, step: 2 });
  detail(rr(-28, 18, 56, 74, 26), seed + 1); // the nail
  detail('M-26 170 Q0 182 26 170 Q0 190 -26 170Z', seed + 2); // the finger's middle joint
  detail('M-66 456 Q-92 404 -60 334 Q-80 404 -56 456Z', seed + 3); // the thumb's edge
  detail('M-41 566 L171 562 L172 580 L-41 584Z', seed + 4); // the cuff
  const place = (x, y, angle, k, press = 0) => {
    g.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${angle.toFixed(3)}deg) scale(${(k * (1 - 0.035 * press)).toFixed(4)})`;
    const lift = 1 - press;
    hand.style.filter = `drop-shadow(0 ${(3 + 9 * lift).toFixed(1)}px ${(3 + 3 * lift).toFixed(1)}px rgba(0,0,0,0.28))`;
  };
  return { el: g, place };
}

// The laptop, in its own units: CSS px of the 1440 x 900 recording. Lid 1512 x 980 with the display at (36, 36),
// a base below it. `screen` is where the recording goes; the black bezel above it overlaps it by 3 units at most.
export const LAPTOP = { w: 1512, h: 980, sx: 36, sy: 36, sw: 1440, sh: 900 };
export function laptop(parent, { body = C.navy, seed = 580 } = {}) {
  const L = LAPTOP;
  const g = el(parent, '', { width: `${L.w}px`, height: `${L.h}px` });
  const bw0 = L.w * 1.07;
  const bw1 = L.w * 1.13;
  const by = L.h - 6;
  piece(g, `M${(L.w - bw0) / 2} ${by} H${(L.w + bw0) / 2} L${(L.w + bw1) / 2} ${by + 44} Q${L.w / 2} ${by + 58} ${(L.w - bw1) / 2} ${by + 44}Z`, body, { seed: seed + 1, amp: 3 });
  piece(g, `M${L.w / 2 - 110} ${by} H${L.w / 2 + 110} Q${L.w / 2 + 104} ${by + 14} ${L.w / 2 + 90} ${by + 14} H${L.w / 2 - 90} Q${L.w / 2 - 104} ${by + 14} ${L.w / 2 - 110} ${by}Z`, C.black, { seed: seed + 2, amp: 1, shadow: false });
  piece(g, rr(0, 0, L.w, L.h, 30), body, { seed: seed + 3, amp: 3.2 });
  const screen = el(g, '', { left: `${L.sx}px`, top: `${L.sy}px`, width: `${L.sw}px`, height: `${L.sh}px`, overflow: 'hidden' });
  ringSheet(g, rr(L.sx - 12, L.sy - 12, L.sw + 24, L.sh + 24, 14), rr(L.sx + 3, L.sy + 3, L.sw - 6, L.sh - 6, 2), C.black, { seed: seed + 4, amp: 1.8, w: L.w, h: L.h });
  return { el: g, screen };
}

// The cursor: an arrow with its hotspot at the origin, BLACK with a CREAM edge, in the page's CSS px, drawn 1.6x a
// system arrow so it reads in a wide shot. place(x, y, press): hotspot at (x, y); press (0-1) is a click.
export function cursor(parent, { seed = 595 } = {}) {
  const g = el(parent, '', { width: '1px', height: '1px', transformOrigin: '0 0' });
  const k = 1.6;
  const a = [[0, 0], [0, 26], [6.6, 20], [11.2, 29.6], [15.4, 27.8], [10.9, 18.6], [19.2, 18.6]].map(([x, y]) => [x * k, y * k]);
  const path = (pts) => `M${pts.map((p) => p.join(' ')).join('L')}Z`;
  const grow = (pts, d) => pts.map(([x, y]) => {
    const l = Math.hypot(x - 7 * k, y - 16 * k) || 1;
    return [x + ((x - 7 * k) / l) * d, y + ((y - 16 * k) / l) * d];
  });
  piece(g, path(grow(a, 3.4)), C.cream, { seed, amp: 0.8 });
  piece(g, path(a), C.black, { seed: seed + 1, amp: 0.6, shadow: false, step: 1.5 });
  const place = (x, y, press = 0) => {
    g.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(1 - 0.12 * press).toFixed(4)})`;
  };
  return { el: g, place };
}
