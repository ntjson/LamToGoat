// Cut-paper helpers: hand-cut edges as polygons, turned into clip-path strings. Seeded, so every build is identical.
import { noise1, hash } from './motion.js';

export const C = { orange: '#FF7C00', cream: '#F4ECDC', black: '#151311', navy: '#003080', red: '#D0271D', bar: '#CDBFA8' };

// Create an absolutely positioned element.
export function el(parent, cls = '', style = {}, html) {
  const e = document.createElement('div');
  e.className = `abs ${cls}`.trim();
  Object.assign(e.style, style);
  if (html !== undefined) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}

// Jitter the edges of a clockwise polygon inward, like paper cut by hand.
// amp: max inward offset in px; wave: wavelength of the slow wobble; spacing: sample distance along edges.
export function rough(points, { seed = 1, amp = 3, wave = 60, spacing = 9 } = {}) {
  const out = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len === 0) continue;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const n = Math.max(1, Math.round(len / spacing));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const d = s + u * len;
      const off = amp * (0.5 + 0.35 * noise1(d / wave, seed) + 0.15 * noise1(d / 7, seed + 7));
      out.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
    }
    s += len;
  }
  return out;
}

// Clockwise rectangle, optionally with rounded corners (sampled arcs).
export function rect(x, y, w, h, r = 0) {
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const pts = [];
  const arc = (cx, cy, a0) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  arc(x + w - r, y + r, -Math.PI / 2);
  arc(x + w - r, y + h - r, 0);
  arc(x + r, y + h - r, Math.PI / 2);
  arc(x + r, y + r, Math.PI);
  return pts;
}

// Speech bubble: rounded rectangle with a tail at the bottom, on the left or right.
export function bubble(w, h, { r = 26, tail = 'left', tw = 34, th = 30 } = {}) {
  const body = rect(0, 0, w, h - th, r);
  const bottom = h - th;
  const tx = tail === 'left' ? 44 : w - 44 - tw;
  // Insert the tail into the bottom edge, which runs right to left in a clockwise outline.
  const i = body.findIndex(([x, y]) => y === bottom && x < w - r);
  const tip = tail === 'left' ? [tx - 6, h] : [tx + tw + 6, h];
  const tailPts = [[tx + tw, bottom], tip, [tx, bottom]];
  return [...body.slice(0, i), ...tailPts, ...body.slice(i)];
}

// Torn-paper hole around (cx, cy): radius r with a few slow lobes (low) and fine fibre jitter (fine).
// The noise wraps around the circle so the outline closes without a seam.
export function blob(cx, cy, r, { seed = 1, n = 180, lobes = 7, low = 0.14, fine = 0.022 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const u = (i / n) * lobes;
    const wrap = (1 - i / n) * noise1(u, seed) + (i / n) * noise1(u - lobes, seed);
    const k = 1 + low * wrap + fine * (hash(i, seed) * 2 - 1);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  return pts;
}

const fmt = (v) => (Math.round(v * 10) / 10).toString();
const sub = (pts) => 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z';

// clip-path value for one or more polygons; later polygons cut holes (even-odd).
export const clip = (...polys) => `path(evenodd, "${polys.map(sub).join(' ')}")`;

// SVG path data (for strokes and SVG shapes).
export const pathData = (pts, closed = true) =>
  'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + (closed ? 'Z' : '');

// Open jagged line from p0 to p1 (a scissor cut): wobbles to both sides by up to amp px.
export function jagged([x0, y0], [x1, y1], { seed = 1, amp = 10, wave = 90, spacing = 12 } = {}) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const n = Math.max(2, Math.round(len / spacing));
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const d = u * len;
    const edge = Math.min(1, u * 8, (1 - u) * 8); // pin both ends to the exact endpoints
    const off = amp * edge * (0.75 * noise1(d / wave, seed) + 0.25 * noise1(d / 11, seed + 3));
    pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
  }
  return pts;
}
