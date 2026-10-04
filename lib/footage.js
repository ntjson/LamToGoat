// Recordings of the real app (tools/record_app.mjs; CLAUDE.md, "Truth"): a screen that plays a recording's frames, a
// time remap from film time to recording time (speed ramps), and its inverse for placing events. A recording counts
// as real UI: a scene may crop, mask, scale and time-remap it, never redraw or retouch it. The device frame, the hand
// and the cursor around it are overlays (lib/props.js).
//
// Every frame is an <img> fully fetched before the chapter's first frame but decoded only when it is shown
// (decoding = 'sync': Chromium decodes it while painting the frame that shows it), so a chapter can hold hundreds of
// DPR 3 frames without keeping them all decoded.
import { el } from './paper.js';

// screen(parent, rec): a box of the recording's viewport size (its CSS px), holding one <img> per frame. Returns
// { el, n, at(rt) }: at(rt) shows the last frame captured at or before recording time rt (the first frame before
// it) and returns that frame's index. Call it on every render.
export async function screen(parent, rec) {
  const [w, h] = rec.viewport;
  const box = el(parent, '', { width: `${w}px`, height: `${h}px`, overflow: 'hidden' });
  const loads = [];
  const imgs = rec.frames.map(([, file]) => {
    const img = document.createElement('img');
    img.decoding = 'sync';
    img.className = 'abs';
    Object.assign(img.style, { width: `${w}px`, height: `${h}px`, visibility: 'hidden' });
    loads.push(new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error(`recording frame ${rec.base}${file} did not load`));
    }));
    img.src = rec.base + file;
    box.appendChild(img);
    return img;
  });
  await Promise.all(loads);
  const ts = rec.frames.map(([t]) => t);
  const index = (rt) => {
    let lo = 0;
    let hi = ts.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (ts[m] <= rt + 1e-9) lo = m;
      else hi = m - 1;
    }
    return lo;
  };
  return {
    el: box,
    n: imgs.length,
    index,
    at(rt) {
      const k = index(rt);
      imgs.forEach((img, i) => { img.style.visibility = i === k ? 'inherit' : 'hidden'; });
      return k;
    },
  };
}

// remap(keys): film time -> recording time, piecewise linear through keys [[film, rec], ...], both strictly
// increasing; it holds the first and last recording times outside the keys. Between two keys the recording plays at
// (rec1 - rec0) / (film1 - film0) times real speed.
export function remap(keys) {
  check(keys);
  return (t) => lerpKeys(keys, t, 0, 1);
}

// unmap(keys): the inverse, recording time -> film time (to place a logged event on the film's timeline).
export function unmap(keys) {
  check(keys);
  return (rt) => lerpKeys(keys, rt, 1, 0);
}

function check(keys) {
  for (let i = 1; i < keys.length; i++) {
    if (!(keys[i][0] > keys[i - 1][0]) || !(keys[i][1] > keys[i - 1][1])) {
      throw new Error(`time remap keys must increase: ${JSON.stringify(keys[i - 1])} -> ${JSON.stringify(keys[i])}`);
    }
  }
}

function lerpKeys(keys, v, a, b) {
  if (v <= keys[0][a]) return keys[0][b];
  for (let i = 1; i < keys.length; i++) {
    if (v <= keys[i][a]) {
      const u = (v - keys[i - 1][a]) / (keys[i][a] - keys[i - 1][a]);
      return keys[i - 1][b] + u * (keys[i][b] - keys[i - 1][b]);
    }
  }
  return keys[keys.length - 1][b];
}

// The end of the burst of frames that follows recording time rt: the time of the last frame before a gap of more
// than `still` seconds (the screen has settled; a transition or a ripple is over). Never later than `limit`.
export function settled(rec, rt, { still = 0.12, limit = Infinity } = {}) {
  const ts = rec.frames.map(([t]) => t).filter((t) => t >= rt && t <= limit);
  for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > still) return ts[i - 1];
  return ts.length ? ts[ts.length - 1] : rt;
}

// Position of the logged cursor at recording time rt (linear between logged points; held before and after).
export function cursorAt(path, rt) {
  if (!path.length) return null;
  if (rt <= path[0][0]) return [path[0][1], path[0][2]];
  for (let i = 1; i < path.length; i++) {
    if (rt <= path[i][0]) {
      const [t0, x0, y0] = path[i - 1];
      const [t1, x1, y1] = path[i];
      const u = t1 > t0 ? (rt - t0) / (t1 - t0) : 1;
      return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
    }
  }
  const last = path[path.length - 1];
  return [last[1], last[2]];
}
