// ch07 USP 2: after publication (shots 7.1-7.7). Layer two of the fund's protection, shown through the product's own
// screens: a published expense is sealed and not even the management can edit it; a resident traces the verified
// expense back to the report it came from (the hook's lost complaint, word for word); the record's hash is kept at four
// independent places; an edit is caught at once, and nobody can erase the trace. The film has no voice: every beat is
// anchored to the story beats L23-L27 on the music's grid (ctx.line / ctx.syl; moves that land start early by their
// spring's first-arrival time), each beat's text lands early and holds to the beat's end; nothing uses film-absolute
// seconds. The same phrase or statement never shows twice in one frame, the UI's text included (CLAUDE.md); the four
// identical hash copies of 7.4-7.6 are the one exception, since the repetition is the picture.
//
// 7.1  (underlap) CREAM paper tears diagonally across ch06's held BLACK frame in two pulls; the NAVY "2" slams on the
//      cream and a NAVY "layer two" bar shoots in under it (ch06 opened layer one with an ORANGE bar).
// 7.2  "SAU KHI / CÔNG BỐ" rises out from behind the bar, then "ngay cả ban quản lý / cũng không sửa được" under it;
//      the checkbox line and the publish button slide in; the NAVY oval seal "NIÊM PHONG" stamps beside the button; an
//      ORANGE bracket snaps under the UI's "không thể chỉnh sửa", the only place that phrase is on screen.
// 7.3  A NAVY façade rises; its window opens like lift doors onto the verified expense (7.3a). "Cư dân / LẦN / NGƯỢC /
//      từ khoản chi / về phản ánh ban đầu" rise out of slits in the façade; the screen scrolls to the accountability
//      chain (7.3b) and a CREAM bracket climbs step 4 → 1. The window shuts (HARD CUT) and, a 16th later on the beat,
//      the hook's bubble SLAMs in alone as in ch01, its words where the report's title will be; one beat on, the
//      match cut: HARD CUT to the original report (7.3c), the words unmoved, only the paper around them changed.
// 7.4  ORANGE and CREAM close in like doors; "MÃ BĂM" slams; the verified card slides up; four NAVY copies of the hash
//      slide in and "4 nơi độc lập" counts with them.
// 7.5  A RED torn copy "4b70…e8" slips in crooked under the stack.
// 7.6  "SỬA LÉN?" slams; HARD CUT verified → mismatch (only the badge changes); "BÁO LỖI NGAY." slides in.
// 7.7  The fields part like doors onto NAVY while the camera pushes in on the red badge (to 60 px below centre);
//      "KHÔNG AI XÓA / ĐƯỢC DẤU VẾT." slams line by line on the NAVY above it; hold.
// ch08 covers the held last frame with CREAM (its underlap + kit.cover), so nothing here animates past the push.
import { step, spring, track, noise1, hash, lerp, PRESETS } from '../lib/motion.js';
import { C, el, rough, rect, bubble, clip } from '../lib/paper.js';
import { W, H, text, tag, odometer, plate, vis } from '../lib/kit.js';

const SEED = 700; // this chapter's seeds are 700-799 (the hook's bubble keeps ch01's seed 11, on purpose)
const UNDERLAP = 0.95;

const TEAR1 = { f: 2.6, z: 0.72 }; // the first pull of the rip, to mid-frame, catching with a jolt
const TEAR2 = { f: 2.3, z: 1 }; // the second pull, the rest of the way
const SCROLL = { f: 2.4, z: 1 }; // the app scrolling 7.3a → 7.3b (never past the end of the screenshot)
const DOORS = { f: 2.2, z: 1 }; // the façade window opening like lift doors
const WIPE = { f: 3.0, z: 1 }; // 7.3 → 7.4: the two fields close in like doors and land dead (at rest in ~0.56 s)
const SLY = { f: 1.05, z: 0.85 }; // the edited copy slipping in
const LAYER = { f: 1.6, z: 0.8 }; // the layer bar shooting in along the frame
const COUNT = { f: 1.3, z: 0.9 }; // the director's odometer preset (no visible overshoot)

// The resident's report, word for word from the product (android-light-06-issue-detail), broken where the real report
// breaks its title (7.3c), so the hook's bubble can lay its words on the report's (ch01 breaks it after "tầng 3,").
const TITLE = ['Thang máy B kẹt cửa ở tầng 3, phải bấm', 'nhiều lần mới mở được.'];
const CFONT = 72; // ch01's size for them
// The deck's hashes ("Công nghệ cốt lõi"): the anchored record and the edited one.
const HASH = '9f2a…c1';
const EDIT = '4b70…e8';

// Positions measured inside the screenshots, in source px relative to each crop's origin (the file and the crop are in
// docs/crops.json); converted with the crop's own scale from ctx.crop(), so no screen size is typed here.
const WORDS_72B = [1479, 1982]; // 7.2b, "không thể chỉnh sửa": ink from the k to the a (the period excluded)
const DESC_72B = 103; // 7.2b: lowest descender of that line (the g of "không")
const STEPS_73B = [364.5, 577.5, 850.5, 991.5]; // 7.3b: centres of the step numbers 1, 2, 3, 4
const TITLE_73C = { x: [48, 1089], base: [193, 274] }; // 7.3c: the title's ink from the T to the m of "bấm"; its two baselines
const BADGE_76 = [3082, 159.5]; // 7.6: centre of the "Phát hiện sai lệch toàn vẹn" pill

const OV = 7; // a window's paper overlaps the UI by 4-7 px (4 px plus the cut's 3 px jitter, as kit.aperture)

// Ink metrics of one line of text as text() lays it out (line-height lh): px from the element's top.
const cv = document.createElement('canvas').getContext('2d');
function ink(s, kind, size, lh) {
  cv.font = kind === 'mono' ? `600 ${size}px "IBM Plex Mono"` : `${kind === 'disp' ? 800 : 700} ${size}px "Bricolage Grotesque"`;
  cv.fontStretch = kind === 'disp' ? 'condensed' : 'normal';
  const m = cv.measureText(s.normalize('NFC'));
  const base = (lh * size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  return { top: base - m.actualBoundingBoxAscent, base, bottom: base + m.actualBoundingBoxDescent, left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight };
}

const place = (e, x, y) => Object.assign(e.style, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px` });

// Seconds until a critically damped spring is within `px` of a `dist` px move (when a piece is truly at rest).
function settle(p, dist, px = 0.5) {
  let a = 0;
  let b = 6;
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    if ((1 - step(m, p)) * dist > px) a = m;
    else b = m;
  }
  return b;
}

// Seconds until an underdamped spring first reaches its target (where a slide lands): scanned forward, then refined.
function firstArrival(p) {
  let b = 0.001;
  while (b < 8 && step(b, p) < 1) b += 0.001;
  let a = b - 0.001;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (step(m, p) < 1) a = m;
    else b = m;
  }
  return b;
}

// Type on ctx.top sits above the stage grain; fill its glyphs with the same grained paper so it matches type printed
// on ctx.root (the grain darkens paper by about 7 %).
function grainText(e, color) {
  e.classList.add('grained');
  Object.assign(e.style, { backgroundColor: color, color: 'transparent', backgroundClip: 'text', webkitBackgroundClip: 'text' });
}

// A torn paper edge from p0 to p1: slow lobes plus a zigzag of fibres, the hook's tear (ch01) drawn along a line.
function torn([x0, y0], [x1, y1], seed, { lobe = 24, zig = 15, spacing = 30 } = {}) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const n = Math.max(2, Math.round(len / spacing));
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const off = lobe * noise1((u * len) / 280, seed) + zig * (hash(k, seed) * 2 - 1);
    pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
  }
  return pts;
}

// The fibre fringe of a torn edge: the edge resampled every few px, pushed outward (toward nx, ny) by short fibres of
// irregular length, closed back along the edge itself. Drawn in the sheet's colour, it frays the tear like ch01's.
function fibres(pts, [nx, ny], seed, { step: gap = 6, min = 3, max = 18 } = {}) {
  const line = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / gap));
    for (let k = 0; k < n; k++) line.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  line.push(pts[pts.length - 1]);
  const outer = line.map(([x, y], i) => {
    const r = hash(i, seed);
    const len = min + (max - min) * r * (i % 2 ? r : 0.3);
    return [x + nx * len, y + ny * len];
  });
  const inner = line.map(([x, y]) => [x - nx * 3, y - ny * 3]).reverse();
  return [...outer, ...inner];
}

// A piece of grained paper (ctx.top) cut to a polygon given in stage px. Move it with slidePaper(), which keeps its
// grain pinned to the stage, so pieces that overlap never show a seam in the texture.
function paper(parent, poly, color, seed, amp = 3) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const e = el(parent, 'grained', {
    left: `${x0}px`, top: `${y0}px`, width: `${Math.max(...xs) - x0}px`, height: `${Math.max(...ys) - y0}px`, backgroundColor: color,
    clipPath: clip(rough(poly.map(([x, y]) => [x - x0, y - y0]), { seed, amp })),
  });
  return { el: e, x0, y0 };
}
function slidePaper(p, tx, ty) {
  p.el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
  p.el.style.backgroundPosition = `${(-(p.x0 + tx)).toFixed(2)}px ${(-(p.y0 + ty)).toFixed(2)}px`;
}

// The NAVY cut-paper seal: an oval stamp (navy paper, a thin cream ring inset, navy again) with the word across it.
function seal(parent, s, { size, seed }) {
  const box = el(parent, '', { transformOrigin: '50% 50%' });
  const label = text(box, 'disp cut-text', s, { size, color: C.cream });
  const w = Math.round(label.w + size * 2.3);
  const h = Math.round(label.h + size * 1.7);
  const oval = (d) => Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return [w / 2 + (w / 2 - d) * Math.cos(a), h / 2 + (h / 2 - d) * Math.sin(a)];
  });
  const layer = (d, color, k) => el(box, '', {
    width: `${w}px`, height: `${h}px`, background: color, clipPath: clip(rough(oval(d), { seed: seed + k, amp: d ? 1.5 : 3, wave: 40 })),
  });
  layer(0, C.navy, 0);
  layer(10, C.cream, 1);
  layer(15, C.navy, 2);
  box.appendChild(label.el);
  place(label.el, (w - label.w) / 2, (h - label.h) / 2);
  Object.assign(box.style, { width: `${w}px`, height: `${h}px` });
  return { el: box, w, h };
}

// A paper strip of fixed size carrying one MONO hash, flush left (the gate-1 still's copies).
function hashStrip(parent, s, { x, y, w, h, bg, seed, torn: isTorn = false }) {
  const box = el(parent, '', { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, transformOrigin: '50% 50%' });
  let outline = rough(rect(0, 0, w, h), { seed, amp: 4 });
  if (isTorn) {
    // Torn along both long edges (a copy ripped out of the record), cut straight at the ends.
    const topEdge = torn([0, 6], [w, 6], seed + 1, { lobe: 5, zig: 4, spacing: 14 });
    const botEdge = torn([w, h - 6], [0, h - 6], seed + 2, { lobe: 5, zig: 4, spacing: 14 });
    outline = [...topEdge, ...botEdge];
  }
  el(box, '', { width: `${w}px`, height: `${h}px`, background: bg, clipPath: clip(outline) });
  const m = ink(s, 'mono', 52, 1.2);
  const t = text(box, 'mono', s, { size: 52, color: C.cream });
  place(t.el, 38, Math.round(h / 2 - (m.top + m.base) / 2 - 1));
  return box;
}

export default {
  underlap: UNDERLAP,

  async build(ctx) {
    const root = ctx.root;
    const top = ctx.top;
    const L23 = ctx.line('L23');
    const L24 = ctx.line('L24');
    const L25 = ctx.line('L25');
    const L26 = ctx.line('L26');
    const L27 = ctx.line('L27');
    const s23 = (k) => ctx.syl('L23', k);
    const s24 = (k) => ctx.syl('L24', k);
    const s25 = (k) => ctx.syl('L25', k);
    const s26 = (k) => ctx.syl('L26', k);
    const s27 = (k) => ctx.syl('L27', k);
    const arrive = (p) => firstArrival(typeof p === 'string' ? PRESETS[p] : p);
    const SL = arrive('slide'); // a 'slide' first lands this long after it starts
    // The first grid point at or after t (keeps the order if the timeline ever re-flows a beat shorter).
    const up = (t) => {
      const g = ctx.snap(t);
      return g < t - 1e-6 ? g + ctx.grid : g;
    };
    const atLeast = (t, min) => Math.max(t, up(min));

    // ---- Beats (chapter-local seconds), all on the grid of the story beats. A move that lands (slide, bar, count,
    // slip) starts early by its spring's first-arrival time so it lands on its grid point; a SLAM or stamp appears on it.
    const T = {};
    T.tear = 2 * ctx.grid - arrive(TEAR1); // the rip starts on ch06's held frame, catches at mid-frame on a 16th...
    T.tear2 = ctx.beat; // ...and tears the rest from the first beat; it covers the frame before the underlap (checked)
    T.two = L23.start; // 7.1 the "2" SLAMs on the cream, on the beat's first grid point
    T.bar = s23(2) - arrive(LAYER); // the NAVY layer bar shoots in under it
    T.title = s23(3) - SL; // 7.2 "SAU KHI / CÔNG BỐ" rises out from behind the bar
    T.sub = s23(5) - SL; // "ngay cả ban quản lý / cũng không sửa được" rises under it
    T.check = s23(7) - SL; // the checkbox line
    T.btn = s23(8) - SL; // the publish button
    T.seal = s23(9); // the seal STAMPs beside the button
    T.brk = s23(10); // the bracket snaps under the UI's "không thể chỉnh sửa"
    T.fac = L23.end; // 7.3 the façade rises once L23 has been read...
    T.doors = up(T.fac + SL); // ...and its window opens like lift doors onto 7.3a as it lands
    T.cu = atLeast(s24(1), T.doors + SL) - SL; // "Cư dân" rises out of its slit
    T.lan = s24(2) - SL; // "LẦN"
    T.nguoc = s24(3) - SL; // "NGƯỢC"
    T.tu = s24(4) - SL; // "từ khoản chi / về phản ánh ban đầu"
    T.scroll = s24(4); // the screen scrolls to the chain as the last line lands
    T.scrolled = T.scroll + settle(SCROLL, 1000);
    const c0 = atLeast(s24(6), T.scrolled); // the bracket ticks step 4, then climbs one step per 8th note
    T.climb = [0, 1, 2, 3].map((i) => c0 + 2 * i * ctx.grid);
    T.cut3 = atLeast(s24(9), T.climb[3] + 2 * ctx.grid); // HARD CUT: the window shuts on the chain
    T.bub = ctx.snap(T.cut3 + ctx.grid); // the hook's bubble SLAMs in alone (snapped: it shows on its own frame)...
    T.match = atLeast(s24(11), T.bub + ctx.beat); // ...and a beat later, at rest, the match cut to the original report
    T.wipe = L24.end; // 7.4 the two fields close in, on the beat's end
    T.landed = T.wipe + settle(WIPE, 1400); // both at rest: they move to ctx.root and 7.3 is put away
    T.mabam = atLeast(s25(0), T.landed); // "MÃ BĂM" SLAMs
    T.card = atLeast(s25(2), T.mabam + SL) - SL; // the verified card slides up
    T.strips = [3, 4, 5, 6].map((k) => s25(k) - SL); // the four copies land in turn
    T.four = s25(4); // "4 nơi độc lập" appears as the second copy lands, its digit already turning past 1...
    T.roll = s25(6) - arrive(COUNT); // ...and reaches 4 as the fourth lands
    T.red = L25.end - arrive(SLY); // 7.5 the edited copy slips in, landing on the beat's end
    T.sua = L26.start; // 7.6 "SỬA LÉN?" SLAMs in place of "MÃ BĂM"
    T.alarm = s26(3); // HARD CUT verified → mismatch
    T.bao = s26(6) - SL; // "BÁO LỖI NGAY." lands
    T.push = L26.end; // 7.7 push in on the badge; the paper parts
    T.kh = atLeast(L27.start, T.push + 0.4); // "KHÔNG AI XÓA" SLAMs on the NAVY...
    T.dv = atLeast(s27(1), T.kh + ctx.grid); // ..."ĐƯỢC DẤU VẾT." under it; both hold to the end
    if (T.landed > T.mabam) console.warn('ch07: the fields land after "MÃ BĂM"');
    // Landing times of the moves above (for the sound's cues).
    const land = {
      bar: T.bar + arrive(LAYER), title: T.title + SL, sub: T.sub + SL, check: T.check + SL, btn: T.btn + SL,
      fac: T.fac + SL, cu: T.cu + SL, lan: T.lan + SL, nguoc: T.nguoc + SL, tu: T.tu + SL, card: T.card + SL,
      strips: T.strips.map((x) => x + SL), roll: T.roll + arrive(COUNT), red: T.red + arrive(SLY), bao: T.bao + SL,
      tear: T.tear + arrive(TEAR1),
    };

    // ---- Ground: NAVY, the colour the chapter ends on. It shows only once the tear has covered ch06.
    const ground = el(root, '', { width: `${W}px`, height: `${H}px`, background: C.navy });

    // ---- 7.1 the tear: a CREAM sheet whose torn edge sweeps diagonally (left and down) across the frame. At rest the
    // edge lies beyond the bottom-left corner, so the sheet is the 7.2 ground.
    const A = (35 * Math.PI) / 180;
    const dir = [-Math.cos(A), Math.sin(A)]; // travel
    const along = [Math.sin(A), Math.cos(A)]; // the edge
    const Q = [110 * dir[0], H + 110 * dir[1]];
    const E0 = [Q[0] - 1050 * along[0], Q[1] - 1050 * along[1]];
    const E1 = [Q[0] + 1250 * along[0], Q[1] + 1250 * along[1]];
    const BACK = 2700;
    const edge = torn(E0, E1, SEED + 1, { lobe: 30, zig: 20, spacing: 38 });
    const tearPoly = [...edge, [E1[0] - BACK * dir[0], E1[1] - BACK * dir[1]], [E0[0] - BACK * dir[0], E0[1] - BACK * dir[1]]];
    const tx0 = Math.floor(Math.min(...tearPoly.map((p) => p[0]))) - 20;
    const ty0 = Math.floor(Math.min(...tearPoly.map((p) => p[1]))) - 20;
    const tw = Math.ceil(Math.max(...tearPoly.map((p) => p[0]))) + 20 - tx0;
    const th = Math.ceil(Math.max(...tearPoly.map((p) => p[1]))) + 20 - ty0;
    const local = (pts) => pts.map(([x, y]) => [x - tx0, y - ty0]);
    const tearSheet = el(root, '', { left: `${tx0}px`, top: `${ty0}px`, width: `${tw}px`, height: `${th}px` });
    el(tearSheet, '', { width: `${tw}px`, height: `${th}px`, background: C.cream, clipPath: clip(local(tearPoly)) });
    el(tearSheet, '', { width: `${tw}px`, height: `${th}px`, background: C.cream, clipPath: clip(local(fibres(edge, dir, SEED + 2))) });
    // Distance the sheet travels: from its edge clear of the top-right corner to its resting place.
    const far = (W - Q[0]) * -dir[0] + (0 - Q[1]) * -dir[1];
    const TEAR_D = far + 110 + 50;
    // The frame is covered once the sheet is within ~60 px of rest (the edge rests 110 px past the corner, less its
    // 30 + 20 px of lobes and zigzag): check the underlap leaves time for that.
    const tearPos = track(0, [[T.tear, 0.45, TEAR1], [T.tear2, 1, TEAR2]]);
    let covered = T.tear2;
    while (covered < 3 && (1 - tearPos(covered)) * TEAR_D > 55) covered += 1 / 240;
    if (covered > UNDERLAP) console.warn(`ch07: the tear covers the frame at ${covered.toFixed(2)} s, after the underlap`);

    // ---- 7.2 the numeral, the title, the three UI pieces, the seal and the bracket.
    const g72 = el(root, '', { width: `${W}px`, height: `${H}px` });
    // The NAVY "layer two" bar (ch06 opened layer one with an ORANGE bar): the numeral stands on it and the title
    // rises out from behind it.
    const BY = 900; // bar top
    const BH = 120;
    const X2 = 110;
    const B2 = BY - 34; // baseline of the numeral and of the label's last line
    const i2 = ink('2', 'disp', 620, 1);
    const TX = Math.round(X2 + (i2.right - i2.left) + 80);
    const slot = el(g72, '', { width: `${W}px`, height: `${BY + BH - 6}px`, overflow: 'hidden' });
    // Flush left at TX, bottom-up: the label "ngay cả ban quản lý / cũng không sửa được" (BLACK LABEL 52) with its last
    // baseline on the numeral's, and "SAU KHI / CÔNG BỐ" 36 px over the label's marks. Both rise from behind the bar.
    // The label says what the seal and the UI don't (who can't edit), so no phrase on screen repeats another.
    const SUB = ['ngay cả ban quản lý', 'cũng không sửa được'];
    const SUB_LH = 1.2;
    const iS1 = ink(SUB[0], 'label', 52, SUB_LH);
    const iS2 = ink(SUB[1], 'label', 52, SUB_LH);
    const sub = text(slot, 'label', SUB.join(' / '), { size: 52, color: C.black, lh: SUB_LH });
    const subTop = Math.round(B2 - 52 * SUB_LH - iS2.base);
    place(sub.el, TX - iS1.left, subTop);
    const subRise = Math.round(BY + BH - (subTop + iS1.top) + 10);
    const iTa = ink('SAU KHI', 'disp', 120, 1.1);
    const iT = ink('CÔNG BỐ', 'disp', 120, 1.1);
    const title = text(slot, 'disp cut-text', 'SAU KHI / CÔNG BỐ', { size: 120, color: C.black });
    const titleTop = Math.round(subTop + iS1.top - 36 - 132 - iT.base);
    place(title.el, TX - iT.left, titleTop);
    const titleRise = Math.round(BY + BH - (titleTop + iTa.top) + 10);
    const titleInk = { top: titleTop + iTa.top, right: TX - iT.left + Math.max(iTa.right, iT.right) };
    const bar = el(g72, '', {
      left: '-60px', top: `${BY}px`, width: '2040px', height: `${BH}px`, background: C.navy,
      clipPath: clip(rough(rect(0, 0, 2040, BH), { seed: SEED + 5, amp: 4 })),
    });
    const two = text(g72, 'disp cut-text', '2', { size: 620, color: C.navy, lh: 1, fontVariantNumeric: 'normal' });
    place(two.el, X2 - i2.left, B2 - i2.base);
    two.el.style.transformOrigin = `${Math.round((i2.left + i2.right) / 2)}px ${Math.round(i2.base)}px`;

    const XR = 1830; // the UI pieces sit flush right
    const pCheck = await plate(ctx, '7.2b', { backing: C.navy, seed: SEED + 11 });
    const pBtn = await plate(ctx, '7.2c', { backing: C.navy, seed: SEED + 12 });
    // The checkbox line and the publish button in the upper right, against the numeral and the title in the lower left:
    // the button's row stands on the title's caps (its backing 24 px over them), the checkbox line 74 px over the button.
    // (The lock note, 7.2a, is left out: it ends "… không thể chỉnh sửa." as the checkbox line does.)
    const BTN = { x: XR - pBtn.w, y: Math.round(titleInk.top - 24 - 14 - pBtn.h) };
    const CHECK = { x: XR - pCheck.w, y: BTN.y - 74 - pCheck.h };
    place(pCheck.el, CHECK.x, CHECK.y);
    place(pBtn.el, BTN.x, BTN.y);
    const sealP = seal(g72, 'NIÊM PHONG', { size: 48, seed: SEED + 20 });
    place(sealP.el, BTN.x - 56 - sealP.w, BTN.y + pBtn.h / 2 - sealP.h / 2 + 6);
    // The ORANGE bracket under "không thể chỉnh sửa": its arms rise into the blank strip under the words (never over
    // them) and its bar hangs over the plate's edge onto the NAVY backing.
    const sb = ctx.crop('7.2b').scale;
    const bw = Math.round((WORDS_72B[1] - WORDS_72B[0]) * sb + 8);
    const bTop = Math.round(DESC_72B * sb + 5);
    const bh = pCheck.h + 12 - bTop; // hangs from under the words over the plate's edge onto its backing
    const brk72 = el(pCheck.el, '', { left: `${Math.round(WORDS_72B[0] * sb - 4)}px`, top: `${bTop}px`, width: '0px', height: `${bh}px`, overflow: 'hidden' });
    {
      const bar = 11;
      const tab = 10;
      const u = [[0, 0], [tab, 0], [tab, bh - bar], [bw - tab, bh - bar], [bw - tab, 0], [bw, 0], [bw, bh], [0, bh]];
      el(brk72, 'grained', { width: `${bw}px`, height: `${bh}px`, backgroundColor: C.orange, clipPath: clip(rough(u, { seed: SEED + 21, amp: 1.2, wave: 30, spacing: 5 })) });
    }

    // ---- 7.3: the plates behind the façade's window, the façade, and what sits on it (all on ctx.top).
    const cA = ctx.crop('7.3a');
    const cB = ctx.crop('7.3b');
    const s3 = cB.scale; // 7.3a and 7.3b are the same screenshot at the same scale
    const pA = await plate(ctx, '7.3a');
    const pS = await plate(ctx, '7.3b'); // the scroll between the two crops (the same real screen, in motion only)
    const pB = await plate(ctx, '7.3b');
    const pC = await plate(ctx, '7.3c');
    const WB = { x: W - 70 - pB.w, y: Math.round((H - pB.h) / 2), w: pB.w, h: pB.h };
    const WA = { x: WB.x + Math.round((cA.crop[0] - cB.crop[0]) * s3), y: Math.round((H - pA.h) / 2), w: pA.w, h: pA.h };
    // The report sits flush right, centred on the frame.
    const WC = { x: W - 90 - pC.w, y: Math.round((H - pC.h) / 2), w: pC.w, h: pC.h };
    place(pA.el, WA.x, WA.y);
    place(pB.el, WB.x, WB.y);
    place(pC.el, WC.x, WC.y);
    // The façade: four strips around the window (their inner edges are the window's cut edges); the left and right
    // ones are also the lift doors. A single sheet with a slanted top edge rises first, with the doors shut.
    const fTop = paper(top, rect(-100, -1300, W + 200, 1300 + OV), C.navy, SEED + 30);
    const fBot = paper(top, rect(-100, -OV, W + 200, 1300 + OV), C.navy, SEED + 31);
    const fLeft = paper(top, rect(-2300, -60, 2300 + OV, H + 120), C.navy, SEED + 32);
    const fRight = paper(top, rect(-OV, -60, 2300 + OV, H + 120), C.navy, SEED + 33);
    const fRise = paper(top, [[-100, -150], [W + 100, -70], [W + 100, H + 100], [-100, H + 100]], C.navy, SEED + 34, 5);
    const RISE = H + 240;
    // The CREAM bracket that climbs the chain, on the façade just left of the window.
    const yStep = STEPS_73B.map((v) => WB.y + v * s3);
    const BRX = WB.x - 50;
    const brBar = el(top, '', { overflow: 'hidden' });
    const brBarPaper = el(brBar, 'grained', {
      width: '14px', height: `${Math.round(yStep[3] - yStep[0] + 16)}px`, backgroundColor: C.cream,
      clipPath: clip(rough(rect(0, 0, 14, Math.round(yStep[3] - yStep[0] + 16)), { seed: SEED + 40, amp: 1.5 })),
    });
    const tickW = WB.x + 3 - BRX;
    const ticks = yStep.map((y, i) => el(top, 'grained', {
      left: `${BRX}px`, top: `${Math.round(y - 6)}px`, width: `${tickW}px`, height: '12px', backgroundColor: C.cream, transformOrigin: '0 50%',
      clipPath: clip(rough(rect(0, 0, tickW, 12), { seed: SEED + 41 + i, amp: 1.5 })),
    }));
    const climb = track(yStep[3], [[T.climb[1], yStep[2], 'snap'], [T.climb[2], yStep[1], 'snap'], [T.climb[3], yStep[0], 'snap']]);
    // "Cư dân / LẦN / NGƯỢC / từ khoản chi / về phản ánh ban đầu": a flush-left CREAM column on the façade, each piece
    // rising out of its own slit (LABEL 52 above and under the DISPLAY 150 pair), the block centred on the frame.
    const LX = 120;
    const lineH = 165;
    const LBL = 52 * 1.2; // a label line's pitch
    const iC = ink('Cư dân', 'label', 52, 1.2);
    const iL = ink('LẦN', 'disp', 150, 1.1);
    const iN = ink('NGƯỢC', 'disp', 150, 1.1);
    const iU1 = ink('từ khoản chi', 'label', 52, 1.2);
    const iU2 = ink('về phản ánh ban đầu', 'label', 52, 1.2);
    // Element tops relative to LẦN's: the label's ink 22 px over LẦN's marks, the two lines 26 px under NGƯỢC's dot.
    const rel = { cu: iL.top - 22 - iC.bottom, lan: 0, nguoc: lineH };
    rel.tu = lineH + iN.bottom + 26 - iU1.top;
    const blockTop = rel.cu + iC.top;
    const blockBot = rel.tu + LBL + iU2.bottom;
    const lanTop = Math.round(H / 2 - (blockTop + blockBot) / 2);
    const riser = (s, cls, size, lh, y, m0, mN) => {
      const lines = s.split(' / ').length;
      const inkTop = y + m0.top;
      const inkBot = y + (lines - 1) * size * lh + mN.bottom;
      const slotTop = Math.round(inkTop - 12);
      const slot = el(top, '', { left: `${LX - 20}px`, top: `${slotTop}px`, width: '900px', height: `${Math.round(inkBot - inkTop + 24)}px`, overflow: 'hidden' });
      const w = text(slot, cls, s, { size, lh });
      grainText(w.el, C.cream);
      w.el.style.backgroundPosition = `${-LX}px ${-y}px`;
      place(w.el, 20, y - slotTop);
      return { slot, el: w.el, drop: Math.round(inkBot - inkTop + 40) };
    };
    const slots = [
      riser('Cư dân', 'label', 52, 1.2, lanTop + rel.cu, iC, iC),
      riser('LẦN', 'disp cut-text', 150, 1.1, lanTop, iL, iL),
      riser('NGƯỢC', 'disp cut-text', 150, 1.1, lanTop + rel.nguoc, iN, iN),
      riser('từ khoản chi / về phản ánh ban đầu', 'label', 52, 1.2, Math.round(lanTop + rel.tu), iU1, iU2),
    ];
    // The hook's bubble, cut as ch01's complaint (seed 11, its tail, its paddings and corner in proportion) but set at
    // the size, line break and line pitch of the report's own title, so its words lie on the report's: the first line
    // exactly as wide as the report's, the baselines on the report's, the ink starting where the report's does. Widths
    // are measured in the page, where optical sizing applies (the canvas in ink() ignores it): a few steps converge.
    const sC = ctx.crop('7.3c').scale;
    const lineW = (size) => {
      const p = el(top, 'label', { fontSize: `${size}px`, whiteSpace: 'nowrap' }, TITLE[0]);
      const w = p.getBoundingClientRect().width;
      p.remove();
      return w;
    };
    let bfs = CFONT;
    for (let i = 0; i < 6; i++) bfs *= ((TITLE_73C.x[1] - TITLE_73C.x[0]) * sC) / lineW(bfs);
    const bk = bfs / CFONT; // ch01's bubble at this size
    const blh = ((TITLE_73C.base[1] - TITLE_73C.base[0]) * sC) / bfs;
    const probe = el(top, 'label', { fontSize: `${bfs}px`, lineHeight: blh, whiteSpace: 'nowrap' }, TITLE.join('<br>'));
    const bubW = Math.round(probe.getBoundingClientRect().width + 100 * bk);
    probe.remove();
    const bubH = Math.round(bfs * blh * 2 + 80 * bk + 28 * bk);
    const bub = el(top, 'grained', {
      width: `${bubW}px`, height: `${bubH}px`, backgroundColor: C.cream, transformOrigin: `${(bubW / 2).toFixed(1)}px ${bubH}px`,
      clipPath: clip(rough(bubble(bubW, bubH, { r: 26 * bk, tail: 'left', tw: 34 * bk, th: 28 * bk }), { seed: 11, amp: 3 })),
    });
    el(bub, 'label', {
      left: `${(50 * bk).toFixed(2)}px`, top: `${(40 * bk).toFixed(2)}px`, fontSize: `${bfs.toFixed(3)}px`, lineHeight: blh.toFixed(4),
      color: C.black, whiteSpace: 'nowrap',
    }, TITLE.join('<br>'));
    const iB1 = ink(TITLE[0], 'label', bfs, blh);
    Object.assign(bub.style, {
      left: `${(WC.x + TITLE_73C.x[0] * sC - (50 * bk + iB1.left)).toFixed(2)}px`,
      top: `${(WC.y + TITLE_73C.base[0] * sC - (40 * bk + iB1.base)).toFixed(2)}px`,
    });

    // ---- 7.4-7.7: two fields (ORANGE cut diagonally at left, CREAM at right). They close in on ctx.top over 7.3,
    // then swap to identical copies on ctx.root, where the rest of the frame lives.
    const DG = [[1150, 0], [940, H]]; // the diagonal of the gate-1 still
    const xAt = (y) => DG[0][0] + ((DG[1][0] - DG[0][0]) * y) / H;
    const orangePoly = [[-80, -80], [xAt(-80), -80], [xAt(H + 80), H + 80], [-80, H + 80]];
    const creamPoly = [[xAt(-80) - 280, -80], [W + 80, -80], [W + 80, H + 80], [xAt(H + 80) - 280, H + 80]];
    const creamTop = paper(top, creamPoly, C.cream, SEED + 50, 5);
    const orangeTop = paper(top, orangePoly, C.orange, SEED + 51, 5);
    const gCream = el(root, '', { width: `${W}px`, height: `${H}px` });
    const gOrange = el(root, '', { width: `${W}px`, height: `${H}px` });
    for (const [g, p] of [[gCream, creamTop], [gOrange, orangeTop]]) {
      el(g, '', { left: `${p.x0}px`, top: `${p.y0}px`, width: p.el.style.width, height: p.el.style.height, background: p.el.style.backgroundColor, clipPath: p.el.style.clipPath });
    }
    const IN = { orange: -1300, cream: 1400 };
    // Orange side: "MÃ BĂM", then "SỬA LÉN?" in its place, and the BLACK strip "BÁO LỖI NGAY." under it.
    const mabam = text(gOrange, 'disp cut-text', 'MÃ BĂM', { size: 250, color: C.black, lh: 1.1, transformOrigin: '0 70%' });
    const sua = text(gOrange, 'disp cut-text', 'SỬA LÉN?', { size: 250, color: C.black, lh: 1.1, transformOrigin: '0 70%' });
    place(mabam.el, 84, 22);
    place(sua.el, 84, 22);
    const bao = tag(gOrange, 'BÁO LỖI NGAY.', { cls: 'disp cut-text', size: 150, color: C.cream, bg: C.black, padX: 0.3, padY: 0.08, seed: SEED + 52, rot: -2 });
    place(bao.el, 58, 330);
    // Cream side: the label with its counted 4, four NAVY copies, and the RED edited copy.
    const four = odometer(gCream, '4', { cls: 'label', size: 48, color: C.black, lh: 1.2 });
    const noi = text(gCream, 'label', 'nơi độc lập', { size: 48, color: C.black });
    place(four.el, 1204, 72);
    place(noi.el, 1204 + four.w + 13, 72);
    const copies = [0, 1, 2, 3].map((i) => hashStrip(gCream, HASH, { x: 1200, y: 150 + 114 * i, w: 630, h: 96, bg: C.navy, seed: SEED + 60 + 3 * i }));
    const red = hashStrip(gCream, EDIT, { x: 1130, y: 620, w: 700, h: 100, bg: C.red, seed: SEED + 75, torn: true });
    // The explorer card: verified and mismatch at the same place (only the badge differs), and the mismatch at 2x
    // for the push (shown at CSS scale 0.5 → 1, so its raster is only ever downscaled).
    const CARD = { x: 72, y: 850 };
    const pV = await plate(ctx, '7.4', { backing: C.black, seed: SEED + 80 });
    const pM = await plate(ctx, '7.6', { backing: C.black, seed: SEED + 80 });
    const pZ = await plate(ctx, '7.6', { zoom: 2, backing: C.black, offset: 28, seed: SEED + 80 });
    place(pV.el, CARD.x, CARD.y);
    place(pM.el, CARD.x, CARD.y);
    const c76 = ctx.crop('7.6');
    const bx = BADGE_76[0] * c76.scale; // badge centre in the 1x plate
    const by = BADGE_76[1] * c76.scale;
    place(pZ.el, CARD.x + bx - 2 * bx, CARD.y + by - 2 * by);
    pZ.el.style.transformOrigin = `${(2 * bx).toFixed(2)}px ${(2 * by).toFixed(2)}px`;
    // The badge comes to rest centred, 60 px below the frame's centre line, leaving the NAVY above it for the last line.
    const REST = { x: W / 2, y: H / 2 + 60 };
    const PUSH_TO = { x: REST.x - (CARD.x + bx), y: REST.y - (CARD.y + by) };
    const cardRise = H + 40 - CARD.y;
    // 7.7 "KHÔNG AI XÓA / ĐƯỢC DẤU VẾT." (CREAM DISPLAY 150) on the NAVY ground, flush left above where the pushed card
    // comes to rest (its top edge ends at REST.y - 2·by), 48 px clear of it, so it is never over the UI. Line by line
    // SLAMs.
    const PZ_TOP = REST.y - 2 * by;
    const K = ['KHÔNG AI XÓA', 'ĐƯỢC DẤU VẾT.'];
    const KS = 150;
    const iK = K.map((v) => ink(v, 'disp', KS, 1.1));
    const k2 = Math.round(PZ_TOP - 48 - iK[1].bottom);
    const trace = K.map((v, i) => {
      const e = text(root, 'disp cut-text', v, { size: KS, color: C.cream, transformOrigin: '0 60%' }).el;
      place(e, 150 - iK[i].left, i ? k2 : k2 - Math.round(KS * 1.1));
      return e;
    });
    if (k2 - Math.round(KS * 1.1) + iK[0].top < 50) console.warn('ch07: the last line runs into the top of the frame');

    return {
      T, land, ground, tearSheet, dir, TEAR_D, tearPos,
      g72, bar, two: two.el, title: title.el, titleRise, sub: sub.el, subRise, pCheck, pBtn, CHECK, BTN, seal: sealP.el, brk72, bw,
      cA, cB, s3, pA, pS, pB, pC, WA, WB, WC, fTop, fBot, fLeft, fRight, fRise, RISE,
      brBar, brBarPaper, BRX, yStep, ticks, climb, slots, bub,
      creamTop, orangeTop, gCream, gOrange, IN, mabam: mabam.el, sua: sua.el, bao: bao.el, four, noi: noi.el, copies, red,
      pV, pM, pZ, PUSH_TO, cardRise, trace,
    };
  },

  render(s, t) {
    const { T } = s;
    const f2 = (v) => v.toFixed(2);

    // 7.1 The tear, then the ground under everything.
    vis(s.ground, t >= UNDERLAP);
    const inTear = vis(s.tearSheet, t >= T.tear && t < T.landed);
    if (inTear) {
      const k = (1 - s.tearPos(t)) * s.TEAR_D;
      s.tearSheet.style.transform = `translate(${f2(-k * s.dir[0])}px, ${f2(-k * s.dir[1])}px)`;
    }

    // 7.1-7.2 The numeral slams; the bar shoots in under it; the title and its label rise; the UI slides in; the seal
    // stamps; the bracket snaps.
    const on72 = vis(s.g72, t >= Math.min(T.two, T.bar) && t < T.doors);
    if (on72 && vis(s.bar, t >= T.bar)) {
      s.bar.style.transform = `translateX(${f2(spring(t, T.bar, -2140, 0, LAYER))}px)`;
    }
    if (on72 && vis(s.two, t >= T.two)) {
      s.two.style.transform = `rotate(${f2(spring(t, T.two, 5, 0, 'slam'))}deg) scale(${spring(t, T.two, 1.25, 1, 'slam').toFixed(4)})`;
    }
    if (on72) {
      if (vis(s.title, t >= T.title)) s.title.style.transform = `translateY(${f2(spring(t, T.title, s.titleRise, 0, 'slide'))}px)`;
      if (vis(s.sub, t >= T.sub)) s.sub.style.transform = `translateY(${f2(spring(t, T.sub, s.subRise, 0, 'slide'))}px)`;
      if (vis(s.seal, t >= T.seal)) s.seal.style.transform = `rotate(${f2(spring(t, T.seal, -14, -6, 'slam'))}deg) scale(${spring(t, T.seal, 1.6, 1, 'slam').toFixed(4)})`;
    }
    for (const [p, t0, P] of [[s.pCheck, T.check, s.CHECK], [s.pBtn, T.btn, s.BTN]]) {
      if (vis(p.el, t >= t0 && t < T.doors)) p.el.style.transform = `translateX(${f2(spring(t, t0, W + 40 - P.x, 0, 'slide'))}px)`;
    }
    if (vis(s.brk72, t >= T.brk)) s.brk72.style.width = `${f2(s.bw * Math.min(1, step(t - T.brk, { f: 2.2, z: 1 })))}px`;

    // 7.3 The façade rises (one sheet, doors shut), then becomes four strips around the window; the doors open. From
    // the cut out of the chain to the match cut the window is shut (the same sheet, at rest) and the bubble is alone.
    const rising = t >= T.fac && t < T.doors;
    const on73 = t >= T.doors && t < T.landed;
    const alone = on73 && t >= T.cut3 && t < T.match;
    if (vis(s.fRise.el, rising || alone)) slidePaper(s.fRise, 0, rising ? spring(t, T.fac, s.RISE, 0, 'slide') : 0);
    const u = t < T.scroll ? 0 : t >= T.scrolled ? 1 : step(t - T.scroll, SCROLL);
    const cut = t >= T.cut3;
    const lerpR = (a, b) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
    const win = cut ? s.WC : lerpR(s.WA, s.WB);
    const open = t < T.doors ? 0 : step(t - T.doors, DOORS);
    const shut = (1 - open) * (win.w / 2 + 14);
    for (const p of [s.fTop, s.fBot, s.fLeft, s.fRight]) vis(p.el, on73 && !alone);
    if (on73) {
      slidePaper(s.fTop, 0, win.y);
      slidePaper(s.fBot, 0, win.y + win.h);
      slidePaper(s.fLeft, win.x + shut, 0);
      slidePaper(s.fRight, win.x + win.w - shut, 0);
    }
    // Behind the window: 7.3a at rest, the scroll (the same screenshot, between the two crops), 7.3b at rest, then
    // (after the bubble's beat) 7.3c.
    vis(s.pA.el, on73 && !cut && t < T.scroll);
    vis(s.pB.el, on73 && !cut && t >= T.scrolled);
    const scrolling = vis(s.pS.el, on73 && !cut && t >= T.scroll && t < T.scrolled);
    if (scrolling) {
      const { cA, cB, s3 } = s;
      const rx = lerp(cA.crop[0], cB.crop[0], u);
      const ry = lerp(cA.crop[1], cB.crop[1], u);
      place(s.pS.el, 0, 0);
      s.pS.el.style.transform = `translate(${f2(win.x)}px, ${f2(win.y)}px)`;
      Object.assign(s.pS.el.style, { width: `${f2(win.w)}px`, height: `${f2(win.h)}px` });
      Object.assign(s.pS.win.style, { width: `${f2(win.w)}px`, height: `${f2(win.h)}px` });
      Object.assign(s.pS.img.style, { left: `${f2(-rx * s3)}px`, top: `${f2(-ry * s3)}px` });
    }
    vis(s.pC.el, on73 && t >= T.match);
    // The CREAM bracket climbs the chain: a tick at step 4, then the bar snaps up one step per 8th note.
    const climbing = on73 && !cut && t >= T.climb[0];
    vis(s.brBar, climbing);
    if (climbing) {
      const head = s.climb(t);
      const y4 = s.yStep[3];
      Object.assign(s.brBar.style, { left: `${s.BRX}px`, top: `${f2(head - 8)}px`, width: '14px', height: `${f2(y4 - head + 16)}px` });
      s.brBarPaper.style.transform = `translateY(${f2(s.yStep[0] - head)}px)`;
    }
    s.ticks.forEach((e, i) => {
      const t0 = T.climb[3 - i];
      if (vis(e, climbing && t >= t0)) e.style.transform = `scaleX(${Math.max(0.001, spring(t, t0, 0, 1, 'snap')).toFixed(4)})`;
    });
    const lanOn = [T.cu, T.lan, T.nguoc, T.tu];
    s.slots.forEach((sl, i) => {
      vis(sl.slot, on73 && t >= lanOn[i]);
      if (on73 && t >= lanOn[i]) sl.el.style.transform = `translateY(${f2(spring(t, lanOn[i], sl.drop, 0, 'slide'))}px)`;
    });
    // The hook's bubble SLAMs in alone as the complaint did in ch01's chat (big and tilted), straight at rest so its
    // words lie exactly on the report's at the match cut. It sits near the frame's right edge, so it grows from its
    // bottom centre (1.2×), not from its tail as in ch01: its first frames stay inside the frame.
    if (vis(s.bub, alone && t >= T.bub)) {
      s.bub.style.transform = `rotate(${f2(spring(t, T.bub, -6, 0, 'snap'))}deg) scale(${spring(t, T.bub, 1.2, 1, 'slam').toFixed(4)})`;
    }

    // 7.4 The fields close in over 7.3 (ctx.top), then continue as identical copies on ctx.root.
    const closing = t >= T.wipe && t < T.landed;
    vis(s.orangeTop.el, closing);
    vis(s.creamTop.el, closing);
    if (closing) {
      const k = 1 - step(t - T.wipe, WIPE);
      slidePaper(s.orangeTop, s.IN.orange * k, 0);
      slidePaper(s.creamTop, s.IN.cream * k, 0);
    }
    const fields = t >= T.landed;
    vis(s.gOrange, fields);
    vis(s.gCream, fields);
    const part = t >= T.push ? step(t - T.push, 'drop') : 0;
    if (fields) {
      s.gOrange.style.transform = `translateX(${f2(-1400 * part)}px)`;
      s.gCream.style.transform = `translateX(${f2(1300 * part)}px)`;
    }
    if (vis(s.mabam, fields && t >= T.mabam && t < T.sua)) s.mabam.style.transform = `scale(${spring(t, T.mabam, 1.15, 1, 'slam').toFixed(4)})`;
    if (vis(s.sua, fields && t >= T.sua)) s.sua.style.transform = `scale(${spring(t, T.sua, 1.2, 1, 'slam').toFixed(4)})`;
    if (vis(s.bao, fields && t >= T.bao)) s.bao.style.transform = `translateX(${f2(spring(t, T.bao, -1000, 0, 'slide'))}px)`;
    s.copies.forEach((e, i) => {
      if (vis(e, fields && t >= T.strips[i])) e.style.transform = `translateX(${f2(spring(t, T.strips[i], 800, 0, 'slide'))}px)`;
    });
    const fourOn = fields && t >= T.four;
    vis(s.four.el, fourOn);
    vis(s.noi, fourOn);
    if (fourOn) {
      s.four.roll(t, T.roll, { preset: COUNT });
      const dy = spring(t, T.four, -24, 0, 'snap');
      s.four.el.style.transform = `translateY(${f2(dy)}px)`;
      s.noi.style.transform = `translateY(${f2(dy)}px)`;
    }
    if (vis(s.red, fields && t >= T.red)) {
      const k = step(t - T.red, SLY);
      s.red.style.transform = `translateX(${f2(900 * (1 - k))}px) rotate(${f2(-2 - 3 * k)}deg)`;
    }
    // The explorer card slides up; HARD CUT to the mismatch (only the badge changes); then the push on the red badge.
    const cardOn = t >= T.card;
    const cardY = spring(t, T.card, s.cardRise, 0, 'slide');
    if (vis(s.pV.el, cardOn && t < T.alarm)) s.pV.el.style.transform = `translateY(${f2(cardY)}px)`;
    if (vis(s.pM.el, cardOn && t >= T.alarm && t < T.push)) s.pM.el.style.transform = `translateY(${f2(cardY)}px)`;
    if (vis(s.pZ.el, t >= T.push)) {
      const k = step(t - T.push, 'settle');
      s.pZ.el.style.transform = `translate(${f2(s.PUSH_TO.x * k)}px, ${f2(s.PUSH_TO.y * k)}px) scale(${(0.5 + 0.5 * k).toFixed(4)})`;
    }
    // 7.7 The last line SLAMs onto the NAVY above the card, line by line, and holds to the end.
    [T.kh, T.dv].forEach((t0, i) => {
      if (vis(s.trace[i], t >= t0)) s.trace[i].style.transform = `scale(${spring(t, t0, 1.2, 1, 'slam').toFixed(4)})`;
    });
  },

  // Event times (chapter-local) for the sound: a move that lands carries `land` (its hit, on the grid); the rest hit
  // on `t`.
  cues(s) {
    const { T, land: L } = s;
    return [
      { t: T.tear, name: 'tear', land: L.tear },
      { t: T.tear2, name: 'tear' },
      { t: T.two, name: 'stab' }, // the "2": the music marks it
      { t: T.bar, name: 'bar', land: L.bar },
      { t: T.title, name: 'rise', land: L.title },
      { t: T.sub, name: 'rise', land: L.sub },
      { t: L.check, name: 'click' }, // the checkbox line clicks into place
      { t: T.btn, name: 'slide', land: L.btn },
      { t: T.seal, name: 'stamp' },
      { t: T.brk, name: 'snap' },
      { t: T.fac, name: 'rise', land: L.fac },
      { t: T.doors, name: 'doors' },
      { t: T.cu, name: 'rise', land: L.cu },
      { t: T.lan, name: 'rise', land: L.lan },
      { t: T.nguoc, name: 'rise', land: L.nguoc },
      { t: T.tu, name: 'rise', land: L.tu },
      { t: T.scroll, name: 'scroll' },
      ...T.climb.map((t, i) => ({ t, name: 'climb', i })),
      { t: T.cut3, name: 'cut' }, // the window shuts on the chain
      { t: T.bub, name: 'bubble', land: T.match }, // the hook's bubble returns (its tick); the match cut (snap, warm chord)
      { t: T.wipe, name: 'doors' },
      { t: T.mabam, name: 'slam' },
      { t: T.card, name: 'slide', land: L.card },
      ...T.strips.map((t, i) => ({ t, name: 'slide', land: L.strips[i], i })),
      ...L.strips.map((t, i) => ({ t, name: 'click', i })), // each copy locks in
      { t: T.roll, name: 'count', land: L.roll },
      { t: T.red, name: 'sly', land: L.red },
      { t: T.sua, name: 'slam' },
      { t: T.alarm, name: 'alarm' }, // verified -> mismatch
      { t: T.bao, name: 'slide', land: L.bao },
      { t: T.push, name: 'push' },
      { t: T.kh, name: 'slam' },
      { t: T.dv, name: 'slam' },
    ];
  },
};
