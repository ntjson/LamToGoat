// ch06 USP 1: before approval (shots 6.1-6.5). Layer one of the fund's protection: before any spending is approved,
// AI gives a reasonable price band from similar past jobs (the deck's example, 18–34tr, always labelled "Ví dụ");
// a 46tr quote lands beyond the band and is flagged before approval; AI only suggests, people decide.
// Drawn paper only: no UI screenshot exists for the price check, so nothing here imitates an app screen.
// Every beat is anchored to the voice lines L19-L22; nothing uses film-absolute seconds.
import { step, spring } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged } from '../lib/paper.js';
import { W, H, text, tag, cover, odometer, svg, stroke, drawOn, vis } from '../lib/kit.js';

const UNDERLAP = 0.8;
const COVER = { f: 2.4, z: 1 }; // the black curtain lands dead (no bounce), whole px, exactly at rest by the underlap
const PAN = { f: 1.1, z: 0.82 }; // 6.2 -> 6.3: the claim leaves left as the scale bar arrives from the right
const FLAG = { f: 0.26, z: 0.6 }; // the quote's friction slide along the bar, from "Một", stopped hard at 46
const LAYER = { f: 1.3, z: 0.85 }; // a long strip shooting in along the frame (the layer bar, the NAVY strip)
const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';

// The deck's example ("Công nghệ cốt lõi"): a reasonable band of 18–34tr, and a 46tr quote above it.
const TICKS = [[0, '0'], [18, '18tr'], [34, '34tr'], [46, '46tr']];

// Scale bar (1080p px). Ticks sit at proportional positions: x = BX + v * K.
const BX = 150;
const K = 28.2;
const BEND = 1770; // the bar runs on past 46, unlabelled
const BY = 720; // bar top
const BH = 120;
const PX = (v) => BX + v * K;
const PAN_D = 1980;

// Ink metrics of one line of text as text() lays it out (line-height lh): px from the element's top.
const cv = document.createElement('canvas').getContext('2d');
function ink(s, kind, size, lh) {
  cv.font = kind === 'mono' ? `600 ${size}px "IBM Plex Mono"` : `${kind === 'disp' ? 800 : 700} ${size}px "Bricolage Grotesque"`;
  cv.fontStretch = kind === 'disp' ? 'condensed' : 'normal';
  const m = cv.measureText(s.normalize('NFC'));
  const base = (lh * size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  return { top: base - m.actualBoundingBoxAscent, base, bottom: base + m.actualBoundingBoxDescent, left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight };
}

// Seconds until an underdamped spring first reaches its target (where the quote hits its stop).
function firstArrival(p) {
  let a = 0;
  let b = 4;
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    if (step(m, p) < 1) a = m;
    else b = m;
  }
  return b;
}

const place = (e, x, y) => Object.assign(e.style, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px` });

// The 6.3-6.4 frame: scale bar, band, ticks, heading, the quote's flag, the over-limit strip and its caption.
// Built three times (whole, and the two halves of the 6.4 -> 6.5 cut), painted identically.
function makeScene(parent, g, clipPath) {
  const box = el(parent, '', { width: `${W}px`, height: `${H}px`, transformOrigin: '50% 50%' });
  if (clipPath) box.style.clipPath = clipPath;

  // Bar group: moves in with the pan, bumps when the quote hits its stop.
  const bar = el(box, '', { width: `${W}px`, height: `${H}px` });
  el(bar, '', {
    left: `${BX}px`, top: `${BY}px`, width: `${BEND - BX}px`, height: `${BH}px`, background: C.cream,
    clipPath: clip(rough(rect(0, 0, BEND - BX, BH), { seed: 610, amp: 4 })),
  });
  // Over-limit rip (34 -> 46): red paper under the torn cream, revealed from the quote's stop back to the band.
  const rip = el(bar, '', { left: `${g.rip.x}px`, top: `${g.rip.y}px`, width: `${g.rip.w}px`, height: `${g.rip.h}px`, background: C.red });
  // The band (18 -> 34): orange paper laid on the bar, lifted, grows left to right.
  const bandWrap = el(bar, '', { filter: SHADOW });
  const band = el(bandWrap, '', {
    left: `${PX(18)}px`, top: `${BY - 10}px`, width: `${g.bandW}px`, height: `${BH + 20}px`, background: C.orange,
    clipPath: clip(rough(rect(0, 0, g.bandW, BH + 20), { seed: 611, amp: 3 })), transformOrigin: '0 50%',
  });
  // Ticks under the bar, with their MONO labels.
  const ticks = TICKS.map(([v, s], i) => {
    const notch = el(bar, '', {
      left: `${PX(v) - 5}px`, top: `${BY + BH - 4}px`, width: '10px', height: '34px', background: C.cream,
      clipPath: clip(rough(rect(0, 0, 10, 34), { seed: 612 + i, amp: 1.5 })), transformOrigin: '50% 0',
    });
    const lab = text(bar, 'mono', s, { size: 40, color: C.cream });
    place(lab.el, PX(v) - lab.w / 2, BY + BH + 38);
    return { notch, lab: lab.el };
  });

  // Heading above the band: "Ví dụ", "Khung giá hợp lý", "18–34tr".
  const vidu = tag(box, 'Ví dụ', { size: 40, color: C.black, bg: C.cream, seed: 620, rot: -2 });
  place(vidu.el, BX, g.viduY);
  const khung = text(box, 'label', 'Khung giá hợp lý', { size: 52, color: C.cream });
  place(khung.el, g.hx, g.khungY);
  const fig = odometer(box, '18–34tr', { cls: 'disp cut-text', size: 110, color: C.orange });
  place(fig.el, g.hx - 4, g.figY);

  // The quote: a red flag whose pole marks its price on the bar.
  const flag = el(box, '', { width: `${g.flagW}px`, height: `${g.poleH}px`, filter: SHADOW, transformOrigin: `6px ${g.poleH}px` });
  el(flag, '', { width: '12px', height: `${g.poleH}px`, background: C.red, clipPath: clip(rough(rect(0, 0, 12, g.poleH), { seed: 631, amp: 1.5 })) });
  const banner = tag(flag, 'Báo giá 46tr', { size: 52, color: C.cream, bg: C.red, seed: 630 });
  place(banner.el, 8, 0);

  // Over-limit: the strip slams, the warning slides in under it.
  const strip = tag(box, 'VƯỢT KHUNG', { cls: 'disp cut-text', size: 140, color: C.cream, bg: C.red, padX: 0.3, padY: 0.14, seed: 640, rot: -2 });
  place(strip.el, g.sx, g.sy);
  strip.el.style.filter = SHADOW;
  const warn = text(box, 'label', 'cảnh báo trước khi duyệt', { size: 48, color: C.cream });
  place(warn.el, g.sx + 10, g.wy);

  return { box, bar, rip, band, ticks, vidu: vidu.el, khung: khung.el, fig, flag, strip: strip.el, warn: warn.el };
}

function paintScene(c, s, t) {
  const { T, g } = s;
  const pan = step(t - T.pan, PAN);
  const bump = 12 * (step(t - T.hit, 'snap') - step(t - T.hit - 0.08, 'snap'));
  c.bar.style.transform = `translate(${(PAN_D * (1 - pan)).toFixed(1)}px, ${bump.toFixed(2)}px)`;

  // Ticks click on one after another, each notch dropping from the bar.
  c.ticks.forEach((k, i) => {
    const t0 = T.ticks + i * 0.12;
    const on = vis(k.notch, t >= t0);
    vis(k.lab, on);
    if (on) {
      k.notch.style.transform = `scaleY(${spring(t, t0, 0, 1, 'snap').toFixed(3)})`;
      k.lab.style.transform = `translateY(${spring(t, t0, -26, 0, 'snap').toFixed(1)}px)`;
    }
  });
  // "Ví dụ" arrives with the first tick: the example is labelled whenever its figures are on screen.
  if (vis(c.vidu, t >= T.ticks)) c.vidu.style.transform = `scale(${spring(t, T.ticks, 1.25, 1, 'slam').toFixed(3)})`;

  // The band grows 18 -> 34 on "khung giá"; the heading slides in with it; the figure counts on "từ những việc".
  if (vis(c.band, t >= T.band)) c.band.style.transform = `scaleX(${Math.max(0.001, spring(t, T.band, 0, 1, { f: 1.3, z: 0.7 })).toFixed(4)})`;
  if (vis(c.khung, t >= T.band)) c.khung.style.transform = `translateX(${spring(t, T.band, -g.hx - 700, 0, 'slide').toFixed(1)}px)`;
  if (vis(c.fig.el, t >= T.count)) c.fig.roll(t, T.count, { preset: { f: 1.25, z: 0.8 }, stagger: 0.05 });

  // The quote slides in from the left, crosses the band and stops dead at 46; it jolts forward on impact.
  const moving = t >= T.flag;
  if (vis(c.flag, moving)) {
    const u = t >= T.hit ? 1 : step(t - T.flag, FLAG);
    const x = g.flagX0 + (PX(46) - g.flagX0) * u;
    const rot = t >= T.hit ? spring(t, T.hit, 9, 0, 'slam') : 0;
    c.flag.style.transform = `translate(${(x - 6).toFixed(1)}px, ${(BY + 2 - g.poleH + bump).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
  }
  // The 34 -> 46 segment tears open to red, from the quote's stop back to the band.
  if (vis(c.rip, t >= T.tear)) {
    const u = Math.min(1, step(t - T.tear, 'tear'));
    c.rip.style.clipPath = g.ripClips[Math.round(u * (g.ripClips.length - 1))];
  }
  if (vis(c.strip, t >= T.strip)) c.strip.style.transform = `scale(${spring(t, T.strip, 1.22, 1, 'slam').toFixed(4)})`;
  if (vis(c.warn, t >= T.warn)) c.warn.style.transform = `translateX(${spring(t, T.warn, W - g.sx, 0, 'slide').toFixed(1)}px)`;
}

export default {
  underlap: UNDERLAP,

  build(ctx) {
    const root = ctx.root;
    const L19 = ctx.line('L19');
    const L20 = ctx.line('L20');
    const L21 = ctx.line('L21');
    const L22 = ctx.line('L22');
    const syl = (id, k) => ctx.syl(id, k);
    const flagTravel = firstArrival(FLAG);

    // Beats (chapter-local seconds), all derived from the voice lines.
    const T = {
      one: Math.max(UNDERLAP + 0.02, L19.start - 0.25), // 6.1 the numeral slams in the breath
      claim: syl('L19', 3) - 0.3, // 6.2 "Hai lớp bảo vệ quỹ chung" lands on "hai lớp"
      layer: syl('L19', 7) - 0.12, // the ORANGE layer bar shoots in under the numeral on "Lớp một"
      truoc: syl('L19', 9) - 0.3, // "TRƯỚC KHI" rises out of the bar, lands on "trước"
      duyet: syl('L19', 11) - 0.3, // "DUYỆT CHI" lands on "duyệt"
      pan: L19.end + 0.1, // 6.3 in the breath: the claim leaves left, the scale bar slides in on the same line
      ticks: L20.start + 0.12, // ticks click on under "Ây-ai đưa ra"
      band: syl('L20', 4) - 0.08, // the band grows on "khung giá"
      count: syl('L20', 9) - 0.05, // "18–34tr" counts through "những việc tương tự"
      hit: syl('L21', 5), // 6.4 the quote stops at 46 on "sáu"
      strip: syl('L21', 7) - 0.05, // "VƯỢT KHUNG" slams on "vượt"
      warn: syl('L21', 10) - 0.3, // "cảnh báo trước khi duyệt" lands on "cảnh báo"
      cut: syl('L21', 12) - 0.1, // the scissor line crosses on "ngay"
      split: L21.end + 0.03, // the halves part in the breath
      ai: L22.start - 0.06, // 6.5 "AI GỢI Ý." on "Ây-ai"
      nguoi: syl('L22', 5) - 0.06, // "NGƯỜI QUYẾT ĐỊNH." on "ban quản lý"
      cap: syl('L22', 8) - 0.3, // the caption lands on "xem lại"
      decide: syl('L22', 11) - 0.1, // the NAVY strip slides in under "NGƯỜI QUYẾT ĐỊNH." on "quyết định"
    };
    T.flag = T.hit - flagTravel;
    T.tear = T.hit + 0.05;

    // 6.1 ground: the BLACK cover. It travels on ctx.top over ch05's plates, then becomes this chapter's ground.
    const blk = cover(ctx, C.black, { seed: 601, amp: 6 });

    // 6.1-6.2: the numeral stands on the line the scale bar will take; on "Lớp một" an ORANGE layer bar shoots in
    // along that line, and the claim rises out from behind it. The pan later carries all of it out left.
    const g62 = el(root, '', { width: `${W}px`, height: `${H}px` });
    const baseY = BY - 40; // the numeral's and the claim's baseline
    const one = text(g62, 'disp cut-text', '1', { size: 620, color: C.orange, lh: 1, fontVariantNumeric: 'normal' });
    const oi = ink('1', 'disp', 620, 1);
    const oneX = 190;
    place(one.el, oneX, baseY - oi.base);
    one.el.style.transformOrigin = `${Math.round((oi.left + oi.right) / 2)}px ${Math.round(oi.base)}px`;
    const cx = Math.round(oneX + oi.right + 80);
    const slot = el(g62, '', { width: `${W}px`, height: `${BY + BH - 6}px`, overflow: 'hidden' });
    const di = ink('DUYỆT CHI', 'disp', 120, 1.1);
    const duyet = text(slot, 'disp cut-text', 'DUYỆT CHI', { size: 120, color: C.cream });
    place(duyet.el, cx, baseY - di.base);
    const truoc = text(slot, 'disp cut-text', 'TRƯỚC KHI', { size: 120, color: C.cream });
    place(truoc.el, cx, baseY - di.base - 132);
    const rise = { truoc: BY + BH - (baseY - di.base - 132), duyet: BY + BH - (baseY - di.base) };
    const layer = el(g62, '', {
      left: '-60px', top: `${BY}px`, width: '2020px', height: `${BH}px`, background: C.orange,
      clipPath: clip(rough(rect(0, 0, 2020, BH), { seed: 602, amp: 4 })),
    });
    const claim = text(g62, 'label', 'Hai lớp bảo vệ quỹ chung', { size: 48, color: C.orange });
    const ti = ink('TRƯỚC KHI', 'disp', 120, 1.1);
    const ci = ink('Hai lớp bảo vệ quỹ chung', 'label', 48, 1.2);
    place(claim.el, cx + 4, baseY - di.base - 132 + ti.top - 26 - ci.bottom);

    // 6.3-6.4 geometry, shared by the three copies of the scene.
    const g = { bandW: Math.round(PX(34) - PX(18)), hx: Math.round(PX(18)) };
    {
      const probe = tag(root, 'Báo giá 46tr', { size: 52, color: C.cream, bg: C.red, seed: 630 });
      g.flagW = probe.w + 8;
      g.bannerH = probe.h;
      probe.el.remove();
      g.poleH = g.bannerH + 34;
      g.flagX0 = -g.flagW - 80;
      // Heading: the figure's baseline sits 150 px over the bar; "Khung giá hợp lý" and "Ví dụ" stack above it.
      const fi = ink('18–34tr', 'disp', 110, 1);
      g.figY = Math.round(BY - g.poleH - 30 - 110);
      const ki = ink('Khung giá hợp lý', 'label', 52, 1.2);
      g.khungY = Math.round(g.figY + fi.top - 18 - ki.bottom);
      // "Ví dụ" labels the whole scale: it sits over the bar's 0 end, just above the quote's lane.
      const vprobe = tag(root, 'Ví dụ', { size: 40, color: C.black, bg: C.cream, seed: 620 });
      g.viduY = Math.round(BY - g.poleH - 24 - vprobe.h);
      vprobe.el.remove();
      // Right column, over the red segment: the strip and its warning.
      const sprobe = tag(root, 'VƯỢT KHUNG', { cls: 'disp cut-text', size: 140, color: C.cream, bg: C.red, padX: 0.3, padY: 0.14, seed: 640 });
      g.stripW = sprobe.w;
      g.stripH = sprobe.h;
      sprobe.el.remove();
      g.sx = Math.round(Math.min(PX(34) + 20, W - 70 - g.stripW));
      const wi = ink('cảnh báo trước khi duyệt', 'label', 48, 1.2);
      g.wy = Math.round(BY - g.poleH - 34 - wi.bottom);
      g.sy = Math.round(g.wy + wi.top - 26 - g.stripH);
      // The rip: red paper between 34 and 46, revealed from 46 back to 34 behind a torn front.
      const M = 24;
      const x34 = PX(34);
      const x46 = PX(46);
      const Lr = x46 - x34;
      g.rip = { x: Math.round(x34 - M), y: BY - M, w: Math.round(Lr + 2 * M), h: BH + 2 * M };
      const top = M + 4;
      const bot = M + BH - 4;
      const right = jagged([M + Lr, bot], [M + Lr, top], { seed: 651, amp: 6, wave: 26, spacing: 5 });
      g.ripClips = [];
      for (let i = 0; i <= 72; i++) {
        const xf = M + Lr * (1 - i / 72) - 8;
        const front = jagged([xf, top], [xf, bot], { seed: 650, amp: 9, wave: 22, spacing: 4 });
        g.ripClips.push(clip([...front, ...right]));
      }
    }

    const whole = makeScene(root, g, null);
    // The 6.4 -> 6.5 cut: a scissor line down the frame; each half gets its own copy of the scene.
    const cutLine = jagged([1330, -40], [600, H + 40], { seed: 660, amp: 14 });
    const polyA = [[-100, -100], [1330, -100], ...cutLine, [600, H + 100], [-100, H + 100]];
    const polyB = [[1330, -100], [W + 100, -100], [W + 100, H + 100], [600, H + 100], ...[...cutLine].reverse()];
    const halfA = makeScene(root, g, clip(polyA));
    const halfB = makeScene(root, g, clip(polyB));
    const scissor = svg(root);
    const sPath = stroke(scissor, cutLine, { color: C.orange, width: 7 });

    // 6.5: one idea on black. On "quyết định" a NAVY strip (the named manager's colour) slides in under the
    // people's line: the bookend of the orange layer bar that opened the chapter.
    const navy = el(root, '', { background: C.navy });
    const ai = text(root, 'disp cut-text', 'AI GỢI Ý.', { size: 170, color: C.orange });
    const ng = text(root, 'disp cut-text', 'NGƯỜI QUYẾT ĐỊNH.', { size: 170, color: C.cream });
    const cap = text(root, 'label', 'AI có bước tự kiểm tra · ảnh và thông tin cá nhân / cư dân không gửi cho AI', { size: 34, color: C.cream, lh: 1.3 });
    const ni = ink('NGƯỜI QUYẾT ĐỊNH.', 'disp', 170, 1.1);
    const gap = 50;
    const capGap = Math.round(ni.bottom - ng.h + 30 + 40);
    const block = ai.h + gap + ng.h + capGap + cap.h;
    const y0 = Math.round((H - block) / 2);
    const ngY = y0 + ai.h + gap;
    place(ai.el, 150, y0);
    place(ng.el, 150, ngY);
    place(cap.el, 156, ngY + ng.h + capGap);
    for (const e of [ai.el, ng.el]) e.style.transformOrigin = '0 60%';
    const navyW = 150 + ng.w + 70 + 60;
    const navyH = Math.round(ni.bottom - ni.top + 54);
    Object.assign(navy.style, {
      left: '-60px', top: `${Math.round(ngY + ni.top - 24)}px`, width: `${navyW}px`, height: `${navyH}px`,
      clipPath: clip(rough(rect(0, 0, navyW, navyH), { seed: 670, amp: 4 })),
    });

    const coverY = (t) => Math.round(spring(t, 0.1, -(H + 150), 0, COVER));
    return { T, g, blk, coverY, g62, one: one.el, claim: claim.el, truoc: truoc.el, duyet: duyet.el, rise, layer, whole, halfA, halfB, sPath, navy, navyW, ai: ai.el, ng: ng.el, cap: cap.el };
  },

  render(s, t) {
    const { T } = s;
    // 6.1 BLACK slides down over ch05's held last frame (on ctx.top until the underlap ends).
    s.blk.place(0, s.coverY(t), t < UNDERLAP);

    // 6.1-6.2: the numeral slams, hits again on "một"; the claim slides in beside it; the pan takes it out left.
    const pan = step(t - T.pan, PAN);
    if (vis(s.g62, t >= T.one && pan < 0.995)) {
      s.g62.style.transform = `translateX(${(-PAN_D * pan).toFixed(1)}px)`;
      s.one.style.transform = `rotate(${spring(t, T.one, -4, 0, 'slam').toFixed(3)}deg) scale(${spring(t, T.one, 1.25, 1, 'slam').toFixed(4)})`;
      if (vis(s.claim, t >= T.claim)) s.claim.style.transform = `translateX(${spring(t, T.claim, 1400, 0, 'slide').toFixed(1)}px)`;
      if (vis(s.layer, t >= T.layer)) s.layer.style.transform = `translateX(${spring(t, T.layer, -2140, 0, LAYER).toFixed(1)}px)`;
      if (vis(s.truoc, t >= T.truoc)) s.truoc.style.transform = `translateY(${spring(t, T.truoc, s.rise.truoc, 0, 'slide').toFixed(1)}px)`;
      if (vis(s.duyet, t >= T.duyet)) s.duyet.style.transform = `translateY(${spring(t, T.duyet, s.rise.duyet, 0, 'slide').toFixed(1)}px)`;
    }

    // 6.3-6.4, then the cut: whole until the split, two halves parting after it.
    const split = t >= T.split;
    const showWhole = vis(s.whole.box, t >= T.pan && !split);
    if (showWhole) paintScene(s.whole, s, t);
    const a = step(t - T.split, 'drop');
    const b = step(t - T.split - 0.06, 'drop');
    const halves = split && b < 0.995;
    vis(s.halfA.box, halves);
    vis(s.halfB.box, halves);
    if (halves) {
      paintScene(s.halfA, s, t);
      paintScene(s.halfB, s, t);
      s.halfA.box.style.transform = `translate(${(-260 * a).toFixed(1)}px, ${(1300 * a).toFixed(1)}px) rotate(${(-6 * a).toFixed(2)}deg)`;
      s.halfB.box.style.transform = `translate(${(260 * b).toFixed(1)}px, ${(-1300 * b).toFixed(1)}px) rotate(${(5 * b).toFixed(2)}deg)`;
    }
    const cutting = t >= T.cut && t < T.split + 0.05;
    if (vis(s.sPath, cutting)) drawOn(s.sPath, step(t - T.cut, { f: 1.8, z: 1 }));

    // 6.5: the two lines slam in turn; the caption slides in under them. Final state holds past ctx.dur.
    if (vis(s.ai, t >= T.ai)) s.ai.style.transform = `scale(${spring(t, T.ai, 1.2, 1, 'slam').toFixed(4)})`;
    if (vis(s.ng, t >= T.nguoi)) s.ng.style.transform = `scale(${spring(t, T.nguoi, 1.2, 1, 'slam').toFixed(4)})`;
    if (vis(s.navy, t >= T.decide)) s.navy.style.transform = `translateX(${spring(t, T.decide, -s.navyW - 120, 0, LAYER).toFixed(1)}px)`;
    if (vis(s.cap, t >= T.cap)) s.cap.style.transform = `translateX(${spring(t, T.cap, -1300, 0, 'slide').toFixed(1)}px)`;
  },
};
