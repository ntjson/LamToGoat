// ch11 Close (shots 11.1-11.3), the film's last card and its poster frame.
// 11.1  A CREAM field wipes in from the right over ch10's held last frame, an ORANGE sheet running just ahead of it
//       (the two sheets part slightly as they cross and close up as they land). It is the ground from then on.
// 11.2  On "Làm Tổ" the logo slides in at left; the three credit lines slide in at right on cut-paper bars that run
//       off the right edge (after Bass's bars in The Man with the Golden Arm), one per phrase of L35: each bar's
//       paper leads and its line rides in just behind it, landing on the word.
// 11.3  After the line, a thin NAVY façade strip rises along the bottom edge, tower by tower from left to right, and
//       its windows light CREAM in a wave behind them. Then the frame holds to the end of the film.
// Every beat is anchored to L35 (ctx.line / ctx.syl) or to the wipe; nothing uses film-absolute seconds.
import { spring, step, rng } from '../lib/motion.js';
import { C, el, rough, rect, clip } from '../lib/paper.js';
import { W, H, text, vis } from '../lib/kit.js';

const SEED = 1100; // this chapter's seeds are 1100-1199: wipe 1101-1102, bars 1105-1107, towers 1120-1159, windows 1160-1199
const UNDERLAP = 0.7; // ch10 paints underneath until then; the cream covers the frame before it
const WIPE = { f: 1.35, z: 0.92 }; // the wipe: fast, lands without a bounce (the field never pulls back into frame)
const LEAD = 0.04; // the orange sheet starts this much before the cream one
const ARRIVE = 0.388; // a 'slide' first reaches its target this long after it starts
const LIGHT = { f: 3.6, z: 0.62 }; // a window lighting: a quick pop
const SWEEP = 0.8; // the light wave crosses the frame in this long
const TOWER_STAGGER = 0.045; // the towers rise one after another, left to right
const TEXT_LAG = 0.07; // a credit rides in on its bar this far behind the bar's paper

// Layout (px at 1080p).
const LOGO_W = 560; // width of the logo's visible artwork
const LOGO_X = 170; // left edge of the logo's artwork
const GAP = 120; // logo artwork to the bars' left edge
const PADX = 40; // bar paper left of its text
const BAR_GAP = 14; // cream between the bars
const SKY = 150; // the façade strip's lowest roof, above the bottom edge
const ROOFS = [0, 26, 52, 18, 40]; // extra height of a tower above that
const WIN = { w: 18, h: 24, px: 36, py: 40, roof: 24, foot: 16, side: 20 }; // windows: size, pitch, least insets

const px = (v) => `${v.toFixed(1)}px`;

// The logo's artwork box inside its transparent PNG, so LOGO_W measures the visible logo, not the canvas.
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

// A sheet of paper whose outline is `pts` (clockwise, stage px at rest), positioned by its bounding box.
function sheet(parent, pts, color, seed, amp = 5) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const local = pts.map(([x, y]) => [x - bx, y - by]);
  return el(parent, '', {
    left: `${bx}px`, top: `${by}px`, width: `${Math.max(...xs) - bx}px`, height: `${Math.max(...ys) - by}px`,
    background: color, clipPath: clip(rough(local, { seed, amp, wave: 80, spacing: 10 })),
  });
}

export default {
  underlap: UNDERLAP,

  async build(ctx) {
    const L35 = ctx.line('L35');
    const s35 = (k) => ctx.syl('L35', k);
    const root = ctx.root;

    // ---- 11.1 the wipe: two sheets with a slanted leading edge ("/"), travelling right to left.
    const PAD = 60;
    const SLANT = 280; // the leading edge's bottom runs this far ahead of its top
    const XT = -40; // the cream edge's top at rest (the edge is wholly off-frame, left)
    const OFF_O = 60; // at rest the orange sheet sits this much further left, under the cream
    const DX0 = W + SLANT + OFF_O - XT + 30; // start offset: both sheets wholly off-frame right
    const edgePoly = (x) => [[x, -PAD], [W + PAD + 40, -PAD], [W + PAD + 40, H + PAD], [x - SLANT, H + PAD]];
    const orange = sheet(root, edgePoly(XT - OFF_O), C.orange, SEED + 1);
    const cream = sheet(root, edgePoly(XT), C.cream, SEED + 2);
    const wipeO = (t) => spring(t, 0, DX0, 0, WIPE);
    const wipeC = (t) => spring(t, LEAD, DX0, 0, WIPE);
    // The cream covers the frame once its edge (at most 5 px of rough inset) has passed x = 0 at the top row.
    const edgeTop = XT - (SLANT * PAD) / (H + 2 * PAD) + 5;
    let covered = UNDERLAP;
    for (let t = 0; t < UNDERLAP; t += 1 / 240) {
      if (wipeC(t) + edgeTop < 0) {
        covered = t;
        break;
      }
    }

    // Beats (chapter-local seconds). The logo lands on "Làm"; each credit lands on "sổ", "ai", "được" (L35 syllables
    // 2, 5, 8), its bar a moment ahead of it. The towers start rising 1.35 s after the line ends (the cascade lands
    // around +1.8 s), and the frame is still left a hold of at least 1.5 s at the end.
    const T = { covered };
    T.logo = Math.max(covered + 0.02, s35(0) - ARRIVE);
    T.bars = [2, 5, 8].map((k, i) => Math.max(T.logo + 0.3 * (i + 1), s35(k) - ARRIVE)); // text starts; paper TEXT_LAG before
    T.strip = Math.max(T.bars[2] + 0.7, Math.min(L35.end + 1.35, ctx.dur - 3.0));
    T.lights = T.strip + 0.35;

    // ---- 11.2 the logo (ctx.top, so it shows exactly as the file is: no grain, no filter).
    const img = await ctx.image('/assets/brand/lamto-logo.png');
    const art = alphaBox(img);
    const k = LOGO_W / art.w;
    const artH = art.h * k;
    const SY = H - SKY - Math.max(...ROOFS); // the tallest roof
    const LOGO_Y = Math.round((SY - artH) / 2);
    const logo = el(ctx.top, '', {});
    const im = img.cloneNode();
    im.className = 'abs';
    Object.assign(im.style, {
      width: px(img.naturalWidth * k), height: px(img.naturalHeight * k),
      left: px(LOGO_X - art.x * k), top: px(LOGO_Y - art.y * k),
    });
    logo.appendChild(im);
    const LOGO_IN = LOGO_X + LOGO_W + 80; // slide distance: from wholly off-frame left

    // ---- 11.2 the credit bars, flush left, stacked so the last bar's foot sits on the logo's foot.
    const TX = LOGO_X + LOGO_W + GAP + PADX;
    const BAR_W = W - TX + PADX + 120; // runs off the right edge
    const lines = [
      { s: 'github.com/ntjson/LamTo', cls: 'mono', size: 48, bg: C.navy, fg: C.cream },
      { s: 'Đội Kawaibu', cls: 'label', size: 56, bg: C.orange, fg: C.black },
      { s: 'RnD to Startup 2026', cls: 'label', size: 44, bg: C.navy, fg: C.cream },
    ];
    const bars = lines.map((l, i) => {
      const paper = el(root, '', { background: l.bg });
      const g = el(root, '', {}); // the credit, above its paper
      const tx = text(g, l.cls, l.s, { size: l.size, color: l.fg, lh: 1.2 });
      const bh = Math.round(tx.h + l.size * 0.62);
      Object.assign(paper.style, {
        left: `${TX - PADX}px`, width: `${BAR_W}px`, height: `${bh}px`,
        clipPath: clip(rough(rect(0, 0, BAR_W, bh), { seed: SEED + 5 + i, amp: 3 })),
      });
      return { g, paper, tx, bh };
    });
    let y = Math.round(LOGO_Y + artH);
    for (let i = bars.length - 1; i >= 0; i--) {
      const b = bars[i];
      y -= b.bh;
      b.paper.style.top = `${y}px`;
      Object.assign(b.tx.el.style, { left: `${TX}px`, top: `${y + Math.round((b.bh - b.tx.h) / 2)}px` });
      y -= BAR_GAP;
    }
    const BAR_IN = W - TX + PADX + 60; // from wholly off-frame right

    // ---- 11.3 the façade strip: a row of NAVY towers of a few heights, windows in a tight grid.
    const r = rng(SEED + 20);
    const towers = [];
    for (let x = -PAD, prev = -1; x < W + PAD; ) {
      let w = 150 + Math.round(r() * 5) * 30;
      if (x + w > W - 80) w = W + PAD - x; // no sliver of a next tower at the right edge: this one runs off-frame
      let roof = Math.floor(r() * ROOFS.length);
      if (roof === prev) roof = (roof + 1 + Math.floor(r() * (ROOFS.length - 1))) % ROOFS.length; // neighbours differ
      towers.push({ x, w, top: H - SKY - ROOFS[roof] });
      prev = roof;
      x += w;
    }
    const wins = [];
    towers.forEach((tw, ti) => {
      tw.g = el(root, '', {});
      tw.rise = H - tw.top + 40; // from wholly below the frame
      tw.t = T.strip + ti * TOWER_STAGGER;
      sheet(tw.g, [[tw.x - 6, tw.top], [tw.x + tw.w + 6, tw.top], [tw.x + tw.w + 6, H + PAD], [tw.x - 6, H + PAD]], C.navy, SEED + 21 + ti, 3);
      const cols = Math.floor((tw.w - 2 * WIN.side + (WIN.px - WIN.w)) / WIN.px);
      const x0 = tw.x + (tw.w - (cols * WIN.px - (WIN.px - WIN.w))) / 2;
      // Floors are counted from the ground, so every tower's windows sit on the same floor lines.
      for (let row = 0; H - WIN.foot - WIN.h - row * WIN.py >= tw.top + WIN.roof; row++) {
        for (let c = 0; c < cols; c++) {
          const x = Math.round(x0 + c * WIN.px);
          if (x < 0 || x + WIN.w > W) continue; // no window cut by the frame's edge
          const wy = H - WIN.foot - WIN.h - row * WIN.py;
          const e = el(tw.g, '', {
            left: `${x}px`, top: `${wy}px`, width: `${WIN.w}px`, height: `${WIN.h}px`, background: C.cream,
            transformOrigin: '50% 50%',
            clipPath: clip(rough(rect(0, 0, WIN.w, WIN.h), { seed: SEED + 60 + (wins.length % 40), amp: 1.2, spacing: 5 })),
          });
          // The wave: left to right across the frame, each floor a touch behind the one below it.
          wins.push({ e, t: T.lights + (x / W) * SWEEP + (H - wy) * 0.0006 });
        }
      }
    });

    return { T, orange, cream, wipeO, wipeC, logo, LOGO_IN, bars, BAR_IN, towers, wins };
  },

  render(s, t) {
    const { T } = s;

    // 11.1: the wipe. The orange sheet is wholly under the cream once the cream has landed.
    vis(s.orange, t < UNDERLAP);
    s.orange.style.transform = `translateX(${s.wipeO(t).toFixed(1)}px)`;
    s.cream.style.transform = `translateX(${s.wipeC(t).toFixed(1)}px)`;

    // 11.2: the logo, then the bars.
    if (vis(s.logo, t >= T.logo)) s.logo.style.transform = `translateX(${spring(t, T.logo, -s.LOGO_IN, 0, 'slide').toFixed(1)}px)`;
    s.bars.forEach((b, i) => {
      const t0 = T.bars[i];
      if (vis(b.paper, t >= t0 - TEXT_LAG)) b.paper.style.transform = `translateX(${spring(t, t0 - TEXT_LAG, s.BAR_IN, 0, 'slide').toFixed(1)}px)`;
      if (vis(b.g, t >= t0)) b.g.style.transform = `translateX(${spring(t, t0, s.BAR_IN, 0, 'slide').toFixed(1)}px)`;
    });

    // 11.3: the towers rise one after another, then their windows light.
    for (const tw of s.towers) {
      if (vis(tw.g, t >= tw.t)) tw.g.style.transform = `translateY(${spring(t, tw.t, tw.rise, 0, 'slide').toFixed(1)}px)`;
    }
    for (const w of s.wins) {
      if (vis(w.e, t >= w.t)) w.e.style.transform = `scale(${(0.3 + 0.7 * step(t - w.t, LIGHT)).toFixed(4)})`;
    }
  },
};
