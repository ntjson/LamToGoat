// ch10 Team (shots 10.1-10.3). ch09's staircase slides out left over a BLACK ground (its exit). Five cut-paper bands,
// one per member, SLIDE in from alternating sides, one every three beats of L33, spread so each has time to be read:
// the three Ngoại thương members first, then Học viện Tài chính, then the NAVY Công nghệ band, which fills the last gap
// in the middle of the stack. On L33's end (a downbeat) the stack closes up tight and drops; "ĐỘI KAWAIBU" SLAMs into
// the freed top on L34's first beat and the frame starts a slow PUSH; the L34 line "Công nghệ kết hợp / kinh doanh
// và tài chính." slides in beside it, one line per beat, and once it has been read the bands from both sides glide to
// one common edge under the title (the "kết hợp", five beats into L34). Every beat comes from ctx.line() and
// whole beats (ctx.snap); nothing uses film-absolute seconds.
import { spring, track, step } from '../lib/motion.js';
import { C, el, rough, clip } from '../lib/paper.js';
import { W, H, text, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

// The team, from the deck ("Đội ngũ", refs/slide-13.png), worded as in docs/shotlist.md (ch10).
// n: arrival rank (one band every three beats of L33); right: enters from the right. The schools arrive in groups
// (Ngoại thương, Tài chính, Công nghệ), so the NAVY technology band comes last and fills the middle of the stack;
// sides alternate both by position and by arrival (R, L, R, L, R).
const TEAM = [
  { name: 'NGUYỄN VĂN THÁI HƯNG', line: 'Trưởng nhóm · Điều phối, nhân sự · ĐH Ngoại thương', bg: C.orange, fg: C.black, n: 0, right: true },
  { name: 'NGUYỄN HOÀNG SƠN', line: 'Tài chính · Phát triển kinh doanh · Học viện Tài chính', bg: C.cream, fg: C.black, n: 3, right: false },
  { name: 'NGUYỄN THÁI SƠN', line: 'Lập trình · An toàn thông tin · ĐH Công nghệ', bg: C.navy, fg: C.cream, n: 4, right: true },
  { name: 'PHẠM NGỌC LÂM', line: 'AI · Dữ liệu · ĐH Ngoại thương', bg: C.cream, fg: C.black, n: 1, right: false },
  { name: 'CÔNG BẢO CHÂU', line: 'Thiết kế · Marketing, Sales · ĐH Ngoại thương', bg: C.orange, fg: C.black, n: 2, right: true },
];
const TITLE = 'ĐỘI KAWAIBU';
const LINE = ['Công nghệ kết hợp', 'kinh doanh và tài chính.']; // L34, CREAM LABEL beside the title (docs/onscreen.json)

// Layout (stage px). Text is flush left at X0 once locked. Inside a band: name baseline NB, label baseline LB.
// Measured at 72 px: caps 48 px, the Ễ stack reaches 72 px above the baseline and the Ạ/Ọ dot 13 px below; the
// 40 px label's marks reach 41 px above its baseline and its descenders 9 px below.
const X0 = 150;
const BH = 164; // band height
const NB = 84; // Ễ top 12 px under the band's top edge
const LB = 144; // label marks clear the Ạ/Ọ dots by 6 px; descenders end 11 px above the band's bottom edge
const GAP_TIGHT = 8;
const PAD_L = 56; // paper left of the text (right-entering bands)
const PAD_R = 64; // paper right of the text (left-entering bands)
const SLANT = 28; // the hand-cut free end leans like "/"
const RUN = 340; // paper that runs past the frame edge on the fixed side
const IND_R = 110; // until the lock, right-entering bands wait this far right of X0
const IND_L = 60; // and left-entering bands this far left of it
const HIT = 0.02; // a landing leads its grid time by this much (the guide allows up to 0.05 s, never trailing)
const SLAM_LEAD = 0.03; // the title appears this much before its beat (a SLAM appears on its t0)
const PART = 3; // the stack has made room this many 16ths before the next band lands (it lands before the band moves)
const TITLE_BASE = 170; // title baseline before the push
const LINE_SIZE = 64; // the L34 line: LABEL, CREAM
const LINE_PITCH = 1.15; // its line pitch (× size): line 1's descenders clear line 2's marks by 15 px
const LINE_GAP = 72; // title's box to the line's left edge
const PUSH = { f: 0.4, z: 1 }; // slow, from the title's slam to the end: L34 drifts while it is read

// Time from a spring's start to its first arrival at the target (a slide's landing).
function firstHit(p) {
  let t = 0;
  while (step(t, p) < 1 && t < 2) t += 1 / 480;
  return t;
}

// Baseline of a text element, from its top edge (a zero-size inline-block sits on the baseline).
function baseline(e) {
  const p = document.createElement('span');
  Object.assign(p.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
  e.appendChild(p);
  const y = p.offsetTop;
  p.remove();
  return y;
}

// The band's paper outline in band coordinates (x = 0 at the text's left edge, y = 0 at the band's top), clockwise.
function outline(right, textW) {
  if (right) return [[-PAD_L, 0], [W + RUN, 0], [W + RUN, BH], [-PAD_L - SLANT, BH]];
  return [[-X0 - RUN, 0], [textW + PAD_R, 0], [textW + PAD_R - SLANT, BH], [-X0 - RUN, BH]];
}

export default {
  build(ctx) {
    const L33 = ctx.line('L33');
    const L34 = ctx.line('L34');
    const ARRIVE = firstHit('slide') + HIT; // a slide started this long before a grid time lands on it
    // The close starts on L33's end and lands a 16th later: a stiff snap tuned so its first arrival is on the grid.
    const CLOSE = { f: firstHit({ f: 1, z: 0.7 }) / (ctx.grid - HIT), z: 0.7 };
    // Five arrivals spread over L33, the last leaving two beats of L33 to read it; each on a beat.
    const every = (L33.dur - 2 * ctx.beat) / 4;
    const land = TEAM.map((m) => ctx.snap(L33.start + m.n * every, 1));
    const on34 = (n) => ctx.snap(L34.start + n * ctx.beat, 1); // n beats into L34
    const T = {
      land, // each band arrives on its beat
      in: land.map((l) => Math.max(EXIT.ch09, l - ARRIVE)), // slides start after ch09 has left the frame
      close: L33.end, // the stack closes up tight on L33's end (a downbeat on this timeline)
      slam: L34.start - SLAM_LEAD, // "ĐỘI KAWAIBU" on L34's first beat, once the top is free
      line: [1, 2].map((n) => on34(n) - ARRIVE), // the L34 line slides in beside the title, one line per beat
      lock: on34(5) - ARRIVE, // once the line is read, both sides glide to the common edge (lands 5 beats into L34)
    };

    const root = ctx.root;
    el(root, '', { width: `${W}px`, height: `${H}px`, background: C.black });
    const world = el(root, '', { width: `${W}px`, height: `${H}px`, transformOrigin: `${X0}px 560px` });

    // Vertical positions. While the bands arrive, the stack stays centred in the frame: before each band slides in,
    // the bands already there move to make room for it (opening a gap when it goes between two of them). After the
    // close, the stack is tight against the bottom edge and the title takes the top.
    const G = (H - 2 * 44 - 5 * BH) / 4; // gap in the full spread stack (44 px margins)
    const centred = (set) => {
      const ranks = [...set].sort((a, b) => a - b);
      const top = (H - (ranks.length * BH + (ranks.length - 1) * G)) / 2;
      return new Map(ranks.map((i, r) => [i, top + r * (BH + G)]));
    };
    const order = TEAM.map((_, i) => i).sort((a, b) => land[a] - land[b]);
    const yIn = [];
    const yKeys = TEAM.map(() => []);
    order.forEach((i, n) => {
      const pos = centred(order.slice(0, n + 1));
      yIn[i] = pos.get(i);
      const room = land[i] - PART * ctx.grid - firstHit('snap') - HIT; // a 'snap' that lands on a 16th
      for (const j of order.slice(0, n)) yKeys[j].push([room, pos.get(j), 'snap']);
    });
    const tightBottom = H - 24 - (LB + 9); // band 5's descenders end 24 px above the frame's bottom edge
    const bands = TEAM.map((m, i) => {
      const band = el(world, '', { width: '1px', height: `${BH}px` });
      const paper = el(band, '', { backgroundColor: m.bg });
      const name = text(band, 'disp cut-text', m.name, { size: 72, color: m.fg, lh: 1.5 });
      const label = text(band, 'label', m.line, { size: 40, color: m.fg, lh: 1.2 });
      name.el.style.top = `${NB - baseline(name.el)}px`;
      label.el.style.top = `${LB - baseline(label.el)}px`;
      const textW = Math.max(name.w, label.w);
      const pts = outline(m.right, textW);
      const minX = Math.min(...pts.map((p) => p[0]));
      const maxX = Math.max(...pts.map((p) => p[0]));
      const shifted = pts.map(([x, y]) => [x - minX, y]);
      Object.assign(paper.style, {
        left: `${minX}px`, width: `${maxX - minX}px`, height: `${BH}px`,
        clipPath: clip(rough(shifted, { seed: 1001 + i * 7, amp: 4, wave: 70, spacing: 10 })),
      });
      const rest = m.right ? X0 + IND_R : X0 - IND_L;
      const off = m.right ? W + PAD_L + SLANT + 40 : -(textW + PAD_R) - 40;
      const yTight = tightBottom - (4 - i) * (BH + GAP_TIGHT);
      return {
        el: band,
        x: track(off, [[T.in[i], rest, 'slide'], [T.lock, X0, 'slide']]),
        y: track(yIn[i], [...yKeys[i], [T.close, yTight, CLOSE]]),
      };
    });

    // The team name, flush left over the tight stack.
    const title = text(world, 'disp cut-text', TITLE, { size: 160, color: C.orange, lh: 1.3 });
    const tb = baseline(title.el);
    Object.assign(title.el.style, { left: `${X0}px`, top: `${TITLE_BASE - tb}px`, transformOrigin: `0px ${tb - 54}px` });

    // The L34 line, CREAM LABEL beside the title: its second line on the title's baseline, its first line's marks
    // level with the title's Ộ, 45 px clear of the top band below.
    const lx = X0 + title.w + LINE_GAP;
    const pitch = Math.round(LINE_SIZE * LINE_PITCH);
    const line = LINE.map((s, i) => {
      const e = text(world, 'label', s, { size: LINE_SIZE, color: C.cream, lh: 1.3 }).el;
      Object.assign(e.style, { left: `${lx}px`, top: `${TITLE_BASE - (1 - i) * pitch - baseline(e)}px` });
      return e;
    });
    const LINE_IN = W - lx + 60; // from wholly off-frame right

    return { T, world, bands, title: title.el, line, LINE_IN };
  },

  render(s, t0, ctx) {
    const t = Math.min(t0, ctx.dur); // hold the final 10.3 frame under ch11's cream wipe
    const { T } = s;
    s.bands.forEach((b, i) => {
      if (!vis(b.el, t >= T.in[i])) return;
      b.el.style.transform = `translate(${b.x(t).toFixed(2)}px, ${b.y(t).toFixed(2)}px)`;
    });
    if (vis(s.title, t >= T.slam)) s.title.style.transform = `scale(${spring(t, T.slam, 1.2, 1, 'slam')})`;
    s.line.forEach((e, i) => {
      if (vis(e, t >= T.line[i])) e.style.transform = `translateX(${spring(t, T.line[i], s.LINE_IN, 0, 'slide').toFixed(1)}px)`;
    });
    s.world.style.transform = `scale(${spring(t, T.slam, 1, 1.025, PUSH)})`;
  },
};
