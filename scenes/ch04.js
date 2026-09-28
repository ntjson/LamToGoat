// ch04 Who hurts (shots 4.1-4.4). A BLACK curtain drops over the market chart in three strips; three ORANGE panels
// hang in, one per role, each with a BLACK cut-paper figure. As the voice names a role, its panel steps forward and its
// pain lands on cream tags; then it FLIPs to NAVY and shows LamTo's answer. In the exit the three columns part like
// doors (left out left, centre down, right out right) onto ch05's CREAM ground.
// Facts: deck, "Nhu cầu và tranh chấp Làm Tổ giải quyết", via docs/shotlist.md ch04. Timing: L12-L14 only.
import { spring, track, rng } from '../lib/motion.js';
import { C, el, rough, rect, bubble, blob, clip, jagged } from '../lib/paper.js';
import { W, H, text, tag, flip, vis } from '../lib/kit.js';
import { EXIT, FLIP_EDGE } from '../lib/handoff.js';

const PW = 520; // panel size (shotlist: 520 x 760)
const PH = 760;
const GAP = 75;
const X0 = (W - 3 * PW - 2 * GAP) / 2;
const PX = [X0, X0 + PW + GAP, X0 + 2 * (PW + GAP)];
const PY = 160;
const SEAMS = [PX[0] + PW + GAP / 2, PX[1] + PW + GAP / 2]; // where the doors part, mid-gap
const TOP = -120; // the curtain strips reach this far above the frame (room for the landing bounce)
const HEM = H + 60; // the strips' hand-cut bottom edge at rest
const TXT = 30; // text inset inside a panel

// On-screen text, word for word from docs/shotlist.md (ch04). Answer 3 takes one extra line break at its comma:
// "vào việc gì, cho nhà thầu nào" is 640 px at 48 px and can't fit a 520 px panel on one line.
const ROLES = [
  { name: 'BAN QUẢN TRỊ', desc: 'người quyết định mua', pain: ['Bị nghi ngờ,', 'kể cả khi làm đúng'], answer: 'Lịch sử thu chi / không thể sửa lén' },
  { name: 'BAN QUẢN LÝ', desc: 'người dùng hằng ngày', pain: ['Phản ánh qua Zalo,', 'không ai theo dõi'], answer: 'Gửi phản ánh 24/7, / AI gợi ý, có lưu vết' },
  { name: 'CƯ DÂN', desc: 'người thụ hưởng', pain: ['Không rõ tiền đi đâu'], answer: 'Biết từng khoản chi / vào việc gì, / cho nhà thầu nào' },
];

const CURTAIN = { f: 1.25, z: 0.72 }; // heavy drop, one small bounce
const HANG = { f: 1.3, z: 0.62 }; // a panel dropping on its string and catching
const SWING = { f: 0.85, z: 0.28 }; // the pendulum after the catch
const SCROLL = { f: 2.4, z: 0.85 }; // chat stack, as in ch01
const DOOR = { f: 0.7, z: 1 }; // heavy doors: ease in, gone before the exit window ends

// ---- cut-paper geometry (clockwise polygons, panel coordinates) ----

// A hand-cut oval head: rx x ry, turned by deg.
function head(cx, cy, rx, ry, deg, seed) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return blob(0, 0, 1, { seed, lobes: 5, low: 0.05, fine: 0.012 }).map(([x, y]) => [cx + x * rx * c - y * ry * s, cy + x * rx * s + y * ry * c]);
}

// A straight band of width w along a segment.
function band([x0, y0], [x1, y1], w) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = (-(y1 - y0) / len) * (w / 2);
  const ny = ((x1 - x0) / len) * (w / 2);
  return [[x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx, y1 + ny], [x0 + nx, y0 + ny]];
}

// A rounded rectangle w x h centred on (cx, cy), turned by deg.
function card(cx, cy, w, h, r, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return rect(-w / 2, -h / 2, w, h, r).map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

// A roof: a thick chevron (apex at the top) with vertical thickness th.
function roof(cx, ay, hw, hh, th) {
  return [[cx, ay], [cx + hw, ay + hh], [cx + hw, ay + hh + th], [cx, ay + th], [cx - hw, ay + hh + th], [cx - hw, ay + hh]];
}

// Each figure: scissor-cut shapes with a kind. 'ink' is BLACK on the orange front and CREAM on the navy back;
// 'screen' is CREAM on the front and NAVY on the back; 'mark' (the tick) is CREAM on the front, ORANGE on the back.
// holes: polygons cut out of the shape (even-odd). amp: how ragged the scissor edge is.
function figures() {
  return [
    // Ban quản trị: jacket with a V collar and tie, and a raised gavel (the one who decides).
    [
      { kind: 'ink', pts: head(200, 134, 64, 70, -6, 401) },
      { kind: 'ink', pts: [[170, 222], [232, 222], [322, 262], [356, 424], [38, 424], [80, 270]], holes: [[[178, 222], [224, 222], [201, 294]]] },
      { kind: 'ink', pts: [[194, 236], [208, 236], [213, 298], [201, 314], [189, 298]], amp: 1 },
      { kind: 'ink', pts: band([320, 376], [414, 172], 26) },
      { kind: 'ink', pts: card(426, 148, 172, 68, 14, 25) },
      { kind: 'mark', id: 'tick', pts: band([100, 340], [128, 370], 21) },
      { kind: 'mark', id: 'tick', pts: band([120, 376], [178, 308], 21) },
    ],
    // Ban quản lý: a staff badge, and a phone held low at the right; complaints pour out of it.
    [
      { kind: 'ink', pts: head(174, 150, 62, 68, 5, 402) },
      { kind: 'ink', pts: [[146, 238], [206, 238], [290, 276], [318, 424], [24, 424], [58, 280]] },
      { kind: 'screen', pts: card(226, 346, 50, 64, 6, 5), amp: 1.5 },
      { kind: 'ink', pts: card(416, 324, 112, 192, 20, -9) },
      { kind: 'screen', pts: card(415, 316, 86, 138, 8, -9) },
    ],
    // Cư dân: a bust under a roof with a chimney (home).
    [
      { kind: 'ink', pts: roof(260, 26, 228, 160, 50) },
      { kind: 'ink', pts: [[366, 44], [410, 44], [410, 150], [366, 120]] },
      { kind: 'ink', pts: head(260, 220, 60, 66, -4, 403) },
      { kind: 'ink', pts: [[228, 304], [292, 304], [380, 338], [414, 424], [106, 424], [140, 340]] },
    ],
  ];
}

// The anonymous chat bubbles that spill out of the manager's phone (ch01's bubbles, small).
function chat(r) {
  const items = [];
  let y = 0;
  for (let i = 0; i < 6; i++) {
    const bars = 1 + (r() < 0.5 ? 1 : 0);
    const w = Math.round(150 + r() * 56);
    const h = bars * 14 + (bars - 1) * 10 + 36 + 14;
    const tail = i % 2 ? 'right' : 'left';
    const x = tail === 'left' ? 292 : 506 - w;
    const widths = Array.from({ length: bars }, (_, k) => (k === bars - 1 ? 0.4 + 0.3 * r() : 0.7 + 0.25 * r()));
    items.push({ x, y, w, h, tail, widths });
    y += h + 10;
  }
  return items;
}

function paper(parent, color, sh, seed) {
  const amp = sh.amp ?? 3;
  const polys = [sh.pts, ...(sh.holes ?? [])].map((q, i) => rough(q, { seed: seed + 50 * i, amp, wave: 40 }));
  return el(parent, '', { width: `${PW}px`, height: `${PH}px`, backgroundColor: color, clipPath: clip(...polys) });
}

export default {
  underlap: 0.8,
  exit: EXIT.ch04,

  build(ctx) {
    const root = ctx.root;
    const L12 = ctx.line('L12');

    // Beats (chapter-local seconds), all derived from the voice lines. A flip's hit is the moment its back face
    // shows (edge-on), so it starts FLIP_EDGE earlier.
    const hang0 = Math.max(0.5, L12.start - 0.45);
    const T = {
      curtain: [0, 0.06, 0.12], // three strips, left to right
      hang: [hang0, hang0 + 0.12, hang0 + 0.24], // the panels drop in on their strings
      fwd: [ctx.syl('L12', 3) - 0.06, ctx.syl('L13', 0) - 0.06, ctx.syl('L14', 0) - 0.06], // "bị" / "Ban" / "Cư"
      tags: [
        [ctx.syl('L12', 3) - 0.06, ctx.syl('L12', 6) - 0.06], // "bị nghi ngờ" / "kể cả khi làm đúng"
        [ctx.syl('L13', 4) - 0.06, ctx.syl('L13', 9) - 0.06], // "phản ánh qua Zalo" / "không ai theo dõi"
        [ctx.syl('L14', 4) - 0.04], // on "nhưng", the start of its clause "nhưng không rõ tiền đi đâu": the flip
        // comes on "tiền", so the tag needs every syllable it can get
      ],
      tick: ctx.syl('L12', 10) - 0.06, // "đúng"
      flip: [ctx.syl('L13', 2) - 0.1, ctx.syl('L14', 2) - 0.1, ctx.syl('L14', 7) - 0.05].map((hit) => hit - FLIP_EDGE), // "lý" / "đóng" / "tiền"
      bubbles: [3, 4, 5, 6, 7, 8].map((k) => ctx.syl('L13', k) - 0.05), // "nhận phản ánh qua Zalo"
      lost: ctx.syl('L13', 9) - 0.06, // "không ai theo dõi": the chat drifts off the panel
      door: ctx.dur,
    };
    T.back = [T.fwd[1], T.fwd[2], T.flip[2] + FLIP_EDGE + 0.35]; // each panel steps back when the next comes forward

    // ---- ground: three BLACK strips that drop as the curtain and part as the doors ----
    const seam = SEAMS.map((x, i) => jagged([x, TOP], [x, HEM], { seed: 430 + i, amp: 9, wave: 90 }));
    const shift = (pts, dx) => pts.map(([x, y]) => [x + dx, y]);
    const hem = (x0, x1, seed) => jagged([x0, HEM], [x1, HEM], { seed, amp: 5, wave: 55 });
    // Clockwise outlines: left strip, centre strip (it runs 10 px under its neighbours, so no seam can open while the
    // curtain is whole), right strip.
    const polys = [
      [[-80, TOP], ...seam[0], ...hem(SEAMS[0], -80, 440)],
      // its top edge shows as it drops in the exit, so it is hand-cut too
      [...jagged([SEAMS[0] - 10, TOP + 6], [SEAMS[1] + 10, TOP + 6], { seed: 443, amp: 5, wave: 55 }), ...shift(seam[1], 10), ...hem(SEAMS[1] + 10, SEAMS[0] - 10, 441), ...shift([...seam[0]].reverse(), -10)],
      [[SEAMS[1], TOP], [W + 80, TOP], [W + 80, HEM], ...hem(W + 80, SEAMS[1], 442), ...[...seam[1]].reverse()],
    ];
    const ground = (i) => el(root, '', {
      left: '-80px', top: `${TOP}px`, width: `${W + 160}px`, height: `${HEM - TOP}px`, backgroundColor: C.black,
      clipPath: clip(polys[i].map(([x, y]) => [x + 80, y - TOP])),
    });
    const centre = ground(1); // built first, so its overlap sits under the side strips
    const groundOf = [ground(0), centre, ground(2)]; // by column: left, centre, right

    // ---- panels ----
    const r = rng(404);
    const figs = figures();
    const panels = ROLES.map((role, k) => {
      const outer = el(root, '', { left: `${PX[k]}px`, top: `${PY}px`, width: `${PW}px`, height: `${PH}px`, transformOrigin: `${PW / 2}px 0px` });
      const inner = el(outer, '', { width: `${PW}px`, height: `${PH}px`, transformOrigin: '50% 50%' });
      const front = el(inner, '', { width: `${PW}px`, height: `${PH}px`, backgroundColor: C.orange, clipPath: clip(rough(rect(0, 0, PW, PH), { seed: 410 + k, amp: 4 })) });
      const back = el(inner, '', { width: `${PW}px`, height: `${PH}px`, backgroundColor: C.navy, clipPath: clip(rough(rect(0, 0, PW, PH), { seed: 415 + k, amp: 4 })) });
      const over = el(inner, '', { width: `${PW}px`, height: `${PH}px` }); // tags may overhang the panel edge

      // Figures: the same cut shapes on both faces, colours swapped.
      const tickFront = document.createElement('div');
      figs[k].forEach((sh, i) => {
        const seed = 450 + k * 10 + i;
        const fc = { ink: C.black, screen: C.cream, mark: C.cream }[sh.kind];
        const bc = { ink: C.cream, screen: C.navy, mark: C.orange }[sh.kind];
        paper(sh.id === 'tick' ? tickFront : front, fc, sh, seed);
        paper(back, bc, sh, seed);
      });
      // The tick lives in its own layer above the figure, so it can stamp on.
      if (tickFront.childElementCount) {
        tickFront.className = 'abs';
        Object.assign(tickFront.style, { width: `${PW}px`, height: `${PH}px`, transformOrigin: '140px 342px' });
        front.appendChild(tickFront);
      }

      // Front: role, descriptor; back: role in orange, the answer in cream.
      text(front, 'disp cut-text', role.name, { size: 72, color: C.black, left: `${TXT}px`, top: '440px' });
      text(front, 'label', role.desc, { size: 36, color: C.black, left: `${TXT}px`, top: '516px' });
      text(back, 'disp cut-text', role.name, { size: 72, color: C.orange, left: `${TXT}px`, top: '440px' });
      text(back, 'label', role.answer, { size: 48, color: C.cream, left: `${TXT}px`, top: '528px' });

      // Pain tags: cream paper, black LABEL 48, pasted slightly crooked below the descriptor.
      const tags = role.pain.map((s, i) => {
        const tg = tag(over, s, { size: 48, color: C.black, bg: C.cream, padX: 0.36, padY: 0.16, seed: 460 + k * 3 + i, rot: i ? 1.1 : -1.4 });
        const y = role.pain.length === 1 ? 588 : 574 + i * 82;
        Object.assign(tg.el.style, { left: `${16 + i * 10}px`, top: `${y}px` });
        return { ...tg, t0: T.tags[k][i] };
      });

      // The swing the panel carries as it drops (degrees), and where it rests.
      const tilt = [2.4, -2.0, 2.6][k];
      const hangY = (t) => spring(t, T.hang[k], -1000, 0, HANG);
      const swing = (t) => spring(t, T.hang[k] + 0.3, tilt, 0, SWING);
      const scale = track(1, [[T.fwd[k], 1.06, 'snap'], [T.back[k], 1, 'settle']]);
      const lift = track(0, [[T.fwd[k], -26, 'snap'], [T.back[k], 0, 'settle']]);
      return { outer, inner, front, back, over, tags, hangY, swing, scale, lift, tickFront };
    });

    // The manager's chat: bubbles pop out of the phone and pile up; on "không ai theo dõi" the pile drifts off the top.
    const items = chat(r);
    const stack = el(panels[1].front, '', { width: `${PW}px`, height: `${PH}px` });
    const BASE = 212; // newest bubble's bottom edge, just above the phone
    const bubbleEls = items.map((it, i) => {
      const b = el(stack, '', {
        left: `${it.x}px`, top: `${it.y}px`, width: `${it.w}px`, height: `${it.h}px`, backgroundColor: C.cream,
        clipPath: clip(rough(bubble(it.w, it.h, { tail: it.tail, r: 16, tw: 20, th: 14 }), { seed: 470 + i, amp: 2 })),
        transformOrigin: it.tail === 'left' ? '24px 100%' : `${it.w - 24}px 100%`,
      });
      it.widths.forEach((u, j) => {
        const bw = Math.round((it.w - 40) * u);
        el(b, '', { left: '20px', top: `${18 + j * 24}px`, width: `${bw}px`, height: '14px', backgroundColor: C.bar, clipPath: clip(rough(rect(0, 0, bw, 14, 7), { seed: 480 + i * 3 + j, amp: 1 })) });
      });
      return b;
    });
    const last = items[items.length - 1];
    const scroll = track(BASE - items[0].h, [
      ...items.slice(1).map((it, i) => [T.bubbles[i + 1], BASE - (it.y + it.h), SCROLL]),
      [T.lost, -(last.y + last.h) - 60, { f: 0.7, z: 1 }],
    ]);

    // The doors: left column out left, centre down, right out right. The centre starts as the chapter ends, the sides
    // 0.08 s later; the sides clear the frame about 0.55 s into the exit, the centre strip about 0.68 s in (EXIT.ch04 0.8).
    const doorX = [(t) => spring(t, T.door + 0.08, 0, -1100, DOOR), () => 0, (t) => spring(t, T.door + 0.08, 0, 1100, DOOR)];
    const doorY = [() => 0, (t) => spring(t, T.door, 0, 1500, DOOR), () => 0];
    const curtainY = [0, 1, 2].map((i) => (t) => spring(t, T.curtain[i], -(HEM + 20), 0, CURTAIN));

    return { T, groundOf, panels, bubbleEls, stack, scroll, doorX, doorY, curtainY };
  },

  render(s, t) {
    const { T } = s;
    for (let k = 0; k < 3; k++) {
      const dx = s.doorX[k](t);
      const dy = s.doorY[k](t);
      s.groundOf[k].style.transform = `translate(${dx}px, ${s.curtainY[k](t) + dy}px)`;

      const p = s.panels[k];
      const on = vis(p.outer, t >= T.hang[k]);
      if (!on) continue;
      const f = flip(t, T.flip[k]);
      const lift = p.lift(t) - 16 * (1 - f.sx);
      const sc = p.scale(t);
      p.outer.style.transform = `translate(${dx}px, ${dy + p.hangY(t) + lift}px) rotate(${p.swing(t)}deg)`;
      p.inner.style.transform = `scale(${sc * f.sx}, ${sc})`;
      vis(p.front, !f.back);
      vis(p.over, !f.back);
      vis(p.back, f.back);
      for (const tg of p.tags) {
        if (vis(tg.el, t >= tg.t0)) tg.el.style.transform = `scale(${spring(t, tg.t0, 1.16, 1, 'slam')})`;
      }
    }

    // Board: the tick stamps onto the chest on "đúng".
    const tk = s.panels[0].tickFront;
    if (vis(tk, t >= T.tick)) tk.style.transform = `scale(${spring(t, T.tick, 1.5, 1, 'slam')})`;

    // Manager: the chat pours out of the phone, then drifts away.
    s.stack.style.transform = `translateY(${s.scroll(t)}px)`;
    s.bubbleEls.forEach((b, i) => {
      if (vis(b, t >= T.bubbles[i])) {
        const k = spring(t, T.bubbles[i], 0.5, 1, 'snap');
        b.style.transform = `translateY(${spring(t, T.bubbles[i], 24, 0, 'snap')}px) scale(${k})`;
      }
    });
  },
};
