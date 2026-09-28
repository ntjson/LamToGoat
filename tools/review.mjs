// Review a chapter the way CLAUDE.md asks: render its draft, then a 2 fps contact sheet and a 360 px phone test.
//   node tools/review.mjs ch01 [--no-render]
// Writes out/review/<ch>.mp4, out/review/<ch>_contact.png (480 px tiles) and out/review/<ch>_phone.png
// (360 px tiles, the width of a phone held upright). Tiles are labelled with film time; labels are for review only.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '../render.mjs';
import { ROOT } from './serve.mjs';

const ch = process.argv[2];
if (!ch) {
  console.error('usage: node tools/review.mjs <chapter> [--no-render]');
  process.exit(2);
}
const dir = path.join(ROOT, 'out/review');
const video = path.join(dir, `${ch}.mp4`);
if (!process.argv.includes('--no-render')) await render({ chapters: [ch], out: path.relative(ROOT, video) });

const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/vo_timings.json'), 'utf8'));
const start = timings.chapters.find((c) => c.id === ch).start;
const frames = path.join(dir, `${ch}_frames`);
fs.rmSync(frames, { recursive: true, force: true });
fs.mkdirSync(frames, { recursive: true });
// One frame every 0.5 s of the chapter: exact frame indices 0, fps/2, fps, ... (the fps filter resamples, so no).
const [num, den] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate',
  '-of', 'csv=p=0', video]).toString().trim().split('/').map(Number);
const fps = num / den;
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vf', `select=not(mod(n\\,${Math.round(fps / 2)}))`,
  '-fps_mode', 'passthrough', path.join(frames, 'f%03d.png')]);
const files = fs.readdirSync(frames).filter((f) => f.endsWith('.png')).sort();

const sheet = (width, out) => {
  const args = ['montage'];
  files.forEach((f, i) => args.push('-label', `${(start + i * 0.5).toFixed(1)} s`, path.join(frames, f)));
  args.push('-tile', '5x', '-geometry', `${width}x+6+6`, '-background', '#555', '-fill', '#eee', '-pointsize', '14', out);
  execFileSync('magick', args);
};
sheet(480, path.join(dir, `${ch}_contact.png`));
sheet(360, path.join(dir, `${ch}_phone.png`));
console.log(`${files.length} frames -> out/review/${ch}_contact.png, out/review/${ch}_phone.png`);
