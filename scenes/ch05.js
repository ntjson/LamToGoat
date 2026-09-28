// ch05 Demo 1 (shots 5.1-5.6). The product, shown only through its own screenshots: a resident's report goes in
// through a window of the building, the AI suggests how to triage it, and a named manager decides, every step on
// record. Every beat is anchored to the voice lines L15-L18 (ctx.line / ctx.syl); nothing uses film-absolute time.
//
// 5.1  ch04's NAVY doors part over our CREAM ground (ch04 owns that exit; until EXIT.ch04 we paint the ground only).
// 5.2  The logo slides in at left on "Làm Tổ"; the line slides in at right, line by line; "kiểm chứng được" slams.
// 5.3  A NAVY façade (8 × 5 windows) rises; one window lights ORANGE and the camera pushes into it. The app rises in
//      the window, which snaps taller as the report fills in (5.3a → 5.3b → 5.3c); "Ảnh · vị trí · 24/7" assembles
//      word by word as the voice says them.
// 5.4  The window closes onto "Gửi phản ánh", then opens out of it onto the confirmation.
// 5.5  HARD CUT to CREAM. "AI GỢI Ý" slams, report #7 slides in, the AI suggestion slides up over it, and three
//      ORANGE brackets snap under "Thang máy", "Cao" and "240 phút", one per phrase of L17.
// 5.6  The confirm panel slides in; the NAVY tag and the button land; the manager (Kawaibu) snaps in; a NAVY band
//      slides along the bottom and reveals the all-green accountability chain one step per tick.
// ch06 covers the held last frame with BLACK (its underlap + kit.cover), so nothing here animates past ctx.dur.
import { spring, track, noise1, clamp } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged } from '../lib/paper.js';
import { W, H, text, tag, aperture, plate, vis, prog } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

const SEED = 500; // this chapter's seeds are 500-599

// Positions measured inside the screenshots, in source px relative to each crop's origin (the file and the crop are
// in docs/crops.json). They are converted with the crop's own scale from ctx.crop(), so no screen size is typed here.
// 5.5b, web/desktop-report-triage@4x.png, first line "Gợi ý Thang máy, mức khẩn Cao, hàng đợi Thang máy, hạn trong
// 240 phút.": ink extents of the three suggested values, punctuation excluded.
const WORDS_55B = [[270, 607], [948, 1064], [2035, 2296]]; // "Thang máy", "Cao", "240 phút"
const DESC_55B = 158; // lowest descender of that line (g, y, p); the brackets hang below it
const NEXT_55B = 235; // top of the next line ("Vị trí diễn giải", its tilde included); the brackets stay above it
// 5.5a, same file: the separator under the "Vị trí" row ends at 492 and "Trạng thái" starts at 555. The AI card covers
// 5.5a from midway between the two, so its edge never cuts a line of text.
const SEP_55A = 492;
const NEXT_55A = 555;
// 5.3c, app/flow-01-form-filled@3x.png: the "Gửi phản ánh" button starts 885 px below the crop's top.
const BTN_53C = 885;
// 5.6a, web/desktop-report-triage@4x.png: the form fields (Danh mục, Mức khẩn) start 80 px in; the button aligns there.
const FIELD_56A = 80;
// 5.6d, web/desktop-case-completed@4x.png: midway between one step's widest ink (circle or label) and the next one's,
// where the reveal stops after each tick: Báo cáo | Phân loại | Công việc | Công bố đề xuất | Thanh toán | Công bố.
const GAPS_56D = [532, 976, 1384, 1898, 2326];

const ARRIVE = 0.39; // a 'slide' first reaches its target this long after it starts
const PUSH = { f: 1.8, z: 1 }; // the camera pushing into the lit window
const RISE = { f: 1.8, z: 0.8 }; // the app rising in the window; its overshoot stays inside SPARE
const SPARE = 16; // 5.3a is this much taller than its window (the grey margin under the box), so the rise may overshoot
const GROW = { f: 3.2, z: 1 }; // the window snapping taller, never past the plate it shows
const OPEN = { f: 2.6, z: 1 }; // the window opening out of the button onto the confirmation
const TICK = { f: 3.4, z: 0.85 }; // the chain's reveal, one step per tick

// The façade: 8 × 5 windows filling the frame. The camera pushes into PICK until that window is the aperture AP.
const COLS = 8;
const ROWS = 5;
const PICK = [2, 2]; // column, row of the resident's window
const AP = { x: 150, y: 126 }; // top-left of the aperture once pushed in; its size comes from the plates

const px = (v) => `${v.toFixed(1)}px`;
const poly = (pts) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
const box4 = (r, d = 0) => [[r.x + d, r.y + d], [r.x + r.w - d, r.y + d], [r.x + r.w - d, r.y + r.h - d], [r.x + d, r.y + r.h - d]];

// A hand-cut clockwise polygon whose wobble belongs to the paper: along each edge the noise is sampled at a fraction
// of that edge times a fixed reference length (lens[i]), so when the shape is pushed in or resized the cut stretches
// with it instead of boiling. Each layer: { amp (screen px, inward), seed, lens: [one per edge] }.
function roughBox(r, layers, spacing = 9) {
  return roughPoly(box4(r), layers, spacing);
}
function roughPoly(cs, layers, spacing = 9) {
  const pts = [];
  for (let i = 0; i < cs.length; i++) {
    const [x0, y0] = cs[i];
    const [x1, y1] = cs[(i + 1) % cs.length];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 0.5) continue;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const n = clamp(Math.round(len / spacing), 2, 240);
    for (let k = 0; k < n; k++) {
      const u = k / n;
      let off = 0;
      for (const L of layers) {
        if (L.amp <= 0) continue;
        const d = u * L.lens[i];
        const sd = L.seed + 17 * i;
        off += L.amp * (0.5 + 0.35 * noise1(d / 60, sd) + 0.15 * noise1(d / 7, sd + 7));
      }
      pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
    }
  }
  return pts;
}

// Type on ctx.top sits above the stage grain; fill its glyphs with the same grained paper so it matches type printed
// on ctx.root (the grain darkens paper by about 7 %, so plain type up here would read brighter than its neighbours).
function grainText(e, color) {
  e.classList.add('grained');
  Object.assign(e.style, { backgroundColor: color, color: 'transparent', backgroundClip: 'text', webkitBackgroundClip: 'text' });
}

// The logo's artwork box inside its transparent PNG, so "460 px wide" means the visible logo.
function alphaBox(img) {
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const g = cv.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width;
  let y0 = cv.height;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (d[(y * cv.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// An inline piece of a text line that can appear and move on its own (display: inline-block keeps the line's layout).
function piece(parent, html, style = {}) {
  const s = document.createElement('span');
  s.innerHTML = html.normalize('NFC');
  Object.assign(s.style, { display: 'inline-block', ...style });
  parent.appendChild(s);
  return s;
}

export default {
  async build(ctx) {
    const L15 = ctx.line('L15');
    const L16 = ctx.line('L16');
    const L17 = ctx.line('L17');
    const L18 = ctx.line('L18');
    const syl = (id) => (k) => ctx.syl(id, k);
    const s15 = syl('L15');
    const s16 = syl('L16');
    const s17 = syl('L17');
    const s18 = syl('L18');

    // Beats (chapter-local seconds), all derived from the voice lines. The max() guards keep the order if the
    // timeline re-flows and a breath gets short.
    const T = {};
    T.logo = Math.max(EXIT.ch04, s15(0) - ARRIVE); // the logo lands on "Làm Tổ", never before ch04's doors are gone
    T.lines = [s15(4), s15(7), s15(9)].map((t) => Math.max(T.logo + 0.3, t - ARRIVE)); // "phản ánh", "khoản chi", "ai cũng"
    T.verify = s15(11) - 0.04; // "kiểm chứng được" slams on "kiểm"
    T.band52 = T.verify - ARRIVE + 0.06; // the top of the façade rises under the promise, landing as "kiểm chứng được" slams
    T.fac = Math.max(T.verify + 0.6, L15.end - 0.15); // then the whole façade rises over 5.2 in the breath
    T.covered = T.fac + 0.8; // 5.2 is fully under the façade
    T.lit = T.fac + 0.42; // the resident's window lights
    T.push = Math.max(T.lit + 0.1, L16.start - 0.08); // push in on "Cư dân"
    T.rise = Math.max(T.push + 0.3, s16(2) - 0.36); // the app rises, in place on "gửi phản ánh"
    T.b = Math.max(T.rise + 0.6, s16(5) - 0.05); // location picker, and "24/7", on "bất kỳ lúc nào"
    T.c = Math.max(T.b + 0.6, s16(9) - 0.05); // the filled report on "kèm ảnh và vị trí"
    T.anh = Math.max(T.c + 0.15, s16(10) - 0.05); // "Ảnh ·" on "ảnh"
    T.vitri = Math.max(T.anh + 0.15, s16(12) - 0.05); // "vị trí ·" on "vị trí"
    T.press = Math.max(T.vitri + 0.3, L16.end - 0.12); // the window closes onto "Gửi phản ánh"
    T.conf = T.press + clamp(0.3 * (L17.start - L16.end), 0.2, 0.32); // ...and opens onto the confirmation (5.4)
    T.cut = Math.max(T.conf + 0.5, L17.start - 0.1); // HARD CUT to cream (5.5)
    T.tag55 = Math.max(T.cut + 0.03, L17.start - 0.05); // "AI GỢI Ý" slams on "Ây-ai"
    T.p55b = Math.max(T.tag55 + 0.3, s17(2) - 0.1); // the AI suggestion slides up on "gợi ý"
    T.br = [4, 7, 10].map((k) => s17(k) - 0.05); // brackets on "nhóm sự cố", "mức khẩn", "hạn xử lý"
    T.exit55 = Math.max(T.br[2] + 0.8, L17.end - 0.1); // 5.5 leaves to the left...
    T.p56a = Math.max(T.exit55, L18.start - ARRIVE); // ...as the confirm panel slides in, landing on "Nhưng"
    T.tag56 = s18(1) - 0.05; // "NGƯỜI QUYẾT ĐỊNH" on "người quyết định"
    T.btn = s18(3) - 0.08; // "Xác nhận phân loại" on "định"
    T.id = s18(6) - 0.08; // the manager on "quản lý có tên"
    T.band = s18(10) - ARRIVE - 0.03; // the band lands on "mọi"
    T.ticks = [1, 2, 3, 4, 5].map((k) => s18(10 + 0.8 * k) - 0.03); // steps 2-6, the last one on "vết"

    // Ground.
    el(ctx.root, '', { width: `${W}px`, height: `${H}px`, background: C.cream });

    // ---- 5.2: logo at left (ctx.top, so it shows exactly as the file is), the line at right (on the paper).
    const logoImg = await ctx.image('/assets/brand/lamto-logo.png');
    const art = alphaBox(logoImg);
    const LOGO_W = 460;
    const ls = LOGO_W / art.w;
    const LOGO = { x: 250, y: Math.round((H - art.h * ls) / 2) - 60 }; // the artwork's top-left on screen
    const logo = el(ctx.top, '', {});
    const logoEl = logoImg.cloneNode();
    logoEl.className = 'abs';
    Object.assign(logoEl.style, {
      width: px(logoImg.naturalWidth * ls), height: px(logoImg.naturalHeight * ls),
      left: px(LOGO.x - art.x * ls), top: px(LOGO.y - art.y * ls),
    });
    logo.appendChild(logoEl);

    const LS = 64;
    const TX = LOGO.x + LOGO_W + 150;
    const lineH = Math.round(LS * 1.2);
    const TY = Math.round(LOGO.y + (art.h * ls) / 2 - 1.5 * lineH);
    const lines = ['Từ một phản ánh', 'đến khoản chi', 'ai cũng '].map((s, i) =>
      el(ctx.root, 'label', { left: `${TX}px`, top: `${TY + i * lineH}px`, fontSize: `${LS}px`, lineHeight: 1.2, color: C.black, whiteSpace: 'nowrap' }, s.normalize('NFC')));
    const verify = piece(lines[2], 'kiểm chứng được', { color: C.navy, transformOrigin: '0% 70%' });

    // ---- 5.3 / 5.4: the façade and its window (all on ctx.top: the window's paper must overlap the app plates).
    const p53a = await plate(ctx, '5.3a');
    const p53b = await plate(ctx, '5.3b');
    const p53c = await plate(ctx, '5.3c');
    const p54 = await plate(ctx, '5.4');
    const c53a = ctx.crop('5.3a');
    const cardX = (ctx.crop('5.3c').crop[0] - c53a.crop[0]) * c53a.scale; // 5.3a/5.3b cards start this far in
    AP.w = p53c.w; // the window is exactly a card wide
    const hA = p53a.h - SPARE;
    const btnY = BTN_53C * ctx.crop('5.3c').scale; // top of "Gửi phản ánh" inside 5.3c
    // Window rects (screen) after the push, one per state: 5.3a, 5.3b, 5.3c, closed onto the button, the confirmation.
    const RA = { x: AP.x, y: AP.y, w: AP.w, h: hA };
    const RB = { ...RA, h: p53b.h };
    const RC = { ...RA, h: p53c.h };
    const RP = { x: AP.x, y: AP.y + btnY - 8, w: AP.w, h: p53c.h - btnY + 8 };
    const RF = { x: AP.x + AP.w / 2 - p54.w / 2, y: AP.y, w: p54.w, h: p54.h };
    // Plate positions (screen) at rest. The confirmation starts behind the button (F0, containing RP) and rises with
    // the window to RF on the same spring, so the window never leaves the plate.
    const POS = { a: [AP.x - cardX, AP.y], b: [AP.x - cardX, AP.y], c: [AP.x, AP.y], f: [RF.x, RF.y] };
    const F0 = AP.y + p53c.h - p54.h;
    // Window deltas from RA, one spring per change (the window snaps taller, closes onto the button, opens again).
    const D = {
      x: track(0, [[T.conf, RF.x - RA.x, OPEN]]),
      y: track(0, [[T.press, RP.y - RA.y, 'snap'], [T.conf, RF.y - RA.y, OPEN]]),
      w: track(0, [[T.conf, RF.w - RA.w, OPEN]]),
      h: track(0, [[T.b, RB.h - hA, GROW], [T.c, RC.h - hA, GROW], [T.press, RP.h - hA, 'snap'], [T.conf, RF.h - hA, OPEN]]),
    };

    // The push: the grid is the wide shot's screen space; zooming by S about P lands window PICK exactly on RA. S puts
    // the next window to the right 160 px past the frame's edge, so only one window remains once the camera is in.
    const PX = W / COLS;
    const PY = H / ROWS;
    const S = (W + 160 - AP.x) / PX;
    const WW = AP.w / S;
    const WH = hA / S;
    const wins = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        wins.push({ x: c * PX + (PX - WW) / 2, y: r * PY + (PY - WH) / 2, w: WW, h: WH, seed: SEED + 50 + r * COLS + c, pick: c === PICK[0] && r === PICK[1] });
      }
    }
    const pw = wins.find((w) => w.pick);
    const P = { x: (AP.x - S * pw.x) / (1 - S), y: (AP.y - S * pw.y) / (1 - S) };
    // The façade sheet (world, clockwise) with a diagonal cut along its top, and an inset copy for the cream underlay.
    const OUT = [[-40, -60], [W + 40, -300], [W + 40, H + 160], [-40, H + 160]];
    const OUT_IN = [[-32, -44], [W + 32, -284], [W + 32, H + 152], [-32, H + 152]];
    const outLens = OUT.map(([x0, y0], i) => Math.hypot(OUT[(i + 1) % 4][0] - x0, OUT[(i + 1) % 4][1] - y0));
    const RISE_FROM = H + 320; // the whole sheet starts below the frame
    const BAND52 = 930; // ...rises to here under the promise (its first row of windows in view), then all the way
    const rise = track(RISE_FROM, [[T.band52, BAND52, 'slide'], [T.fac, 0, 'slide']]);
    const gridLens = [WW, WH, WW, WH];
    const apLens = [AP.w, hA, AP.w, hA];

    const under = el(ctx.top, 'grained', { width: `${W}px`, height: `${H}px`, backgroundColor: C.cream });
    const lit = el(ctx.top, 'grained', { width: `${W}px`, height: `${H}px`, backgroundColor: C.orange });
    const win = el(ctx.top, '', { overflow: 'hidden' });
    for (const p of [p53a, p53b, p53c, p54]) win.appendChild(p.el);
    const navy = el(ctx.top, 'grained', { width: `${W}px`, height: `${H}px`, backgroundColor: C.navy });
    const label = el(ctx.top, 'label', { left: `${AP.x + AP.w + 100}px`, top: `${AP.y - 4}px`, fontSize: '56px', lineHeight: 1.2, whiteSpace: 'nowrap' });
    const bits = ['Ảnh ·', 'vị trí ·', '24/7'].map((s, i) => {
      if (i) label.appendChild(document.createTextNode(' '));
      const b = piece(label, s, { transformOrigin: '50% 60%' });
      grainText(b, C.cream);
      return b;
    });
    const bitT = [T.anh, T.vitri, T.b];

    // ---- 5.5: the AI suggestion. The tag is paper on the ground; the plates and the brackets on ctx.top.
    const tag55 = tag(ctx.root, 'AI GỢI Ý', { cls: 'disp cut-text', size: 110, color: C.black, bg: C.orange, seed: SEED + 20, rot: -2 });
    const p55a = await plate(ctx, '5.5a', { backing: C.navy, seed: SEED + 21 });
    const p55b = await plate(ctx, '5.5b', { backing: C.navy, seed: SEED + 22 });
    const TAG55 = { x: 80, y: 72 };
    const P55A = { x: TAG55.x + tag55.w + 70, y: 90 };
    const P55B = { x: TAG55.x, y: P55A.y + Math.round(((SEP_55A + NEXT_55A) / 2) * ctx.crop('5.5a').scale) };
    const sb = ctx.crop('5.5b').scale;
    const BR_TOP = DESC_55B * sb + 7;
    const BR_BOT = NEXT_55B * sb - 6;
    const brackets = WORDS_55B.map(([a, b], i) => {
      const x0 = a * sb - 7;
      const w = (b - a) * sb + 14;
      const h = BR_BOT - BR_TOP;
      const bar = 13;
      const tab = 10;
      const u = [[0, 0], [tab, 0], [tab, h - bar], [w - tab, h - bar], [w - tab, 0], [w, 0], [w, h], [0, h]];
      const e = el(p55b.el, 'grained', {
        left: px(x0), top: px(BR_TOP), width: px(w), height: px(h), backgroundColor: C.orange,
        clipPath: clip(rough(u, { seed: SEED + 30 + i, amp: 1.4, wave: 30, spacing: 5 })), transformOrigin: '50% 100%',
      });
      return e;
    });

    // ---- 5.6: the decision, then the trail.
    const p56a = await plate(ctx, '5.6a', { backing: C.navy, seed: SEED + 23 });
    const p56b = await plate(ctx, '5.6b', { backing: C.orange, seed: SEED + 24 });
    const p56c = await plate(ctx, '5.6c', { backing: C.navy, seed: SEED + 25 });
    const tag56 = tag(ctx.root, 'NGƯỜI QUYẾT ĐỊNH', { cls: 'disp cut-text', size: 64, color: C.cream, bg: C.navy, seed: SEED + 26, rot: -2 });
    const c56d = ctx.crop('5.6d');
    const chainW = Math.round(c56d.crop[2] * c56d.scale);
    const chainH = Math.round(c56d.crop[3] * c56d.scale);
    const CH = { x: Math.round((W - chainW) / 2), y: H - 56 - chainH };
    const BY = CH.y - 116; // the band's top edge
    const P56A = { x: W - 80 - p56a.w, y: 40 };
    const P56B = { x: P56A.x + Math.round(FIELD_56A * ctx.crop('5.6a').scale), y: BY + 8 }; // the band covers it later
    const TAG56 = { x: 100, y: 190 };
    const P56C = { x: TAG56.x, y: TAG56.y + tag56.h + 36 };

    const band = el(ctx.top, '');
    const chainBox = el(band, '', { left: `${CH.x}px`, top: `${CH.y}px`, width: `${chainW}px`, height: `${chainH}px`, overflow: 'hidden' });
    await plate(ctx, '5.6d', { parent: chainBox });
    // The shutter: NAVY paper over the steps not yet revealed, with a scissor-cut leading edge (it overhangs the window
    // by 14 px above and below, under the band's paper).
    const sh = chainH + 28;
    const shutter = el(chainBox, 'grained', {
      left: '-12px', top: '-14px', width: `${chainW + 52}px`, height: `${sh}px`, backgroundColor: C.navy,
      clipPath: clip([...jagged([12, sh], [12, 0], { seed: SEED + 41, amp: 5, wave: 40 }), [chainW + 52, 0], [chainW + 52, sh]]),
    });
    aperture(band, C.navy, { x: CH.x, y: CH.y, w: chainW, h: chainH, sheet: [-60, BY, W + 120, H - BY + 80], seed: SEED + 42, amp: 3 });
    const bandLabel = text(band, 'label', 'mọi bước đều lưu vết', { size: 52, color: 'transparent', left: `${CH.x}px`, top: `${CH.y - 88}px` });
    grainText(bandLabel.el, C.cream);
    const gaps = GAPS_56D.map((g) => g * c56d.scale);
    const reveal = track(gaps[0], [...gaps.slice(1), chainW + 12].map((g, k) => [T.ticks[k], g, TICK]));

    return {
      T, logo, lines, verify, under, lit, win, navy, label, bits, bitT,
      p53: { a: p53a, b: p53b, c: p53c, f: p54 }, POS, F0, RA, D, wins, P, S, LNS: Math.log(S), OUT, OUT_IN, outLens, rise, gridLens, apLens,
      tag55, p55a, p55b, brackets, TAG55, P55A, P55B,
      p56a, p56b, p56c, tag56, P56A, P56B, P56C, TAG56, band, shutter, reveal,
    };
  },

  render(s, t) {
    const { T } = s;

    // ---- 5.2
    const in52 = t >= T.logo && t < T.covered;
    if (vis(s.logo, in52)) s.logo.style.transform = `translateX(${spring(t, T.logo, -760, 0, 'slide').toFixed(1)}px)`;
    s.lines.forEach((e, i) => {
      if (vis(e, t >= T.lines[i] && t < T.covered)) e.style.transform = `translateX(${spring(t, T.lines[i], 1200, 0, 'slide').toFixed(1)}px)`;
    });
    if (vis(s.verify, t >= T.verify)) s.verify.style.transform = `scale(${spring(t, T.verify, 1.12, 1, 'slam').toFixed(4)})`;

    // ---- 5.3 / 5.4
    const on53 = t >= T.band52 && t < T.cut;
    for (const e of [s.under, s.navy, s.label, s.win]) vis(e, on53);
    vis(s.lit, on53 && t >= T.lit && t < T.rise + 1.2);
    if (on53) {
      const k = prog(t, T.push, PUSH);
      const z = Math.exp(s.LNS * k);
      const dy = s.rise(t);
      const cam = (r) => ({ x: s.P.x + (r.x - s.P.x) * z, y: s.P.y + (r.y - s.P.y) * z + dy, w: r.w * z, h: r.h * z });
      const camPt = ([x, y]) => [s.P.x + (x - s.P.x) * z, s.P.y + (y - s.P.y) * z + dy];
      const polys = [];
      const o = s.OUT.map(camPt); // TL, TR, BR, BL
      const covers = o[0][0] < -30 && o[3][0] < -30 && o[1][0] > W + 30 && o[2][0] > W + 30 && o[0][1] < -30 && o[1][1] < -30 && o[2][1] > H + 30 && o[3][1] > H + 30;
      if (covers) polys.push(box4({ x: -20, y: -20, w: W + 40, h: H + 40 }));
      else polys.push(roughPoly(o, [{ amp: 4, seed: SEED + 1, lens: s.outLens }], 12));
      let R = null;
      for (const w of s.wins) {
        let r = cam(w);
        if (w.pick) {
          r = { x: r.x + s.D.x(t), y: r.y + s.D.y(t), w: r.w + s.D.w(t), h: r.h + s.D.h(t) };
          R = r;
          const d = 4 * k; // the aperture's paper overlaps the app by 4 px once the camera is in
          polys.push(roughBox({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d },
            [{ amp: 2.2 * (1 - k), seed: w.seed, lens: s.gridLens }, { amp: 3 * k, seed: SEED + 3, lens: s.apLens }]));
        } else if (r.x < W + 10 && r.y < H + 10 && r.x + r.w > -10 && r.y + r.h > -10) {
          polys.push(roughBox(r, [{ amp: 2.2, seed: w.seed, lens: s.gridLens }]));
        }
      }
      s.navy.style.clipPath = clip(...polys);
      s.under.style.clipPath = poly(s.OUT_IN.map(camPt));
      s.lit.style.clipPath = poly(box4(R));
      Object.assign(s.win.style, { left: px(R.x), top: px(R.y), width: px(Math.max(0, R.w)), height: px(Math.max(0, R.h)) });
      const show = { a: t >= T.rise && t < T.b, b: t >= T.b && t < T.c, c: t >= T.c && t < T.conf, f: t >= T.conf };
      for (const key of ['a', 'b', 'c', 'f']) {
        const p = s.p53[key];
        if (vis(p.el, show[key])) {
          const [x, y0] = s.POS[key];
          let y = y0;
          if (key === 'a') y = spring(t, T.rise, y0 + s.RA.h + SPARE, y0, RISE);
          if (key === 'f') y = spring(t, T.conf, s.F0, y0, OPEN);
          p.el.style.transform = `translate(${px(x - R.x)}, ${px(y - R.y)})`;
        }
      }
      s.bits.forEach((b, i) => {
        if (vis(b, t >= s.bitT[i])) b.style.transform = `translateY(${spring(t, s.bitT[i], -26, 0, 'snap').toFixed(1)}px)`;
      });
    }

    // ---- 5.5
    const in55 = t >= T.cut && t < T.exit55 + 1.2;
    const ex = spring(t, T.exit55, 0, -2200, 'drop');
    if (vis(s.tag55.el, in55 && t >= T.tag55)) {
      s.tag55.el.style.transform = `translate(${px(s.TAG55.x + ex)}, ${px(s.TAG55.y)}) scale(${spring(t, T.tag55, 1.25, 1, 'slam').toFixed(4)})`;
    }
    if (vis(s.p55a.el, in55)) {
      s.p55a.el.style.transform = `translate(${px(s.P55A.x + ex + spring(t, T.cut - 0.02, W - s.P55A.x + 40, 0, 'slide'))}, ${px(s.P55A.y)})`;
    }
    if (vis(s.p55b.el, in55 && t >= T.p55b)) {
      s.p55b.el.style.transform = `translate(${px(s.P55B.x + ex)}, ${px(s.P55B.y + spring(t, T.p55b, H - s.P55B.y + 40, 0, 'slide'))})`;
    }
    s.brackets.forEach((b, i) => {
      if (vis(b, t >= T.br[i])) b.style.transform = `translateY(${spring(t, T.br[i], 12, 0, 'snap').toFixed(1)}px) scaleX(${spring(t, T.br[i], 0.3, 1, 'snap').toFixed(4)})`;
    });

    // ---- 5.6
    if (vis(s.p56a.el, t >= T.p56a)) {
      s.p56a.el.style.transform = `translate(${px(s.P56A.x + spring(t, T.p56a, 1150, 0, 'slide'))}, ${px(s.P56A.y)})`;
    }
    if (vis(s.tag56.el, t >= T.tag56)) {
      s.tag56.el.style.transform = `translate(${px(s.TAG56.x)}, ${px(s.TAG56.y)}) scale(${spring(t, T.tag56, 1.22, 1, 'slam').toFixed(4)})`;
    }
    if (vis(s.p56b.el, t >= T.btn)) {
      s.p56b.el.style.transform = `translate(${px(s.P56B.x)}, ${px(s.P56B.y + spring(t, T.btn, 36, 0, 'snap'))})`;
    }
    if (vis(s.p56c.el, t >= T.id)) {
      s.p56c.el.style.transform = `translate(${px(s.P56C.x + spring(t, T.id, -70, 0, 'snap'))}, ${px(s.P56C.y)})`;
    }
    if (vis(s.band, t >= T.band)) {
      s.band.style.transform = `translateX(${px(spring(t, T.band, -(W + 160), 0, 'slide'))})`;
      s.shutter.style.transform = `translateX(${px(s.reveal(t))})`;
    }
  },
};
