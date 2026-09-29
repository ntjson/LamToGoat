// Reading check: how long is each text actually readable on screen, and is that enough?
//   node tools/readcheck.mjs ch02 [--tail s] [--step 0.0333] [--json out.json] [--timeline docs/other.json]
// Samples the chapter (plus --tail s into the next chapter, default 1.2) and, per text element, marks a frame
// readable when the element is visible, at 90-110 % of its layout size (not mid-flip or mid-slam), at least 95 %
// inside the frame, and not covered by paper (hit-tested at three points across it). A text's readable time is its
// longest unbroken readable run. Its need is the reading model's time for that text alone, at the film's fixed pace
// (tools/timeline.py: FIX + words / rate by kind, times PACE). Odometer digits and single characters are skipped.
// Prints every text whose readable time is under its need.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

// Mirrors tools/timeline.py (the model the timeline is built from).
const PACE = 0.82;
const FIX = 0.3;
const WPS = { disp: 4.0, label: 3.3, cap: 3.0, mono: 2.5 };
const NUM = 1.5;
const KNOWN = 0.3;
// Texts the viewer has read before (onscreen.json items marked "known") need only KNOWN s: match by their start.
const known = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/onscreen.json'), 'utf8')).lines)
  .flatMap((l) => l.items.filter(([, , how]) => how === 'known').map(([t]) => t.replace(/ \/ /g, ' ').replace(/…$/, '').trim()));
const words = (s) => s.replace(/·/g, ' ').split(/\s+/).filter((w) => w && w !== '/')
  .reduce((n, w) => n + (/\d/.test(w) ? NUM : 1), 0);

export async function readcheck(id, { tail = 1.2, step = 1 / 30, timeline = 'docs/timeline.json' } = {}) {
  const timings = JSON.parse(fs.readFileSync(path.join(ROOT, timeline), 'utf8'));
  const ch = timings.chapters.find((c) => c.id === id);
  const server = await serve();
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--font-render-hinting=none', '--hide-scrollbars'] });
  try {
    const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    const tq = timeline === 'docs/timeline.json' ? '' : `&timeline=/${timeline}`;
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html${pageQuery(timings, [id], { next: true })}${tq}`);
    await page.evaluate(() => window.__ready);
    // Texts are grouped by their content: a chapter may paint one text as several copies (the two halves of a
    // scissor cut, a whole sheet and its pieces); a frame is readable if the copies together pass the test.
    const texts = await page.evaluate((cid) => {
      const groups = new Map();
      for (const layer of document.querySelectorAll(`[data-id="${cid}"]`)) {
        for (const e of layer.querySelectorAll('*')) {
          if (e.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
          const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
          if (own.replace(/\s/g, '').length < 2) continue; // odometer digits, lone punctuation
          const key = e.textContent.replace(/\s+/g, ' ').trim();
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(e);
        }
      }
      window.__rc = [...groups.values()];
      return [...groups.entries()].map(([text, els]) => {
        const e = els[0];
        const cls = e.closest('.disp') ? 'disp' : e.closest('.mono') ? 'mono' : 'label';
        const size = parseFloat(getComputedStyle(e).fontSize);
        return { text, copies: els.length, kind: cls === 'label' && size < 40 ? 'cap' : cls };
      });
    }, id);
    const n = Math.ceil((ch.end - ch.start + tail) / step);
    const readable = texts.map(() => new Uint8Array(n));
    for (let i = 0; i < n; i++) {
      const flags = await page.evaluate((t) => {
        window.seek(t);
        // The topmost element that paints at a point: layer containers and transparent groups are skipped.
        const paints = (el) => {
          if (el instanceof SVGElement) return el.tagName.toLowerCase() !== 'svg';
          if (el.tagName === 'IMG') return true;
          if ([...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return true;
          const cs = getComputedStyle(el);
          return cs.backgroundImage !== 'none' || !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs.backgroundColor);
        };
        return window.__rc.map((els) => {
          const inGroup = (el) => els.some((e) => e === el || e.contains(el));
          for (const e of els) {
            if (getComputedStyle(e).visibility !== 'visible' || !e.offsetWidth || !e.offsetHeight) continue;
            const r = e.getBoundingClientRect();
            // Scale of the element on screen, independent of rotation: a w x h box scaled by s and rotated by θ has
            // the bounding box W = s(w cosθ + h sinθ), H = s(w sinθ + h cosθ); solve for s. A flip (scaleX only) or
            // a slam shows up as s far from 1; a hand-placed tilt doesn't.
            const w = e.offsetWidth;
            const h = e.offsetHeight;
            const d = Math.abs(w * w - h * h);
            const sc = d > 0.05 * w * w
              ? Math.hypot(r.width * w - r.height * h, r.height * w - r.width * h) / d
              : Math.sqrt((r.width * r.height) / (w * h));
            if (sc < 0.9 || sc > 1.1) continue;
            const ix = Math.max(0, Math.min(r.right, 1920) - Math.max(r.left, 0));
            const iy = Math.max(0, Math.min(r.bottom, 1080) - Math.max(r.top, 0));
            if (ix * iy < 0.95 * r.width * r.height) continue;
            let hits = 0;
            for (const f of [0.2, 0.5, 0.8]) {
              const top = document.elementsFromPoint(r.left + f * r.width, r.top + r.height / 2).find(paints);
              if (top && inGroup(top)) hits++;
            }
            if (hits >= 2) return 1;
          }
          return 0;
        });
      }, ch.start + i * step);
      flags.forEach((f, k) => { readable[k][i] = f; });
    }
    const out = texts.map((tx, k) => {
      let best = 0;
      let run = 0;
      let first = -1;
      for (let i = 0; i < n; i++) {
        if (readable[k][i]) {
          run++;
          if (first < 0) first = i;
          best = Math.max(best, run);
        } else run = 0;
      }
      const isKnown = known.some((k) => tx.text.startsWith(k));
      const need = PACE * (isKnown ? KNOWN : FIX + words(tx.text) / WPS[tx.kind]);
      return { ...tx, need, readable: best * step, from: first < 0 ? null : first * step };
    });
    return out;
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const val = (k, d) => {
    const i = args.indexOf(`--${k}`);
    return i >= 0 ? args[i + 1] : d;
  };
  const id = args[0];
  const res = await readcheck(id, { tail: Number(val('tail', 1.2)), step: Number(val('step', 1 / 30)), timeline: val('timeline', 'docs/timeline.json') });
  if (val('json')) fs.writeFileSync(val('json'), JSON.stringify(res, null, 1));
  const short = res.filter((r) => r.readable + 1e-9 < r.need);
  for (const r of res.filter((r) => r.readable > 0).sort((a, b) => (a.readable - a.need) - (b.readable - b.need)).slice(0, 8)) {
    console.log(`${r.readable + 1e-9 < r.need ? 'SHORT' : 'ok   '} ${r.readable.toFixed(2)} s readable, needs ${r.need.toFixed(2)} s (${r.kind}) "${r.text.slice(0, 60)}"`);
  }
  console.log(`readcheck ${id}: ${res.length} texts, ${short.length} readable for less than their need`);
  process.exitCode = short.length ? 1 : 0;
}
