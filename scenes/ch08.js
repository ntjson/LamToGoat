// ch08 Competition (shots 8.1-8.3). The deck's "Bức tranh cạnh tranh": no competitor has real AI request handling or
// an anti-tamper income/expense ledger; Làm Tổ has both. Two ORANGE columns stand for the two features. The five
// competitors arrive as BLACK strips that stop short of the first column on a torn end; LamTo's NAVY strip runs through
// both columns and a hole is punched through it at each one, so the orange shows through. The black strips fall away,
// the claim slams, and in the exit the NAVY strip grows until it fills the frame (ch09 opens on that NAVY field).
// Every beat is anchored to the voice lines L28-L29; nothing here uses film-absolute seconds.
import { step, spring, track, noise1, hash, rng } from '../lib/motion.js';
import { C, el, rough, rect, blob, clip, jagged } from '../lib/paper.js';
import { W, H, text, cover, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

// Facts (deck, "Bức tranh cạnh tranh"; wording from docs/shotlist.md 8.1-8.3).
const NAMES = ['CYHOME', 'PIHOME', 'HOMEID', 'BUILDING CARE', 'LANDSOFT'];
const FEATURES = ['AI xử lý yêu cầu / thực chất', 'Sổ thu chi / chống sửa đổi'];
const SOURCE = 'Nguồn: website và công bố của các nhà cung cấp';

const UNDERLAP = 0.75;
const PAD = 60; // kit.field's bleed past the frame
const COVER = { f: 2.6, z: 1 }; // the cream wipe lands dead, whole px, at rest by the underlap
const LEAN = -5; // the columns ride in leaning (degrees), then stand up with a wobble
const STAND = { f: 3.0, z: 0.55 }; // settled to well under 0.1 degree by the underlap (the top copies' grain swap)
const CAPMOVE = { f: 3.4, z: 0.75 }; // the caption steps down under each new strip
const STOP = { f: 2.2, z: 0.78 }; // a strip shoots in and stops short (a 2 % overshoot, still short of the column)
const LONG = { f: 1.5, z: 0.9 }; // the NAVY strip's long run through both columns
const KICK = { f: 6, z: 0.5 }; // the strip jolts under a punch
const CLAIM_HOLD = 1.3; // s the full claim holds, landed, before the exit starts to cover it
const EXPAND = { f: 1.1, z: 1 }; // the NAVY strip grows to fill the frame (exit), aimed past it so it leaves moving
const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';

// Layout (1080p px).
const TX = 120; // type flush left
const LAB_Y = 70; // column labels
const LAB_PAD = 30;
const COL_GAP = 28;
const RIGHT = 76; // cream margin right of the second column
const ROW0 = 228; // first black strip
const BH = 92; // black strip height
const PITCH = 110;
const NY = ROW0 + 5 * PITCH; // NAVY strip, in the sixth slot
const NH = 124;
const SHORT = 58; // how far short of the first column the torn ends stop
const SX0 = -150; // strips' left end, off frame
const HOLE_R = 40;

// Where a DISPLAY/LABEL line's caps sit inside its text box (line-height lh), from canvas metrics.
const cv = document.createElement('canvas').getContext('2d');
function caps(size, lh, disp = true) {
  cv.font = `${disp ? 800 : 700} ${size}px "Bricolage Grotesque"`;
  cv.fontStretch = disp ? 'condensed' : 'normal';
  const m = cv.measureText('H');
  const base = (lh * size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  return { top: base - m.actualBoundingBoxAscent, base };
}

// Seconds from a spring's start until it first reaches its target (the moment a strip hits its stop).
function firstArrival(p) {
  for (let t = 0; t < 3; t += 0.001) if (step(t, p) >= 1) return t;
  return 3;
}

// Seconds until a spring over distance d stays within tol px of its target.
function settle(p, d, tol) {
  for (let t = 3; t > 0; t -= 0.01) if (Math.abs(1 - step(t, p)) * d > tol) return t + 0.01;
  return 0;
}

// A hand-cut horizontal edge from x0 to x1 at height y, pushed inward (dir +1 down, -1 up) like paper.rough().
function edge(x0, x1, y, dir, seed) {
  const out = [];
  const n = Math.max(1, Math.round(Math.abs(x1 - x0) / 9));
  for (let k = 0; k < n; k++) {
    const x = x0 + ((x1 - x0) * k) / n;
    const off = 3 * (0.5 + 0.35 * noise1(x / 60, seed) + 0.15 * noise1(x / 7, seed + 7));
    out.push([x, y + dir * off]);
  }
  return out;
}

// A strip of length len and height h whose right end is torn: a slanted, fibrous jagged line.
function tornStrip(len, h, seed) {
  const r = rng(seed);
  const a = (r() - 0.5) * 52;
  const b = (r() - 0.5) * 52;
  const tear = jagged([len + a, 0], [len + b, h], { seed: seed + 1, amp: 12, wave: 22, spacing: 3 })
    .map(([x, y], i) => [x + (hash(i, seed) - 0.5) * 8, y]);
  return [...edge(0, len + a, 0, 1, seed), ...tear, ...edge(len + b, 0, h, -1, seed + 2)];
}

// One ORANGE column, full height with bleed. grained: the copy that rides the cover on ctx.top.
function column(parent, x, w, seed, grained) {
  const h = H + 2 * PAD;
  return el(parent, grained ? 'grained' : '', {
    left: `${x}px`, top: `${-PAD}px`, width: `${w}px`, height: `${h}px`, backgroundColor: C.orange,
    backgroundPosition: `${-x}px ${PAD}px`, clipPath: clip(rough(rect(0, 0, w, h), { seed, amp: 4 })),
  });
}

export default {
  underlap: UNDERLAP,
  exit: EXIT.ch08,

  build(ctx) {
    const root = ctx.root;
    const L28 = ctx.line('L28');
    const L29 = ctx.line('L29');
    const s28 = (k) => ctx.syl('L28', k);
    const arrive = firstArrival(STOP);

    // Beats (chapter-local seconds), all derived from the voice lines.
    const lab0 = Math.max(UNDERLAP + 0.02, L28.start - 0.36);
    // Strips stop on "đối" (thủ), "có", "xử", "cầu", "hay": one a second across the first half of L28.
    const hits = [1, 4, 7, 10, 13].map((k) => s28(k) - 0.04);
    const punch = [s28(17) - 0.04, s28(19) - 0.04]; // "chống" ... "đổi"
    const T = {
      stand: [0.19, 0.19], // the columns stand up as the wipe lands (the wipe is a fixed 0.75 s transition)
      lab: [lab0, lab0 + 0.16],
      hits,
      slide: hits.map((h) => Math.max(UNDERLAP + 0.01, h - arrive)), // root paper only appears after the underlap
      cap: hits[0] + 0.3,
      punch,
      fall: L28.end + 0.06, // 8.3, in the breath before L29 (bottom strip first)
      // "LÀM TỔ" on "Làm", "CÓ CẢ HAI." on "có", but never later than CLAIM_HOLD s before the chapter ends, so the
      // whole claim is read before the exit's NAVY takes the frame; "LÀM TỔ" always leads it by at least 0.3 s.
      slam: (() => {
        const two = Math.min(ctx.syl('L29', 2) - 0.05, ctx.dur - CLAIM_HOLD);
        return [Math.min(L29.start - 0.05, two - 0.3), two];
      })(),
      expand: ctx.dur, // exit: the NAVY strip grows over everything
    };

    // ---- 8.1 ground: the CREAM wipe from the right, carrying the two ORANGE columns ----
    const cov = cover(ctx, C.cream, { seed: 801, amp: 6 });
    const labs = FEATURES.map((s) => text(root, 'label', s, { size: 40, color: C.black }));
    const CW = Math.round(Math.max(...labs.map((l) => l.w)) + 2 * LAB_PAD);
    const X2 = W - RIGHT - CW;
    const X1 = X2 - COL_GAP - CW;
    const colX = [X1, X2];
    const cols = colX.map((x, i) => ({ top: column(ctx.top, x, CW, 802 + i, true), root: column(root, x, CW, 802 + i, false) }));
    for (const c of cols) for (const e of [c.top, c.root]) e.style.transformOrigin = `${CW / 2}px ${H + 2 * PAD}px`;
    // Labels go above the columns in the stacking order: re-append them after.
    labs.forEach((l, i) => {
      root.appendChild(l.el);
      Object.assign(l.el.style, { left: `${colX[i] + LAB_PAD}px`, top: `${LAB_Y}px` });
    });
    const coverX = (t) => Math.round(spring(t, 0, W + 2 * PAD, 0, COVER));

    // ---- source caption, under the stack (part of the group) ----
    // It rides under the stack: under CYHOME when it lands, one slot down as each strip comes in, under the NAVY strip
    // at the end (keys are set once the NAVY run's start is known, below).
    const cap = text(root, 'label', SOURCE, { size: 30, color: C.black });
    Object.assign(cap.el.style, { left: `${TX}px`, top: '0px' });
    const capY = (k) => ROW0 + k * PITCH + BH + 22;

    // ---- 8.2 five BLACK strips, torn short of the first column ----
    const c64 = caps(64, 1.1);
    const tornX = X1 - SHORT;
    const len = tornX - SX0;
    const fr = rng(810);
    const strips = NAMES.map((name, i) => {
      const y = ROW0 + i * PITCH;
      const wrap = el(root, '', { left: `${SX0}px`, top: `${y}px`, width: `${len + 40}px`, height: `${BH}px`, filter: SHADOW });
      el(wrap, '', { width: `${len + 40}px`, height: `${BH}px`, background: C.black, clipPath: clip(tornStrip(len, BH, 820 + i * 10)) });
      const lb = text(wrap, 'disp cut-text', name, { size: 64, color: C.cream });
      const capH = c64.base - c64.top;
      Object.assign(lb.el.style, { left: `${TX - SX0}px`, top: `${Math.round((BH - capH) / 2 - c64.top)}px` });
      // The fall: a hinge at one end, then gravity; a slight spin and drift, seeded per strip.
      const hingeLeft = fr() < 0.6;
      Object.assign(wrap.style, { transformOrigin: hingeLeft ? `${-SX0}px 50%` : `${len}px 50%` });
      return {
        wrap,
        tilt: (i % 2 ? 1 : -1) * (0.8 + 0.7 * fr()), // thrown in slightly askew; it slaps flat on the stop
        off: len + 420, // starts far enough out that the visible part of the slide is fast, then stops
        spin: (hingeLeft ? 1 : -1) * (4 + 5 * fr()),
        drift: (fr() - 0.5) * 120,
      };
    });
    // Bottom strip falls first, so no strip falls through another.
    const fallAt = strips.map((_, i) => T.fall + (NAMES.length - 1 - i) * 0.09);

    // ---- the NAVY strip: runs through both columns; two holes punched where it crosses them ----
    const NL = W - 2 * SX0;
    const nWrap = el(root, '', { left: `${SX0}px`, top: `${NY}px`, width: `${NL}px`, height: `${NH}px`, filter: SHADOW });
    const outer = rough(rect(0, 0, NL, NH), { seed: 850, amp: 3.5 });
    const holeC = colX.map((x) => [x + CW / 2 - SX0, NH / 2]);
    const holes = holeC.map(([hx, hy], i) => blob(hx, hy, HOLE_R, { seed: 851 + i, n: 90, lobes: 5, low: 0.05, fine: 0.015 }));
    const clips = [clip(outer), clip(outer, holes[0]), clip(outer, holes[0], holes[1])];
    const nPaper = el(nWrap, '', { width: `${NL}px`, height: `${NH}px`, background: C.navy, clipPath: clips[0] });
    const nLab = text(nWrap, 'disp cut-text', 'LÀM TỔ', { size: 64, color: C.cream });
    Object.assign(nLab.el.style, { left: `${TX - SX0}px`, top: `${Math.round((NH - (c64.base - c64.top)) / 2 - c64.top)}px` });
    const nOff = NL + 200;
    // The run starts on "sổ", but always early enough to be at rest (within 2 px) when the first hole is punched.
    T.navy = Math.min(s28(14) - 0.05, punch[0] - settle(LONG, nOff, 2));
    const capTrack = track(capY(0), [
      ...[1, 2, 3, 4].map((k) => [T.slide[k] - 0.12, capY(k), CAPMOVE]),
      [T.navy - 0.12, NY + NH + 22, CAPMOVE],
    ]);

    // The punched-out discs (chads): they pop and drop out of frame.
    const chads = holeC.map(([hx, hy], i) => {
      const wrapC = el(root, '', { width: `${2 * HOLE_R + 20}px`, height: `${2 * HOLE_R + 20}px`, filter: SHADOW, transformOrigin: '50% 50%' });
      el(wrapC, '', {
        width: `${2 * HOLE_R + 20}px`, height: `${2 * HOLE_R + 20}px`, background: C.navy,
        clipPath: clip(blob(HOLE_R + 10, HOLE_R + 10, HOLE_R, { seed: 851 + i, n: 90, lobes: 5, low: 0.05, fine: 0.015 })),
      });
      return { el: wrapC, x: SX0 + hx - HOLE_R - 10, y: NY + hy - HOLE_R - 10, rot: i ? -38 : 44, dx: i ? 30 : -24 };
    });

    // ---- 8.3 the claim, in the space the black strips leave ----
    const c140 = caps(140, 1.1);
    const h1 = text(root, 'disp cut-text', 'LÀM TỔ', { size: 140, color: C.navy });
    const h2 = text(root, 'disp cut-text', 'CÓ CẢ HAI.', { size: 140, color: C.navy });
    const hBottom = NY - 70; // baseline of the second line sits this far above the NAVY strip
    const h2Top = Math.round(hBottom - c140.base);
    const h1Top = h2Top - Math.round(1.1 * 140);
    for (const [h, y] of [[h1, h1Top], [h2, h2Top]]) {
      Object.assign(h.el.style, { left: `${TX - 6}px`, top: `${y}px`, transformOrigin: `0 ${Math.round(c140.base)}px` });
    }

    // ---- exit: the NAVY strip grows from its centre line until it covers the frame ----
    const cy = NY + NH / 2;
    const BLADE_H = H + 2 * PAD + 200;
    const wrapU = el(root, '', { left: '0px', top: `${-PAD}px`, width: `${W}px`, height: `${cy + 1 + PAD}px`, overflow: 'hidden' });
    const bladeU = el(wrapU, '', {
      left: `${-PAD}px`, width: `${W + 2 * PAD}px`, height: `${BLADE_H}px`, background: C.navy,
      clipPath: clip(rough(rect(0, 0, W + 2 * PAD, BLADE_H), { seed: 860, amp: 6, wave: 80, spacing: 10 })),
    });
    const wrapD = el(root, '', { left: '0px', top: `${cy - 1}px`, width: `${W}px`, height: `${H - cy + 1 + PAD}px`, overflow: 'hidden' });
    const bladeD = el(wrapD, '', {
      left: `${-PAD}px`, width: `${W + 2 * PAD}px`, height: `${BLADE_H}px`, background: C.navy,
      clipPath: clip(rough(rect(0, 0, W + 2 * PAD, BLADE_H), { seed: 861, amp: 6, wave: 80, spacing: 10 })),
    });
    // Both edges move at the same speed; the upper one has further to go and must clear the frame top (with its
    // hand-cut edge) 0.08 s before the exit window ends.
    const need = cy + 10 + 16;
    const E = Math.max(1.45 * need, need / step(EXIT.ch08 - 0.1, EXPAND));
    const grow = (t) => E * step(t - T.expand, EXPAND);

    return {
      T, cov, coverX, cols, labs: labs.map((l) => l.el), cap: cap.el, capTrack, strips, fallAt, nWrap, nPaper, nLab: nLab.el, clips, nOff, chads,
      h1: h1.el, h2: h2.el, wrapU, bladeU, wrapD, bladeD, grow, cy, BLADE_H,
    };
  },

  render(s, t) {
    const { T } = s;
    const onTop = t < UNDERLAP;

    // 8.1 The CREAM wipe from the right, carrying the two ORANGE columns (on ctx.top until the underlap ends).
    const cx = s.coverX(t);
    s.cov.place(cx, 0, onTop);
    s.cols.forEach((c, i) => {
      const r = spring(t, T.stand[i], LEAN, 0, STAND);
      for (const e of [c.top, c.root]) e.style.transform = `translate(${cx}px, 0px) rotate(${r.toFixed(4)}deg)`;
      vis(c.top, onTop);
      vis(c.root, !onTop);
    });
    // The column labels drop in from above the frame, one after the other.
    s.labs.forEach((e, i) => {
      if (vis(e, t >= T.lab[i])) e.style.transform = `translateY(${spring(t, T.lab[i], -170, 0, 'snap').toFixed(2)}px)`;
    });
    if (vis(s.cap, t >= T.cap)) s.cap.style.transform = `translateY(${(s.capTrack(t) + spring(t, T.cap, 30, 0, 'snap')).toFixed(2)}px)`;

    // 8.2 The five BLACK strips shoot in and stop short; 8.3 they fall away, bottom first.
    s.strips.forEach((st, i) => {
      const t0 = T.slide[i];
      const tf = s.fallAt[i];
      if (!vis(st.wrap, t >= t0 && t < tf + 1.4)) return;
      const x = spring(t, t0, -st.off, 0, STOP);
      const f = step(t - tf, 'drop');
      const r = step(t - tf + 0.06, 'drop'); // the hinge lets go a moment before the drop
      const rot = st.tilt * (1 - step(t - T.hits[i], 'snap')) + st.spin * r;
      st.wrap.style.transform = `translate(${(x + st.drift * f).toFixed(2)}px, ${(1350 * f).toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`;
    });

    // The NAVY strip's long run, then the two punches (hole + a jolt of the paper + the disc popping out).
    if (vis(s.nWrap, t >= T.navy)) {
      const x = spring(t, T.navy, -s.nOff, 0, LONG);
      let kick = 0;
      for (const tp of T.punch) kick += 7 * (step(t - tp, KICK) - step(t - tp - 0.05, KICK));
      s.nWrap.style.transform = `translate(${x.toFixed(2)}px, ${kick.toFixed(2)}px)`;
      s.nPaper.style.clipPath = s.clips[(t >= T.punch[0]) + (t >= T.punch[1])];
      // The strip's own label is cut away as the exit starts: growing from the centre line, the NAVY would cover its
      // caps before its marks and leave À and Ổ floating for a frame or two.
      vis(s.nLab, t < T.expand);
    }
    s.chads.forEach((c, i) => {
      const tp = T.punch[i];
      if (!vis(c.el, t >= tp && t < tp + 1.2)) return;
      const d = step(t - tp, 'drop');
      const pop = spring(t, tp, 1, 1.14, 'snap');
      c.el.style.transform = `translate(${(c.x + c.dx * d).toFixed(2)}px, ${(c.y + 520 * d).toFixed(2)}px) rotate(${(c.rot * d).toFixed(2)}deg) scale(${pop.toFixed(3)})`;
    });

    // 8.3 The claim slams, one line per phrase.
    [s.h1, s.h2].forEach((e, i) => {
      if (vis(e, t >= T.slam[i])) e.style.transform = `scale(${spring(t, T.slam[i], 1.12, 1, 'slam').toFixed(4)})`;
    });

    // Exit: the NAVY strip grows from its centre line, over everything, until the frame is NAVY edge to edge.
    const g = vis(s.wrapU, t >= T.expand);
    vis(s.wrapD, g);
    if (g) {
      const e = s.grow(t);
      // Upper blade: top edge at cy + 10 - e (stage), inside a window whose top is at -PAD.
      s.bladeU.style.transform = `translateY(${(s.cy + 10 - e + PAD).toFixed(2)}px)`;
      // Lower blade: bottom edge at cy - 10 + e (stage), inside a window whose top is at cy - 1.
      s.bladeD.style.transform = `translateY(${(s.cy - 10 + e - s.BLADE_H - (s.cy - 1)).toFixed(2)}px)`;
    }
  },
};
