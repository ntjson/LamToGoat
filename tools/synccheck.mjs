// Does each hit the sound plays land on the frame where its event happens?
// 1. For every cue whose t is an appearance (a SLAM, a stamp, a caption strip, a pin, a bubble, a hard cut, a punched
//    hole), render the film around t at half-frame steps of the final 60 fps (t - 3/120,
//    t - 1/120, t + 1/120, t + 3/120) and count the pixels that change over each interval. The event is on its cue
//    when the picture changes across t (4 px or more at this scale) and changed less over the frame before: it
//    starts on t, not a frame earlier. (It may keep growing after t: a bubble scales up, a hole opens.)
// 2. A sync sheet per chapter (out/review/sync_<ch>.png): for each hit the music marks and each DISPLAY-type hit
//    (stab, alarm, chord, slam, caption, stamp, cut), the frame before t and the frame at t, to look at.
// Moves that travel (slides, bars, wipes, turns, landings) are not checked here: a spring starts from rest and its
// first arrival has no single frame that changes; their t and land come from the springs the scene renders with.
//   node tools/synccheck.mjs [chNN ...] [--scale 0.25] [--out out/sound/synccheck.json]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

const APPEAR = new Set(['complaint', 'bubble', 'caption', 'slam', 'stab', 'stamp', 'alarm', 'cut', 'pin', 'punch', 'bell']);
const SHEET = new Set(['stab', 'alarm', 'chord', 'slam', 'caption', 'stamp', 'cut']);
const D = 1 / 120; // half a frame at 60 fps

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const scale = Number(opt('scale', 0.25));
const out = path.resolve(ROOT, opt('out', 'out/sound/synccheck.json'));
const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const chapters = pos.length ? pos : timings.chapters.map((c) => c.id);
const tmp = path.join(ROOT, 'out/tmp/sync');
fs.mkdirSync(tmp, { recursive: true });

const server = await serve();
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const results = [];
const sheets = {};
try {
  await Promise.all(chapters.map(async (ch) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html${pageQuery(timings, [ch])}`);
    await page.evaluate(() => window.__ready);
    if (errors.length) throw new Error(errors.join('\n'));
    const diff = await context.newPage(); // a blank page that decodes screenshots and counts changed pixels
    const all = (await page.evaluate(() => window.__cues)).filter((q) => q.ch === ch);
    const shot = async (t) => {
      await page.evaluate((tt) => window.seek(tt), t);
      return page.screenshot({ type: 'png' });
    };
    sheets[ch] = [];
    for (const q of all.filter((x) => (APPEAR.has(x.name) && x.land === undefined) || SHEET.has(x.name))) {
      const frames = [await shot(q.t - 3 * D), await shot(q.t - D), await shot(q.t + D), await shot(q.t + 3 * D)];
      if (SHEET.has(q.name)) {
        const k = sheets[ch].length;
        const a = path.join(tmp, `${ch}_${k}_a.png`);
        const b = path.join(tmp, `${ch}_${k}_b.png`);
        fs.writeFileSync(a, frames[1]);
        fs.writeFileSync(b, frames[2]);
        sheets[ch].push({ q, a, b });
      }
      if (!APPEAR.has(q.name) || q.land !== undefined) continue;
      const [pre, evt, post] = await diff.evaluate(async (pngs) => {
        const pixels = async (b64) => {
          const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
          const cv = new OffscreenCanvas(bmp.width, bmp.height);
          const g = cv.getContext('2d');
          g.drawImage(bmp, 0, 0);
          return g.getImageData(0, 0, bmp.width, bmp.height).data;
        };
        const [a, b, c, d] = await Promise.all(pngs.map(pixels));
        const changed = (x, y) => {
          let n = 0;
          for (let i = 0; i < x.length; i += 4) {
            if (Math.abs(x[i] - y[i]) > 24 || Math.abs(x[i + 1] - y[i + 1]) > 24 || Math.abs(x[i + 2] - y[i + 2]) > 24) n++;
          }
          return n;
        };
        return [changed(a, b), changed(b, c), changed(c, d)];
      }, frames.map((f) => f.toString('base64')));
      const ok = evt >= 4 && evt >= pre;
      results.push({ ch, name: q.name, t: Number(q.t.toFixed(4)), pre, evt, post, ok });
    }
    await context.close();
  }));
} finally {
  await browser.close();
  server.close();
}
results.sort((a, b) => a.t - b.t);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(results, null, 1));
const px = (n) => Math.round(n / (scale * scale)); // in 1080p pixels
for (const ch of chapters) {
  const r = results.filter((x) => x.ch === ch);
  const bad = r.filter((x) => !x.ok);
  console.log(`${ch}: ${r.length - bad.length}/${r.length} appearances start on their cue`
    + (bad.length ? `; check: ${bad.map((x) => `${x.name}@${x.t.toFixed(3)} (${px(x.pre)}/${px(x.evt)}/${px(x.post)} px)`).join(', ')}` : ''));
  if (sheets[ch]?.length) {
    const m = ['montage'];
    for (const { q, a, b } of sheets[ch]) {
      m.push('-label', `${q.name} ${q.t.toFixed(3)} s: frame before`, a, '-label', `${q.name}: frame at the cue`, b);
    }
    const file = path.join(ROOT, 'out/review', `sync_${ch}.png`);
    m.push('-tile', '4x', '-geometry', '+6+6', '-background', '#555', '-fill', '#eee', '-pointsize', '13', file);
    execFileSync('magick', m);
  }
}
console.log(`${path.relative(ROOT, out)}; sheets in out/review/sync_<ch>.png`);
