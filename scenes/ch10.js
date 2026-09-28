// ch10 Team (shots 10.1-10.3). ch09's staircase slides out left over a BLACK ground (its exit). Five cut-paper bands,
// one per member, SLIDE in from alternating sides, each landing on a word of L33: the three Ngoại thương members
// first (the last of them on "Ngoại"), then Học viện Tài chính on "Tài", then the NAVY Công nghệ band on "Công",
// which fills the last gap in the middle of the stack. In the breath before L34 the stack closes up tight and drops;
// "ĐỘI KAWAIBU" SLAMs into the freed top; on "kết hợp" the bands from both sides glide to one common edge under
// the title and the frame drifts in a slow PUSH. Every beat comes from ctx.line()/ctx.syl(); nothing uses
// film-absolute seconds.
import { spring, track } from '../lib/motion.js';
import { C, el, rough, clip } from '../lib/paper.js';
import { W, H, text, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

// The team, from the deck ("Đội ngũ", refs/slide-13.png), worded as in docs/shotlist.md (ch10).
// k: the L33 syllable its band lands on; right: enters from the right. Arrival order follows the schools as the
// voice names them; sides alternate both by position and by arrival (R, L, R, L, R).
const TEAM = [
  { name: 'NGUYỄN VĂN THÁI HƯNG', line: 'Trưởng nhóm · Điều phối, nhân sự · ĐH Ngoại thương', bg: C.orange, fg: C.black, k: 0, right: true }, // "Đội"
  { name: 'NGUYỄN HOÀNG SƠN', line: 'Tài chính · Phát triển kinh doanh · Học viện Tài chính', bg: C.cream, fg: C.black, k: 14, right: false }, // "Tài"
  { name: 'NGUYỄN THÁI SƠN', line: 'Lập trình · An toàn thông tin · ĐH Công nghệ', bg: C.navy, fg: C.cream, k: 19, right: true }, // "Công"
  { name: 'PHẠM NGỌC LÂM', line: 'AI · Dữ liệu · ĐH Ngoại thương', bg: C.cream, fg: C.black, k: 5, right: false }, // "thành"
  { name: 'CÔNG BẢO CHÂU', line: 'Thiết kế · Marketing, Sales · ĐH Ngoại thương', bg: C.orange, fg: C.black, k: 10, right: true }, // "Ngoại"
];
const TITLE = 'ĐỘI KAWAIBU';

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
const LEAD = 0.34; // a 'slide' is ~96 % home this long after it starts; it crosses its rest 0.05 s later
const PART = 0.2; // the stack makes room this long before the next band starts to slide ('snap' is home in 0.16 s)
const TITLE_BASE = 170; // title baseline before the push
const CLOSE = 'snap';
const PUSH = { f: 0.4, z: 1 }; // slow, from the lock to the end: the final hold drifts

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
    const land = TEAM.map((m) => ctx.syl('L33', m.k));
    const T = {
      land, // each band is home on its syllable
      in: land.map((l) => Math.max(EXIT.ch09, l - LEAD)), // slides start after ch09 has left the frame
      close: L33.end + 0.02, // the stack closes up tight in the breath after L33
      lock: ctx.syl('L34', 2) - 0.05, // "kết hợp": both sides glide to the common edge (a 'slide' crosses on "hợp")
    };
    T.slam = Math.max(L34.start - 0.05, T.close + 0.22); // "ĐỘI KAWAIBU" on the line's first word, once the top is free

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
      for (const j of order.slice(0, n)) yKeys[j].push([T.in[i] - PART, pos.get(j), 'snap']);
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

    return { T, world, bands, title: title.el };
  },

  render(s, t0, ctx) {
    const t = Math.min(t0, ctx.dur); // hold the final 10.3 frame under ch11's cream wipe
    const { T } = s;
    s.bands.forEach((b, i) => {
      if (!vis(b.el, t >= T.in[i])) return;
      b.el.style.transform = `translate(${b.x(t).toFixed(2)}px, ${b.y(t).toFixed(2)}px)`;
    });
    if (vis(s.title, t >= T.slam)) s.title.style.transform = `scale(${spring(t, T.slam, 1.2, 1, 'slam')})`;
    s.world.style.transform = `scale(${spring(t, T.lock, 1, 1.025, PUSH)})`;
  },
};
