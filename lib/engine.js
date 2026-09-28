// The film engine. One timeline (docs/vo_timings.json); one module per chapter (scenes/chNN.js).
//
// A chapter module exports { build(ctx), render(state, t, ctx), underlap? }.
//   build   runs once after fonts are loaded; creates DOM under ctx.root (below the paper grain) or ctx.top (above
//           it, for clean UI plates); returns the chapter's state. It may await images via ctx.image(src).
//   render  paints chapter-local time t (seconds from the chapter's start). It must be a pure function of t:
//           no timers, no requestAnimationFrame, no Math.random, no CSS transitions.
//   underlap  seconds at the start of this chapter during which the previous chapter keeps painting underneath
//           (for wipes that reveal or cover it).
// window.seek(t) paints film time t; window.__ready resolves when the first frame can be painted.
import { CHAPTERS } from '../scenes/index.js';

function makeCtx(ch, lines, root, top, images) {
  const local = (l) => ({ start: l.start - ch.start, end: l.end - ch.start, dur: l.dur, syllables: l.syllables });
  return {
    id: ch.id,
    start: ch.start,
    end: ch.end,
    dur: ch.end - ch.start,
    root,
    top,
    // Voice line in chapter-local seconds.
    line(id) {
      const l = lines[id];
      if (!l) throw new Error(`unknown line ${id}`);
      return local(l);
    },
    // Estimated time of syllable k (0-based) inside a line: proportional until word-level timings exist.
    syl(id, k) {
      const l = local(lines[id]);
      return l.start + (l.dur * k) / l.syllables;
    },
    image(src) {
      const img = new Image();
      img.src = src;
      const p = img.decode().then(() => img);
      images.push(p);
      return p;
    },
  };
}

async function init() {
  const timings = await (await fetch('/docs/vo_timings.json')).json();
  await Promise.all([...document.fonts].map((f) => f.load()));
  await document.fonts.ready;

  const stage = document.getElementById('stage');
  const lines = Object.fromEntries(timings.lines.map((l) => [l.id, l]));
  const images = [];
  const chapters = [];
  for (const ch of timings.chapters) {
    const root = document.createElement('div');
    root.className = 'chapter';
    root.dataset.id = ch.id;
    const top = document.createElement('div');
    top.className = 'top';
    top.dataset.id = ch.id;
    stage.insertBefore(root, document.getElementById('grain'));
    stage.appendChild(top);
    const mod = CHAPTERS[ch.id];
    const ctx = makeCtx(ch, lines, root, top, images);
    const state = mod ? await mod.build(ctx) : null;
    chapters.push({ ...ch, mod, root, top, ctx, state });
  }
  await Promise.all(images);

  // From here on, frames must be pure functions of t.
  const forbid = (name) => () => {
    throw new Error(`${name} is not allowed in render mode`);
  };
  Math.random = forbid('Math.random');
  window.requestAnimationFrame = forbid('requestAnimationFrame');
  window.setTimeout = forbid('setTimeout');
  window.setInterval = forbid('setInterval');

  const show = (c, on, z) => {
    c.root.style.visibility = on ? 'visible' : 'hidden';
    c.top.style.visibility = on ? 'visible' : 'hidden';
    c.root.style.zIndex = z;
    c.top.style.zIndex = 20 + z;
  };

  window.seek = (t) => {
    let i = chapters.findIndex((c) => t >= c.start && t < c.end);
    if (i < 0) i = t < chapters[0].start ? 0 : chapters.length - 1;
    const cur = chapters[i];
    const prev = chapters[i - 1];
    for (const c of chapters) show(c, false, 0);
    if (prev && cur.mod?.underlap && t - cur.start < cur.mod.underlap) {
      show(prev, true, 1);
      prev.mod?.render(prev.state, t - prev.start, prev.ctx);
    }
    show(cur, true, 2);
    cur.mod?.render(cur.state, t - cur.start, cur.ctx);
    return cur.id;
  };
  window.__film = {
    duration: timings.end,
    source: timings.source,
    chapters: chapters.map(({ id, start, end, mod }) => ({ id, start, end, built: !!mod })),
  };
  window.seek(0);
}

window.__ready = init();
