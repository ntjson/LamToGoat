// ch11 Close (shots 11.1-11.3), the film's last card and its poster frame.
// 11.1  On the bar line a CREAM field wipes in from the right over ch10's held last frame, an ORANGE sheet running just
//       ahead of it (the two sheets part slightly as they cross and close up as they land). It is the ground from then on.
// 11.2  On L35's first beat the logo slides in at left (it carries "LÀM TỔ"). The promise "SỔ QUỸ KHÔNG AI / SỬA LÉN
//       ĐƯỢC." SLAMs beside it in NAVY, one line per beat. Then the three credits slide in under it on cut-paper bars
//       that run off the right edge (after Bass's bars in The Man with the Golden Arm), one per beat: each bar's paper
//       leads and its line rides in just behind it.
// 11.3  On L35's end a thin NAVY façade strip rises along the bottom edge, tower by tower over one beat, and its
//       windows light CREAM in a wave behind them. Then the frame holds to the end of the film: the poster.
// The composition is one block: the tagline's cap line sits on the logo's top, the last bar's foot on the logo's foot.
// Every beat is anchored to L35 (ctx.line + whole beats, snapped with ctx.snap) or to the wipe; nothing uses
// film-absolute seconds.
import { spring, step, rng } from '../lib/motion.js';
import { C, el, rough, rect, clip } from '../lib/paper.js';
import { W, H, text, vis } from '../lib/kit.js';

const SEED = 1100; // this chapter's seeds are 1100-1199: wipe 1101-1102, bars 1105-1107, towers 1120-1159, windows 1160-1199
const UNDERLAP = 0.7; // ch10 paints underneath until then; the cream covers the frame before it
// The wipe's spring: fast, no bounce (the field never pulls back into frame). build() rescales f so the cream has
// covered the frame on the chapter's second beat.
const WIPE = { f: 1.35, z: 0.92 };
const LEAD = 0.04; // the orange sheet starts this much before the cream one
const HIT = 0.02; // a landing leads its grid time by this much (the guide allows up to 0.05 s, never trailing)
const SLAM_LEAD = 0.03; // a SLAM appears this much before its beat (so a 30 fps frame shows it on the beat, too)
const SLAM_FROM = 1.14; // the tagline's lines land from this scale
const LIGHT = { f: 3.6, z: 0.62 }; // a window lighting: a quick pop
const SWEEP = 0.8; // the light wave crosses the frame in this long
const TEXT_LAG = 0.04; // a credit rides in on its bar this far behind the bar's paper

// Layout (px at 1080p).
const LOGO_W = 560; // width of the logo's visible artwork
const LOGO_X = 170; // left edge of the logo's artwork
const GAP = 120; // logo artwork to the bars' left edge
const PADX = 40; // bar paper left of its text
const BAR_PAD = 0.5; // bar height = line box + this × type size
const BAR_GAP = 12; // cream between the bars
const TAG = { size: 128, pitch: 1.1, gap: 44 }; // tagline: DISPLAY size, line pitch (× size), gap above the first bar
const SKY = 150; // the façade strip's lowest roof, above the bottom edge
const ROOFS = [0, 26, 52, 18, 40]; // extra height of a tower above that
const WIN = { w: 18, h: 24, px: 36, py: 40, roof: 24, foot: 16, side: 20 }; // windows: size, pitch, least insets

const px = (v) => `${v.toFixed(1)}px`;

// Time from a spring's start to its first arrival at the target (a slide's landing).
function firstHit(p) {
  let t = 0;
  while (step(t, p) < 1 && t < 2) t += 1 / 480;
  return t;
}

// Baseline of a one-line text element, from its top edge (a zero-size inline-block sits on the baseline).
function baseline(e) {
  const p = document.createElement('span');
  Object.assign(p.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
  e.appendChild(p);
  const y = p.offsetTop;
  p.remove();
  return y;
}

// Cap height of the DISPLAY face at `size` px (measured on "H").
function capHeight(size) {
  const g = document.createElement('canvas').getContext('2d');
  g.font = `800 ${size}px "Bricolage Grotesque"`;
  g.fontStretch = 'condensed';
  return g.measureText('H').actualBoundingBoxAscent;
}

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
    const beat = (n) => ctx.snap(L35.start + n * ctx.beat, 1); // n beats into L35, on the beat grid
    const ARRIVE = firstHit('slide');
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
    // The cream covers the frame once its edge (at most 5 px of rough inset) has passed x = 0 at the top row.
    const edgeTop = XT - (SLANT * PAD) / (H + 2 * PAD) + 5;
    const coverAt = (p) => {
      for (let t = 0; t < 2; t += 1 / 480) if (spring(t, LEAD, DX0, 0, p) + edgeTop < 0) return t;
      return 2;
    };
    // A spring's timing scales with 1/f, so this f lands the cover HIT before the beat.
    const wipe = { f: (WIPE.f * (coverAt(WIPE) - LEAD)) / (ctx.beat - HIT - LEAD), z: WIPE.z };
    const covered = coverAt(wipe);
    if (covered > UNDERLAP) throw new Error(`ch11: the wipe covers at ${covered.toFixed(3)} s, after the underlap`);
    const wipeO = (t) => spring(t, 0, DX0, 0, wipe);
    const wipeC = (t) => spring(t, LEAD, DX0, 0, wipe);

    // Beats (chapter-local seconds; beat(n) = n beats into L35). The logo lands on beat(0), the tagline's lines SLAM
    // on beat(1) and beat(2), the credits land on beat(4), beat(5), beat(6); the towers land in a cascade from L35's
    // end to the next beat.
    const T = { covered };
    T.logo = Math.max(covered + 0.02, L35.start - ARRIVE - HIT);
    T.tag = [beat(1) - SLAM_LEAD, beat(2) - SLAM_LEAD]; // SLAMs appear on their t0
    T.bars = [4, 5, 6].map((n) => beat(n) - ARRIVE); // text starts (lands on the beat); paper TEXT_LAG before
    const rise0 = ctx.snap(L35.end, 1); // the first tower lands on L35's end, the last one beat later
    T.lights = rise0 + 2 * ctx.grid; // the light wave starts an 8th after the first tower lands

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
      const bh = Math.round(tx.h + l.size * BAR_PAD);
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
    const barsTop = y + BAR_GAP;
    const BAR_IN = W - TX + PADX + 60; // from wholly off-frame right

    // ---- 11.2 the tagline, NAVY DISPLAY, flush with the credits: its cap line on the logo's top edge, one line per
    // element (each SLAMs on its own beat) on a fixed pitch. The single-line boxes are tall (lh 1.5) so the Ổ/Ử stacks
    // stay inside the cut-text filter's region; each line is placed by its measured baseline.
    const capH = capHeight(TAG.size);
    const base1 = LOGO_Y + capH;
    const tag = ['SỔ QUỸ KHÔNG AI', 'SỬA LÉN ĐƯỢC.'].map((s, i) => {
      const e = text(root, 'disp cut-text', s, { size: TAG.size, color: C.navy, lh: 1.5 }).el;
      const b = baseline(e);
      const base = base1 + i * TAG.size * TAG.pitch;
      Object.assign(e.style, { left: `${TX}px`, top: `${Math.round(base - b)}px`, transformOrigin: `0px ${Math.round(b - capH / 2)}px` });
      return e;
    });
    // The Ợ dot hangs 0.18 em under the second baseline; the bars must clear it by TAG.gap.
    const tagFoot = base1 + TAG.size * TAG.pitch + 0.18 * TAG.size;
    if (tagFoot + TAG.gap > barsTop + 0.5) console.warn(`ch11: tagline foot ${tagFoot.toFixed(0)} crowds the bars at ${barsTop}`);

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
      tw.t = rise0 + (ti * ctx.beat) / (towers.length - 1) - ARRIVE - HIT; // the cascade spans one beat
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

    return { T, orange, cream, wipeO, wipeC, logo, LOGO_IN, tag, bars, BAR_IN, towers, wins };
  },

  render(s, t) {
    const { T } = s;

    // 11.1: the wipe. The orange sheet is wholly under the cream once the cream has landed.
    vis(s.orange, t < UNDERLAP);
    s.orange.style.transform = `translateX(${s.wipeO(t).toFixed(1)}px)`;
    s.cream.style.transform = `translateX(${s.wipeC(t).toFixed(1)}px)`;

    // 11.2: the logo, the tagline, then the bars.
    if (vis(s.logo, t >= T.logo)) s.logo.style.transform = `translateX(${spring(t, T.logo, -s.LOGO_IN, 0, 'slide').toFixed(1)}px)`;
    s.tag.forEach((e, i) => {
      if (vis(e, t >= T.tag[i])) e.style.transform = `scale(${spring(t, T.tag[i], SLAM_FROM, 1, 'slam').toFixed(4)})`;
    });
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
