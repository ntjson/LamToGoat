// ch02 Problem (shots 2.1-2.6). Five figures from the deck, one at a time, each with its own piece of paper:
// a skyline rises and 1.363 counts digit by digit, one digit locking per beat; the camera dives into one tower whose
// face becomes a façade of 745 cells, 129 of which flip orange (17%); a strip standing for all disputes is cut at 36%
// and the piece turns navy; 13 of 25 "quỹ" boxes are cut out and fall (52%); a report sheet with an empty clip is
// stamped "KHÔNG KÈM CHỨNG TỪ", then turns edge-on for ch03 (3.1).
// Every beat is anchored to the story beats L04-L08 (reading time on the 108 BPM grid): each beat's text lands in its
// first second and holds, unoccluded, until the beat ends; hits land on 16ths (up to 0.05 s early, never late) and the
// transitions play in the one-beat gaps. Nothing here uses film-absolute seconds.
import { step, spring, hash, rng } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged, pathData } from '../lib/paper.js';
import { W, H, text, tag, odometer, flip, svg, stroke, drawOn, vis } from '../lib/kit.js';
import { EXIT, SHEET } from '../lib/handoff.js';

const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';
const SVGNS = 'http://www.w3.org/2000/svg';
const FP = 80; // full-frame fields reach this far past the frame
const SK = 300; // lean of a field's scissor-cut leading edge
const PUSH = { f: 0.9, z: 1 }; // the dive into one tower (2.2 -> 2.3), in log scale
const SMAX = 40; // the dive's end scale, well past the point where the tower's blank band fills the frame
const RISE = { f: 1.6, z: 0.7 }; // a slab rising into the skyline
const QUICK = { f: 3, z: 1 }; // a scissor stroke across the strip
const RULE = { f: 2.2, z: 1 }; // a ledger rule drawn across the report sheet
const TYPE = { f: 2.4, z: 1 }; // MONO text typing on, one character after another (about 0.4 s for a line)
const GLIDE = { f: 1.5, z: 0.92 }; // a long slide that must not overshoot into its neighbour
const SNIP = { f: 7, z: 1 }; // a short scissor stroke around one box...
const SNIPT = 0.1; // ...drawn in this long, ending as the piece falls out
const LOCK = { f: 1.3, z: 0.92 }; // an odometer digit spinning up and locking without a visible overshoot
const X0 = 110; // the film's left type margin

// First time a preset's step response reaches frac: when a spring lands.
function reach(preset, frac = 1) {
  let x = 0;
  while (x < 4 && step(x, preset) < frac) x += 1 / 480;
  return x;
}

// Time from a spring's start until it stays within tol of its target, for a move of `travel`.
function settle(preset, travel, tol) {
  let last = 0;
  for (let x = 0; x < 4; x += 1 / 240) if (Math.abs(1 - step(x, preset)) * travel > tol) last = x;
  return last + 1 / 240;
}

// First t >= t0 (1/240 s steps) at which ok(t) holds.
function when(t0, ok, limit = 3) {
  for (let t = t0; t < t0 + limit; t += 1 / 240) if (ok(t)) return t;
  return t0 + limit;
}

// Flat paper cut to polygons given in the parent's coordinates (later polygons cut holes, even-odd).
// clipOf(polys) gives the clip-path string of another cut of the same piece (precomputed, switched in render).
function paper(parent, color, polys, style = {}) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const poly of polys) {
    for (const [x, y] of poly) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  x0 = Math.floor(x0);
  y0 = Math.floor(y0);
  const clipOf = (ps) => clip(...ps.map((p) => p.map(([x, y]) => [x - x0, y - y0])));
  const e = el(parent, '', {
    left: `${x0}px`, top: `${y0}px`, width: `${Math.ceil(x1) - x0}px`, height: `${Math.ceil(y1) - y0}px`,
    background: color, clipPath: clipOf(polys), ...style,
  });
  return { el: e, clipOf };
}

const place = (e, x, y) => Object.assign(e.style, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px` });
const px = (v) => `${v.toFixed(2)}px`;

// A Gem paper clip as one wire (inner leg, bottom turn, middle leg, top turn, outer leg), 52 x 198 at (ox, oy).
const clipWire = (ox, oy) => {
  const p = (x, y) => `${x + ox} ${y + oy}`;
  return `M ${p(36, 64)} L ${p(36, 152)} A 10 10 0 0 1 ${p(16, 152)} L ${p(16, 30)} A 18 18 0 0 1 ${p(52, 30)} `
    + `L ${p(52, 172)} A 26 26 0 0 1 ${p(0, 172)} L ${p(0, 46)}`;
};

export default {
  underlap: 0.8,
  exit: EXIT.ch02,

  build(ctx) {
    const root = ctx.root;
    const L04 = ctx.line('L04');
    const L05 = ctx.line('L05');
    const L06 = ctx.line('L06');
    const L07 = ctx.line('L07');
    const L08 = ctx.line('L08');
    const syl = (id, k) => ctx.syl(id, k);

    // Shot layers, bottom to top.
    const g21 = el(root, ''); // 2.1 orange field: covers ch01's question, then is 2.2's ground
    const s22 = el(root, ''); // 2.2 skyline and figure, one plane (the dive scales it)
    const s23 = el(root, '', { width: `${W}px`, height: `${H}px`, background: C.black });
    const s24 = el(root, '', { width: `${W}px`, height: `${H}px`, background: C.cream });
    const s25 = el(root, ''); // 2.5 orange field and its slabs, rising as one
    const s25t = el(root, ''); // 2.5 type (stays put while the field settles)
    const s26 = el(root, ''); // 2.6 cream field and the report sheet

    // Beats (chapter-local seconds), all from the story beats and the grid. Layout-dependent ones are added below.
    // Hits (slams, snaps, landings) sit on 16ths, up to 0.05 s early; a slide lands reach('slide') after it starts.
    const slideIn = reach('slide');
    const T = {
      rise: slideIn - 0.04, // the first slabs rise as the orange field lands
      riseEnd: syl('L04', 2) - 0.2, // the last slab starts rising
      group: L04.start + 2 * ctx.grid - 0.02 - slideIn, // "tòa chung cư tại Hà Nội" lands two 16ths into L04
      lock04: ctx.snap(L04.start + 2 * ctx.beat, 1) - 0.02, // 1.363: every digit spins, the first locks on a beat...
      stagger: ctx.beat, // ...and each next digit a beat later, the last one well before the dive
      push: L04.end, // PUSH (dive) into one tower, in the gap after L04
      slam17: L05.start - 0.04, // 17% slams as the façade lights up
      flip0: syl('L05', 1), // 129 cells flip orange, thickening...
      flip1: syl('L05', 12), // ...until late in the beat
      label17: syl('L05', 1) - 0.02 - slideIn, // the label's two lines land a 16th apart, right after 17%
      src17: syl('L05', 6) - 0.02, // 129/745 · Thanh tra Chính phủ types on while the label is read, 2 s before the cut
      strip: L05.end, // the strip starts to slide in (unseen until the cut)...
      cut24: ctx.snap(L05.end + 0.1), // ...and the HARD CUT to cream, on a 16th, finds it crossing
      slam36: L06.start - 0.04, // 36% slams
      label36: syl('L06', 1) - 0.04, // "vụ tranh chấp là về quỹ bảo trì" glides in right after it
      scissor: syl('L06', 3) - 0.04, // the strip is cut at 36%
      part: syl('L06', 5) - 0.04, // the piece turns navy and lifts
      piece: syl('L06', 10) - 0.04, // "quỹ bảo trì" lands on the piece
      wipe25: L06.end, // ORANGE rises in the gap after L06
      slam52: L07.start - 0.03, // 52% slams
      label52: syl('L07', 1) - 0.04, // "chưa được bàn giao quỹ bảo trì" snaps in under it...
      paste0: syl('L07', 1) - 0.04, // ...as the 25 "quỹ" boxes are pasted on, left to right
      cut0: syl('L07', 4) - 0.02, // the first of 13 boxes falls out; one per 16th after it
      sheet: L08.start + ctx.grid - 0.02 - slideIn, // the report sheet lands a 16th into L08 (L07's label holds longer)
      // The sheet's text lands evenly through the first half of L08, so the stamp (the shot's message) is read in
      // full before the sheet flips at the chapter's end (tools/readcheck.mjs).
      rules: syl('L08', 2) - 0.04, // the ledger rules draw on
      freq: syl('L08', 3) - 0.04, // "vài lần mỗi năm"
      clip: syl('L08', 5) + ctx.grid - 0.02 - reach('snap'), // the empty clip clicks on, landing on a 16th
      stamp: syl('L08', 7) - 0.04, // "KHÔNG KÈM CHỨNG TỪ"
    };
    T.count = T.lock04 - reach(LOCK, 0.995); // the number snaps in with every digit rolling
    T.lineIv = ctx.grid; // 2.3's second label line lands a 16th after the first
    T.cutIv = ctx.grid; // 13 cuts, left to right, one per 16th
    T.pasteIv = (syl('L07', 4) - ctx.grid - T.paste0) / 24; // the paste ripple ends a 16th before the first cut
    T.cream26 = T.sheet - 0.1; // the cream field slides in just ahead of the sheet, after L07 has ended

    // ---------- 2.3 type first: the façade takes the rest of the width; the tower we dive into stands near its centre ----------
    const f17 = text(s23, 'disp cut-text', '17%', { size: 300, color: C.orange, lh: 1, transformOrigin: '0 62%' });
    // The shotlist's two lines ("... thương mại / có tranh chấp ..."), as two pieces so they can slide in one by one.
    const l17 = ['cụm, tòa chung cư thương mại', 'có tranh chấp, khiếu kiện'].map((s) => text(s23, 'label', s, { size: 48, color: C.cream }));
    const SRC17 = '129/745 · Thanh tra Chính phủ';
    const m17 = text(s23, 'mono', SRC17, { size: 32, color: C.cream });
    const n17 = [...SRC17].length;
    const typed17 = Array.from({ length: n17 + 1 }, (_, k) => `inset(-20% ${(100 * (1 - k / n17)).toFixed(3)}% -20% 0)`);
    const col17 = Math.max(f17.w, ...l17.map((l) => l.w), m17.w);
    const y17 = Math.round((H - (f17.h + 2 * l17[0].h + m17.h + 34)) / 2);
    place(f17.el, X0 - 12, y17);
    l17.forEach((l, k) => place(l.el, X0, y17 + f17.h + 4 + k * l17[0].h));
    place(m17.el, X0, y17 + f17.h + 2 * l17[0].h + 34);

    const COLS = 35;
    const ROWS = 22; // 21 full rows of 35 and one of 10: 745 cells
    const CELLS = 745;
    const gx0 = X0 + col17 + 90;
    const gx1 = W - 70;
    const pitchX = (gx1 - gx0) / (COLS - 0.3);
    const cellW = pitchX * 0.7;
    const gy0 = 60;
    const pitchY = (H - 2 * gy0) / (ROWS - 0.26);
    const cellH = pitchY * 0.74;
    const gcx = (gx0 + gx1) / 2;

    // ---------- 2.2 the figure group, top left ----------
    const g22 = el(s22, '');
    const od = odometer(g22, '1.363', { cls: 'disp cut-text', size: 260, color: C.black, transformOrigin: '0 80%' });
    // All four digits roll from the first frame (so no in-between value ever reads as the figure) and lock left to
    // right, one per beat: slot k travels its digit plus a turn (not the first) on a spring tuned to be within 0.05
    // slot of it at its lock time.
    const travel04 = od.digits.map((d, k) => d + (k ? 10 : 0));
    const slot04 = travel04.map((v, k) => ({ f: settle({ f: 1, z: LOCK.z }, v, 0.05) / (T.lock04 + k * T.stagger - T.count), z: LOCK.z }));
    const l22 = text(g22, 'label', 'tòa chung cư tại Hà Nội', { size: 56, color: C.black });
    const n22 = text(g22, 'label', 'Nguồn: CBRE, Savills', { size: 30, color: C.black });
    place(l22.el, 10, od.h + 2);
    place(n22.el, 12, od.h + 2 + l22.h + 8);
    const G22 = { x: X0 - 12, y: 50, w: Math.max(od.w, l22.w + 10, n22.w + 12), h: od.h + 2 + l22.h + 8 + n22.h };
    place(g22, G22.x, G22.y);

    // ---------- 2.2 the skyline: 24 black slabs with cream windows; the widest stands at the façade's centre ----------
    const r22 = rng(202);
    const NSLAB = 24;
    const wr = Array.from({ length: NSLAB }, () => 50 + r22() * 46);
    const gr = Array.from({ length: NSLAB - 1 }, () => 4 + r22() * 14);
    const lay = () => {
      const span = wr.reduce((a, b) => a + b, 0) + gr.reduce((a, b) => a + b, 0);
      const k = (W - 56) / span;
      let x = 28;
      return wr.map((w, i) => {
        const s = { x: Math.round(x), w: Math.round(w * k) };
        x += (w + (gr[i] ?? 0)) * k;
        return s;
      });
    };
    let row = lay();
    const mid = (s) => s.x + s.w / 2;
    const ti = row.reduce((b, s, i) => (Math.abs(mid(s) - gcx) < Math.abs(mid(row[b]) - gcx) ? i : b), 0);
    wr[ti] = 140;
    row = lay();
    const skyClear = G22.y + G22.h + 60; // slabs under the figure keep their tops below this line
    const tops = row.map((s) => {
      let h = 280 + (mid(s) / W) * 420 + (r22() - 0.5) * 260;
      if (s.x < G22.x + G22.w + 40) h = Math.min(h, H - skyClear);
      return Math.round(H - Math.max(170, h));
    });
    tops[ti] = 170;

    const BAND = [H / 2 - 44, H / 2 + 44]; // the tower's blank floor band, where the camera dives in
    const WIN = { w: 13, h: 19, gx: 9, gy: 15, m: 11, top: 16 };
    let band = null;
    const slabs = row.map((s, i) => {
      const { x, w } = s;
      const top = tops[i];
      const bottom = H + 80;
      const outer = rough(rect(x, top, w, bottom - top), { seed: 206 + i, amp: 3 });
      const cols = Math.max(2, Math.floor((w - 2 * WIN.m + WIN.gx) / (WIN.w + WIN.gx)));
      const ox = x + (w - (cols * (WIN.w + WIN.gx) - WIN.gx)) / 2;
      const holes = [];
      let above = top;
      let below = bottom;
      for (let r = 0, y = top + WIN.top; y < H + 40; r++, y += WIN.h + WIN.gy) {
        if (i === ti) {
          if (y + WIN.h > BAND[0] && y < BAND[1]) continue;
          if (y + WIN.h <= BAND[0]) above = Math.max(above, y + WIN.h);
          else below = Math.min(below, y);
        }
        for (let c = 0; c < cols; c++) {
          if (hash(i, r, c, 204) < 0.22) continue; // an unlit window
          holes.push(rough(rect(ox + c * (WIN.w + WIN.gx), y, WIN.w, WIN.h), { seed: 203, amp: 1.2, wave: 14, spacing: 6 }));
        }
      }
      if (i === ti) band = { x0: x + 5, x1: x + w - 5, y0: above, y1: below };
      const g = el(s22, '');
      paper(g, C.cream, [rect(x + 7, top + 7, w - 14, bottom - top - 14)]);
      paper(g, C.black, [outer, ...holes]);
      const t0 = Math.max(T.rise, T.rise + (T.riseEnd - T.rise) * (i / (NSLAB - 1)) + 0.06 * (hash(i, 205) - 0.5));
      return { g, x, w, top, t0, dy: bottom - top + 40 };
    });
    // Put the figure above the skyline in paint order.
    s22.appendChild(g22);

    // The dive: a pure scale, in log space, about the point that maps the band onto the frame (the fixed point of that
    // similarity), so the band covers the frame on every side at once, at S = max(W / band width, H / band height).
    const ax = (W * band.x0) / (W - (band.x1 - band.x0));
    const ay = (H * band.y0) / (H - (band.y1 - band.y0));
    const cover = 1.03 * Math.max(W / (band.x1 - band.x0), H / (band.y1 - band.y0));
    const pushS = (t) => Math.exp(Math.log(SMAX) * step(t - T.push, PUSH));
    T.black = when(T.push, (t) => pushS(t) >= cover);

    // 2.1 the orange field: a scissor-cut diagonal leading edge (after ch01's cut), sliding in from the right.
    const edge21 = jagged([-FP - SK, H + FP], [-FP, -FP], { seed: 201, amp: 14 });
    const field21 = paper(g21, C.orange, [[[W + FP, -FP], [W + FP, H + FP], ...edge21]]);
    const x21 = W + FP + SK + 30;

    // ---------- 2.3 the façade: 745 cream cells on black, lit from where the camera entered ----------
    const grid = el(s23, '');
    s23.insertBefore(grid, f17.el);
    const gl = svg(grid, W, H);
    const variants = Array.from({ length: 8 }, (_, v) => rough(rect(0, 0, cellW, cellH), { seed: 230 + v, amp: 1.3, wave: 16, spacing: 5 }));
    const cells = [];
    let dmax = 0;
    for (let i = 0; i < CELLS; i++) {
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      const x = gx0 + c * pitchX;
      const y = gy0 + r * pitchY;
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', pathData(variants[(i * 5 + r) % 8].map(([a, b]) => [a + x, b + y])));
      Object.assign(p.style, { fill: C.cream, transformBox: 'fill-box', transformOrigin: '50% 50%' });
      gl.appendChild(p);
      const d = Math.hypot(x + cellW / 2 - ax, y + cellH / 2 - ay);
      dmax = Math.max(dmax, d);
      cells.push({ p, d, on: 0, flip: -1 });
    }
    cells.forEach((c, i) => {
      c.on = T.black + 0.3 * (c.d / dmax) + 0.04 * hash(i, 239);
    });
    // 129 of 745 flip to orange: a seeded scatter of places, and times that thicken towards the end of the beat.
    const rf = rng(238);
    const order = cells.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rf() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const at17 = Array.from({ length: 129 }, () => rf() ** 0.7).sort((a, b) => a - b);
    order.slice(0, 129).forEach((ci, k) => {
      cells[ci].flip = T.flip0 + (T.flip1 - T.flip0) * at17[k];
    });

    // ---------- 2.4 a black strip standing for all disputes, cut at 36% ----------
    const f36 = text(s24, 'disp cut-text', '36%', { size: 300, color: C.navy, lh: 1, transformOrigin: '0 62%' });
    place(f36.el, X0 - 12, 64);
    const g36 = el(s24, '');
    const l36 = text(g36, 'label', 'vụ tranh chấp là về quỹ bảo trì', { size: 48, color: C.black });
    const n36 = text(g36, 'label', 'Bộ Xây dựng', { size: 30, color: C.black });
    place(n36.el, 2, l36.h + 8);
    const g36x = X0 + f36.w + 48;
    place(g36, g36x, 64 + f36.h * 0.52);
    const SX = X0;
    const SWD = W - 2 * X0;
    const SY = 690;
    const SH = 230;
    const xc = SX + 0.36 * SWD;
    const cutPts = jagged([xc + 10, SY], [xc - 10, SY + SH], { seed: 241, amp: 8, spacing: 10 });
    const whole24 = paper(s24, C.black, [rough(rect(SX, SY, SWD, SH), { seed: 240, amp: 3 })], { filter: SHADOW }).el;
    const right24 = paper(s24, C.black, [rough([cutPts[0], [SX + SWD, SY], [SX + SWD, SY + SH], ...[...cutPts].reverse()], { seed: 243, amp: 3 })], { filter: SHADOW }).el;
    const left24 = el(s24, '', { filter: SHADOW });
    paper(left24, C.navy, [rough([[SX, SY], ...cutPts, [SX, SY + SH]], { seed: 242, amp: 3 })]);
    const pt = text(left24, 'label', 'quỹ bảo trì', { size: 44, color: C.cream, transformOrigin: '50% 50%' });
    place(pt.el, SX + (xc - SX - pt.w) / 2, SY + (SH - pt.h) / 2);
    const cutLayer = svg(s24);
    const cut24 = stroke(cutLayer, [[xc + 13, SY - 34], ...cutPts, [xc - 13, SY + SH + 34]], { color: C.orange, width: 7 });
    const x24 = -(SX + SWD + 120);

    // ---------- 2.5 ORANGE rises with 25 slabs, each holding a cream "quỹ" box; 13 are cut out ----------
    const TK = 200;
    const edge25 = jagged([-FP, -FP - TK], [W + FP, -FP], { seed: 244, amp: 12 });
    paper(s25, C.orange, [[...edge25, [W + FP, H + FP], [-FP, H + FP]]]);
    const y25 = H + FP + TK + 40;
    const f52 = text(s25t, 'disp cut-text', '52%', { size: 300, color: C.black, lh: 1, transformOrigin: '0 62%' });
    const l52 = text(s25t, 'label', 'chung cư thương mại chưa được / bàn giao quỹ bảo trì', { size: 48, color: C.black });
    const X52 = W - X0 - Math.max(f52.w, l52.w);
    place(f52.el, X52 - 12, 60);
    place(l52.el, X52, 60 + f52.h + 4);
    const foot52 = 60 + f52.h + 4 + l52.h + 60; // slabs under the type keep their tops below this line
    const r25 = rng(245);
    const N25 = 25;
    const SW25 = 70;
    const GAP25 = 6;
    const x25 = (W - (N25 * SW25 + (N25 - 1) * GAP25)) / 2;
    const probe = text(s25, 'label', 'quỹ', { size: 30, color: C.black });
    const bw = Math.min(SW25 - 8, probe.w + 16);
    const bh = Math.round(probe.h + 10);
    probe.el.remove();
    const pick = Array.from({ length: N25 }, (_, i) => i);
    for (let i = N25 - 1; i > 0; i--) {
      const j = Math.floor(r25() * (i + 1));
      [pick[i], pick[j]] = [pick[j], pick[i]];
    }
    const cutSet = pick.slice(0, 13).sort((a, b) => a - b); // 13 of 25 = 52%
    const boxes = [];
    for (let i = 0; i < N25; i++) {
      const x = x25 + i * (SW25 + GAP25);
      const u = Math.min(1, Math.max(0, (x - 300) / (X52 - 300)));
      let top = 400 + 230 * u * u * (3 - 2 * u) + (r25() - 0.5) * 110; // the row climbs towards the left
      if (x + SW25 > X52 - 40) top = Math.max(top, foot52);
      top = Math.round(top);
      const bottom = H + FP + 60;
      const outer = rough(rect(x, top, SW25, bottom - top), { seed: 246 + i, amp: 3 });
      const bx = x + (SW25 - bw) / 2;
      const by = top + 22;
      const cutPoly = rough(rect(bx - 5, by - 5, bw + 10, bh + 10), { seed: 275 + (i % 4), amp: 2 });
      const slab = paper(s25, C.black, [outer]);
      boxes.push({ i, x, bx, by, outer, cutPoly, slab: slab.el, whole: slab.clipOf([outer]), holed: slab.clipOf([outer, cutPoly]), cut: -1 });
    }
    const snips = svg(s25);
    for (const b of boxes) {
      // The piece that falls: its black margin (invisible on the slab until it drops) and the cream face pasted on it.
      const piece = el(s25, '', { transformOrigin: `${b.bx + bw / 2}px ${b.by + bh / 2}px` });
      paper(piece, C.black, [b.cutPoly]);
      const face = el(piece, '', { transformOrigin: `${b.bx + bw / 2}px ${b.by + bh / 2}px` });
      paper(face, C.cream, [rough(rect(b.bx, b.by, bw, bh), { seed: 271 + (b.i % 4), amp: 1.5 })]);
      const q = text(face, 'label', 'quỹ', { size: 30, color: C.black });
      place(q.el, b.bx + (bw - q.w) / 2, b.by + (bh - q.h) / 2);
      b.piece = piece;
      b.face = face;
      b.paste = T.paste0 + b.i * T.pasteIv;
      b.dx = 0;
      b.rot = 0;
      const k = cutSet.indexOf(b.i);
      if (k >= 0) {
        b.cut = T.cut0 + k * T.cutIv;
        b.dx = (hash(b.i, 290) - 0.5) * 160;
        b.rot = (hash(b.i, 291) < 0.5 ? -1 : 1) * (14 + 18 * hash(b.i, 292));
      }
    }
    s25.appendChild(snips); // outlines above the pieces
    for (const b of boxes) if (b.cut >= 0) b.outline = stroke(snips, b.cutPoly, { color: C.orange, width: 5, closed: true });

    // ---------- 2.6 CREAM field; the report sheet at SHEET with an empty clip and a red stamp ----------
    const edge26 = jagged([W + FP, -FP], [W + FP + SK, H + FP], { seed: 280, amp: 14 });
    const field26 = paper(s26, C.cream, [[[-FP, -FP], ...edge26, [-FP, H + FP]]]).el;
    const x26 = -(W + FP + SK + 30);
    const sheet = el(s26, '', { width: `${SHEET.w}px`, height: `${SHEET.h}px`, filter: SHADOW });
    paper(sheet, C.black, [rough(rect(0, 0, SHEET.w, SHEET.h), { seed: 281, amp: 4 })]);
    const title = text(sheet, 'disp cut-text', 'BÁO CÁO THU – CHI', { size: 110, color: C.cream });
    place(title.el, 74, 50);
    const freq = text(sheet, 'label', 'vài lần mỗi năm', { size: 56, color: C.orange, transformOrigin: '0 50%' });
    place(freq.el, 80, 50 + title.h + 8);
    const rulesTop = 50 + title.h + 8 + freq.h + 50;
    const ruleLayer = svg(sheet, SHEET.w, SHEET.h);
    const rules = [];
    for (let k = 0; k < 5; k++) {
      const y = rulesTop + k * ((SHEET.h - 70 - rulesTop) / 4);
      rules.push(stroke(ruleLayer, jagged([78, y], [SHEET.w - 78, y], { seed: 282 + k, amp: 1.6, wave: 120 }), { color: C.cream, width: 6, cap: 'butt' }));
    }
    const clipG = el(sheet, '');
    stroke(svg(clipG, 80, 240), clipWire(10, 10), { color: C.orange, width: 9 });
    place(clipG, SHEET.w - 190, -84);
    const stamp = tag(sheet, 'KHÔNG KÈM CHỨNG TỪ', { cls: 'disp cut-text', size: 100, color: C.cream, bg: C.red, seed: 287, rot: 5 });
    place(stamp.el, (SHEET.w - stamp.w) / 2 + 16, rulesTop + (SHEET.h - 70 - rulesTop) / 2 - stamp.h / 2);
    const sx26 = -(SHEET.cx + SHEET.w / 2 + 260);

    // When each wipe has covered the frame (the shot beneath can then be hidden).
    T.cover25 = when(T.wipe25, (t) => spring(t, T.wipe25, y25, 0, 'slide') <= 60);
    T.cover26 = when(T.cream26, (t) => spring(t, T.cream26, x26, 0, 'slide') >= -60);

    // For the sound (cues() below). land: when each move lands, its spring's first arrival (and when each digit of
    // 1.363 locks); flipEdge: how long after its flip time a cell is edge-on and shows orange; pan: where an event
    // stands across the frame (-1 left … 1 right), from its x centre.
    const riseIn = reach(RISE);
    const snapIn = reach('snap');
    const land = {
      wipe21: slideIn, slabs: slabs.map((sl) => sl.t0 + riseIn), strip: T.strip + slideIn, lift: T.part + snapIn,
      locks: od.digits.map((_, k) => T.lock04 + k * T.stagger), wipe25: T.wipe25 + slideIn, sheet: T.sheet + slideIn,
      clip: T.clip + snapIn,
    };
    const toPan = (x) => Math.round((200 * x) / W - 100) / 100;
    const pan = {
      slabs: slabs.map((sl) => toPan(sl.x + sl.w / 2)), count: toPan(G22.x + od.w / 2), f17: toPan(X0 - 12 + f17.w / 2),
      cells: cells.map((_, i) => toPan(gx0 + (i % COLS) * pitchX + cellW / 2)), f36: toPan(X0 - 12 + f36.w / 2),
      piece: toPan((SX + xc) / 2), f52: toPan(X52 - 12 + f52.w / 2), boxes: boxes.map((b) => toPan(b.bx + bw / 2)),
      clip: toPan(SHEET.cx + SHEET.w / 2 - 190 + 40),
    };

    return {
      T, dur: ctx.dur, g21: field21.el, x21, s22, g22, gx22: -(G22.x + G22.w + 80), od, travel04, slot04, slabs, ax, ay, pushS,
      s23, grid, cells, f17: f17.el, l17: l17.map((l) => l.el), lx17: -(X0 + col17 + 60), m17: m17.el, typed17,
      s24, f36: f36.el, g36, gx36: W - g36x + 40, whole24, right24, left24, pt: pt.el, cutLayer, cut24, x24,
      s25, s25t, y25, boxes, f52: f52.el, l52: l52.el,
      s26, field26, x26, sheet, sx26, rules, freq: freq.el, clipG, stamp: stamp.el,
      land, flipEdge: reach('flip', 0.5), pan,
    };
  },

  render(s, t) {
    const { T } = s;

    // 2.1-2.2: the orange field slides over ch01's question; slabs rise; 1.363 counts; then the dive.
    const on22 = t < T.black;
    vis(s.g21, on22);
    vis(s.s22, on22);
    if (on22) {
      s.g21.style.transform = `translateX(${px(spring(t, 0, s.x21, 0, 'slide'))})`;
      const S = s.pushS(t);
      s.s22.style.transform = `translate(${px(s.ax * (1 - S))}, ${px(s.ay * (1 - S))}) scale(${S.toFixed(5)})`;
      for (const sl of s.slabs) {
        const x0 = s.ax + (sl.x - s.ax) * S;
        const x1 = s.ax + (sl.x + sl.w - s.ax) * S;
        if (vis(sl.g, t >= sl.t0 && x1 > 0 && x0 < W)) sl.g.style.transform = `translateY(${px(spring(t, sl.t0, sl.dy, 0, RISE))})`;
      }
      if (vis(s.g22, t >= T.group && S < 2.6)) s.g22.style.transform = `translateX(${px(spring(t, T.group, s.gx22, 0, 'slide'))})`;
      if (vis(s.od.el, t >= T.count)) s.od.el.style.transform = `scale(${spring(t, T.count, 1.12, 1, 'snap').toFixed(4)})`;
      s.od.place(s.travel04.map((v, k) => spring(t, T.count, 0, v, s.slot04[k])));
    }

    // 2.3: the façade lights up from the dive point; 129 cells flip orange; 17% slams.
    const on23 = t >= T.black && t < T.cut24;
    vis(s.s23, on23);
    if (on23) {
      const k = spring(t, T.black, 0.94, 1, 'settle');
      s.grid.style.transform = `translate(${px(s.ax * (1 - k))}, ${px(s.ay * (1 - k))}) scale(${k.toFixed(5)})`;
      for (const c of s.cells) {
        if (!vis(c.p, t >= c.on)) continue;
        const sy = spring(t, c.on, 0, 1, 'snap');
        let sx = sy;
        let fill = C.cream;
        if (c.flip >= 0 && t >= c.flip) {
          const f = flip(t, c.flip);
          sx *= f.sx;
          if (f.back) fill = C.orange;
        }
        c.p.style.transform = `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        c.p.style.fill = fill;
      }
      if (vis(s.f17, t >= T.slam17)) s.f17.style.transform = `scale(${spring(t, T.slam17, 1.2, 1, 'slam').toFixed(4)})`;
      s.l17.forEach((l, k) => {
        const t0 = T.label17 + T.lineIv * k;
        if (vis(l, t >= t0)) l.style.transform = `translateX(${px(spring(t, t0, s.lx17, 0, 'slide'))})`;
      });
      const n = s.typed17.length - 1;
      if (vis(s.m17, t >= T.src17)) s.m17.style.clipPath = s.typed17[Math.min(n, Math.round(n * step(t - T.src17, TYPE)))];
    }

    // 2.4: HARD CUT to cream; the strip slides in, is cut at 36%, the piece turns navy and lifts.
    const on24 = t >= T.cut24 && t < T.cover25;
    vis(s.s24, on24);
    if (on24) {
      const x = spring(t, T.strip, s.x24, 0, 'slide');
      const parted = t >= T.part;
      if (vis(s.whole24, !parted)) s.whole24.style.transform = `translateX(${px(x)})`;
      if (vis(s.right24, parted)) s.right24.style.transform = `translateX(${px(x)})`;
      if (vis(s.left24, parted)) s.left24.style.transform = `translate(${px(x)}, ${px(spring(t, T.part, 0, -120, 'snap'))})`;
      s.cutLayer.style.transform = `translateX(${px(x)})`;
      if (vis(s.cut24, t >= T.scissor && t < T.part + 0.06)) drawOn(s.cut24, step(t - T.scissor, QUICK));
      if (vis(s.pt, t >= T.piece)) s.pt.style.transform = `scale(${spring(t, T.piece, 1.25, 1, 'snap').toFixed(4)})`;
      if (vis(s.f36, t >= T.slam36)) s.f36.style.transform = `scale(${spring(t, T.slam36, 1.2, 1, 'slam').toFixed(4)})`;
      if (vis(s.g36, t >= T.label36)) s.g36.style.transform = `translateX(${px(spring(t, T.label36, s.gx36, 0, GLIDE))})`;
    }

    // 2.5: ORANGE rises with the slabs; 52% slams; 13 boxes are cut out, left to right, and fall.
    const on25 = t >= T.wipe25 && t < T.cover26;
    vis(s.s25, on25);
    vis(s.s25t, on25);
    if (on25) {
      s.s25.style.transform = `translateY(${px(spring(t, T.wipe25, s.y25, 0, 'slide'))})`;
      for (const b of s.boxes) {
        if (vis(b.face, t >= b.paste)) b.face.style.transform = `scale(${spring(t, b.paste, 1.3, 1, 'snap').toFixed(4)})`;
        let d = 0;
        if (b.cut >= 0) {
          // The scissors go round the box in the SNIPT before its cut time; the piece falls out on it.
          if (vis(b.outline, t >= b.cut - SNIPT && t < b.cut)) drawOn(b.outline, step(t - b.cut + SNIPT, SNIP));
          const gone = t >= b.cut;
          b.slab.style.clipPath = gone ? b.holed : b.whole;
          d = gone ? step(t - b.cut, 'drop') : 0;
        }
        b.piece.style.transform = `translate(${px(b.dx * d)}, ${px(1100 * d)}) rotate(${(b.rot * d).toFixed(2)}deg)`;
      }
      if (vis(s.f52, t >= T.slam52)) s.f52.style.transform = `scale(${spring(t, T.slam52, 1.2, 1, 'slam').toFixed(4)})`;
      if (vis(s.l52, t >= T.label52)) s.l52.style.transform = `translateY(${px(spring(t, T.label52, 30, 0, 'snap'))})`;
    }

    // 2.6: CREAM field, the sheet slides in at -3°, the clip clicks on, the red tag stamps. From ctx.dur the sheet
    // turns about its vertical centre line (3.1); ch03 turns its navy back face out of the edge-on sheet.
    const on26 = t >= T.cream26;
    vis(s.s26, on26);
    if (on26) {
      s.field26.style.transform = `translateX(${px(spring(t, T.cream26, s.x26, 0, 'slide'))})`;
      const f = flip(t, s.dur);
      if (vis(s.sheet, t >= T.sheet && !f.back)) {
        const dx = spring(t, T.sheet, s.sx26, 0, 'slide');
        s.sheet.style.transform = `translate(${px(SHEET.cx + dx)}, ${SHEET.cy}px) rotate(${SHEET.rot}deg) scaleX(${f.sx.toFixed(5)}) `
          + `translate(${-SHEET.w / 2}px, ${-SHEET.h / 2}px)`;
        s.rules.forEach((r, k) => {
          const t0 = T.rules + k * 0.08;
          if (vis(r, t >= t0)) drawOn(r, step(t - t0, RULE));
        });
        if (vis(s.freq, t >= T.freq)) s.freq.style.transform = `scale(${spring(t, T.freq, 1.18, 1, 'snap').toFixed(4)})`;
        if (vis(s.clipG, t >= T.clip)) s.clipG.style.transform = `translateY(${px(spring(t, T.clip, -110, 0, 'snap'))})`;
        if (vis(s.stamp, t >= T.stamp)) s.stamp.style.transform = `scale(${spring(t, T.stamp, 1.3, 1, 'slam').toFixed(4)})`;
      }
    }
  },

  // Event times (chapter-local) for the sound: a move that lands carries `land` (its hit, on the grid); the rest hit
  // on `t`. Labels, typing, the paste ripple and the ledger rules get none; the exit flip is ch03's cue.
  cues(s) {
    const { T, land: L, pan: P } = s;
    const flips = s.cells.map((c, k) => [c.flip, P.cells[k]]).filter(([t]) => t >= 0).sort((a, b) => a[0] - b[0]);
    return [
      { t: 0, name: 'wipe', land: L.wipe21 }, // 2.1 the ORANGE field covers ch01's question
      // 2.2 the skyline rises, slab by slab, left to right
      ...s.slabs.map((sl, i) => ({ t: sl.t0, name: 'slab', land: L.slabs[i], i, pan: P.slabs[i] })),
      { t: T.count, name: 'count', land: L.locks.at(-1), pan: P.count }, // 1.363 rolls until its last digit locks
      ...L.locks.map((t, i) => ({ t, name: 'tick', i, pan: P.count })), // one digit locks per beat
      { t: T.push, name: 'wipe', land: T.black }, // the dive, until the tower's black face fills the frame
      { t: T.slam17, name: 'slam', pan: P.f17 }, // 2.3 "17%"
      ...flips.map(([t, pan], i) => ({ t: t + s.flipEdge, name: 'cell', i, pan })), // 129 cells show orange
      { t: T.cut24, name: 'cut' }, // 2.4 HARD CUT to cream...
      { t: T.cut24, name: 'slide', land: L.strip }, // ...onto the strip mid-slide (its spring starts unseen at T.strip)
      { t: T.slam36, name: 'slam', pan: P.f36 }, // "36%"
      { t: T.scissor, name: 'scissor' }, // the scissor line runs across the strip...
      { t: T.part, name: 'lift', land: L.lift, pan: P.piece }, // ...and the piece turns navy and lifts
      { t: T.wipe25, name: 'wipe', land: L.wipe25 }, // 2.5 ORANGE rises
      { t: T.slam52, name: 'slam', pan: P.f52 }, // "52%"
      // 13 of the 25 boxes are cut out, left to right, each falling as its outline closes
      ...s.boxes.filter((b) => b.cut >= 0).map((b, i) => ({ t: b.cut, name: 'snip', n: 1, i, pan: P.boxes[b.i] })),
      { t: T.cream26, name: 'slide', land: L.sheet }, // 2.6 the CREAM field and the sheet, landing with the sheet
      { t: L.clip, name: 'click', pan: P.clip }, // the empty clip clicks on
      { t: T.stamp, name: 'stamp' }, // the red tag
    ];
  },
};
