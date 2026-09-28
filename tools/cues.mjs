// Event times for the sound: load the film (or some chapters) and save every chapter's cues() with the timeline.
//   node tools/cues.mjs [--chapters ch01,ch02] [--out out/sound/cues.json]
// Cues are in film seconds: { t, name, ch, ... } (a slide also has `land`). The sound tools read this file, so
// effects sit exactly on the frames the scenes compute, whatever the timeline does.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { pageQuery } from '../render.mjs';

const args = process.argv.slice(2);
const val = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const chapters = val('chapters')?.split(',');
const out = path.resolve(ROOT, val('out', 'out/sound/cues.json'));
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));

const server = await serve();
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--hide-scrollbars'] });
try {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html${chapters ? pageQuery(timeline, chapters) : ''}`);
  await page.evaluate(() => window.__ready);
  if (errors.length) throw new Error(errors.join('\n'));
  const cues = (await page.evaluate(() => window.__cues)).filter((c) => !chapters || chapters.includes(c.ch));
  cues.sort((a, b) => a.t - b.t);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const { bpm, beat, grid, end, chapters: chs } = timeline;
  fs.writeFileSync(out, JSON.stringify({ bpm, beat, grid, end, chapters: chs, selected: chapters ?? chs.map((c) => c.id), cues }, null, 1));
  console.log(`${cues.length} cues -> ${path.relative(ROOT, out)}`);
} finally {
  await browser.close();
  server.close();
}
