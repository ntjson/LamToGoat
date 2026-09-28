// Render a single still of a page.
//   node tools/still.mjs <page> <out.png> [--w 1920] [--h 1080] [--scale 1] [--t seconds]
// The page must expose window.__ready (a promise that resolves once fonts and images are in),
// and may expose window.seek(t) to paint frame t.
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const [page, out] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!page || !out) {
  console.error('usage: node tools/still.mjs <page> <out.png> [--w 1920] [--h 1080] [--scale 1] [--t s]');
  process.exit(2);
}
const w = Number(opt('w', 1920));
const h = Number(opt('h', 1080));
const scale = Number(opt('scale', 1));
const t = opt('t', null);

const server = await serve();
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
});
try {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`);
  });
  await p.goto(`http://127.0.0.1:${server.address().port}/${page.replace(/^\//, '')}`);
  await p.evaluate(() => window.__ready);
  if (t !== null) await p.evaluate((tt) => window.seek(tt), Number(t));
  await p.screenshot({ path: out });
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  console.log(`${out} (${w}x${h} @${scale}x)`);
} finally {
  await browser.close();
  server.close();
}
