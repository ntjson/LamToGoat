// Full-resolution stills at chosen times, from one browser session.
//   node tools/frames.mjs <chNN|film> <outdir> <t> [t ...] [--scale 1]
// With a chapter id, times are chapter-local and the page loads only that chapter (plus its neighbours, as
// render.mjs does); with "film", times are film seconds and every chapter loads. Writes <outdir>/<id>_<t>.png.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [id, outdir, ...times] = pos;
if (!id || !outdir || !times.length) {
  console.error('usage: node tools/frames.mjs <chNN|film> <outdir> <t> [t ...] [--scale 1]');
  process.exit(2);
}
const scale = Number(opt('scale', 1));
const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
const ch = id === 'film' ? null : timings.chapters.find((c) => c.id === id);
if (id !== 'film' && !ch) throw new Error(`no chapter ${id}`);
fs.mkdirSync(outdir, { recursive: true });

const server = await serve();
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
});
try {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const q = ch ? pageQuery(timings, [id]) : '';
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html${q}`);
  await page.evaluate(() => window.__ready);
  for (const s of times) {
    const t = Number(s) + (ch ? ch.start : 0);
    await page.evaluate((tt) => window.seek(tt), t);
    if (errors.length) throw new Error(errors.join('\n'));
    const file = path.join(outdir, `${id}_${Number(s).toFixed(2)}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
} finally {
  await browser.close();
  server.close();
}