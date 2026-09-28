// Text-size check for one chapter: samples the chapter every 0.25 s and measures every visible DOM text on screen
// (font size x the transform scale actually applied). Nothing may stay under 28 px at 1080p (CLAUDE.md).
//   node tools/textcheck.mjs ch03
// FAIL: a text that is never 28 px or larger while visible. WARN: a text under 28 px for more than 0.5 s in a row
// (a transient spring, like a slam from 0.9, is fine). Text inside screenshots is pixels, not DOM, so it isn't seen
// here; docs/crops.json holds its measured sizes.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

export async function textcheck(id, { step = 0.25 } = {}) {
  const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/vo_timings.json'), 'utf8'));
  const ch = timings.chapters.find((c) => c.id === id);
  const server = await serve();
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--font-render-hinting=none', '--hide-scrollbars'] });
  const seen = new Map(); // text -> { max, runs: longest run under 28 px in s, first }
  try {
    const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html${pageQuery(timings, [id])}`);
    await page.evaluate(() => window.__ready);
    const run = new Map();
    for (let t = 0; t < ch.end - ch.start; t += step) {
      const found = await page.evaluate(([tt, cid]) => {
        window.seek(tt); // film time
        const out = [];
        for (const layer of document.querySelectorAll(`[data-id="${cid}"]`)) {
          const walk = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            const s = n.textContent.trim();
            if (!s || /^[0-9]$/.test(s)) continue; // odometer digit cells are measured through their slots' parent
            const e = n.parentElement;
            const cs = getComputedStyle(e);
            if (cs.visibility !== 'visible' || !e.offsetHeight) continue;
            const r = e.getBoundingClientRect();
            if (r.right < 0 || r.left > 1920 || r.bottom < 0 || r.top > 1080) continue;
            const scale = r.height / e.offsetHeight;
            out.push([s.slice(0, 48), parseFloat(cs.fontSize) * scale]);
          }
        }
        return out;
      }, [ch.start + t, id]);
      const now = new Set();
      for (const [s, px] of found) {
        const v = seen.get(s) ?? { max: 0, run: 0, first: t };
        v.max = Math.max(v.max, px);
        if (px < 28) {
          now.add(s);
          run.set(s, (run.get(s) ?? 0) + step);
          v.run = Math.max(v.run, run.get(s));
        }
        seen.set(s, v);
      }
      for (const s of run.keys()) if (!now.has(s)) run.delete(s);
    }
  } finally {
    await browser.close();
    server.close();
  }
  let fails = 0;
  for (const [s, v] of seen) {
    if (v.max < 28) {
      fails++;
      console.log(`FAIL text "${s}" never reaches 28 px (max ${v.max.toFixed(1)} px, first seen at +${v.first.toFixed(2)} s)`);
    } else if (v.run > 0.5) console.log(`WARN text "${s}" under 28 px for ${v.run.toFixed(2)} s in a row`);
  }
  const small = [...seen.values()].map((v) => v.max);
  console.log(`textcheck ${id}: ${seen.size} texts, ${fails} below 28 px${small.length ? `, smallest max ${Math.min(...small).toFixed(1)} px` : ''}`);
  return fails;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fails = await textcheck(process.argv[2]);
  process.exitCode = fails ? 1 : 0;
}
