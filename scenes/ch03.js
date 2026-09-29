// ch03 Market (shots 3.1-3.4).
// 3.1 ch02's report sheet turns over: its NAVY back is the price card.
// 3.2 "20.000đ/căn/tháng" counts on the card, unit and all, then the B2B2C pair completes above it: the Ban quản trị
//     pays, residents benefit.
// 3.3 the card slides away left, one BLACK façade slab rises, its windows fill to 300 and then 700 flats, and three
//     tags pin the target customer onto it.
// 3.4 the market nests TAM ⊃ SAM ⊃ SOM, three cut rectangles that slide in and count; SAM's digits land on
//     successive 8th notes.
// Every beat is anchored to the story beats L09-L11 (reading time on the 108 BPM grid, ctx.line / ctx.syl / ctx.snap):
// each beat's text holds, unoccluded, until the beat ends; hits and landings sit on 16ths, up to 0.05 s early, never
// late. Nothing uses film-absolute seconds. Seeds 300-399.
import { step, spring, track, PRESETS } from '../lib/motion.js';
import { C, el, rough, rect, clip } from '../lib/paper.js';
import { W, H, text, tag, odometer, flip, vis } from '../lib/kit.js';
import { SHEET } from '../lib/handoff.js';

const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';
// Counts land without the default preset's 1.5 % overshoot, which leaves a landed digit a fifth of a slot off for
// almost half a second; these settle flat, so the figure reads the moment it lands on its word.
const COUNT = { f: 1.3, z: 0.9 };
const COUNT_FAST = { f: 1.6, z: 0.9 }; // TAM and SOM, skimmed context for SAM, count briskly
const TOL = 0.1; // a digit has landed when it is within a tenth of its slot
const WIPE = { f: 1.3, z: 0.85 }; // TAM crossing the whole frame: little overshoot on a long travel

// Time from a spring's start to its first arrival at the target (the visible "landing" of a slide or a count).
function firstHit(p) {
  const { f, z } = typeof p === 'string' ? PRESETS[p] : p;
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - z * z);
  return (Math.PI - Math.atan2(wd, z * w)) / wd;
}

// Time from a spring's start until it stays within tol of its target, for a move of `travel` (in the same units).
function settle(p, travel, tol = TOL) {
  let last = 0;
  for (let t = 0; t < 4; t += 1 / 240) if (Math.abs(1 - step(t, p)) * travel > tol) last = t;
  return last + 1 / 240;
}

// Time from an odometer.roll() start (stagger 0.06 s) until its last digit stays within TOL of its slot.
const countSpan = (digits, p) => Math.max(...digits.map((d, k) => 0.06 * k + settle(p, d + (k ? 10 : 0))));

// The spring with damping z whose `travel`-slot move comes within `tol` slots of its target in `dur` s (settling
// time scales as 1/f).
const tuned = (z, travel, dur, tol = TOL) => ({ f: settle({ f: 1, z }, travel, tol) / dur, z });

// Baseline of one line of text, from the top of its box (fonts are loaded before build).
function baseline(parent, cls, size, lh) {
  const e = el(parent, cls, { fontSize: `${size}px`, lineHeight: lh, whiteSpace: 'nowrap' },
    'H<span style="display:inline-block;width:0;height:0"></span>');
  const b = e.lastChild.offsetTop;
  e.remove();
  return b;
}

// A counting figure (DISPLAY odometer, hand-cut edge) with its unit (LABEL) beside it on the same baseline.
// The two pieces sit side by side and never wrap: "20.000đ" + "/căn/tháng", "32,4" + "tỷ đ/năm".
function figure(parent, value, unit, { size, usize, color, gap }) {
  const box = el(parent, '', { transformOrigin: '0 60%' });
  const odo = odometer(box, value, { cls: 'disp cut-text', size, color, lh: 1.0 });
  const u = text(box, 'label', unit, { size: usize, color });
  const fb = baseline(box, 'disp', size, 1.0);
  const ub = baseline(box, 'label', usize, 1.2);
  Object.assign(u.el.style, { left: `${odo.w + gap}px`, top: `${Math.round(fb - ub)}px` });
  const w = odo.w + gap + u.w;
  Object.assign(box.style, { width: `${w}px`, height: `${size}px` });
  return { el: box, odo, unit: u, w, h: size };
}

// A cut-paper tag (kit.tag) whose paper, not its text, casts ch01's small hard shadow. The paper is the label's
// sibling just before it, whatever layers kit.tag wraps them in.
function paperTag(parent, s, opts) {
  const t = tag(parent, s, opts);
  const paper = t.label.previousElementSibling;
  const lift = el(paper.parentNode, '', { width: `${t.w}px`, height: `${t.h}px`, filter: SHADOW });
  paper.parentNode.insertBefore(lift, paper);
  lift.appendChild(paper);
  return t;
}

// A band of paper with a hand-cut edge whose right and bottom edges run off the frame (nested market rectangles).
function band(parent, color, x, y, seed, lifted) {
  const w = W + 80 - x;
  const h = H + 80 - y;
  const box = el(parent, '', { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const holder = lifted ? el(box, '', { width: `${w}px`, height: `${h}px`, filter: SHADOW }) : box;
  el(holder, '', {
    width: `${w}px`, height: `${h}px`, background: color,
    clipPath: clip(rough(rect(0, 0, w, h), { seed, amp: 5, wave: 80, spacing: 10 })),
  });
  return box;
}

export default {
  build(ctx) {
    const root = ctx.root;
    const L09 = ctx.line('L09');
    const L10 = ctx.line('L10');
    const L11 = ctx.line('L11');
    const syl = (id, k) => ctx.syl(id, k);
    const slideIn = firstHit('slide');

    // Beats (chapter-local seconds), all from the story beats and the grid. ctx.syl(id, k) is subdivision k of a beat
    // (by the old voice line's syllables, snapped to 16ths); hits land on them up to 0.05 s early, never late.
    const T = {
      pose: ctx.snap(0.4 + slideIn) - 0.02 - slideIn, // the turned card lands in its price pose on a 16th
      b2b: L09.start - 0.03 - slideIn, // "Mô hình B2B2C" lands as L09 starts...
      tag1: L09.start - 0.02 - slideIn, // ...with "Ban quản trị trả phí"
      lock: syl('L09', 4) - 0.02, // "20.000đ/căn/tháng" is complete
      arrow: syl('L09', 7) - 0.02 - firstHit('snap'), // then the arrow pushes out of tag 1...
      tag2: syl('L09', 8) - 0.02 - slideIn, // ...and "Cư dân hưởng lợi" slides in to its head
      out: L09.end, // 3.2 slides away left in the gap after L09
      slab: L10.start - 0.02 - slideIn, // the façade slab lands as...
      head: L10.start - 0.04, // ..."KHÁCH HÀNG" slams
      pin1: syl('L10', 2) - 0.04, // "300–700 căn" pins
      lit300: syl('L10', 3), // windows fill to 300...
      lit700: syl('L10', 6), // ...then to 700
      pin2: syl('L10', 8) - 0.04, // "dưới 10 năm"
      pin3: syl('L10', 10) - 0.04, // "có Ban quản trị", early enough to be read before TAM covers it (readcheck)
      tam: L11.start - 0.02 - firstHit(WIPE), // TAM wipes over the façade (at L10.end its edge is still right of the slab)
      sam: syl('L11', 2) - 0.02 - slideIn, // SAM rises with its caption
      som: syl('L11', 8) - 0.02 - slideIn, // SOM slides in from the corner
    };
    // "20.000đ/căn/tháng" starts counting the moment the card lands in its price pose, so the card never sits blank, and
    // locks like an odometer carrying: the "2" rolls up from 0 while the zeros spin two full turns, each slot on a
    // spring tuned to read as landed (within a quarter slot) at its lock time (zeros right to left, 0.03 s apart,
    // the "2" last), so the figure reads …19.999 → 20.000. The unit is on the card from the count's first frame.
    T.count = T.pose + slideIn;
    T.slotP = [0, 1, 2, 3, 4].map((k) => {
      const at = k === 0 ? T.lock : T.lock - 0.03 * k;
      return tuned(0.95, k === 0 ? 2 : 20, Math.max(0.6, at - T.count), 0.25);
    });
    // TAM and SOM count briskly (odometer stagger 0.06 s) and are complete on a 16th: TAM two 16ths into L11, SOM on
    // the first 16th after a count started with its slide. SAM's slots all roll as it rises and land one per 8th note
    // ("3", "2", "4"; they travel 3, 12 and 14 slots, each on a spring tuned to land then), then it slams.
    T.tamDone = ctx.snap(L11.start + 2 * ctx.grid) - 0.02;
    T.samLand = [0, 2, 4].map((k) => syl('L11', 4) + k * ctx.grid - 0.02);
    T.samDone = T.samLand[2];
    T.samCount = T.sam + 0.1;

    // Ground: CREAM from t = 0 (ch02's flip exit paints over it for its first FLIP_EDGE seconds).
    el(root, '', { width: `${W}px`, height: `${H}px`, background: C.cream });

    // ---- 3.1-3.2: the NAVY card, exactly at SHEET while it turns out.
    const cw = SHEET.w;
    const chh = SHEET.h;
    const card = el(root, '', {
      left: `${SHEET.cx - cw / 2}px`, top: `${SHEET.cy - chh / 2}px`, width: `${cw}px`, height: `${chh}px`, transformOrigin: '50% 50%',
    });
    const cardLift = el(card, '', { width: `${cw}px`, height: `${chh}px`, filter: SHADOW });
    el(cardLift, '', { width: `${cw}px`, height: `${chh}px`, background: C.navy, clipPath: clip(rough(rect(0, 0, cw, chh), { seed: 301, amp: 4 })) });
    const price = figure(card, '20.000đ', '/căn/tháng', { size: 240, usize: 64, color: C.cream, gap: 18 });
    const POSE = { cx: 1080, cy: 800, rot: -1.5 };
    // Centre the price in the part of the card that stays in frame (the card runs off the bottom edge).
    const visTop = POSE.cy - chh / 2;
    const priceTop = Math.round((visTop + H) / 2 - visTop - price.h / 2);
    Object.assign(price.el.style, { left: `${Math.round((cw - price.w) / 2)}px`, top: `${priceTop}px` });

    const EXIT = 2100; // 3.2 leaves left by this much
    const cardX = track(SHEET.cx, [[T.pose, POSE.cx], [T.out, POSE.cx - EXIT, 'drop']]);
    const cardY = track(SHEET.cy, [[T.pose, POSE.cy]]);
    const cardR = track(SHEET.rot, [[T.pose, POSE.rot]]);

    // The B2B2C pair above the card: tag 1 -> cut-paper arrow -> tag 2, with the model's name over them.
    const ROW = { x: 170, y: 292 };
    const b2b = text(root, 'label', 'Mô hình B2B2C', { size: 44, color: C.black });
    b2b.el.style.top = `${ROW.y - 78}px`;
    const arrowEl = el(root, '', {});
    const tag1 = paperTag(root, 'Ban quản trị trả phí', { size: 48, color: C.cream, bg: C.navy, seed: 311 });
    const tag2 = paperTag(root, 'Cư dân hưởng lợi', { size: 48, color: C.black, bg: C.orange, seed: 312 });
    const AL = 230; // arrow length
    const AH = 78; // arrow head height
    const AS = 15; // half the shaft's thickness
    const arrowPts = [[0, AH / 2 - AS], [AL - 66, AH / 2 - AS], [AL - 66, 0], [AL, AH / 2], [AL - 66, AH], [AL - 66, AH / 2 + AS], [0, AH / 2 + AS]];
    Object.assign(arrowEl.style, {
      width: `${AL}px`, height: `${AH}px`, background: C.black, top: `${ROW.y + tag1.h / 2 - AH / 2}px`,
      clipPath: clip(rough(arrowPts, { seed: 313, amp: 2.5, spacing: 7 })),
    });
    const arrowRest = ROW.x + tag1.w + 18; // arrow's left end at rest (its tail tucked under tag 1 before it pushes out)
    const tag2X = arrowRest + AL + 18;
    tag1.el.style.top = `${ROW.y}px`;
    tag2.el.style.top = `${ROW.y - 4}px`;
    const rowX = {
      b2b: track(-b2b.w - 60, [[T.b2b, ROW.x], [T.out + 0.05, ROW.x - EXIT, 'drop']]),
      tag1: track(-tag1.w - 60, [[T.tag1, ROW.x], [T.out + 0.05, ROW.x - EXIT, 'drop']]),
      arrow: track(ROW.x + tag1.w - AL - 30, [[T.arrow, arrowRest, 'snap'], [T.out + 0.05, arrowRest - EXIT, 'drop']]),
      tag2: track(W + 60, [[T.tag2, tag2X], [T.out + 0.05, tag2X - EXIT, 'drop']]),
    };

    // ---- 3.3: one tall BLACK façade slab with 20 x 35 = 700 windows, the target customer pinned onto it.
    const head = text(root, 'disp cut-text', 'KHÁCH / HÀNG', { size: 210, color: C.black, transformOrigin: '0 50%' });
    Object.assign(head.el.style, { left: '170px', top: `${Math.round((H - head.h) / 2)}px` });
    const SL = { x: 1110, y: 150, w: 640, h: 1000 };
    const slab = el(root, '', { left: `${SL.x}px`, top: `${SL.y}px`, width: `${SL.w}px`, height: `${SL.h}px` });
    el(slab, '', { width: `${SL.w}px`, height: `${SL.h}px`, background: C.black, clipPath: clip(rough(rect(0, 0, SL.w, SL.h), { seed: 321, amp: 4 })) });
    const COLS = 20; // 5 bays of 4 windows, separated by piers
    const ROWS = 35;
    const ww = 18;
    const wh = 12;
    const bayW = 4 * ww + 3 * 8;
    const bayGap = 24;
    const x0 = (SL.w - (5 * bayW + 4 * bayGap)) / 2;
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const y = 40 + r * 25;
      const polys = [];
      for (let c = 0; c < COLS; c++) {
        const x = x0 + Math.floor(c / 4) * (bayW + bayGap) + (c % 4) * (ww + 8);
        polys.push(rough(rect(x, 0, ww, wh), { seed: 330 + ((r * COLS + c) % 60), amp: 1.2, spacing: 5 }));
      }
      const row = el(slab, '', { top: `${y}px`, width: `${SL.w}px`, height: `${wh}px`, background: C.cream, clipPath: clip(...polys) });
      const k = ROWS - 1 - r; // windows fill from the ground floor up
      row.__t = k < 15 ? T.lit300 + k * 0.024 : T.lit700 + (k - 15) * 0.024;
      rows.push(row);
    }
    const pins = [
      { s: '300–700 căn', bg: C.orange, color: C.black, cx: 232, cy: 232, rot: -3, t: T.pin1, seed: 341 },
      { s: 'dưới 10 năm', bg: C.cream, color: C.black, cx: 418, cy: 470, rot: 2.5, t: T.pin2, seed: 342 },
      { s: 'có Ban quản trị', bg: C.navy, color: C.cream, cx: 254, cy: 702, rot: -1.5, t: T.pin3, seed: 343 },
    ].map((p) => {
      const tg = paperTag(slab, p.s, { size: 56, color: p.color, bg: p.bg, seed: p.seed });
      Object.assign(tg.el.style, { left: `${p.cx - tg.w / 2}px`, top: `${p.cy - tg.h / 2}px` });
      return { ...p, el: tg.el };
    });
    const slabY = (t) => spring(t, T.slab, H - SL.y + 40, 0, 'slide');

    // ---- 3.4: TAM (ORANGE) ⊃ SAM (NAVY) ⊃ SOM (CREAM), nested at the bottom-right corner, off frame.
    const R = { tam: [150, 110], sam: [540, 400], som: [1180, 740] };
    const tam = band(root, C.orange, ...R.tam, 351, true);
    const sam = band(root, C.navy, ...R.sam, 352, true);
    const som = band(root, C.cream, ...R.som, 353, true);
    const acr = (parent, s, color) => text(parent, 'disp cut-text', s, { size: 64, color, left: '56px', top: '40px' });
    acr(tam, 'TAM', C.black);
    acr(sam, 'SAM', C.cream);
    acr(som, 'SOM', C.black);
    const tamFig = figure(tam, '96–120', 'tỷ đ/năm', { size: 104, usize: 48, color: C.black, gap: 16 });
    Object.assign(tamFig.el.style, { left: '56px', top: '118px' });
    const samFig = figure(sam, '32,4', 'tỷ đ/năm', { size: 150, usize: 56, color: C.cream, gap: 18 });
    Object.assign(samFig.el.style, { left: '56px', top: '118px' });
    text(sam, 'label', 'thị trường mục tiêu', { size: 40, color: C.cream, left: '58px', top: '284px' });
    const somFig = figure(som, '0,54–5,4', 'tỷ đ/năm', { size: 100, usize: 44, color: C.black, gap: 16 });
    Object.assign(somFig.el.style, { left: '56px', top: '114px' });
    T.tamCount = T.tamDone - countSpan(tamFig.odo.digits, COUNT_FAST);
    const somSpan = countSpan(somFig.odo.digits, COUNT_FAST);
    T.somDone = ctx.snap(T.som + somSpan + ctx.grid / 2) - 0.02;
    T.somCount = T.somDone - somSpan;
    const samTravel = samFig.odo.digits.map((d, k) => d + (k ? 10 : 0));
    T.samP = samTravel.map((v, k) => tuned(COUNT.z, v, T.samLand[k] - T.samCount));

    return {
      T, card, price, cardX, cardY, cardR, b2b, tag1, tag2, arrowEl, rowX, head, slab, slabY, rows, pins,
      tam, sam, som, tamFig, samFig, somFig, samTravel, R,
    };
  },

  render(s, t) {
    const { T } = s;

    // 3.1-3.2: the card turns out at SHEET (back face only), settles, then leaves left with the pair.
    const f = flip(t, 0);
    const gone32 = t > T.out + 1.4;
    if (vis(s.card, f.back && !gone32)) {
      s.card.style.transform = `translate(${s.cardX(t) - SHEET.cx}px, ${s.cardY(t) - SHEET.cy}px) rotate(${s.cardR(t)}deg) scaleX(${f.sx})`;
    }
    if (vis(s.price.el, t >= T.count)) s.price.odo.place(T.slotP.map((p, k) => spring(t, T.count, 0, k ? 20 : 2, p)));
    if (vis(s.b2b.el, t >= T.b2b && !gone32)) s.b2b.el.style.transform = `translateX(${s.rowX.b2b(t)}px)`;
    if (vis(s.tag1.el, t >= T.tag1 && !gone32)) {
      s.tag1.el.style.transform = `translateX(${s.rowX.tag1(t)}px) rotate(${spring(t, T.tag1, -5, -2, 'slide')}deg)`;
    }
    if (vis(s.arrowEl, t >= T.arrow && !gone32)) s.arrowEl.style.transform = `translateX(${s.rowX.arrow(t)}px)`;
    if (vis(s.tag2.el, t >= T.tag2 && !gone32)) {
      s.tag2.el.style.transform = `translateX(${s.rowX.tag2(t)}px) rotate(${spring(t, T.tag2, 5, 1.5, 'slide')}deg)`;
    }

    // 3.3: slab rises, heading slams, windows fill 300 then 700, three tags pin.
    const covered = t > T.tam + 1.2; // TAM has landed over the whole façade frame
    if (vis(s.slab, t >= T.slab && !covered)) {
      s.slab.style.transform = `translateY(${s.slabY(t)}px)`;
      for (const row of s.rows) vis(row, t >= row.__t);
      for (const p of s.pins) {
        if (vis(p.el, t >= p.t)) {
          const k = spring(t, p.t, 1.2, 1, 'snap');
          const dy = spring(t, p.t, -18, 0, 'snap');
          p.el.style.transform = `translateY(${dy}px) rotate(${spring(t, p.t, p.rot + 6, p.rot, 'snap')}deg) scale(${k})`;
        }
      }
    }
    if (vis(s.head.el, t >= T.head && !covered)) s.head.el.style.transform = `scale(${spring(t, T.head, 1.1, 1, 'slam')})`;

    // 3.4: TAM wipes in from the right, SAM rises, SOM slides in from the corner; each counts.
    if (vis(s.tam, t >= T.tam)) {
      s.tam.style.transform = `translateX(${spring(t, T.tam, W - s.R.tam[0] + 60, 0, WIPE)}px)`;
      s.tamFig.odo.roll(t, T.tamCount, { preset: COUNT_FAST });
    }
    if (vis(s.sam, t >= T.sam)) {
      s.sam.style.transform = `translateY(${spring(t, T.sam, H - s.R.sam[1] + 60, 0, 'slide')}px)`;
      s.samFig.odo.place(s.samTravel.map((v, k) => spring(t, T.samCount, 0, v, T.samP[k])));
      s.samFig.el.style.transform = `scale(${t < T.samDone ? 1 : spring(t, T.samDone, 1.07, 1, 'slam')})`;
    }
    if (vis(s.som, t >= T.som)) {
      const u = 1 - spring(t, T.som, 0, 1, 'slide');
      s.som.style.transform = `translate(${u * (W - s.R.som[0] + 60)}px, ${u * (H - s.R.som[1] + 60)}px)`;
      s.somFig.odo.roll(t, T.somCount, { preset: COUNT_FAST });
    }
  },
};
