// ch05 Demo 1 (shots 5.1-5.6). The product, shown only through real-time recordings of the real app
// (tools/record_app.mjs): a resident files the hook's complaint on a phone, step by step, and a named manager
// confirms the AI's triage suggestion on a laptop, every step on record. The phone and laptop are cut-paper props,
// the hands and the cursor overlays (lib/props.js); the recordings play on their screens, speed-ramped so every tap
// and click lands on the music's grid exactly where and when the recording tapped (lib/footage.js). Timing is reading
// time on the grid: every beat derives from L15-L18 (ctx.line / ctx.snap); nothing uses film-absolute time.
//
// 5.1  ch04's NAVY doors part over our CREAM ground (ch04 owns that exit; until EXIT.ch04 we paint the ground only).
// 5.2  The phone rises in, held in a left hand, on "Việc của tôi". The logo and the promise slide in at left; the right
//      index finger taps "+ Phản ánh" before the promise leaves.
// 5.3  "CƯ DÂN GỬI / PHẢN ÁNH" slams; the camera pushes in on the report box as the hook's words type in (fast-forward;
//      there is no keyboard in the recording, so none is drawn); back out for "Chọn vị trí" → "Tầng 3" → "Thang máy
//      B", one tap per beat, and "Gửi phản ánh"; "Ảnh · vị trí · 24/7" assembles under the DISPLAY. No photo is
//      attached: the web build cannot attach one (decision 2026-10-04); the form's photo row shows.
// 5.4  The camera pushes in as the app confirms ("Phản ánh của bạn đã được ghi nhận.", the bell, on a grid time); the
//      finger taps back to "Việc của tôi", the new report on top.
// 5.5  The phone and the text pan out left as the laptop pans in with report #7 and its AI suggestion (the seeded
//      design suggestion: no AI endpoint runs in the sandbox, decision 2026-10-04); "AI GỢI Ý" slams. The camera
//      pushes in and paper closes round the suggestion; three ORANGE brackets snap under "Thang máy", "Cao" and
//      "240 phút" as the cursor passes each, each with its tag on a NAVY pocket: "nhóm sự cố", "mức khẩn", "hạn xử lý".
// 5.6  Back out: the cursor picks Vị trí (Tầng 1 / Thang máy A) and clicks "Xác nhận phân loại"; as the real case page
//      loads, "NGƯỜI QUYẾT ĐỊNH" stamps; the page scrolls to "Kawaibu đã chấp nhận gợi ý như đã ghi." over the
//      accountability chain, the camera pushes in and paper closes round them; "mọi bước đều lưu vết".
// ch06 covers the held last frame with BLACK (its underlap + kit.cover), so nothing here animates past ctx.dur.
import { spring, track, step, clamp } from '../lib/motion.js';
import { C, el, rough, rect, clip, jagged } from '../lib/paper.js';
import { W, H, text, tag, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';
import { screen, remap, unmap, settled, cursorAt } from '../lib/footage.js';
import { phone, holdHand, pointHand, laptop, cursor, PHONE, LAPTOP } from '../lib/props.js';

const SEED = 500; // this chapter's seeds are 500-599

const HIT = 0.034; // hits lead their grid point by two frames at 60 fps at most (the guide allows 0.05 s), never trail
const CAM = { f: 1.25, z: 1 }; // the camera: pushes in and pulls back, no overshoot
const PUSHL = { f: 2.6, z: 1 }; // the quick push into the laptop: settled before the paper closes round its window
const REACH = { f: 2.8, z: 1 }; // the tapping hand moving to its next target (critically damped: it lands, it never overshoots)
const LEAD = 0.42; // ...so it sets off this long before each touch and arrives within 1 px of it
const PRESS = { f: 7, z: 1 }; // the fingertip going down on the glass and lifting
const HANG = { f: 1.7, z: 0.3 }; // a tag swinging on its bracket after it drops in

// Seconds after a spring starts at which it first reaches its target.
function firstReach(preset) {
  let t = 0;
  while (step(t, preset) < 1 && t < 3) t += 0.001;
  return t;
}
const ARRIVE = firstReach('slide'); // 0.39 s

// The tapping hand's lean per tap (deg; negative leans the finger left): the arm always comes from the lower right,
// steeper for targets high on the screen so it never lies across what has just appeared.
const LEAN = { 'Phản ánh': -12, 'Đã xảy ra chuyện gì?': -34, 'Chọn vị trí': -28, 'Tầng 3': -28, 'Thang máy B': -28, 'Gửi phản ánh': -20, 'Quay lại': -58 };
const HAND_K = 0.47; // the hand's scale in phone units: its finger is 47 units wide

// Phone framings: body top-left (x, y) on the stage and scale z (stage px per recording CSS px).
const REST = { x: 1210, y: 74, z: 1.04 };
const TYPE = { x: 860, y: 113, z: 1.95 }; // the report box, its typed words at about 31 px
const CONF = { x: 860, y: -16, z: 1.9 }; // the screen's top half: the back arrow and the confirmation, both in frame
// Laptop framings, the same way (z in stage px per page CSS px).
const WIDE = { x: 475, y: 180, z: 0.8 };
const ZOOM = 2.1; // the push into the suggestion: its line at about 35 px
const ZOOM2 = 2.2; // the push into the decision and the chain: their text at about 30 px

const px = (v) => `${v.toFixed(1)}px`;

// Type on ctx.top sits above the stage grain; fill its glyphs with the same grained paper (works for light colours
// on dark paper, as on ctx.root).
function grainText(e, color) {
  e.classList.add('grained');
  Object.assign(e.style, { backgroundColor: color, color: 'transparent', backgroundClip: 'text', webkitBackgroundClip: 'text' });
}

// The logo's artwork box inside its transparent PNG, so "w px wide" means the visible logo.
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

// Four sheets of paper that close in round a window (stage px) from the frame's edges, each with a scissor-cut inner
// edge: like the aperture of the old façade, but the paper arrives. colors: [top, right, bottom, left]. Each sheet's
// box is its whole paper (well past the frame), so no edge of it can show while it travels.
const CLOSE = { f: 3.4, z: 0.9 }; // the sheets arriving: quick, and no bounce over the window's edge
function closers(parent, win, colors, seed) {
  const M = 80;
  const sides = [
    { r: [-M, -M - 400, W + 2 * M, win.y + M + 400], edge: [[-M, win.y], [W + M, win.y]], from: [0, -(win.y + M)] },
    { r: [win.x + win.w, -M, W - win.x - win.w + M + 400, H + 2 * M], edge: [[win.x + win.w, -M], [win.x + win.w, H + M]], from: [W - win.x - win.w + M, 0] },
    { r: [-M, win.y + win.h, W + 2 * M, H - win.y - win.h + M + 400], edge: [[W + M, win.y + win.h], [-M, win.y + win.h]], from: [0, H - win.y - win.h + M] },
    { r: [-M - 400, -M, win.x + M + 400, H + 2 * M], edge: [[win.x, H + M], [win.x, -M]], from: [-(win.x + M), 0] },
  ];
  return sides.map((sd, i) => {
    const [x, y, w, h] = sd.r;
    const cut = jagged(sd.edge[0], sd.edge[1], { seed: seed + i, amp: 3, wave: 60 });
    // the sheet: the rectangle on the far side of the cut edge, the cut replacing its inner side
    let poly;
    if (i === 0) poly = [[x, y], [x + w, y], ...cut.slice().reverse()];
    else if (i === 1) poly = [...cut, [x + w, y + h], [x + w, y]];
    else if (i === 2) poly = [...cut, [x, y + h], [x + w, y + h]];
    else poly = [...cut, [x, y], [x, y + h]];
    const local = rough(poly, { seed: seed + 10 + i, amp: 1.2 }).map(([px0, py0]) => [px0 - x, py0 - y]);
    const e = el(parent, 'grained', {
      left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, backgroundColor: colors[i],
      backgroundPosition: `${-x}px ${-y}px`, clipPath: clip(local),
    });
    return { el: e, from: sd.from };
  });
}

export default {
  async build(ctx) {
    const L15 = ctx.line('L15');
    const L16 = ctx.line('L16');
    const L17 = ctx.line('L17');
    const L18 = ctx.line('L18');
    const g = ctx.grid; // a 16th
    const b = ctx.beat;
    const e8 = 2 * g; // an 8th
    const at = (t) => t - HIT;
    const ceilGrid = (t) => {
      const s = ctx.snap(t);
      return s < t - 1e-6 ? s + g : s;
    };
    const app = await ctx.recording('app');
    const web = await ctx.recording('web');
    const tapOf = (label) => {
      const tp = app.taps.find((x) => x.label === label);
      if (!tp) throw new Error(`the app recording has no tap on "${label}"`);
      return tp;
    };
    const keys = app.keys.map(([t]) => t);
    const firstFrameAfter = (rec, rt) => rec.frames.find(([t]) => t > rt)[0];

    // ---- Beats (chapter-local seconds) on the music's grid. Every tap and click lands on an 8th; slams, stamps and
    // paper landings on 16ths; each beat's text lands early and stays whole until its beat ends.
    const T = {};
    // L15: the phone rises in as soon as ch04's doors are gone; the logo and the promise slide in line by line,
    // "kiểm chứng được" slams; the finger taps "+ Phản ánh" a beat before the promise leaves.
    T.phone = at(ceilGrid(EXIT.ch04 + ARRIVE + HIT)) - ARRIVE;
    T.logo = at(ceilGrid(Math.max(L15.start, T.phone + 0.15 + ARRIVE + HIT))) - ARRIVE;
    T.lines = [3, 5, 7].map((k) => Math.max(T.logo + 0.3, at(ctx.syl('L15', k)) - ARRIVE));
    T.verify = at(ctx.syl('L15', 9));
    T.handIn = ctx.snap(L15.end - 3 * b, 2); // the tapping hand comes in from the lower right
    T.tap = {};
    T.tap['Phản ánh'] = ctx.snap(L15.end - b, 2);
    T.out15 = L15.end; // the logo and the promise leave
    // L16: the report box; the hook's words type in, fast-forward, while the camera pushes in; then the location,
    // one tap per beat; "Gửi phản ánh"; the confirmation on the bar line... a beat later, back to the list.
    T.tap['Đã xảy ra chuyện gì?'] = L16.start;
    T.disp = [at(L16.start + g), at(L16.start + 3 * g)]; // "CƯ DÂN GỬI", "PHẢN ÁNH" (between the key clicks)
    T.k0 = L16.start + g + 0.07; // the first character (after the box's own focus animation, at real speed)
    T.k1 = L16.start + 7 * g; // the last
    T.keys = [1, 2, 3].map((k) => L16.start + k * e8); // key clicks on straight 8ths while the words type in
    T.pushType = L16.start + 0.06;
    T.pullType = T.k1;
    T.tap['Chọn vị trí'] = ctx.snap(T.k1 + g, 2);
    T.tap['Tầng 3'] = T.tap['Chọn vị trí'] + b;
    T.tap['Thang máy B'] = T.tap['Tầng 3'] + b;
    T.tap['Gửi phản ánh'] = T.tap['Thang máy B'] + b;
    T.conf = T.tap['Gửi phản ánh'] + b; // the confirmation appears (the bell)
    T.pushConf = T.tap['Gửi phản ánh'] + g;
    T.tap['Quay lại'] = T.conf + b;
    // "Ảnh ·" as the camera is back on the whole form (its photo row); "vị trí ·" as the form shows the location.
    const back = settled(app, tapOf('Thang máy B').down) - tapOf('Thang máy B').down;
    T.bits = { '24/7': at(L16.start + 5 * g), 'Ảnh ·': at(ctx.snap(T.pullType + 0.42)), 'vị trí ·': at(ceilGrid(T.tap['Thang máy B'] + Math.min(back, b - 0.12))) };
    // L17: the pan to the laptop (the list has been up for about half a second); "AI GỢI Ý" as it lands; the push into
    // the suggestion; the brackets snap as the cursor passes each suggested value; back out as L17 ends.
    T.listed = T.tap['Quay lại'] + e8; // the list shows the new report (the app's fade-through, a little fast)
    T.panLand = ctx.snap(T.listed + 0.45 + ARRIVE, 2);
    T.pan = at(T.panLand) - ARRIVE;
    T.ai = at(T.panLand);
    T.push1 = T.panLand + e8;
    T.close1 = T.panLand + 2 * e8; // the paper closes round the suggestion...
    T.closed1 = T.close1 + e8; // ...and is in place
    T.br = [T.closed1, T.closed1 + e8, T.closed1 + 3 * e8];
    T.pull1 = L17.end;
    // L18: the cursor picks the location (the click on L18's first beat), clicks the button; as the case page loads,
    // "NGƯỜI QUYẾT ĐỊNH" stamps; the scroll, the push, the paper; "mọi bước đều lưu vết".
    T.clickLoc = L18.start;
    T.clickGo = L18.start + 2 * b;
    T.page = L18.start + 2 * b + e8;
    T.scroll = T.page + b;
    T.push2 = T.scroll + 0.05;
    T.close2 = T.scroll + e8;
    T.closed2 = T.close2 + e8;
    T.trail = at(T.closed2);

    // ---- The recordings' time remaps: film time -> recording time. Around each tap the recording plays at real
    // speed until the screen settles (its ripple and its transition play as recorded); the still stretches between
    // are compressed or held. The typing is fast-forwarded between its first and last character.
    const K = [[0, 0]];
    const add = (F, R) => {
      const [f0, r0] = K[K.length - 1];
      if (F > f0 + 1e-6 && R > r0 + 1e-6) K.push([F, R]);
    };
    const tapKey = (label, room) => {
      const tp = tapOf(label);
      const F = T.tap[label];
      add(F, tp.down);
      const s = settled(app, tp.down);
      add(F + Math.min(s - tp.down, room), tp.down + Math.min(s - tp.down, room));
    };
    tapKey('Phản ánh', T.tap['Đã xảy ra chuyện gì?'] - T.tap['Phản ánh'] - 0.2);
    tapKey('Đã xảy ra chuyện gì?', g);
    add(T.k0, keys[0]);
    add(T.k1, keys[keys.length - 1]);
    for (const label of ['Chọn vị trí', 'Tầng 3', 'Thang máy B']) tapKey(label, b - 0.12);
    tapKey('Gửi phản ánh', 0.12);
    const rConf = firstFrameAfter(app, app.marks.confirm - 1e-3); // the frame that first shows the confirmation
    add(T.conf, rConf);
    add(T.tap['Quay lại'], tapOf('Quay lại').down);
    add(T.listed, app.marks.listed);
    add(ctx.dur, app.frames[app.frames.length - 1][0]);
    T.appKeys = K;
    const appT = remap(K);
    const appF = unmap(K);
    // The laptop: the cursor's crossing of each suggested value (its centre) lands on a bracket's 8th.
    const tri = web.boxes.triage;
    const vals = ['Thang máy', 'Cao', '240 phút'].map((s) => tri.values.find((v) => v.text === s).box);
    const lineMoveStart = web.mouse[0][0];
    // The move along the suggestion line: the longest run of logged points at one height.
    let run = [];
    for (let i = 0, j = 0; i < web.mouse.length; i = j) {
      for (j = i; j < web.mouse.length && Math.abs(web.mouse[j][2] - web.mouse[i][2]) < 0.01; j++);
      if (j - i > run.length) run = web.mouse.slice(i, j);
    }
    const crossing = (x) => run.find(([, mx]) => mx >= x)[0];
    const lineEnd = run[run.length - 1][0];
    const clickLoc = web.clicks.find((c) => c.label === 'Vị trí').down;
    const clickGo = web.clicks.find((c) => c.label === 'Xác nhận phân loại').down;
    // The location steps through the list as the arrow keys move (the list itself is native, not in the frames),
    // from the first frame that changes after the click to the frame of its input event (Enter).
    const picked = web.page_events.find((ev) => ev.k === 'input' && ev.t > clickLoc).t;
    const pick = web.frames.filter(([t]) => t > clickLoc + 0.3 && t <= picked + 0.01);
    const wheel = web.page_events.filter((ev) => ev.k === 'wheel');
    const scrolls = web.page_events.filter((ev) => ev.k === 'scroll');
    const rPage = firstFrameAfter(web, web.marks.confirmed - 1e-3); // the first frame of the case page
    const KW = [[0, 0]];
    const addW = (F, R) => {
      const [f0, r0] = KW[KW.length - 1];
      if (F > f0 + 1e-6 && R > r0 + 1e-6) KW.push([F, R]);
    };
    addW(T.push1, lineMoveStart);
    vals.forEach((v, i) => addW(T.br[i], crossing(v[0] + v[2] / 2)));
    addW(T.br[2] + (lineEnd - crossing(vals[2][0] + vals[2][2] / 2)) * 1.1, lineEnd);
    addW(T.clickLoc, clickLoc);
    addW(T.clickLoc + 0.14, pick[0][0] - 0.01); // the location steps through the list (the arrow keys)...
    addW(T.clickLoc + 0.39, pick[pick.length - 1][0]); // ...to Tầng 1 / Thang máy A
    addW(T.clickGo, clickGo);
    addW(T.page, rPage);
    addW(T.scroll, wheel[0].t);
    addW(T.scroll + (scrolls[scrolls.length - 1].t - wheel[0].t), scrolls[scrolls.length - 1].t);
    addW(ctx.dur, web.frames[web.frames.length - 1][0]);
    T.webKeys = KW;
    const webT = remap(KW);
    const webF = unmap(KW);

    // ---- Ground.
    el(ctx.root, '', { width: `${W}px`, height: `${H}px`, background: C.cream });

    // ---- 5.2: the logo (ctx.top, so it shows exactly as the file is) and the promise (on the paper), at left.
    const logoImg = await ctx.image('/assets/brand/lamto-logo.png');
    const art = alphaBox(logoImg);
    const LOGO_W = 360;
    const ls = LOGO_W / art.w;
    const LOGO = { x: 130, y: 150 };
    const logo = el(ctx.top, '', {});
    const logoEl = logoImg.cloneNode();
    logoEl.className = 'abs';
    Object.assign(logoEl.style, {
      width: px(logoImg.naturalWidth * ls), height: px(logoImg.naturalHeight * ls),
      left: px(LOGO.x - art.x * ls), top: px(LOGO.y - art.y * ls),
    });
    logo.appendChild(logoEl);
    const LS = 64;
    const lineH = Math.round(LS * 1.2);
    const TY = Math.round(LOGO.y + art.h * ls + 90);
    const lines = ['Từ một phản ánh', 'đến khoản chi', 'ai cũng '].map((s, i) =>
      el(ctx.root, 'label', { left: `${LOGO.x}px`, top: `${TY + i * lineH}px`, fontSize: `${LS}px`, lineHeight: 1.2, color: C.black, whiteSpace: 'nowrap' }, s.normalize('NFC')));
    const verify = piece(lines[2], 'kiểm chứng được', { color: C.navy, transformOrigin: '0% 70%' });

    // ---- 5.3 / 5.4: who sends it, and what goes with it (left column, on the paper).
    const DS = 120;
    const DX = 130;
    const DY = 300;
    const disp = ['CƯ DÂN GỬI', 'PHẢN ÁNH'].map((s, i) =>
      text(ctx.root, 'disp cut-text', s, { size: DS, color: C.black, left: `${DX}px`, top: `${DY + i * Math.round(DS * 1.1)}px`, transformOrigin: '0% 70%' }).el);
    const label = el(ctx.root, 'label', { left: `${DX}px`, top: `${DY + 2 * Math.round(DS * 1.1) + 22}px`, fontSize: '56px', lineHeight: 1.2, color: C.navy, whiteSpace: 'nowrap' });
    const bits = Object.keys(T.bits).sort((a, b2) => ['Ảnh ·', 'vị trí ·', '24/7'].indexOf(a) - ['Ảnh ·', 'vị trí ·', '24/7'].indexOf(b2)).map((s, i) => {
      if (i) label.appendChild(document.createTextNode(' '));
      return { e: piece(label, s, { transformOrigin: '50% 60%' }), t: T.bits[s] };
    });

    // ---- The phone rig (ctx.top: its paper overlaps the recording): palm, phone and screen, thumb and fingertips,
    // the tapping hand; all in the phone's units under one camera transform.
    const prig = el(ctx.top, '', { transformOrigin: '0 0' });
    const under = el(prig, '', {});
    const ph = phone(prig, { seed: SEED + 20 });
    const over = el(prig, '', {});
    holdHand(under, over, { seed: SEED + 40 });
    const appScreen = await screen(ph.screen, app);
    const hand = pointHand(over, { seed: SEED + 60 });
    // The hand's path (phone units): in from the lower right, each tap's contact point at its time, aside while the
    // words type in. One spring per change of target for x, y and lean; the fingertip's press from the log.
    const sp = (tp) => [PHONE.sx + tp.x, PHONE.sy + tp.y];
    const OFF = [760, 1500];
    const ASIDE = [470, 830];
    const HOVER = [44, 70]; // the finger waits just below and right of its first target, then goes in
    const hx = [[T.handIn, sp(tapOf('Phản ánh'))[0] + HOVER[0], REACH], [T.tap['Phản ánh'] - LEAD, sp(tapOf('Phản ánh'))[0], REACH]];
    const hy = [[T.handIn, sp(tapOf('Phản ánh'))[1] + HOVER[1], REACH], [T.tap['Phản ánh'] - LEAD, sp(tapOf('Phản ánh'))[1], REACH]];
    const ha = [[T.handIn, LEAN['Phản ánh'], REACH]];
    const order = ['Phản ánh', 'Đã xảy ra chuyện gì?', 'Chọn vị trí', 'Tầng 3', 'Thang máy B', 'Gửi phản ánh', 'Quay lại'];
    const press = [];
    order.forEach((lab, i) => {
      const tp = tapOf(lab);
      const F = T.tap[lab];
      const down = appF(tp.down);
      const up = appF(tp.up);
      if (Math.abs(down - F) > 1e-3) throw new Error(`tap "${lab}" maps to ${down.toFixed(3)} s, not its beat ${F.toFixed(3)} s`);
      if (i > 0) {
        const [x, y] = sp(tp);
        hx.push([F - LEAD, x, REACH]);
        hy.push([F - LEAD, y, REACH]);
        ha.push([F - LEAD, LEAN[lab], REACH]);
      }
      press.push([down, 1, PRESS], [up, 0, PRESS]);
      if (lab === 'Quay lại') { // done: the hand leaves the way it came, clear of the list
        hx.push([up + 0.03, OFF[0], REACH]);
        hy.push([up + 0.03, OFF[1], REACH]);
        ha.push([up + 0.03, -30, REACH]);
      }
      if (lab === 'Đã xảy ra chuyện gì?') { // aside while the words type in
        hx.push([up + 0.05, ASIDE[0], REACH]);
        hy.push([up + 0.05, ASIDE[1], REACH]);
        ha.push([up + 0.05, -18, REACH]);
      }
    });
    T.handX = track(OFF[0], hx);
    T.handY = track(OFF[1], hy);
    T.handA = track(-16, ha);
    T.press = track(0, press);
    T.handUp = appF(tapOf('Quay lại').up);
    // The camera on the phone rig.
    T.camP = {
      z: track(REST.z, [[T.pushType, TYPE.z, CAM], [T.pullType, REST.z, CAM], [T.pushConf, CONF.z, CAM]]),
      x: track(REST.x, [[T.pushType, TYPE.x, CAM], [T.pullType, REST.x, CAM], [T.pushConf, CONF.x, CAM], [T.pan, CONF.x - 2300, 'slide']]),
      y: track(1180, [[T.phone, REST.y, 'slide'], [T.pushType, TYPE.y, CAM], [T.pullType, REST.y, CAM], [T.pushConf, CONF.y, CAM]]),
    };

    // ---- The laptop rig: laptop and screen, the cursor; in the page's units under one camera transform.
    const lrig = el(ctx.top, '', { transformOrigin: '0 0' });
    const lp = laptop(lrig, { seed: SEED + 80 });
    const webScreen = await screen(lp.screen, web);
    // Framings of the two push-ins: a page region (CSS px of the viewport) brought to a window on the stage.
    const frameOf = (r, wx, wy, z) => ({ x: wx - (LAPTOP.sx + r[0]) * z, y: wy - (LAPTOP.sy + r[1]) * z, z });
    const R1 = [tri.line[0] - 34, tri.heading[1] - 16, tri.line[0] + tri.line[2] + 40, tri.line[1] + tri.line[3] + 14];
    // The case page after the scroll (viewport CSS px): the decision (its heading and line) and, below the page's
    // "Tiến độ" section, the accountability chain (its heading and steps).
    const cs = web.boxes.case;
    const sy = web.scroll;
    const R2 = [tri.line[0] - 30, cs.decision_heading[1] - sy - 14, cs.chain[0] + cs.chain[2] + 24, cs.chain[1] + cs.chain[3] - sy + 12];
    const MID = [cs.decision[1] + cs.decision[3] - sy + 12, cs.chain_heading[1] - sy - 14]; // the band between them
    const WIN1 = { x: 330, y: 250 };
    const S1 = frameOf(R1, WIN1.x, WIN1.y, ZOOM);
    const WIN2 = { x: Math.round((W - (R2[2] - R2[0]) * ZOOM2) / 2) + 40, y: H - 26 - Math.round((R2[3] - R2[1]) * ZOOM2) };
    const S2 = frameOf(R2, WIN2.x, WIN2.y, ZOOM2);
    const win1 = { x: WIN1.x, y: WIN1.y, w: (R1[2] - R1[0]) * ZOOM, h: (R1[3] - R1[1]) * ZOOM };
    const win2 = { x: WIN2.x, y: WIN2.y, w: (R2[2] - R2[0]) * ZOOM2, h: (R2[3] - R2[1]) * ZOOM2 };
    const mid = { y0: S2.y + (LAPTOP.sy + MID[0]) * ZOOM2, y1: S2.y + (LAPTOP.sy + MID[1]) * ZOOM2 };
    T.camL = {
      z: track(WIDE.z, [[T.push1, S1.z, PUSHL], [T.pull1, WIDE.z, CAM], [T.push2, S2.z, PUSHL]]),
      x: track(W + 60, [[T.pan, WIDE.x, 'slide'], [T.push1, S1.x, PUSHL], [T.pull1, WIDE.x, CAM], [T.push2, S2.x, PUSHL]]),
      y: track(WIDE.y, [[T.push1, S1.y, PUSHL], [T.pull1, WIDE.y, CAM], [T.push2, S2.y, PUSHL]]),
    };
    T.clickPress = track(0, web.clicks.flatMap((c) => [[webF(c.down), 1, PRESS], [webF(c.down + 0.09), 0, PRESS]]));

    // ---- 5.5: the paper that closes round the suggestion (CREAM, with a NAVY pocket below it for the tags), the
    // brackets under the three suggested values and their tags.
    const pocketTop = win1.y + win1.h - 6;
    const shut1 = closers(ctx.top, win1, [C.cream, C.cream, C.navy, C.cream], SEED + 100);
    // The cursor rides above that paper (it is an overlay, like the hand) and under the tags; the camera is applied
    // to it by hand. The paper that closes round the decision later covers it where it rests.
    const curLayer = el(ctx.top, '', { transformOrigin: '0 0' });
    const cur = cursor(curLayer, { seed: SEED + 95 });
    const bracketLayer = el(ctx.top, '', {});
    const TAGS = ['nhóm sự cố', 'mức khẩn', 'hạn xử lý'];
    const vx = (v) => S1.x + (LAPTOP.sx + v) * ZOOM;
    const vy = (v) => S1.y + (LAPTOP.sy + v) * ZOOM;
    const tg = TAGS.map((s, i) => tag(bracketLayer, s, { size: 56, color: C.black, bg: C.cream, padX: 0.36, padY: 0.24, seed: SEED + 36 + i, rot: [-1.5, 1.2, -1][i], grained: true }));
    const centres = vals.map((v) => vx(v[0] + v[2] / 2));
    const lefts = [];
    tg.forEach((t, i) => lefts.push(i ? Math.max(centres[i] - t.w / 2, lefts[i - 1] + tg[i - 1].w + 40) : centres[i] - t.w / 2));
    const brackets = vals.map((v, i) => {
      const x0 = vx(v[0]) - 7;
      const w = v[2] * ZOOM + 14;
      const y0 = vy(v[1] + v[3]) + 6;
      const h = pocketTop + 12 - y0;
      const u = [[0, 0], [10, 0], [10, h - 13], [w - 10, h - 13], [w - 10, 0], [w, 0], [w, h], [0, h]];
      const e = el(bracketLayer, 'grained', {
        left: px(x0), top: px(y0), width: px(w), height: px(h), backgroundColor: C.orange,
        backgroundPosition: `${-x0}px ${-y0}px`, clipPath: clip(rough(u, { seed: SEED + 30 + i, amp: 1.4, wave: 30, spacing: 5 })), transformOrigin: '50% 100%',
      });
      Object.assign(tg[i].el.style, { left: px(lefts[i]), top: px(pocketTop + 12), transformOrigin: `${px(centres[i] - lefts[i])} 0px` });
      return e;
    });
    const aiTag = tag(ctx.top, 'AI GỢI Ý', { cls: 'disp cut-text', size: 110, color: C.black, bg: C.orange, seed: SEED + 20, rot: -2, grained: true });
    const AI = { x: 60, y: 40 };

    // ---- 5.6: the paper round the decision and the chain; "NGƯỜI QUYẾT ĐỊNH"; "mọi bước đều lưu vết".
    const shut2 = closers(ctx.top, win2, [C.cream, C.cream, C.cream, C.cream], SEED + 120);
    // A NAVY band slides in over the page's "Tiến độ" section between the two (a mask: nothing is redrawn), carrying
    // "mọi bước đều lưu vết" down to the chain.
    const band = el(ctx.top, '', {});
    const BX = -160; // the band's paper runs well past both edges of the frame, so its overshoot never shows an end
    const BW = W + 320;
    const by0 = Math.floor(mid.y0) - 8;
    const bandPoly = [...jagged([BX, mid.y0], [BX + BW, mid.y0], { seed: SEED + 130, amp: 3, wave: 60 }), ...jagged([BX + BW, mid.y1], [BX, mid.y1], { seed: SEED + 131, amp: 3, wave: 60 })];
    el(band, 'grained', {
      left: `${BX}px`, top: `${by0}px`, width: `${BW}px`, height: `${Math.ceil(mid.y1 - mid.y0) + 16}px`, backgroundColor: C.navy,
      backgroundPosition: `${-BX}px ${-by0}px`, clipPath: clip(rough(bandPoly, { seed: SEED + 132, amp: 1 }).map(([x0, y0]) => [x0 - BX, y0 - by0])),
    });
    const TS = 72;
    const trail = text(band, 'label', 'mọi bước đều lưu vết', { size: TS, color: 'transparent', left: `${win2.x + 34}px`, top: `${Math.round((mid.y0 + mid.y1) / 2 - TS * 0.62)}px` });
    grainText(trail.el, C.cream);
    const decTag = tag(ctx.top, 'NGƯỜI QUYẾT ĐỊNH', { cls: 'disp cut-text', size: 84, color: C.cream, bg: C.navy, seed: SEED + 26, rot: -2, grained: true });
    const DEC = { x: 60, y: Math.max(20, win2.y - 150) };

    // Landing times (for the sound): each spring's first arrival at its target.
    const land = {
      phone: T.phone + ARRIVE, logo: T.logo + ARRIVE, lines: T.lines.map((x) => x + ARRIVE), pan: T.pan + ARRIVE,
      close1: T.close1 + firstReach(CLOSE), close2: T.close2 + firstReach(CLOSE), trail: T.trail,
    };
    // Where each tap sits across the frame, with the camera where it is at that moment.
    const pans = {};
    for (const lab of order) {
      const F = T.tap[lab];
      pans[lab] = clamp((T.camP.x(F) + (PHONE.sx + tapOf(lab).x) * T.camP.z(F) - 960) / 960, -1, 1);
    }

    return {
      T, land, pans, appT, webT, appScreen, webScreen, logo, lines, verify, disp, bits, prig, hand, lrig, cur, shut1, shut2,
      bracketLayer, brackets, tags: tg.map((t) => t.el), aiTag, AI, decTag, DEC, band, web, order, curLayer,
    };
  },

  render(s, t0, ctx) {
    const t = Math.min(t0, ctx.dur); // hold the last frame for ch06's cover
    const { T } = s;

    // ---- 5.2: the logo and the promise.
    const in15 = t >= T.logo && t < T.out15 + 1.2;
    const ex15 = spring(t, T.out15, 0, -1500, 'drop');
    if (vis(s.logo, in15)) s.logo.style.transform = `translateX(${px(spring(t, T.logo, -760, 0, 'slide') + ex15)})`;
    s.lines.forEach((e, i) => {
      if (vis(e, in15 && t >= T.lines[i])) e.style.transform = `translateX(${px(spring(t, T.lines[i], -1300, 0, 'slide') + ex15)})`;
    });
    if (vis(s.verify, t >= T.verify)) s.verify.style.transform = `scale(${spring(t, T.verify, 1.12, 1, 'slam').toFixed(4)})`;

    // ---- 5.3 / 5.4: the left column (it pans out with the phone).
    const panP = spring(t, T.pan, 0, -2300, 'slide');
    s.disp.forEach((d, i) => {
      if (vis(d, t >= T.disp[i] && t < T.pan + 1)) d.style.transform = `translateX(${px(panP)}) scale(${spring(t, T.disp[i], 1.14, 1, 'slam').toFixed(4)})`;
    });
    s.bits.forEach(({ e, t: tb }) => {
      if (vis(e, t >= tb && t < T.pan + 1)) e.style.transform = `translate(${px(panP)}, ${px(spring(t, tb, -26, 0, 'snap'))})`;
    });

    // The phone: camera, recording, hand.
    const onP = t >= T.phone && t < T.pan + 1;
    if (vis(s.prig, onP)) {
      s.prig.style.transform = `translate(${px(T.camP.x(t))}, ${px(T.camP.y(t))}) scale(${T.camP.z(t).toFixed(4)})`;
      s.appScreen.at(s.appT(t));
      const handOn = t >= T.handIn - 0.05;
      if (vis(s.hand.el, handOn)) s.hand.place(T.handX(t), T.handY(t), T.handA(t), HAND_K, clamp(T.press(t)));
    }

    // ---- 5.5 / 5.6: the laptop.
    const onL = t >= T.pan;
    if (vis(s.lrig, onL)) {
      const cam = `translate(${px(T.camL.x(t))}, ${px(T.camL.y(t))}) scale(${T.camL.z(t).toFixed(4)})`;
      s.lrig.style.transform = cam;
      s.curLayer.style.transform = cam;
      const rt = s.webT(t);
      s.webScreen.at(rt);
      const c = cursorAt(s.web.mouse, rt);
      s.cur.place(LAPTOP.sx + c[0], LAPTOP.sy + c[1], clamp(T.clickPress(t)));
    }
    vis(s.curLayer, onL);
    // The paper round the suggestion closes as the push lands and opens as L17 ends; the brackets and tags ride the
    // pocket out.
    const shut = (sheets, tClose, tOpen) => sheets.forEach((sh, i) => {
      const on = t >= tClose && (tOpen === null || t < tOpen + 1.2);
      if (vis(sh.el, on)) {
        const k = 1 - step(t - tClose, CLOSE) + (tOpen === null ? 0 : step(t - tOpen, 'drop'));
        sh.el.style.transform = `translate(${px(sh.from[0] * k)}, ${px(sh.from[1] * k)})`;
      }
    });
    shut(s.shut1, T.close1, T.pull1);
    shut(s.shut2, T.close2, null);
    const pocketDrop = s.shut1[2].from[1] * step(t - T.pull1, 'drop');
    vis(s.bracketLayer, t >= T.br[0] && t < T.pull1 + 1.2);
    s.bracketLayer.style.transform = `translateY(${px(pocketDrop)})`;
    s.brackets.forEach((e, i) => {
      if (vis(e, t >= T.br[i])) e.style.transform = `translateY(${px(spring(t, T.br[i], 12, 0, 'snap'))}) scaleX(${spring(t, T.br[i], 0.3, 1, 'snap').toFixed(4)})`;
    });
    s.tags.forEach((e, i) => {
      if (vis(e, t >= T.br[i])) e.style.transform = `translateY(${px(spring(t, T.br[i], -12, 0, 'snap'))}) rotate(${spring(t, T.br[i], [5, -4, 4][i], 0, HANG).toFixed(3)}deg)`;
    });
    if (vis(s.aiTag.el, t >= T.ai && t < T.pull1 + 1.2)) {
      s.aiTag.el.style.transform = `translate(${px(s.AI.x + spring(t, T.pull1, 0, -900, 'drop'))}, ${px(s.AI.y)}) scale(${spring(t, T.ai, 1.25, 1, 'slam').toFixed(4)})`;
    }
    if (vis(s.decTag.el, t >= T.page)) {
      s.decTag.el.style.transform = `translate(${px(s.DEC.x)}, ${px(s.DEC.y)}) scale(${spring(t, T.page, 1.22, 1, 'slam').toFixed(4)})`;
    }
    if (vis(s.band, t >= T.trail - ARRIVE)) s.band.style.transform = `translateX(${px(spring(t, T.trail - ARRIVE, -(W + 220), 0, 'slide'))})`;
  },

  // Event times (chapter-local) for the sound (docs/ANIMATION_GUIDE.md, section 12). Taps, key clicks and clicks are
  // the recording's own events, placed on the film's timeline by the remap (each on an 8th); `pan` is where the event
  // sits across the frame, (x - 960) / 960.
  cues(s) {
    const { T, land: L } = s;
    return [
      // 5.2 the phone rises in; the logo and the promise slide in line by line; "kiểm chứng được" slams
      { t: T.phone, name: 'slide', land: L.phone, pan: 0.5 },
      { t: T.logo, name: 'slide', land: L.logo, pan: -0.6 },
      ...T.lines.map((t, i) => ({ t, name: 'slide', land: L.lines[i], pan: -0.4 })),
      { t: T.verify, name: 'slam', pan: -0.3 },
      // 5.3-5.4 the finger's taps on the glass; "CƯ DÂN GỬI", "PHẢN ÁNH"; the key clicks; the confirmation
      ...s.order.map((lab) => ({ t: T.tap[lab], name: 'tap', pan: s.pans[lab] })),
      ...T.disp.map((t) => ({ t, name: 'slam', pan: -0.6 })),
      ...T.keys.map((t, i) => ({ t, name: 'key', i, pan: 0.3 })),
      { t: T.conf, name: 'bell', pan: 0.3 },
      // 5.5 the pan to the laptop; "AI GỢI Ý"; the paper closes round the suggestion; three brackets; it opens
      { t: T.pan, name: 'pan', land: L.pan },
      { t: T.ai, name: 'slam', pan: -0.7 },
      { t: T.close1, name: 'doors', land: L.close1 },
      ...T.br.map((t, i) => ({ t, name: 'snap', i, pan: [-0.4, -0.15, 0.35][i] })),
      { t: T.pull1, name: 'doors' },
      // 5.6 the two clicks; "NGƯỜI QUYẾT ĐỊNH" as the case page loads; the scroll; the paper; the trail
      { t: T.clickLoc, name: 'click', pan: 0.35 },
      { t: T.clickGo, name: 'click', pan: 0.35 },
      { t: T.page, name: 'stamp', pan: -0.6 },
      { t: T.scroll, name: 'scroll' },
      { t: T.close2, name: 'doors', land: L.close2 },
      { t: T.trail - ARRIVE, name: 'slide', land: L.trail, pan: -0.8 },
    ];
  },
};
