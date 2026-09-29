// Face check for a chapter with team portraits (ch10): every frame, is any text covered by a face, is any face
// covered by another, and how tall is each face in frame?
//   node tools/facecheck.mjs ch10 [--step 0.0333] [--tail 1.2]
// Faces are the elements the scene marks with data-face. A text is hit-tested on a 12 x 3 grid over its glyph boxes
// (Range rects: the font's ascent to descent, whatever the line height); a face on top at any point covers it.
// A face is covered where another face paints on top inside its cut (a 9 x 12 grid over its box, inside its outline).
// Height in frame: the face's box clipped to the frame, in stage px, for frames where it is at rest (not sliding),
// against the 300 px floor; a face's box is RIM px taller than its photo, so the floor applies to the box minus that.
// Prints each problem with its frames; exit code 1 if a text is covered while nothing moves, or a face at rest is
// under the floor.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

const args = process.argv.slice(2);
const val = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const id = args[0];
const step = val('step', 1 / 30);
const tail = val('tail', 1.2);
const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
const team = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/team.json'), 'utf8'));
const ch = timings.chapters.find((c) => c.id === id);
const server = await serve();
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--font-render-hinting=none', '--hide-scrollbars'] });
let bad = 0;
try {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html${pageQuery(timings, [id], { next: true })}`);
  await page.evaluate(() => window.__ready);
  const n = Math.ceil((ch.end - ch.start + tail) / step);
  const log = { text: new Map(), face: new Map() };
  const tall = new Map(); // face -> min height at rest
  let prev = null;
  for (let k = 0; k < n; k++) {
    const t = ch.start + k * step;
    const r = await page.evaluate(({ t, cid, outlines }) => {
      window.seek(t);
      const root = document.querySelector(`.chapter[data-id="${cid}"]`);
      const faces = [...root.querySelectorAll('[data-face]')];
      const faceOf = (e) => e?.closest?.('[data-face]');
      const paints = (el) => {
        if (el instanceof SVGElement) return el.tagName.toLowerCase() !== 'svg';
        if (el.tagName === 'IMG') return true;
        if ([...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return true;
        const cs = getComputedStyle(el);
        return cs.backgroundImage !== 'none' || !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs.backgroundColor);
      };
      const top = (x, y) => document.elementsFromPoint(x, y).find(paints);
      const out = { text: [], face: [], boxes: [] };
      for (const e of root.querySelectorAll('.disp, .label, .mono')) {
        if (getComputedStyle(e).visibility !== 'visible') continue;
        const range = document.createRange();
        range.selectNodeContents(e);
        let hit = 0;
        let pts = 0;
        for (const rc of range.getClientRects()) {
          for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 3; j++) {
              const x = rc.left + ((i + 0.5) / 12) * rc.width;
              const y = rc.top + ((j + 0.5) / 3) * rc.height;
              if (x < 0 || y < 0 || x >= 1920 || y >= 1080) continue;
              pts++;
              if (faceOf(top(x, y))) hit++;
            }
          }
        }
        if (hit) out.text.push({ text: e.textContent.slice(0, 40), hit, pts });
      }
      for (const f of faces) {
        if (getComputedStyle(f).visibility !== 'visible') continue;
        const i = Number(f.dataset.face);
        const b = f.getBoundingClientRect();
        out.boxes.push({ i, x: b.left, y: b.top, w: b.width, h: b.height, vis: Math.max(0, Math.min(b.bottom, 1080) - Math.max(b.top, 0)) });
        // points inside the cut outline (scaled from box px to screen px)
        const o = outlines[i];
        const sx = b.width / o.w;
        const sy = b.height / o.h;
        const inside = (px, py) => {
          let c = false;
          for (let a = 0, z = o.pts.length - 1; a < o.pts.length; z = a++) {
            const [xa, ya] = o.pts[a];
            const [xz, yz] = o.pts[z];
            if ((ya > py) !== (yz > py) && px < ((xz - xa) * (py - ya)) / (yz - ya) + xa) c = !c;
          }
          return c;
        };
        let cov = 0;
        for (let u = 0; u < 9; u++) {
          for (let v = 0; v < 12; v++) {
            const px = ((u + 0.5) / 9) * o.w;
            const py = ((v + 0.5) / 12) * o.h;
            if (!inside(px, py)) continue;
            const x = b.left + px * sx;
            const y = b.top + py * sy;
            if (x < 0 || y < 0 || x >= 1920 || y >= 1080) continue;
            const other = faceOf(top(x, y));
            if (other && other !== f) cov++;
          }
        }
        if (cov) out.face.push({ i, cov });
      }
      return out;
    }, { t, cid: id, outlines: team.members.map((m) => ({ w: m.w, h: m.h, pts: m.outline })) });
    const moving = prev && r.boxes.some((b) => {
      const p = prev.find((q) => q.i === b.i);
      return !p || Math.hypot(p.x - b.x, p.y - b.y) > 0.5;
    });
    prev = r.boxes;
    for (const x of r.text) {
      const key = `${x.text}${moving ? ' (while moving)' : ''}`;
      if (!log.text.has(key)) log.text.set(key, []);
      log.text.get(key).push(t - ch.start);
    }
    for (const x of r.face) {
      const key = `face ${x.i}${moving ? ' (while moving)' : ''}`;
      if (!log.face.has(key)) log.face.set(key, []);
      log.face.get(key).push(t - ch.start);
    }
    if (!moving) {
      for (const b of r.boxes) tall.set(b.i, Math.min(tall.get(b.i) ?? Infinity, b.vis - team.rim));
    }
  }
  const span = (ts) => `${ts.length} frames, +${ts[0].toFixed(2)} to +${ts.at(-1).toFixed(2)}`;
  for (const [k, ts] of log.text) {
    console.log(`TEXT COVERED by a face: "${k}" ${span(ts)}`);
    if (!k.includes('moving')) bad++;
  }
  for (const [k, ts] of log.face) console.log(`FACE COVERED by another face: ${k} ${span(ts)}`);
  for (const [i, h] of [...tall].sort((a, b) => a[0] - b[0])) {
    const ok = h >= 300;
    if (!ok) bad++;
    console.log(`${ok ? 'ok   ' : 'SHORT'} face ${i}: at least ${h.toFixed(1)} px of photo in frame at rest (box minus the ${team.rim} px rim)`);
  }
  console.log(`facecheck ${id}: ${bad ? `${bad} problem(s)` : 'ok'}`);
} finally {
  await browser.close();
  server.close();
}
process.exitCode = bad ? 1 : 0;
