// Check a chapter handoff: render 2 s either side of chNN's start with chNN and the chapter before it loaded,
// then a strip of every other frame around the cut.
//   node tools/boundary.mjs ch03 [--before 2] [--after 2] [--workers 2]
// Writes out/review/boundary_<ch>.mp4 and out/review/boundary_<ch>.png (tiles labelled with film time).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '../render.mjs';
import { ROOT } from './serve.mjs';

const args = process.argv.slice(2);
const id = args[0];
const val = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
const order = timings.chapters.map((c) => c.id);
const k = order.indexOf(id);
if (k < 1) throw new Error(`usage: node tools/boundary.mjs <chNN> (ch02-ch11)`);
const cut = timings.chapters[k].start;
const from = Math.max(0, cut - val('before', 2));
const to = Math.min(timings.end, cut + val('after', 2));
const dir = path.join(ROOT, 'out/review');
const video = path.join(dir, `boundary_${id}.mp4`);
await render({ from, to, load: [order[k - 1], id], out: path.relative(ROOT, video), workers: val('workers', 2) });
const frames = path.join(dir, `boundary_${id}_frames`);
fs.rmSync(frames, { recursive: true, force: true });
fs.mkdirSync(frames, { recursive: true });
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vf', 'select=not(mod(n\\,3))', '-fps_mode', 'passthrough',
  path.join(frames, 'f%04d.png')]);
const files = fs.readdirSync(frames).filter((f) => f.endsWith('.png')).sort();
const a = ['montage'];
files.forEach((f, i) => a.push('-label', `${(from + (i * 3) / 30).toFixed(2)} s`, path.join(frames, f)));
a.push('-tile', '8x', '-geometry', '320x+4+4', '-background', '#555', '-fill', '#eee', '-pointsize', '13', path.join(dir, `boundary_${id}.png`));
execFileSync('magick', a);
console.log(`cut at ${cut.toFixed(3)} s; ${files.length} frames -> out/review/boundary_${id}.png`);
