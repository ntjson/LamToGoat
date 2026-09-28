// ch06 USP 1: before approval (shots 6.1-6.5). Layer one of the fund's protection: before any spending is approved,
// AI gives a reasonable price band from similar past jobs (the deck's example, 18–34tr, always labelled "Ví dụ");
// a 46tr quote lands beyond the band and is flagged before approval; AI only suggests, people decide.
// Drawn paper only: no UI screenshot exists for the price check, so nothing here imitates an app screen.
// The film has no voice: every beat is anchored to the story beats L19-L22 on the music's grid (ctx.line / ctx.syl,
// hits landing on their grid times); each beat's text lands early and holds to the beat's end. Nothing uses
// film-absolute seconds.
import { step, spring, PRESETS } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged } from '../lib/paper.js';
import { W, H, text, tag, cover, odometer, svg, stroke, drawOn, vis } from '../lib/kit.js';

const UNDERLAP = 0.8;
const COVER = { f: 2.4, z: 1 }; // the black curtain lands dead (no bounce), whole px, exactly at rest by the underlap
const PAN0 = { f: 1.1, z: 0.82 }; // 6.2 -> 6.3: the claim leaves left as the scale bar arrives from the right (retimed in build)
const FLAG = { f: 0.26, z: 0.6 }; // the quote's friction slide along the bar, stopped hard at 46
const LAYER = { f: 1.3, z: 0.85 }; // a long strip shooting in along the frame (the layer bar, the NAVY strip)
const BAND = { f: 1.3, z: 0.7 }; // the band growing 18 -> 34
const ODO = { f: 1.25, z: 0.8 }; // "18–34tr" counting (one spring per digit slot)
const ODO_STAGGER = 0.05;
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

// Seconds until an underdamped spring first reaches its target (where a slide lands, where the quote hits its stop):
// scanned forward, then refined, so a later crossing of an oscillating spring is never taken for the first.
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
// The same spring retimed (same damping) so it first lands `dt` s after it starts: a move that fills a gap exactly.
const landIn = (p, dt) => ({ f: (p.f * firstArrival(p)) / dt, z: p.z });

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

  // Heading, one flush-left stack over the bar's 0 end: "Ví dụ", the two lines that say where the band comes from,
  // and the band's figure in the band's colour.
  const vidu = tag(box, 'Ví dụ', { size: 40, color: C.black, bg: C.cream, seed: 620, rot: -2 });
  place(vidu.el, BX - 6, g.viduY);
  const khung = text(box, 'label', 'AI đưa ra khung giá hợp lý', { size: 52, color: C.cream });
  place(khung.el, BX, g.khungY);
  const tu = text(box, 'label', 'từ những việc tương tự đã làm', { size: 52, color: C.cream });
  place(tu.el, BX, g.tuY);
  const fig = odometer(box, '18–34tr', { cls: 'disp cut-text', size: 110, color: C.orange });
  place(fig.el, BX - 4, g.figY);

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

  return { box, bar, rip, band, ticks, vidu: vidu.el, khung: khung.el, tu: tu.el, fig, flag, strip: strip.el, warn: warn.el };
}

function paintScene(c, s, t) {
  const { T, g } = s;
  const pan = step(t - T.pan, s.PAN);
  const bump = 12 * (step(t - T.hit, 'snap') - step(t - T.hit - 0.08, 'snap'));
  c.bar.style.transform = `translate(${(PAN_D * (1 - pan)).toFixed(1)}px, ${bump.toFixed(2)}px)`;

  // Ticks click on one after another, a 16th apart, each notch dropping from the bar.
  c.ticks.forEach((k, i) => {
    const t0 = T.tick[i];
    const on = vis(k.notch, t >= t0);
    vis(k.lab, on);
    if (on) {
      k.notch.style.transform = `scaleY(${spring(t, t0, 0, 1, 'snap').toFixed(3)})`;
      k.lab.style.transform = `translateY(${spring(t, t0, -26, 0, 'snap').toFixed(1)}px)`;
    }
  });
  // "Ví dụ" arrives with the first tick: the example is labelled whenever its figures are on screen.
  if (vis(c.vidu, t >= T.ticks)) c.vidu.style.transform = `scale(${spring(t, T.ticks, 1.25, 1, 'slam').toFixed(3)})`;

  // The first line slides in, the band grows 18 -> 34 under it, the second line follows, then the figure counts.
  if (vis(c.khung, t >= T.khung)) c.khung.style.transform = `translateX(${spring(t, T.khung, -g.headOut, 0, 'slide').toFixed(1)}px)`;
  if (vis(c.band, t >= T.band)) c.band.style.transform = `scaleX(${Math.max(0.001, spring(t, T.band, 0, 1, BAND)).toFixed(4)})`;
  if (vis(c.tu, t >= T.tu)) c.tu.style.transform = `translateX(${spring(t, T.tu, -g.headOut, 0, 'slide').toFixed(1)}px)`;
  // It shows once its digits are turning, so no frame reads "00–00tr".
  if (vis(c.fig.el, t >= T.count + 0.1)) c.fig.roll(t, T.count, { preset: ODO, stagger: ODO_STAGGER });

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
    const arrive = (p) => firstArrival(typeof p === 'string' ? PRESETS[p] : p);
    const SL = arrive('slide'); // a 'slide' first lands this long after it starts
    const PAN = landIn(PAN0, L20.start - L19.end); // the scale bar lands exactly on L20's first beat

    // Beats (chapter-local seconds), all on the grid of the story beats. A move that lands (slide, band, count, flag)
    // starts early by its spring's first-arrival time so it lands on its grid point; a SLAM appears on it.
    const T = {
      one: L19.start, // 6.1 the numeral SLAMs on the beat's first grid point (the BLACK cover is down by then)
      claim: syl('L19', 3) - SL, // 6.2 "Hai lớp bảo vệ quỹ chung" slides in beside it
      layer: syl('L19', 5) - arrive(LAYER), // the ORANGE layer bar shoots in under the numeral
      truoc: syl('L19', 6) - SL, // "TRƯỚC KHI" rises out from behind the bar
      duyet: syl('L19', 7) - SL, // "DUYỆT CHI"; the finished claim then holds to the beat's end
      pan: L19.end, // 6.3 the claim leaves left as the scale bar slides in on the same line
      ticks: L20.start, // the ticks click on a 16th apart, "Ví dụ" with the first
      khung: syl('L20', 2) - SL, // "AI đưa ra khung giá hợp lý" lands
      band: syl('L20', 3) - arrive(BAND), // the band grows 18 -> 34 under it
      tu: syl('L20', 5) - SL, // "từ những việc tương tự đã làm" lands
      count: syl('L20', 9) - arrive(ODO) - ODO_STAGGER * ('18–34tr'.replace(/\D/g, '').length - 1), // "18–34tr" lands
      hit: L21.start, // 6.4 the quote (sliding in since the end of L20) stops dead at 46 on L21's first beat
      strip: syl('L21', 2), // "VƯỢT KHUNG" SLAMs
      warn: syl('L21', 5) - SL, // "cảnh báo trước khi duyệt" lands (halfway between the slam and the scissor)
      cut: syl('L21', 10), // the scissor line runs down the frame...
      split: L21.end, // ...and the halves part on the beat's end
      ai: L22.start, // 6.5 "AI GỢI Ý." SLAMs
      nguoi: syl('L22', 2), // "NGƯỜI QUYẾT ĐỊNH." SLAMs
      cap: [syl('L22', 4) - SL, syl('L22', 6) - SL], // the caption's two lines land in turn
      decide: syl('L22', 10) - arrive(LAYER), // the NAVY strip lands under "NGƯỜI QUYẾT ĐỊNH."
    };
    T.tick = TICKS.map((_, i) => T.ticks + i * ctx.grid);
    T.flag = T.hit - arrive(FLAG);
    T.tear = T.hit;
    // Landing times of the moves above (for the sound's cues).
    const land = {
      claim: T.claim + SL, layer: T.layer + arrive(LAYER), truoc: T.truoc + SL, duyet: T.duyet + SL, pan: L20.start,
      khung: T.khung + SL, band: T.band + arrive(BAND), tu: T.tu + SL, count: syl('L20', 9), warn: T.warn + SL,
      cap: T.cap.map((c) => c + SL), decide: T.decide + arrive(LAYER),
    };

    // 6.1 ground: the BLACK cover. It travels on ctx.top over ch05's plates, then becomes this chapter's ground.
    const blk = cover(ctx, C.black, { seed: 601, amp: 6 });

    // 6.1-6.2: the numeral stands on the line the scale bar will take; an ORANGE layer bar shoots in along that line,
    // and the claim rises out from behind it. The pan later carries all of it out left.
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
    const g = { bandW: Math.round(PX(34) - PX(18)) };
    {
      const probe = tag(root, 'Báo giá 46tr', { size: 52, color: C.cream, bg: C.red, seed: 630 });
      g.flagW = probe.w + 8;
      g.bannerH = probe.h;
      probe.el.remove();
      g.poleH = g.bannerH + 34;
      g.flagX0 = -g.flagW - 80;
      // Heading: a flush-left stack over the bar's 0 end, its figure 30 px over the quote's lane. The two label lines
      // sit at a 64 px baseline pitch (the descenders of the first clear the marks of the second); "Ví dụ" tops it.
      const fi = ink('18–34tr', 'disp', 110, 1);
      g.figY = Math.round(BY - g.poleH - 30 - 110);
      const ki = ink('AI đưa ra khung giá hợp lý', 'label', 52, 1.2);
      const tui = ink('từ những việc tương tự đã làm', 'label', 52, 1.2);
      g.tuY = Math.round(g.figY + fi.top - 24 - tui.bottom);
      g.khungY = g.tuY - 64;
      const vprobe = tag(root, 'Ví dụ', { size: 40, color: C.black, bg: C.cream, seed: 620 });
      g.viduY = Math.round(g.khungY + ki.top - 20 - vprobe.h);
      vprobe.el.remove();
      g.headOut = Math.round(BX + Math.max(ki.right, tui.right) + 80); // the lines slide in from off-frame left
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

    // 6.5: one idea on black. Last, a NAVY strip (the named manager's colour) shoots in under the people's line: the
    // bookend of the orange layer bar that opened the chapter.
    const navy = el(root, '', { background: C.navy });
    const ai = text(root, 'disp cut-text', 'AI GỢI Ý.', { size: 170, color: C.orange });
    const ng = text(root, 'disp cut-text', 'NGƯỜI QUYẾT ĐỊNH.', { size: 170, color: C.cream });
    // The caption (one sentence, broken where the shotlist breaks it) as its two lines, so each can land in turn.
    // Without a voice this sentence is story text, not a source line, so it is set at 48 px (guide: ≥ 40 px).
    const CAP_SIZE = 48;
    const CAP_LH = Math.round(CAP_SIZE * 1.3);
    const cap = ['AI có bước tự kiểm tra · ảnh và thông tin cá nhân', 'cư dân không gửi cho AI'].map((s) => text(root, 'label', s, { size: CAP_SIZE, color: C.cream, lh: 1.3 }).el);
    const ni = ink('NGƯỜI QUYẾT ĐỊNH.', 'disp', 170, 1.1);
    const gap = 50;
    const capGap = Math.round(ni.bottom - ng.h + 30 + 40);
    const block = ai.h + gap + ng.h + capGap + 2 * CAP_LH;
    const y0 = Math.round((H - block) / 2);
    const ngY = y0 + ai.h + gap;
    place(ai.el, 150, y0);
    place(ng.el, 150, ngY);
    cap.forEach((e, i) => place(e, 156, ngY + ng.h + capGap + i * CAP_LH));
    for (const e of [ai.el, ng.el]) e.style.transformOrigin = '0 60%';
    const navyW = 150 + ng.w + 70 + 60;
    const navyH = Math.round(ni.bottom - ni.top + 54);
    Object.assign(navy.style, {
      left: '-60px', top: `${Math.round(ngY + ni.top - 24)}px`, width: `${navyW}px`, height: `${navyH}px`,
      clipPath: clip(rough(rect(0, 0, navyW, navyH), { seed: 670, amp: 4 })),
    });

    const coverY = (t) => Math.round(spring(t, 0.1, -(H + 150), 0, COVER));
    return { T, land, g, PAN, blk, coverY, g62, one: one.el, claim: claim.el, truoc: truoc.el, duyet: duyet.el, rise, layer, whole, halfA, halfB, sPath, navy, navyW, ai: ai.el, ng: ng.el, cap };
  },

  render(s, t) {
    const { T } = s;
    // 6.1 BLACK slides down over ch05's held last frame (on ctx.top until the underlap ends).
    s.blk.place(0, s.coverY(t), t < UNDERLAP);

    // 6.1-6.2: the numeral slams; the claim slides in beside it; the layer bar shoots in and the two lines rise out
    // from behind it; the pan takes it all out left.
    const pan = step(t - T.pan, s.PAN);
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

    // 6.5: the two lines slam in turn; the caption's lines slide in under them; the NAVY strip lands last, under the
    // people's line. Final state holds past ctx.dur.
    if (vis(s.ai, t >= T.ai)) s.ai.style.transform = `scale(${spring(t, T.ai, 1.2, 1, 'slam').toFixed(4)})`;
    if (vis(s.ng, t >= T.nguoi)) s.ng.style.transform = `scale(${spring(t, T.nguoi, 1.2, 1, 'slam').toFixed(4)})`;
    if (vis(s.navy, t >= T.decide)) s.navy.style.transform = `translateX(${spring(t, T.decide, -s.navyW - 120, 0, LAYER).toFixed(1)}px)`;
    s.cap.forEach((e, i) => {
      if (vis(e, t >= T.cap[i])) e.style.transform = `translateX(${spring(t, T.cap[i], -1300, 0, 'slide').toFixed(1)}px)`;
    });
  },

  // Event times (chapter-local) for the sound: a move that lands carries `land` (its hit, on the grid); the rest hit
  // on `t`.
  cues(s) {
    const { T, land: L } = s;
    return [
      { t: 0.1, name: 'wipe' },
      { t: T.one, name: 'slam' },
      { t: T.claim, name: 'slide', land: L.claim },
      { t: T.layer, name: 'bar', land: L.layer },
      { t: T.truoc, name: 'rise', land: L.truoc },
      { t: T.duyet, name: 'rise', land: L.duyet },
      { t: T.pan, name: 'pan', land: L.pan },
      ...T.tick.map((t, i) => ({ t, name: 'tick', i })),
      { t: T.ticks, name: 'tag' },
      { t: T.khung, name: 'slide', land: L.khung },
      { t: T.band, name: 'band', land: L.band },
      { t: T.tu, name: 'slide', land: L.tu },
      { t: T.count, name: 'count', land: L.count },
      { t: T.flag, name: 'friction', land: T.hit },
      { t: T.tear, name: 'tear' },
      { t: T.strip, name: 'stab' },
      { t: T.warn, name: 'slide', land: L.warn },
      { t: T.cut, name: 'scissor' },
      { t: T.split, name: 'split' },
      { t: T.ai, name: 'slam' },
      { t: T.nguoi, name: 'slam' },
      ...T.cap.map((t, i) => ({ t, name: 'slide', land: L.cap[i] })),
      { t: T.decide, name: 'bar', land: L.decide },
    ];
  },
};
