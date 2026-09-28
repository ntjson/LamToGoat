// The film engine. One timeline (docs/timeline.json, built by tools/timeline.py: reading time on the music's beat
// grid, since the film has no voice-over); one module per chapter (scenes/chNN.js).
//
// A chapter module's default export is { build(ctx), render(state, t, ctx), underlap?, exit? }.
//   build   runs once after fonts are loaded; creates DOM under ctx.root (below the paper grain) or ctx.top (above
//           it, for clean UI plates); returns the chapter's state. It may await images via ctx.image(src).
//   render  paints chapter-local time t (seconds from the chapter's start). It must be a pure function of t:
//           no timers, no requestAnimationFrame, no Math.random, no CSS transitions.
//   underlap  seconds at the start of this chapter during which the previous chapter keeps painting underneath
//           (for wipes that reveal or cover it). The previous chapter is rendered at t past its end.
//   exit    seconds at the start of the NEXT chapter during which this chapter keeps painting on top of it, at t past
//           its own end, so it can animate its own paper out of frame (doors, flips, slides) and reveal the next one.
// Every chapter listed in the timeline is loaded from scenes/<id>.js; a missing file paints a black frame.
// index.html?only=ch03,ch04&soft=ch02 loads only those chapters (errors in "soft" ones leave them black), so a
// chapter can be rendered while its neighbours are being rewritten.
// window.seek(t) paints film time t; window.__ready resolves when the first frame can be painted.

function makeCtx(ch, lines, crops, root, top, images, timing) {
  const local = (l) => ({ start: l.start - ch.start, end: l.end - ch.start, dur: l.dur, syllables: l.syllables });
  // The beat grid starts at film time 0; snapping happens in film time.
  const grid = timing.grid;
  const snapFilm = (t, g = grid) => (g ? Math.round(t / g + 1e-9) * g : t);
  return {
    id: ch.id,
    start: ch.start,
    end: ch.end,
    dur: ch.end - ch.start,
    root,
    top,
    bpm: timing.bpm,
    beat: timing.beat, // seconds per beat
    grid, // seconds per 16th note
    // Story beat (the ids of the old voice lines) in chapter-local seconds; starts and ends sit on the grid.
    line(id) {
      const l = lines[id];
      if (!l) throw new Error(`unknown line ${id}`);
      return local(l);
    },
    // Time of subdivision k (0-based) of a beat: its syllable k in the old voice line, spread evenly over the beat
    // and snapped to the 16th-note grid, so a hit placed here lands on the music.
    syl(id, k) {
      const l = lines[id];
      return snapFilm(l.start + (l.dur * k) / l.syllables) - ch.start;
    },
    // Snap a chapter-local time to the grid (division 4 = 16ths, 2 = 8ths, 1 = beats).
    snap(t, division = 4) {
      return snapFilm(ch.start + t, timing.beat / division) - ch.start;
    },
    // A measured screenshot crop from docs/crops.json, by shot id ("5.3a").
    crop(shot) {
      const c = crops[shot];
      if (!c) throw new Error(`no crop for shot ${shot} in docs/crops.json`);
      return c;
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

async function loadModule(id) {
  const url = `/scenes/${id}.js`;
  const head = await fetch(url, { method: 'HEAD' });
  if (head.status === 404) return null;
  return (await import(url)).default;
}

async function init() {
  const timings = await (await fetch('/docs/timeline.json')).json();
  const crops = Object.fromEntries((await (await fetch('/docs/crops.json')).json()).crops.map((c) => [c.shot, c]));
  await Promise.all([...document.fonts].map((f) => f.load()));
  await document.fonts.ready;

  const q = new URLSearchParams(location.search);
  const only = q.get('only')?.split(',');
  const soft = q.get('soft')?.split(',') ?? [];
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
    const ctx = makeCtx(ch, lines, crops, root, top, images, timings);
    let mod = null;
    let state = null;
    const lenient = only && soft.includes(ch.id);
    if (!only || only.includes(ch.id) || lenient) {
      try {
        mod = await loadModule(ch.id);
        state = mod ? await mod.build(ctx) : null;
      } catch (e) {
        if (!lenient) throw e;
        console.warn(`${ch.id} left black: ${e}`);
        mod = null;
        root.replaceChildren();
        top.replaceChildren();
      }
    }
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

  // A chapter that isn't painting also gets display: none, so a child left at visibility: visible can't leak
  // through (empty layers can't leak, and keep plain visibility so they don't disturb compositing).
  const show = (c, on, z) => {
    for (const layer of [c.root, c.top]) {
      layer.style.visibility = on ? 'visible' : 'hidden';
      if (layer.firstChild) layer.style.display = on ? '' : 'none';
    }
    c.root.style.zIndex = z;
    c.top.style.zIndex = 20 + z;
  };

  window.seek = (t) => {
    let i = chapters.findIndex((c) => t >= c.start && t < c.end);
    if (i < 0) i = t < chapters[0].start ? 0 : chapters.length - 1;
    const cur = chapters[i];
    const prev = chapters[i - 1];
    for (const c of chapters) show(c, false, 0);
    const into = t - cur.start;
    if (prev?.mod?.exit && into < prev.mod.exit) {
      show(prev, true, 3);
      prev.mod.render(prev.state, t - prev.start, prev.ctx);
    } else if (prev?.mod && cur.mod?.underlap && into < cur.mod.underlap) {
      show(prev, true, 1);
      prev.mod.render(prev.state, t - prev.start, prev.ctx);
    }
    show(cur, true, 2);
    cur.mod?.render(cur.state, into, cur.ctx);
    return cur.id;
  };
  window.__film = {
    duration: timings.end,
    source: timings.source,
    chapters: chapters.map(({ id, start, end, mod }) => ({
      id, start, end, built: !!mod, underlap: mod?.underlap ?? 0, exit: mod?.exit ?? 0,
    })),
  };
  window.seek(0);
}

window.__ready = init();
