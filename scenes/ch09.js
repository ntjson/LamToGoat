// ch09 Business (shots 9.1-9.4): what one building earns, what the start costs, and where the roadmap climbs to.
// 9.1 ch08's NAVY strip fills the frame (ch08's exit); here the frame is plain NAVY until EXIT.ch08.
// 9.2 A BLACK façade of 25 × 20 = 500 windows rises out of the NAVY field. The windows light ORANGE in one sweep and
//     "10 TRIỆU" counts with them (the lit share of the 500 flats is the share of the 10 triệu); "/THÁNG" stamps.
//     The revenue bar under the figure is cut at 59,2 %: the profit piece flips over to CREAM ("lợi nhuận ròng"), the
//     rest stays ORANGE, and "59,2%" counts digit by digit, then stamps.
// 9.3 HARD CUT to CREAM on L31's first beat, with the capital strip "CẦN 200 TRIỆU" slamming; "cho 8 tháng đầu"
//     slides out from under it; the timeline band slides in from 10/2026; the ORANGE flag "HÒA VỐN VẬN HÀNH" snaps
//     up at 08/2027 and the date types itself on; a slow PUSH that keeps every text in frame, and the date stamps
//     once more. All of it holds to L31's end.
// 9.4 9.3's paper slides away left; four NAVY façades rise left to right, one per beat, their windows lighting;
//     "20–25 TÒA" slams on the top step; the ORANGE MRR banner slides across GĐ3, counts, and stamps.
// Exit (EXIT.ch09): the CREAM ground and the staircase slide out left together, the ground's right edge hand-cut,
// onto ch10's BLACK field. No voice: every beat sits on the music's grid, anchored to L30-L32 (ctx.line / ctx.syl /
// ctx.snap); nothing uses film-absolute seconds. Seeds 900-999.
import { step, spring, hash, PRESETS } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged, pathData } from '../lib/paper.js';
import { W, H, text, odometer, flip, svg, stroke, drawOn, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';
const COUNT = { f: 1.3, z: 0.9 }; // odometer digits that lock without the default preset's visible overshoot
const TOL = 0.1; // a digit has landed once it stays within a tenth of its slot
const FAC = { f: 1.4, z: 0.8 }; // 9.2: the façade rising out of the NAVY field
const RISE = { f: 2.2, z: 0.72 }; // 9.4: a façade step thumping up into place
const PART = { f: 2, z: 1 }; // the cost piece of the cut bar easing away from the profit piece
const OUT = { f: 1.6, z: 0.9 }; // 9.3's paper leaving left at the change of shot
const EXIT_P = { f: 1.3, z: 1 }; // the whole CREAM sheet pulled out left, no bounce
const EXIT_D = W + 340; // its travel: the hand-cut right edge rests just past the frame and ends far left of it
const LEAD = 0.03; // a hit leads its grid point by this much (under 2 frames at 60 fps); it never trails
const PUSH = { f: 0.7, z: 1 }; // 9.3's slow push-in (8 %), moving through most of the reading hold

const params = (p) => (typeof p === 'string' ? PRESETS[p] : p);

// Time from a spring's start until it stays within tol of its target, for a move of `travel` (same units as tol).
function settle(p, travel, tol = TOL) {
  let last = 0;
  for (let t = 0; t < 5; t += 1 / 240) if (Math.abs(1 - step(t, p)) * travel > tol) last = t;
  return last + 1 / 240;
}

// Time from a spring's start to its first arrival at the target (the landing of a slide, a rise, a snap).
function firstHit(p) {
  const { f, z } = params(p);
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - z * z);
  return (Math.PI - Math.atan2(wd, z * w)) / wd;
}

// The spring with damping z whose `travel`-slot move settles in exactly `dur` s (settling time scales as 1/f).
const tuned = (z, travel, dur) => ({ f: settle({ f: 1, z }, travel) / dur, z });

// First time a spring's progress reaches u (0 < u < 1); the rising part is monotone, so bisect.
function reach(p, u) {
  let b = 0.05;
  while (step(b, p) < u && b < 10) b += 0.05;
  let a = b - 0.05;
  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    if (step(m, p) < u) a = m;
    else b = m;
  }
  return b;
}

// Baseline of one line of text at `size` px and line-height `lh`, from the top of its box.
function baseline(parent, cls, size, lh) {
  const e = el(parent, cls, { fontSize: `${size}px`, lineHeight: lh, whiteSpace: 'nowrap' },
    'H<span style="display:inline-block;width:0;height:0"></span>');
  const b = e.lastChild.offsetTop;
  e.remove();
  return b;
}

// A flat paper sheet with a hand-cut edge, w × h at (x, y); lifted sheets cast ch01's small hard shadow.
function sheet(parent, color, x, y, w, h, { seed, amp = 3, lift = false } = {}) {
  const box = el(parent, '', { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const hold = lift ? el(box, '', { width: `${w}px`, height: `${h}px`, filter: SHADOW }) : box;
  el(hold, '', { width: `${w}px`, height: `${h}px`, background: color, clipPath: clip(rough(rect(0, 0, w, h), { seed, amp })) });
  return box;
}

// A hand-cut window: a w × h quad whose corners are nudged by up to j px (stateless hash, so every build matches).
function quad(x, y, w, h, k, seed, j = 1.6) {
  const d = (i) => (hash(k, i, seed) - 0.5) * 2 * j;
  return [[x + d(0), y + d(1)], [x + w + d(2), y + d(3)], [x + w + d(4), y + h + d(5)], [x + d(6), y + h + d(7)]];
}

// Window cells of a façade: `cols` × `rows` quads in bays of `bay` columns, bays `pier` px apart.
function cells({ x0, y0, cols, rows, bay = cols, ww, wh, gx, pier = gx, pitch, seed }) {
  const out = [];
  const bayW = bay * ww + (bay - 1) * gx + pier;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + Math.floor(c / bay) * bayW + (c % bay) * (ww + gx);
      out.push({ r, c, pts: quad(x, y0 + r * pitch, ww, wh, r * 97 + c, seed) });
    }
  }
  return out;
}

// One filled SVG path holding many polygons.
function fillPath(layer, polys, color) {
  const p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', polys.map((q) => pathData(q)).join(' '));
  p.setAttribute('fill', color);
  layer.appendChild(p);
  return p;
}

// Windows that light in order: `key` ranks the cells; they are packed into groups of `per` (one path each), so a
// frame toggles a few dozen paths rather than every window. Each group gets u, the share of all windows lit when it
// comes on (it lights as the sweep's progress passes the middle of its share).
function lights(layer, list, key, per, color) {
  const order = list.map((w, i) => ({ w, k: key(w, i) })).sort((a, b) => a.k - b.k).map((o) => o.w);
  const groups = [];
  for (let i = 0; i < order.length; i += per) {
    const g = order.slice(i, i + per);
    groups.push({ path: fillPath(layer, g.map((w) => w.pts), color), u: (i + g.length / 2) / order.length });
  }
  return groups;
}

export default {
  exit: EXIT.ch09,

  build(ctx) {
    const root = ctx.root;
    const L30 = ctx.line('L30');
    const L31 = ctx.line('L31');
    const L32 = ctx.line('L32');
    const s30 = (k) => ctx.syl('L30', k);
    const s31 = (k) => ctx.syl('L31', k);
    const cv = document.createElement('canvas').getContext('2d');
    // Ink box of one line (line-height lh), px from the element's top (fonts are loaded before build).
    const ink = (s, kind, size, lh) => {
      cv.font = kind === 'mono' ? `600 ${size}px "IBM Plex Mono"` : `${kind === 'disp' ? 800 : 700} ${size}px "Bricolage Grotesque"`;
      cv.fontStretch = kind === 'disp' ? 'condensed' : 'normal';
      const m = cv.measureText(s.normalize('NFC'));
      const base = (lh * size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      return { top: base - m.actualBoundingBoxAscent, base, bottom: base + m.actualBoundingBoxDescent, w: m.width };
    };
    const slideHit = firstHit('slide');
    const B = ctx.beat;
    // Start time of a spring whose first arrival lands LEAD s before grid time g.
    const land = (g, p) => g - LEAD - firstHit(p);

    // Beats (chapter-local seconds) on the music's grid. ctx.syl(id, k) is subdivision k of a story beat, snapped to
    // 16ths (L30 and L31 have 18 and 19 of them, about 0.29 s apart); every text lands early in its beat and holds,
    // landed, to the beat's end.
    const T = {
      fac: Math.max(EXIT.ch08 + 0.02, land(L30.start, FAC)), // the façade rises once ch08's exit is done, landing on L30
      lab: land(s30(1), 'slide'), // "500 căn × 20.000đ" lands on the 2nd subdivision...
      count: s30(1) - LEAD, // ...as the sweep and the count start...
      land10: s30(4) - LEAD, // ...which land together on the 5th
      month: s30(6) - LEAD, // "/THÁNG" stamps
      snip: s30(8) - LEAD, // the scissor line crosses the bar
      cut93: L31.start, // HARD CUT to CREAM exactly on L31's first beat...
      slam: L31.start, // ...with the capital strip "CẦN 200 TRIỆU" slamming on it
      for: land(s31(3), 'snap'), // "cho 8 tháng đầu" slides out from under the strip
      band: land(s31(5), 'slide'), // the timeline band slides in from the left, from 10/2026
      flag: land(s31(7), 'snap'), // the flag snaps up at 08/2027
      push: s31(9) - LEAD, // a slow PUSH-in over the reading hold (every text of L31 stays in frame)
      dateSay: ctx.snap(L31.end - 2.5 * B) - LEAD, // "08/2027" stamps once more, on the bar line
      out93: L31.end, // 9.3's paper leaves left once L31 has ended
    };
    T.bar = T.land10 - slideHit; // the revenue bar slides in under the figure and lands with the count
    T.part = ctx.snap(T.snip + LEAD + 0.3) - LEAD; // the two pieces part; the profit piece flips over
    // "08/2027" types on fast as the flag lands, so it's complete and readable for the rest of L31.
    T.date = [0, 1, 2, 3, 4, 5, 6].map((k) => T.flag + firstHit('snap') + 0.05 * k);
    // 9.4 on L32's beats: the steps land one per beat (the first once 9.3's paper has cleared the frame: it only
    // rises from below, so it may start while the paper is still leaving on the left), GĐ3 carries the goal, which
    // slams on its roof a beat later. The MRR banner slides in five beats before the end (the last clear event before
    // the exit); its two figures count and the banner stamps as the last digit locks, 1.7 s before the exit.
    const ceil = (t) => ctx.snap(t + ctx.grid / 2 - 1e-6); // the first grid time at or after t
    const firstStep = Math.max(L32.start, ceil(T.out93 + 0.25 + firstHit(RISE) + LEAD)); // 9.3 clears in 0.25 s
    T.land = [0, 1, 2, 3].map((k) => ctx.snap(firstStep + k * B) - LEAD);
    T.goal = ctx.snap(T.land[3] + LEAD + B) - LEAD; // "20–25 TÒA" slams on GĐ3's roof a beat after it lands
    T.mrrLand = ctx.snap(L32.end - 5 * B) - LEAD;
    T.mrr = T.mrrLand - slideHit;
    // "10 TRIỆU": the second slot turns a full 10 on a spring that settles exactly on land10; the first slot (0 -> 1)
    // starts later so it rolls over at the end, like an odometer carrying, and both lock together.
    const P10 = tuned(0.9, 10, T.land10 - T.count);
    const d10 = settle(P10, 10) - settle(P10, 1);
    // "59,2%": "5" locks on the 12th subdivision, "2" on the 14th, "9" in between; the "%" is part of the figure from
    // its first frame (a margin never reads without its unit), and the whole figure stamps on the 15th.
    T.pct = s30(11) - LEAD - settle(COUNT, 5);
    T.pctSt = (s30(13) - LEAD - settle(COUNT, 12) - T.pct) / 2;
    T.pctStamp = s30(14) - LEAD;
    // MRR: "160" locks "1" an 8th after the banner lands and its last "0" a beat later, with "2" of "200"; the zeros of
    // "200" lock an 8th after that and the banner stamps with them.
    const mrrKey = (k) => ctx.snap(T.mrrLand + LEAD + k * B) - LEAD;
    T.mrrA = mrrKey(0.5) - settle(COUNT, 1);
    T.mrrASt = (mrrKey(1.5) - settle(COUNT, 10) - T.mrrA) / 2;
    T.mrrB = mrrKey(1.5) - settle(COUNT, 2);
    T.mrrBSt = Math.max(0, (mrrKey(2) - settle(COUNT, 10) - T.mrrB) / 2);
    T.mrrStamp = mrrKey(2);

    // ================= 9.1-9.2: the NAVY field (full frame from t = 0; ch08 paints over it until EXIT.ch08).
    const navy = el(root, '', { width: `${W}px`, height: `${H}px` });
    el(navy, '', { width: `${W}px`, height: `${H}px`, background: C.navy });

    // The façade: a BLACK slab, 25 × 20 windows in five bays of five, running off the bottom of the frame.
    const F = { x: 110, y: 110, w: 790, h: 1060 };
    const fac = el(navy, '', { left: `${F.x}px`, top: `${F.y}px`, width: `${F.w}px`, height: `${F.h}px` });
    el(fac, '', { width: `${F.w}px`, height: `${F.h}px`, background: C.black, clipPath: clip(rough(rect(0, 0, F.w, F.h), { seed: 901, amp: 4 })) });
    const facWin = svg(fac, F.w, F.h);
    const wins = cells({ x0: 31, y0: 36, cols: 25, rows: 20, bay: 5, ww: 20, wh: 30, gx: 8, pier: 17, pitch: 45, seed: 902 });
    fillPath(facWin, wins.map((w) => w.pts), C.navy); // unlit: dark holes onto the night
    // One sweep from the bottom-left corner to the top-right, a little ragged; it runs on the count's own spring,
    // so the lit share of the 500 flats is always the share of the 10 triệu on the odometer.
    const sweep = lights(facWin, wins, (w, i) => 0.55 * (w.c / 24) + 0.45 * ((19 - w.r) / 19) + 0.22 * (hash(i, 903) - 0.5), 10, C.orange);
    for (const g of sweep) g.t = T.count + reach(P10, g.u);

    // The figures, flush left in the right half.
    const X0 = 1010;
    const lab = text(navy, 'label', '500 căn × 20.000đ', { size: 56, color: C.cream, left: `${X0}px`, top: '244px' });
    const FIG_Y = 330;
    const fig = el(navy, '', { left: `${X0}px`, top: `${FIG_Y}px`, transformOrigin: '0 80%' });
    const odo10 = odometer(fig, '10', { cls: 'disp cut-text', size: 150, color: C.orange, lh: 1 });
    const bO = baseline(fig, 'disp', 150, 1);
    const bT = baseline(fig, 'disp', 150, 1.1);
    const sp150 = Math.round(ink('0 0', 'disp', 150, 1).w - 2 * ink('0', 'disp', 150, 1).w);
    const trieu = text(fig, 'disp cut-text', 'TRIỆU', { size: 150, color: C.orange, left: `${odo10.w + sp150}px`, top: `${bO - bT}px` });
    const thang = text(fig, 'disp cut-text', '/THÁNG', { size: 150, color: C.orange, left: `${odo10.w + sp150 + trieu.w}px`, top: `${bO - bT}px`, transformOrigin: '0 75%' });
    const figW = odo10.w + sp150 + trieu.w + thang.w;

    // The revenue bar under the figure, and its two pieces after the cut at 59,2 %.
    const BAR = { x: X0, y: 522, w: figW, h: 86 };
    const barBox = el(navy, '', { left: `${BAR.x}px`, top: `${BAR.y}px`, width: `${BAR.w}px`, height: `${BAR.h}px` });
    const outer = clip(rough(rect(0, 0, BAR.w, BAR.h), { seed: 910, amp: 3 }));
    const whole = el(barBox, '', { width: `${BAR.w}px`, height: `${BAR.h}px`, background: C.orange, clipPath: outer });
    const cx = Math.round(BAR.w * 0.592);
    const cutLine = jagged([cx - 3, -40], [cx + 5, BAR.h + 40], { seed: 911, amp: 6, wave: 40, spacing: 7 });
    const piece = (poly, origin) => el(barBox, '', { width: `${BAR.w}px`, height: `${BAR.h}px`, clipPath: clip(poly), transformOrigin: origin });
    const pieceL = piece([[-40, -40], ...cutLine, [-40, BAR.h + 40]], `${Math.round(cx / 2)}px 50%`);
    const frontL = el(pieceL, '', { width: `${BAR.w}px`, height: `${BAR.h}px`, background: C.orange, clipPath: outer });
    const backL = el(pieceL, '', { width: `${BAR.w}px`, height: `${BAR.h}px`, background: C.cream, clipPath: outer });
    const pi = ink('lợi nhuận ròng', 'label', 52, 1.2);
    text(backL, 'label', 'lợi nhuận ròng', { size: 52, color: C.black, left: '28px', top: `${Math.round(BAR.h / 2 - (pi.top + pi.bottom) / 2)}px` });
    const pieceR = piece([...cutLine, [BAR.w + 40, BAR.h + 40], [BAR.w + 40, -40]], `${cx}px 50%`);
    el(pieceR, '', { width: `${BAR.w}px`, height: `${BAR.h}px`, background: C.orange, clipPath: outer });
    const snip = stroke(svg(barBox, BAR.w, BAR.h), cutLine, { color: C.cream, width: 8 });

    // "59,2%" counts digit by digit (the "%" is a fixed slot of the odometer, there from the first frame), then stamps.
    const pctBox = el(navy, '', { left: `${X0}px`, top: '644px', transformOrigin: '0 75%' });
    const pct = odometer(pctBox, '59,2%', { cls: 'disp cut-text', size: 150, color: C.cream, lh: 1 });

    // ================= 9.3-9.4: one CREAM sheet. Its right edge is hand-cut; it only shows when the sheet leaves.
    const cream = el(root, '', { width: `${W}px`, height: `${H}px` });
    const GP = 80;
    const edge = jagged([W + GP + 44, 0], [W + GP + 22, H + 2 * GP], { seed: 990, amp: 16, wave: 70, spacing: 10 });
    el(cream, '', {
      left: `${-GP}px`, top: `${-GP}px`, width: `${W + 2 * GP}px`, height: `${H + 2 * GP}px`, background: C.cream,
      clipPath: clip([[0, 0], ...edge, [0, H + 2 * GP]]),
    });

    // ---- 9.3: capital strip, its caption, the timeline band and the break-even flag, in one group that leaves left.
    // Every text of L31 holds to its end, so the frame is laid out to read on the phone as it stands: the strip
    // top-left, the flag right of centre, the band along the bottom. The PUSH scales the group about PIV by 8 %, which
    // keeps all of it in frame.
    const PIV = { x: 900, y: 600, k: 1.06 };
    const g93 = el(cream, '', { width: `${W}px`, height: `${H}px`, transformOrigin: `${PIV.x}px ${PIV.y}px` });
    const STRIP = { x: -60, y: 130, h: 300, pad: 180, size: 190 };
    // The caption is laid down first, so it sits under the strip and can slide out from beneath it.
    const forLab = text(g93, 'label', 'cho 8 tháng đầu', { size: 64, color: C.black, left: '132px', top: `${STRIP.y + STRIP.h + 22}px` });
    const capT = ink('200', 'disp', STRIP.size, 1.1);
    const capW = STRIP.pad + Math.round(ink('CẦN 200 TRIỆU', 'disp', STRIP.size, 1.1).w) + 100;
    const cap = sheet(g93, C.black, STRIP.x, STRIP.y, capW, STRIP.h, { seed: 940, amp: 4, lift: true });
    text(cap, 'disp cut-text', 'CẦN 200 TRIỆU', { size: STRIP.size, color: C.cream, left: `${STRIP.pad}px`, top: `${Math.round(STRIP.h / 2 - (capT.top + capT.bottom) / 2)}px` });
    cap.style.transformOrigin = `${Math.round(capW / 2)}px 50%`;

    // The band: a BLACK ground across the bottom of the frame, starting at 10/2026, with a tick standing on it for
    // every month to 08/2027 (the first and the last taller) and the two dates in CREAM on it.
    const BAND = { x: 120, y: 830, month: 88 };
    const band = el(g93, '', { width: `${W}px`, height: `${H}px` });
    const bw = W + 60 - BAND.x; // its right end stays off-frame through the push
    const bh = H + 60 - BAND.y;
    el(band, '', { left: `${BAND.x}px`, top: `${BAND.y}px`, width: `${bw}px`, height: `${bh}px`, background: C.black, clipPath: clip(rough(rect(0, 0, bw, bh), { seed: 941, amp: 4 })) });
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      const th = i === 0 || i === 10 ? 50 : 26;
      ticks.push(rough(rect(BAND.x + i * BAND.month - 4, BAND.y - th, 10, th + 4), { seed: 942 + i, amp: 1 }));
    }
    el(band, '', { width: `${W}px`, height: `${H}px`, background: C.black, clipPath: clip(...ticks) });
    const monoTop = BAND.y + 22;
    text(band, 'mono', '10/2026', { size: 60, color: C.cream, left: `${BAND.x + 4}px`, top: `${monoTop}px` });
    const XF = BAND.x + 10 * BAND.month; // 08/2027
    const dateEl = el(band, 'mono', { left: `${XF + 4}px`, top: `${monoTop}px`, fontSize: '60px', lineHeight: 1.2, color: C.cream, whiteSpace: 'nowrap', transformOrigin: '0 60%' });
    const dateCh = [...'08/2027'].map((ch) => {
      const sp = document.createElement('span');
      sp.textContent = ch;
      Object.assign(sp.style, { display: 'inline-block', transformOrigin: '50% 85%' });
      dateEl.appendChild(sp);
      return sp;
    });

    // The flag: a pole standing on the band at 08/2027 with an ORANGE flag, raised from inside the band.
    const FT = 540; // flag top at rest
    const FS = 100; // flag type
    const flagMask = el(g93, '', { left: `${XF - 30}px`, top: '0px', width: `${W - XF + 30}px`, height: `${BAND.y + 4}px`, overflow: 'hidden' });
    const flagG = el(flagMask, '', { width: `${W - XF + 30}px`, height: `${BAND.y + 4}px` });
    const poleH = BAND.y + 4 - FT;
    el(flagG, '', { left: '24px', top: `${FT}px`, width: '12px', height: `${poleH}px`, background: C.black, clipPath: clip(rough(rect(0, 0, 12, poleH), { seed: 951, amp: 1.2 })) });
    const flagIn = ink('HOA VON VAN HANH', 'disp', FS, 1.6);
    const flagW = Math.round(ink('HÒA VỐN VẬN HÀNH', 'disp', FS, 1.6).w) + FS;
    const flagH = 176;
    const flag = sheet(flagG, C.orange, 36, FT, flagW, flagH, { seed: 952, amp: 3, lift: true });
    text(flag, 'disp cut-text', 'HÒA VỐN VẬN HÀNH', { size: FS, color: C.black, lh: 1.6, left: `${FS / 2}px`, top: `${Math.round(flagH / 2 - (flagIn.top + flagIn.bottom) / 2)}px` });
    const flagFrom = BAND.y + 4 - FT + 12;

    // ---- 9.4: the staircase, four NAVY façades standing on the bottom edge, each with its phase printed on it.
    const PH = [
      ['GĐ0', 'Hoàn thiện MVP', '10/2026–01/2027'],
      ['GĐ1', 'Thí điểm', '02–05/2027'],
      ['GĐ2', 'Thương mại hóa', '06–11/2027'],
      ['GĐ3', 'Mở rộng quy mô', '12/2027–11/2028'],
    ];
    const SX = 96;
    const SG = 18;
    const SW = [336, 336, 336];
    SW.push(1862 - (SX + 3 * (336 + SG)));
    const STOP = [720, 560, 400, 250];
    const steps = PH.map(([code, what, when], i) => {
      const x = SX + i * (336 + SG);
      const w = SW[i];
      const h = H + 80 - STOP[i];
      const box = el(cream, '', { left: `${x}px`, top: `${STOP[i]}px`, width: `${w}px`, height: `${h}px` });
      const hold = el(box, '', { width: `${w}px`, height: `${h}px`, filter: SHADOW });
      el(hold, '', { width: `${w}px`, height: `${h}px`, background: C.navy, clipPath: clip(rough(rect(0, 0, w, h), { seed: 960 + i, amp: 4 })) });
      const label = text(box, 'label', `<span style="color:${C.orange}">${code}</span> / ${what} / ${when}`, { size: 36, color: C.cream, left: '24px', top: '20px' });
      return { box, x, w, h, top: STOP[i], label, winTop: 20 + label.h + 26 };
    });
    // GĐ3 carries the goal on its roof and the MRR banner under its label.
    const g3 = steps[3];
    const gb = baseline(g3.box, 'disp', 150, 1.1);
    const goal = text(g3.box, 'disp cut-text', '20–25 TÒA', { size: 150, color: C.black, left: '10px', top: `${-gb - 14}px`, transformOrigin: '0 100%' });
    const BN = { x: 22, y: g3.winTop - 6, h: 124 };
    const banner = el(g3.box, '', { left: `${BN.x}px`, top: `${BN.y}px` });
    const mrr = el(banner, '', {});
    const mO = baseline(mrr, 'disp', 90, 1);
    const mT = baseline(mrr, 'disp', 90, 1.1);
    const sp90 = Math.round(ink('0 0', 'disp', 90, 1).w - 2 * ink('0', 'disp', 90, 1).w);
    let mx = 0;
    const put = (s) => {
      const e = text(mrr, 'disp cut-text', s, { size: 90, color: C.black, left: `${mx}px`, top: `${mO - mT}px` });
      mx += e.w;
    };
    const putOdo = (s) => {
      const o = odometer(mrr, s, { cls: 'disp cut-text', size: 90, color: C.black, lh: 1, left: `${mx}px`, top: '0px' });
      mx += o.w;
      return o;
    };
    put('MRR');
    mx += sp90;
    const odoA = putOdo('160');
    put('–');
    const odoB = putOdo('200');
    mx += sp90;
    put('TRIỆU');
    const bnW = mx + 72;
    const mi = ink('MRR', 'disp', 90, 1);
    const bnPaper = sheet(banner, C.orange, 0, 0, bnW, BN.h, { seed: 971, amp: 3, lift: true });
    banner.insertBefore(bnPaper, mrr);
    Object.assign(mrr.style, { left: '36px', top: `${Math.round(BN.h / 2 - (mi.top + mi.bottom) / 2)}px` });
    banner.style.transformOrigin = `${Math.round(bnW / 2)}px ${BN.h / 2}px`; // it stamps about its centre
    g3.winTop = BN.y + BN.h + 26;

    // Windows on each step: BLACK when dark, ORANGE groups that light from the bottom up once the step has landed.
    // GĐ3's light up slowly, from the goal's slam to the MRR banner.
    steps.forEach((st, i) => {
      const cols = Math.floor((st.w - 48 + 14) / 36);
      const x0 = Math.round((st.w - (cols * 22 + (cols - 1) * 14)) / 2);
      const rows = Math.floor((st.h - st.winTop) / 46);
      const layer = svg(st.box, st.w, st.h);
      st.box.insertBefore(layer, st.label.el);
      const list = cells({ x0, y0: st.winTop, cols, rows, ww: 22, wh: 30, gx: 14, pitch: 46, seed: 980 + i });
      fillPath(layer, list.map((w) => w.pts), C.black);
      const lit = lights(layer, list, (w, k) => (rows - 1 - w.r) / rows + 0.3 * hash(k, 985 + i), i === 3 ? 8 : 4, C.orange);
      const start = T.land[i] + (i === 3 ? 0.06 : 0.02);
      const dur = i === 3 ? Math.max(0.8, T.mrr - start) : 0.55; // GĐ3's light up slowly, until the banner comes
      const LP = { f: 0.93 / dur, z: 1 };
      for (const g of lit) g.t = start + reach(LP, g.u);
      Object.assign(st, { lit, t0: T.land[i] - firstHit(RISE), from: H + 40 - st.top });
    });
    // The banner's paper must sit above the windows: move the banner to the end of GĐ3's box.
    g3.box.appendChild(banner);
    g3.box.appendChild(goal.el);

    return {
      T, dur: ctx.dur, navy, fac, facFrom: H - F.y + 30, sweep, lab, labFrom: W - X0 + 40, fig, odo10, P10, d10, thang,
      barBox, barFrom: W - X0 + 40, whole, pieceL, frontL, backL, pieceR, snip, pctBox, pct,
      cream, g93, pushK: PIV.k, cap, forLab, band, bandFrom: W + 100, dateEl, dateCh, flagG, flagFrom,
      steps, goal, banner, bannerFrom: W + 40 - (g3.x + BN.x), odoA, odoB,
    };
  },

  render(s, t) {
    const { T } = s;
    const navyOn = t < T.cut93;
    vis(s.navy, navyOn);
    vis(s.cream, !navyOn);

    if (navyOn) {
      // 9.2: the façade rises; its windows light with the count.
      if (vis(s.fac, t >= T.fac)) s.fac.style.transform = `translateY(${spring(t, T.fac, s.facFrom, 0, FAC).toFixed(2)}px)`;
      for (const g of s.sweep) vis(g.path, t >= g.t);
      if (vis(s.lab.el, t >= T.lab)) s.lab.el.style.transform = `translateX(${spring(t, T.lab, s.labFrom, 0, 'slide').toFixed(2)}px)`;
      if (vis(s.fig, t >= T.count)) {
        s.odo10.roll(t, T.count + s.d10, { preset: s.P10, stagger: -s.d10 });
        s.fig.style.transform = `scale(${spring(t, T.count, 1.06, 1, 'snap')})`;
      }
      if (vis(s.thang.el, t >= T.month)) s.thang.el.style.transform = `scale(${spring(t, T.month, 1.25, 1, 'slam')})`;

      // The bar: slides in, is cut at 59,2 %, the profit piece flips to CREAM, the cost piece eases away.
      if (vis(s.barBox, t >= T.bar)) {
        s.barBox.style.transform = `translateX(${spring(t, T.bar, s.barFrom, 0, 'slide').toFixed(2)}px)`;
        const parted = t >= T.part;
        vis(s.whole, !parted);
        vis(s.pieceL, parted);
        vis(s.pieceR, parted);
        const f = flip(t, T.part);
        vis(s.frontL, !f.back);
        vis(s.backL, f.back);
        s.pieceL.style.transform = `scaleX(${parted ? f.sx : 1})`;
        const d = step(t - T.part, PART);
        s.pieceR.style.transform = `translate(${(30 * d).toFixed(2)}px, ${(18 * d).toFixed(2)}px) rotate(${(3 * d).toFixed(3)}deg)`;
        if (vis(s.snip, t >= T.snip && t < T.part + 0.06)) drawOn(s.snip, step(t - T.snip, { f: 3, z: 1 }));
      }
      if (vis(s.pctBox, t >= T.pct)) {
        s.pct.roll(t, T.pct, { preset: COUNT, stagger: T.pctSt });
        s.pctBox.style.transform = `scale(${t >= T.pctStamp ? spring(t, T.pctStamp, 1.1, 1, 'slam') : 1})`;
      }
      return;
    }

    // 9.3: the capital, the band and the flag; then the whole group leaves left.
    if (vis(s.g93, t < T.out93 + 1)) {
      const k = spring(t, T.push, 1, s.pushK, PUSH);
      s.g93.style.transform = `translateX(${spring(t, T.out93, 0, -2600, OUT).toFixed(2)}px) scale(${k.toFixed(4)})`;
      if (vis(s.cap, t >= T.slam)) s.cap.style.transform = `rotate(-2deg) scale(${spring(t, T.slam, 1.14, 1, 'slam')})`;
      if (vis(s.forLab.el, t >= T.for)) s.forLab.el.style.transform = `translateY(${spring(t, T.for, -112, 0, 'snap').toFixed(2)}px)`;
      if (vis(s.band, t >= T.band)) s.band.style.transform = `translateX(${spring(t, T.band, -s.bandFrom, 0, 'slide').toFixed(2)}px)`;
      s.dateCh.forEach((sp, k) => {
        if (vis(sp, t >= T.date[k])) sp.style.transform = `scale(${spring(t, T.date[k], 1.45, 1, 'snap')})`;
      });
      s.dateEl.style.transform = `scale(${t >= T.dateSay ? spring(t, T.dateSay, 1.25, 1, 'snap') : 1})`;
      if (vis(s.flagG, t >= T.flag)) s.flagG.style.transform = `translateY(${spring(t, T.flag, s.flagFrom, 0, 'snap').toFixed(2)}px)`;
    }

    // 9.4: the steps rise one per beat, their windows light; the goal slams; the MRR banner slides in, counts, stamps.
    for (const st of s.steps) {
      if (vis(st.box, t >= st.t0)) {
        st.box.style.transform = `translateY(${spring(t, st.t0, st.from, 0, RISE).toFixed(2)}px)`;
        for (const g of st.lit) vis(g.path, t >= g.t);
      }
    }
    if (vis(s.goal.el, t >= T.goal)) s.goal.el.style.transform = `scale(${spring(t, T.goal, 1.16, 1, 'slam')})`;
    if (vis(s.banner, t >= T.mrr)) {
      const k = t >= T.mrrStamp ? spring(t, T.mrrStamp, 1.16, 1, 'snap') : 1; // the last stamp: held a little longer
      s.banner.style.transform = `translateX(${spring(t, T.mrr, s.bannerFrom, 0, 'slide').toFixed(2)}px) scale(${k.toFixed(4)})`;
      s.odoA.roll(t, T.mrrA, { preset: COUNT, stagger: T.mrrASt });
      s.odoB.roll(t, T.mrrB, { preset: COUNT, stagger: T.mrrBSt });
    }

    // Exit: the CREAM sheet and everything on it slide out left, uncovering ch10's BLACK field.
    const x = t >= s.dur ? spring(t, s.dur, 0, -EXIT_D, EXIT_P) : 0;
    s.cream.style.transform = `translateX(${x.toFixed(2)}px)`;
  },
};
