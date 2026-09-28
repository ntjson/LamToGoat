// Render the film (or part of it) to H.264.
//   node render.mjs [--from s] [--to s] [--chapters ch01,ch02] [--tail s] [--fps 30] [--scale 0.5]
//                   [--out out/draft.mp4] [--workers n] [--crf n] [--preset p] [--final]
// Drafts default to 960x540 at 30 fps. --final means 1920x1080, 60 fps, CRF 16, preset slow.
// --chapters renders only those chapters' time range and loads only them (plus the chapter before each, for
// transitions; see pageQuery), so a chapter that is mid-edit elsewhere can't break the render. --tail extends
// the range past the last chapter's end (to see a chapter's exit). --load ch02,ch03 loads only those chapters
// without changing the range (for boundary checks).
// The range is split at chapter boundaries (long chapters into chunks), rendered by parallel Chromium workers
// that each pipe frames into their own ffmpeg, then joined with the ffmpeg concat demuxer.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, ROOT } from './tools/serve.mjs';

const CHUNK = 2; // seconds: longest segment one worker renders in one go

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));
  return { p, done };
}

// Page query that loads only `ids` (errors in them fail the render) plus the chapter before each one, loaded
// leniently (an error there just leaves it black), because transitions paint the previous chapter too.
// With next = true the chapter after each one loads leniently too (to see an exit reveal what comes next).
export function pageQuery(timings, ids, { next = false } = {}) {
  const order = timings.chapters.map((c) => c.id);
  const near = ids.flatMap((id) => [order[order.indexOf(id) - 1], next ? order[order.indexOf(id) + 1] : undefined]);
  const soft = [...new Set(near.filter((id) => id && !ids.includes(id)))];
  return `?only=${ids.join(',')}` + (soft.length ? `&soft=${soft.join(',')}` : '');
}

function plan(timings, { from, to, fps }) {
  // First and last frame at or after the range's ends, so a chapter's draft starts on its own first frame.
  const n0 = Math.ceil(from * fps - 1e-6);
  const n1 = Math.ceil(to * fps - 1e-6);
  const cuts = new Set([n0, n1]);
  for (const c of timings.chapters) {
    const n = Math.round(c.start * fps);
    if (n > n0 && n < n1) cuts.add(n);
  }
  const bounds = [...cuts].sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    for (let a = bounds[i]; a < bounds[i + 1]; a += Math.round(CHUNK * fps)) {
      segs.push({ a, b: Math.min(bounds[i + 1], a + Math.round(CHUNK * fps)) });
    }
  }
  return segs;
}

export async function render(opts) {
  const o = { fps: 30, scale: 0.5, crf: 18, preset: 'veryfast', out: 'out/draft.mp4', ...opts };
  if (o.final) Object.assign(o, { fps: 60, scale: 1, crf: 16, preset: 'slow' }, opts.fpsOverride ? { fps: opts.fpsOverride } : {});
  const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/timeline.json'), 'utf8'));
  if (o.chapters) {
    const sel = timings.chapters.filter((c) => o.chapters.includes(c.id));
    if (!sel.length) throw new Error(`no such chapters: ${o.chapters}`);
    o.from = Math.min(...sel.map((c) => c.start));
    o.to = Math.min(timings.end, Math.max(...sel.map((c) => c.end)) + (o.tail ?? 0));
  }
  o.from ??= 0;
  o.to ??= timings.end;
  const segs = plan(timings, o);
  const workers = Math.max(1, Math.min(o.workers ?? Math.max(1, Math.floor(os.cpus().length / 2)), segs.length));
  const out = path.resolve(ROOT, o.out);
  const segDir = `${out}.segments`;
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });
  const w = Math.round(1920 * o.scale);
  const h = Math.round(1080 * o.scale);
  console.log(`render ${o.from.toFixed(3)}-${o.to.toFixed(3)} s, ${w}x${h} @${o.fps} fps, ${segs.length} segments, ${workers} workers`);

  const server = await serve();
  const load = o.load ?? o.chapters;
  const url = `http://127.0.0.1:${server.address().port}/index.html${load ? pageQuery(timings, load, { next: !!o.tail }) : ''}`;
  const queue = segs.map((s, i) => ({ ...s, i }));
  const t0 = Date.now();
  let frames = 0;
  const worker = async () => {
    const browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
    });
    try {
      const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: o.scale })).newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(url);
      await page.evaluate(() => window.__ready);
      for (let job = queue.shift(); job; job = queue.shift()) {
        const file = path.join(segDir, `${String(job.i).padStart(4, '0')}.mp4`);
        const enc = ffmpeg(['-y', '-f', 'image2pipe', '-framerate', String(o.fps), '-c:v', 'png', '-i', '-',
          '-c:v', 'libx264', '-preset', o.preset, '-crf', String(o.crf), '-pix_fmt', 'yuv420p',
          '-r', String(o.fps), '-movflags', '+faststart', file]);
        for (let n = job.a; n < job.b; n++) {
          await page.evaluate((t) => window.seek(t), n / o.fps);
          if (errors.length) throw new Error(errors.join('\n'));
          const png = await page.screenshot({ type: 'png' });
          if (!enc.p.stdin.write(png)) await new Promise((r) => enc.p.stdin.once('drain', r));
          frames++;
        }
        enc.p.stdin.end();
        await enc.done;
      }
    } finally {
      await browser.close();
    }
  };
  try {
    await Promise.all(Array.from({ length: workers }, worker));
  } finally {
    server.close();
  }
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.map((_, i) => `file '${String(i).padStart(4, '0')}.mp4'`).join('\n') + '\n');
  await ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]).done;
  fs.rmSync(segDir, { recursive: true, force: true });
  const secs = (Date.now() - t0) / 1000;
  console.log(`${path.relative(ROOT, out)}: ${frames} frames in ${secs.toFixed(1)} s (${(frames / secs).toFixed(1)} fps)`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const get = (k) => {
    const i = a.indexOf(`--${k}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const num = (k) => (get(k) !== undefined ? Number(get(k)) : undefined);
  const opts = {
    from: num('from'), to: num('to'), scale: num('scale'), crf: num('crf'), workers: num('workers'), tail: num('tail'),
    preset: get('preset'), out: get('out'), final: a.includes('--final'),
    chapters: get('chapters')?.split(','), load: get('load')?.split(','),
  };
  if (num('fps') !== undefined) opts[a.includes('--final') ? 'fpsOverride' : 'fps'] = num('fps');
  for (const k of Object.keys(opts)) if (opts[k] === undefined) delete opts[k];
  render(opts).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
