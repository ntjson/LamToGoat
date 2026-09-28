// ch01 Hook (shots 1.1-1.5). A real complaint is lost in a group chat; the chat is cut away; the fund balance has a
// block of digits cut out of it; the hole tears open into the question "TIỀN QUỸ ĐI ĐÂU?".
// Every beat is anchored to the voice lines L01-L03; nothing here uses film-absolute seconds.
import { step, spring, track, rng } from '../lib/motion.js';
import { C, el, rough, rect, bubble, blob, clip, jagged, pathData } from '../lib/paper.js';

const W = 1920;
const H = 1080;
// The resident's report, word for word from the product (android-light-03-issues, android-light-06-issue-detail).
const COMPLAINT = ['Thang máy B kẹt cửa ở tầng 3,', 'phải bấm nhiều lần mới mở được.'];
// The demo fund balance (desktop-fund, android-light-02-home). The middle block is cut out, not replaced.
const FIGURE = ['981.', '500', '.000 đ'];

const SCROLL = { f: 2.4, z: 0.85 };
const STACK_BOTTOM = 1010; // the newest bubble stays above this line
const GAP = 24;
const CFONT = 72; // complaint text size
const CY = 360; // complaint top, in stack coordinates

// The chat for a given opening interval a: the complaint, then anonymous messages arriving faster and faster
// (a, then 15% shorter each time, never under 0.08 s) until L01 ends. The stack scrolls with one spring per arrival.
function chatFor(L01, cw, ch, a) {
  const r = rng(101);
  const items = [{ kind: 'complaint', x: 150, y: CY, w: cw, h: ch, tail: 'left', tIn: 0.15 }];
  let y = CY + ch + GAP;
  for (let t = 0.8, iv = a; t <= L01.end - 0.05; t += iv, iv = Math.max(0.08, iv * 0.85)) {
    const bars = 1 + Math.floor(r() * 3);
    const w = Math.round(420 + r() * 620);
    const h = bars * 26 + (bars - 1) * 16 + 68 + 26;
    const tail = r() < 0.55 ? 'left' : 'right';
    const widths = Array.from({ length: bars }, (_, i) => (i === bars - 1 ? 0.35 + 0.3 * r() : 0.6 + 0.35 * r()));
    items.push({ kind: 'anon', x: tail === 'left' ? 150 : W - 150 - w, y, w, h, tail, tIn: t, widths });
    y += h + GAP;
  }
  const keys = [];
  let last = 0;
  for (const it of items) {
    const target = Math.max(0, it.y + it.h - STACK_BOTTOM);
    if (target !== last) keys.push([it.tIn, target, SCROLL]);
    last = target;
  }
  return { items, scroll: track(0, keys) };
}

// Pick the cadence whose complaint leaves the top of the frame on "trôi" (L01, syllable 7): the picture says
// "drifts away" when the voice does, and stays in sync whenever the timeline is re-flowed.
function layoutChat(ctx, cw, ch) {
  const L01 = ctx.line('L01');
  const target = ctx.syl('L01', 7);
  let best = null;
  for (let a = 0.3; a <= 1.2; a += 0.02) {
    const chat = chatFor(L01, cw, ch, a);
    let exit = L01.end + 1;
    for (let t = 0.8; t <= L01.end; t += 1 / 120) {
      if (chat.scroll(t) >= CY + ch + 10) {
        exit = t;
        break;
      }
    }
    if (!best || Math.abs(exit - target) < Math.abs(best.exit - target)) best = { chat, exit };
  }
  return best.chat;
}

// One black sheet with its own copy of the chat (the whole sheet, and each half after the cut, get a copy).
function makeSheet(parent, chat, clipPath) {
  const sheet = el(parent, '', { width: `${W}px`, height: `${H}px`, background: C.black, transformOrigin: '50% 50%' });
  if (clipPath) sheet.style.clipPath = clipPath;
  const stack = el(sheet, '', { width: `${W}px`, height: `${H}px` });
  const els = chat.items.map((it, i) => {
    const b = el(stack, '', {
      left: `${it.x}px`, top: `${it.y}px`, width: `${it.w}px`, height: `${it.h}px`,
      background: C.cream, clipPath: clip(rough(bubble(it.w, it.h, { tail: it.tail, th: it.kind === 'complaint' ? 28 : 26 }), { seed: 11 + i, amp: 3 })),
      transformOrigin: it.tail === 'left' ? '40px 100%' : `${it.w - 40}px 100%`,
    });
    if (it.kind === 'complaint') {
      el(b, 'label', { left: '50px', top: '40px', fontSize: `${CFONT}px`, lineHeight: 1.22, color: C.black, whiteSpace: 'nowrap' },
        COMPLAINT.join('<br>'));
    } else {
      it.widths.forEach((u, k) => {
        const bw = Math.round((it.w - 72) * u);
        el(b, '', {
          left: '36px', top: `${34 + k * 42}px`, width: `${bw}px`, height: '26px', background: C.bar,
          clipPath: clip(rough(rect(0, 0, bw, 26, 13), { seed: 300 + i * 7 + k, amp: 1.5 })),
        });
      });
    }
    return b;
  });
  return { sheet, stack, els };
}

export default {
  build(ctx) {
    const L01 = ctx.line('L01');
    const L03 = ctx.line('L03');
    const root = ctx.root;
    const probe = el(root, 'label', { fontSize: `${CFONT}px`, lineHeight: 1.22, whiteSpace: 'nowrap' }, COMPLAINT.join('<br>'));
    const cw = Math.round(probe.getBoundingClientRect().width + 100);
    const ch = Math.round(CFONT * 1.22 * 2 + 2 * 40 + 28);
    probe.remove();
    const chat = layoutChat(ctx, cw, ch);

    // Beats (chapter-local seconds), all derived from the voice lines.
    const T = {
      cut: L01.end + 0.1, // scissor line starts
      split: L01.end + 0.52, // the two halves leave
      strip: ctx.line('L02').start - 0.3, // balance strip slides in
      cut500: ctx.syl('L02', 3) - 0.05, // on "lặng"
      tear: Math.min(L03.start - 0.72, ctx.line('L02').end + 0.05), // the hole tears open in the breath after L02
      slam: L03.start - 0.06, // the question lands on "Tiền"
    };
    T.drop = T.cut500 + 0.35;

    // Layer 1: orange field.
    el(root, '', { width: `${W}px`, height: `${H}px`, background: C.orange });

    // Layer 2: the balance strip (cream paper over a black patch that shows through the hole after the cut).
    const FTOP = 132; // figure top inside the strip
    const FS = 300; // figure size
    const strip = el(root, '', { filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))' });
    const patch = el(strip, '', { background: C.black });
    const paper = el(strip, '', { background: C.cream });
    el(strip, 'label', { left: '66px', top: '46px', fontSize: '60px', color: C.black, whiteSpace: 'nowrap' }, 'Quỹ bảo trì');
    const fig = el(strip, 'disp', { left: '56px', top: `${FTOP}px`, fontSize: `${FS}px`, lineHeight: 1, color: C.black, whiteSpace: 'nowrap' });
    const spans = FIGURE.map((s) => {
      const sp = document.createElement('span');
      sp.textContent = s;
      fig.appendChild(sp);
      return sp;
    });
    // Measure the real glyph boxes (fonts are loaded before build).
    const fr = fig.getBoundingClientRect();
    const sw = Math.round(fr.width + 116);
    const sh = FTOP + FS + 64;
    const SY = Math.round((H - sh) / 2);
    strip.style.top = `${SY}px`;
    Object.assign(strip.style, { width: `${sw}px`, height: `${sh}px` });
    Object.assign(paper.style, { width: `${sw}px`, height: `${sh}px` });
    const outer = rough(rect(0, 0, sw, sh), { seed: 21, amp: 4 });
    const m = spans[1].getBoundingClientRect();
    const sr = strip.getBoundingClientRect();
    const hole = { x: Math.round(m.left - sr.left - 18), y: FTOP + 22, w: Math.round(m.width + 36), h: FS - 34 };
    const holePoly = rough(rect(hole.x, hole.y, hole.w, hole.h), { seed: 22, amp: 3 });
    const clipWhole = clip(outer);
    const clipHoled = clip(outer, holePoly);
    Object.assign(patch.style, { left: `${hole.x}px`, top: `${hole.y}px`, width: `${hole.w}px`, height: `${hole.h}px` });
    const stripX = (t) => spring(t, T.strip, -sw - 80, Math.round((W - sw) / 2) - 60, 'slide');

    // Layer 3: the cut-out "500" piece and the scissor outline around it.
    const piece = el(root, '', { width: `${hole.w}px`, height: `${hole.h}px`, transformOrigin: '50% 30%', filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.3))' });
    const piecePaper = el(piece, '', { width: `${hole.w}px`, height: `${hole.h}px`, background: C.cream, clipPath: clip(rough(rect(0, 0, hole.w, hole.h), { seed: 22, amp: 3 })) });
    el(piecePaper, 'disp', { left: `${m.left - sr.left - hole.x}px`, top: `${FTOP - hole.y}px`, fontSize: `${FS}px`, lineHeight: 1, color: C.black, whiteSpace: 'nowrap' }, FIGURE[1]);
    const outlinePts = rough(rect(hole.x, hole.y, hole.w, hole.h), { seed: 22, amp: 3 });
    const svgNS = 'http://www.w3.org/2000/svg';
    const outline = document.createElementNS(svgNS, 'svg');
    outline.setAttribute('width', sw);
    outline.setAttribute('height', sh);
    outline.setAttribute('class', 'abs');
    const oPath = document.createElementNS(svgNS, 'path');
    oPath.setAttribute('d', pathData(outlinePts));
    oPath.setAttribute('fill', 'none');
    oPath.setAttribute('stroke', C.black);
    oPath.setAttribute('stroke-width', '4');
    outline.appendChild(oPath);
    root.appendChild(outline);
    const oLen = oPath.getTotalLength();
    oPath.setAttribute('stroke-dasharray', `${oLen} ${oLen}`);

    // Layer 4: the black chat sheet: whole before the cut, two halves after it.
    const cutLine = jagged([1540, -40], [380, 1120], { seed: 31, amp: 14 });
    const polyA = [[-80, -80], [1540, -80], ...cutLine, [380, H + 80], [-80, H + 80]];
    const polyB = [[1540, -80], [W + 80, -80], [W + 80, H + 80], [380, H + 80], ...[...cutLine].reverse()];
    const whole = makeSheet(root, chat, null);
    const halfA = makeSheet(root, chat, clip(polyA));
    const halfB = makeSheet(root, chat, clip(polyB));

    // Layer 5: the scissor line, drawn along the cut before the halves part.
    const scissor = document.createElementNS(svgNS, 'svg');
    scissor.setAttribute('width', W);
    scissor.setAttribute('height', H);
    scissor.setAttribute('class', 'abs');
    const sPath = document.createElementNS(svgNS, 'path');
    sPath.setAttribute('d', pathData(cutLine, false));
    sPath.setAttribute('fill', 'none');
    sPath.setAttribute('stroke', C.orange);
    sPath.setAttribute('stroke-width', '7');
    sPath.setAttribute('stroke-linejoin', 'round');
    scissor.appendChild(sPath);
    root.appendChild(scissor);
    const sLen = sPath.getTotalLength();
    sPath.setAttribute('stroke-dasharray', `${sLen} ${sLen}`);

    // Layer 6: black tear that grows out of the hole and swallows the frame.
    const R = 100;
    const fringe = el(root, '', { width: `${2 * R}px`, height: `${2 * R}px`, background: C.cream, transformOrigin: '50% 50%', clipPath: clip(blob(R, R, R * 0.92 * 1.045, { seed: 41 })) });
    const tear = el(root, '', { width: `${2 * R}px`, height: `${2 * R}px`, background: C.black, transformOrigin: '50% 50%', clipPath: clip(blob(R, R, R * 0.92, { seed: 41 })) });

    // Layer 7: the question.
    const q = el(root, 'disp cut-text', { left: '120px', top: '0px', fontSize: '340px', lineHeight: 1.02, color: C.cream, whiteSpace: 'nowrap', transformOrigin: '0 50%' },
      `TIỀN QUỸ<br><span style="color:${C.orange}">ĐI ĐÂU?</span>`);
    const qh = q.getBoundingClientRect().height;
    q.style.top = `${Math.round((H - qh) / 2)}px`;

    const tearScale = track(1.4, [[T.tear, 4.2, { f: 2.0, z: 0.85 }], [T.slam - 0.3, 26, { f: 1.6, z: 1 }]]);
    return { T, tearScale, chat, whole, halfA, halfB, strip, paper, spans, clipWhole, clipHoled, stripX, SY, hole, piece, outline, oPath, oLen, sPath, sLen, fringe, tear, q };
  },

  render(s, t) {
    const { T } = s;
    // Chat: bubbles pop in at their times, the stack scrolls; scrolling freezes at the cut.
    const scroll = s.chat.scroll(Math.min(t, T.cut));
    for (const sheet of [s.whole, s.halfA, s.halfB]) {
      sheet.stack.style.transform = `translateY(${-scroll}px)`;
      s.chat.items.forEach((it, i) => {
        const b = sheet.els[i];
        const on = t >= it.tIn;
        b.style.visibility = on ? 'inherit' : 'hidden';
        if (on) {
          const k = it.kind === 'complaint' ? spring(t, it.tIn, 1.25, 1, 'slam') : spring(t, it.tIn, 0.55, 1, 'snap');
          const dy = it.kind === 'complaint' ? 0 : spring(t, it.tIn, 40, 0, 'snap');
          const rot = it.kind === 'complaint' ? spring(t, it.tIn, -6, -1.5, 'slide') : 0;
          b.style.transform = `translateY(${dy}px) rotate(${rot}deg) scale(${k})`;
        }
      });
    }
    const split = t >= T.split;
    s.whole.sheet.style.visibility = split ? 'hidden' : 'inherit';
    s.halfA.sheet.style.visibility = split ? 'inherit' : 'hidden';
    s.halfB.sheet.style.visibility = split ? 'inherit' : 'hidden';
    if (split) {
      const a = step(t - T.split, 'drop');
      const b = step(t - T.split - 0.07, 'drop');
      s.halfA.sheet.style.transform = `translate(${-380 * a}px, ${-1250 * a}px) rotate(${-7 * a}deg)`;
      s.halfB.sheet.style.transform = `translate(${300 * b}px, ${1250 * b}px) rotate(${6 * b}deg)`;
    }
    // Scissor line along the cut.
    const cutting = t >= T.cut && t < T.split + 0.05;
    s.sPath.style.visibility = cutting ? 'visible' : 'hidden';
    if (cutting) s.sPath.setAttribute('stroke-dashoffset', `${s.sLen * (1 - step(t - T.cut, { f: 1.8, z: 1 }))}`);

    // Balance strip, then the "500" cut and drop.
    const x = s.stripX(t);
    const sy = s.SY;
    s.strip.style.transform = `translate(${x}px, 0px)`;
    const dropped = t >= T.drop;
    s.paper.style.clipPath = dropped ? s.clipHoled : s.clipWhole;
    s.spans[1].style.visibility = dropped ? 'hidden' : 'visible';
    const cutting500 = t >= T.cut500 && t < T.drop + 0.1;
    s.oPath.style.visibility = cutting500 ? 'visible' : 'hidden';
    s.outline.style.transform = `translate(${x}px, ${sy}px)`;
    if (cutting500) s.oPath.setAttribute('stroke-dashoffset', `${s.oLen * (1 - step(t - T.cut500, { f: 3, z: 1 }))}`);
    s.piece.style.visibility = dropped ? 'visible' : 'hidden';
    if (dropped) {
      const d = step(t - T.drop, 'drop');
      s.piece.style.transform = `translate(${x + s.hole.x}px, ${sy + s.hole.y + 1000 * d}px) rotate(${11 * d}deg)`;
    }

    // The hole tears open into black, then the question slams.
    const tearing = t >= T.tear;
    for (const e of [s.fringe, s.tear]) {
      e.style.visibility = tearing ? 'visible' : 'hidden';
      if (tearing) {
        const cx = x + s.hole.x + s.hole.w / 2;
        const cy = sy + s.hole.y + s.hole.h / 2;
        e.style.transform = `translate(${cx - 100}px, ${cy - 100}px) scale(${s.tearScale(t)})`;
      }
    }
    const slammed = t >= T.slam;
    s.q.style.visibility = slammed ? 'visible' : 'hidden';
    if (slammed) s.q.style.transform = `scale(${spring(t, T.slam, 1.1, 1, 'slam')})`;
  },
};
