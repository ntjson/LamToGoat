// Review a chapter the way CLAUDE.md asks: render its draft, then a 2 fps contact sheet and a 360 px phone test.
//   node tools/review.mjs ch01 [--no-render] [--workers n] [--tail s] [--strip a:b ...]
// Writes out/review/<ch>.mp4, out/review/<ch>_contact.png (480 px tiles) and out/review/<ch>_phone.png
// (360 px tiles, the width of a phone held upright). Tiles are labelled "film time · +chapter time".
// Only this chapter is loaded (plus the one before it, leniently), so neighbours being rewritten can't break it.
// --workers caps the Chromium workers (parallel builders use 2). --tail s renders s seconds past the chapter's end
// (to see its exit). --strip a:b (chapter-local seconds, repeatable) writes out/review/<ch>_strip_<a>.png with
// every other frame of that window, for fast beats. Finally prints a text-size check (tools/textcheck.mjs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '../render.mjs';
import { ROOT } from './serve.mjs';
import { textcheck } from './textcheck.mjs';

const args = process.argv.slice(2);
const ch = args[0];
if (!ch || ch.startsWith('--')) {
  console.error('usage: node tools/review.mjs <chapter> [--no-render] [--workers n] [--tail s] [--strip a:b ...]');
  process.exit(2);
}
const val = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const strips = args.flatMap((a, i) => (a === '--strip' ? [args[i + 1]] : []));
const dir = path.join(ROOT, 'out/review');
const video = path.join(dir, `${ch}.mp4`);
if (!args.includes('--no-render')) {
  const opts = { chapters: [ch], out: path.relative(ROOT, video) };
  if (val('workers')) opts.workers = Number(val('workers'));
  if (val('tail')) opts.tail = Number(val('tail'));
  await render(opts);
}

const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
const start = timings.chapters.find((c) => c.id === ch).start;
const [num, den] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate',
  '-of', 'csv=p=0', video]).toString().trim().split('/').map(Number);
const fps = num / den;

// Exact frame indices (the fps filter resamples, so select by index instead).
const grab = (name, select) => {
  const frames = path.join(dir, name);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vf', `select=${select}`,
    '-fps_mode', 'passthrough', path.join(frames, 'f%04d.png')]);
  return fs.readdirSync(frames).filter((f) => f.endsWith('.png')).sort().map((f) => path.join(frames, f));
};
const sheet = (files, times, width, cols, out) => {
  const a = ['montage'];
  files.forEach((f, i) => a.push('-label', `${(start + times[i]).toFixed(2)} s · +${times[i].toFixed(2)}`, f));
  a.push('-tile', `${cols}x`, '-geometry', `${width}x+6+6`, '-background', '#555', '-fill', '#eee', '-pointsize', '14', out);
  execFileSync('magick', a);
};

const half = Math.round(fps / 2);
const files = grab(`${ch}_frames`, `not(mod(n\\,${half}))`);
const times = files.map((_, i) => (i * half) / fps);
sheet(files, times, 480, 5, path.join(dir, `${ch}_contact.png`));
sheet(files, times, 360, 5, path.join(dir, `${ch}_phone.png`));
console.log(`${files.length} frames -> out/review/${ch}_contact.png, out/review/${ch}_phone.png`);

for (const s of strips) {
  const [a, b] = s.split(':').map(Number);
  const n0 = Math.round(a * fps);
  const n1 = Math.round(b * fps);
  const fs2 = grab(`${ch}_strip`, `between(n\\,${n0}\\,${n1})*not(mod(n-${n0}\\,2))`);
  const out = path.join(dir, `${ch}_strip_${a.toFixed(2)}.png`);
  sheet(fs2, fs2.map((_, i) => (n0 + 2 * i) / fps), 384, 6, out);
  console.log(`${fs2.length} frames -> ${path.relative(ROOT, out)}`);
}

await textcheck(ch);
