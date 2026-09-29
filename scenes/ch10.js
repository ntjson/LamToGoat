// ch10 Team (shots 10.1-10.3). ch09's staircase slides out left over a BLACK ground (its exit). Five cut-paper bands,
// one per member, SLIDE in from alternating sides, one every three beats of L33, spread so each has time to be read:
// the three Ngoại thương members first, then Học viện Tài chính, then the NAVY Công nghệ band, which fills the last gap
// in the middle of the stack. Each band carries its member's face: the real photo (assets/team, through
// ctx.portrait), cut out as a paper bust and pasted on the band, so it enters with the band's slide. The faces stand
// in two columns right of the text, the orange and navy bands' at the far right, the cream bands' nearer the names,
// so no face ever covers a name, a role or another face. On L33's end (a downbeat) the stack closes up tight (each band
// laid 4 px over the one above) and drops; "ĐỘI KAWAIBU" SLAMs into the freed top on L34's first beat and the frame
// starts a slow PUSH; the L34 line "Công nghệ kết hợp / kinh doanh và tài chính." slides in beside it, one line per
// beat, and once it has been read the bands from both sides glide to one common edge under the title (the "kết hợp",
// five beats into L34), and the two columns of faces close in with them. Every beat comes from ctx.line() and whole
// beats (ctx.snap); nothing uses film-absolute seconds.
import { spring, track, step } from '../lib/motion.js';
import { C, el, rough, clip } from '../lib/paper.js';
import { W, H, text, vis } from '../lib/kit.js';
import { EXIT } from '../lib/handoff.js';

// The team, from the deck ("Đội ngũ", refs/slide-13.png), worded as in docs/shotlist.md (ch10).
// n: arrival rank (one band every three beats of L33); right: enters from the right. The schools arrive in groups
// (Ngoại thương, Tài chính, Công nghệ), so the NAVY technology band comes last and fills the middle of the stack;
// sides alternate both by position and by arrival (R, L, R, L, R). The faces are ctx.portrait(i), in the same order.
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
const GAP_SPREAD = 20; // between bands while they arrive (all five: a 900 px stack, centred as MID says)
const GAP_TIGHT = -4; // closed up, each band is laid 4 px over the one above: 7 px under its descenders
const TIGHT_TOP = 215; // the closed stack's top edge, 45 px under the title's baseline
const PAD_L = 56; // paper left of the text (right-entering bands)
const PAD_R = 64; // paper right of the text (left-entering bands)
const SLANT = 28; // the hand-cut free end leans like "/"
const RUN = 340; // paper that runs past the frame edge on the fixed side
const IND_R = 60; // until the lock, right-entering bands wait this far right of X0 (their faces near the frame's edge)
const IND_L = 80; // and left-entering bands this far left of it
const HIT = 0.02; // a landing leads its grid time by this much (the guide allows up to 0.05 s, never trailing)
const SLAM_LEAD = 0.03; // the title appears this much before its beat (a SLAM appears on its t0)
const PART = 3; // the stack has made room this many 16ths before the next band lands (it lands before the band moves)
const TITLE_BASE = 170; // title baseline before the push
const LINE_SIZE = 64; // the L34 line: LABEL, CREAM
const LINE_PITCH = 1.15; // its line pitch (× size): line 1's descenders clear line 2's marks by 15 px
const LINE_GAP = 72; // title's box to the line's left edge
const PUSH = { f: 0.4, z: 1 }; // slow, from the title's slam to the end: L34 drifts while it is read
const PUSH_TO = 1.025;

// The faces. Each is the member's bust as tools/team.py cut it (docs/team.json: size, cut outline, the face's
// centre), in the photo's own colours, pasted on its band with a small lifted-paper shadow; the cut gets the film's
// hand-cut jitter. The paper round the photo is CREAM on the orange and navy bands and ORANGE on the cream ones, so
// every bust keeps its edge. Placement (stage px, before the push), derived in build: a face's centre on its band's
// centre, raised where its column needs the room; in two columns, the orange and navy bands' faces right of the L34
// line, the cream bands' faces between them and the names.
const SHADOW = 'drop-shadow(0 5px 4px rgba(0,0,0,0.28))';
const FACE_GAP = 4; // between two busts in one column, when the stack is tight
const FACE_EDGE = 10; // busts stay this far inside the frame (at the push reached by then)
const TEXT_CLEAR = 16; // a bust's paper stays this far from any text
const FACE_JITTER = { amp: 3, wave: 40, spacing: 6 };

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
// reach: how far right a left-entering band's paper runs (past its text and its face).
function outline(right, reach) {
  if (right) return [[-PAD_L, 0], [W + RUN, 0], [W + RUN, BH], [-PAD_L - SLANT, BH]];
  return [[-X0 - RUN, 0], [reach, 0], [reach - SLANT, BH], [-X0 - RUN, BH]];
}

// A bust's cut outline, densified (a point every 2 px), so its extent over any band of rows can be read off it.
function dense(pts) {
  const out = [];
  pts.forEach(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  });
  return out;
}

// Leftmost and rightmost x of a bust's paper within its rows y0..y1 (box coordinates).
function span(pts, y0, y1) {
  let a = Infinity;
  let b = -Infinity;
  for (const [x, y] of pts) {
    if (y < y0 || y > y1) continue;
    a = Math.min(a, x);
    b = Math.max(b, x);
  }
  return [a, b];
}

export default {
  async build(ctx) {
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
    const push = (t) => spring(t, T.slam, 1, PUSH_TO, PUSH);
    // The frame's edges in the world's coordinates at push scale s (the push scales about (X0, 560)).
    const frameRight = (s) => X0 + (W - X0) / s;
    const frameBottom = (s) => 560 + (H - 560) / s;

    const root = ctx.root;
    el(root, '', { width: `${W}px`, height: `${H}px`, background: C.black });
    const world = el(root, '', { width: `${W}px`, height: `${H}px`, transformOrigin: `${X0}px 560px` });

    // The faces (docs/team.json): each bust's box, its cut outline, where its face is.
    const faces = TEAM.map((_, i) => {
      const g = ctx.portrait(i);
      return { g, pts: dense(g.outline), fx: g.face[0], fy: g.face[1] };
    });
    const right = [0, 2, 4]; // the orange and navy bands (right-entering)
    const left = [1, 3]; // the cream bands

    // Vertical positions. After the close, the stack is tight under the title and the title takes the top. A face's
    // centre sits on its band's centre, except where its column needs the room: the right column's three busts stack
    // from the frame's bottom edge (at full push) upwards, FACE_GAP apart. dy: from a band's top to its bust's box.
    const yTight = TEAM.map((_, i) => TIGHT_TOP + i * (BH + GAP_TIGHT));
    const dy = TEAM.map((_, i) => BH / 2 - faces[i].fy);
    for (const col of [right, left]) {
      let limit = frameBottom(PUSH_TO) - 2;
      for (const i of [...col].reverse()) {
        const over = yTight[i] + dy[i] + faces[i].g.h - limit;
        if (over > 0) dy[i] -= over;
        limit = yTight[i] + dy[i] - FACE_GAP;
      }
    }
    // While the bands arrive, the stack stays centred on MID: before each band slides in, the bands already there move
    // to make room for it (opening a gap when it goes between two of them). A band still missing between two that are
    // in keeps its slot open: their faces share a column and would overlap (so after the Tài chính band lands, the
    // stack waits with a gap in its middle for the NAVY band). MID is the frame's centre, moved down just enough that
    // the top bust stays FACE_EDGE inside the frame when all five are in.
    const spreadH = 5 * BH + 4 * GAP_SPREAD;
    const MID = Math.max(H / 2, FACE_EDGE - dy[0] + spreadH / 2);
    if (MID + spreadH / 2 - BH + dy[4] + faces[4].g.h > H - FACE_EDGE) throw new Error('ch10: the spread stack has no room for its faces');
    const centred = (set) => {
      const slots = TEAM.map((_, i) => i).filter((i) => set.includes(i) || (set.includes(i - 1) && set.includes(i + 1)));
      const top = MID - (slots.length * BH + (slots.length - 1) * GAP_SPREAD) / 2;
      return new Map(slots.filter((i) => set.includes(i)).map((i) => [i, top + slots.indexOf(i) * (BH + GAP_SPREAD)]));
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
    const ySpread = centred(TEAM.map((_, i) => i)); // all five, just before the close
    for (const i of TEAM.keys()) {
      const top = ySpread.get(i) + dy[i];
      if (top < FACE_EDGE || top + faces[i].g.h > H - FACE_EDGE) throw new Error(`ch10: face ${i} leaves the frame in the spread stack`);
    }

    // The bands: each is its paper, under the faces, and its text, over them (a bust overhangs its neighbours' paper
    // and, while it slides in, may cross their text; it never covers it). The text first: the faces are placed round it.
    const paperLayer = el(world, '', {});
    const textLayer = el(world, '', {});
    const bands = TEAM.map((m, i) => {
      const band = el(paperLayer, '', { width: '1px', height: `${BH}px` });
      const paper = el(band, '', { backgroundColor: m.bg });
      const words = el(textLayer, '', { width: '1px', height: `${BH}px` });
      const name = text(words, 'disp cut-text', m.name, { size: 72, color: m.fg, lh: 1.5 });
      const label = text(words, 'label', m.line, { size: 40, color: m.fg, lh: 1.2 });
      name.el.style.top = `${NB - baseline(name.el)}px`;
      label.el.style.top = `${LB - baseline(label.el)}px`;
      return { el: band, words, paper, textW: Math.max(name.w, label.w), labelW: label.w };
    });

    // The team name, flush left over the tight stack, and the L34 line beside it: its second line on the title's
    // baseline, its first line's marks level with the title's Ộ.
    const title = text(world, 'disp cut-text', TITLE, { size: 160, color: C.orange, lh: 1.3 });
    const tb = baseline(title.el);
    Object.assign(title.el.style, { left: `${X0}px`, top: `${TITLE_BASE - tb}px`, transformOrigin: `0px ${tb - 54}px` });
    const lx = X0 + title.w + LINE_GAP;
    const pitch = Math.round(LINE_SIZE * LINE_PITCH);
    const line = LINE.map((s, i) => {
      const t = text(world, 'label', s, { size: LINE_SIZE, color: C.cream, lh: 1.3 });
      Object.assign(t.el.style, { left: `${lx}px`, top: `${TITLE_BASE - (1 - i) * pitch - baseline(t.el)}px` });
      return t;
    });
    const LINE_IN = W - lx + 60; // from wholly off-frame right
    const lineRight = lx + Math.max(...line.map((l) => l.w));

    // The faces' placement: the box's top-left is the band's origin plus (dx, dy).
    const boxTop = (i, yBand) => yBand + dy[i];
    // Horizontally (x of the face's centre line, once locked). The right column goes as far right as the frame allows:
    // before the lock it waits IND_R further right, and must still be FACE_EDGE inside the frame at the push it has
    // reached by then. The part of its top bust that rises beside the L34 line (above the line's baseline + 10) must
    // stay TEXT_CLEAR right of the line.
    const f0 = faces[0];
    const fxRight = Math.min(...right.map((i) => frameRight(push(T.lock)) - FACE_EDGE - IND_R - (faces[i].g.w - faces[i].fx)));
    const [beside] = span(f0.pts, 0, TITLE_BASE + 10 - boxTop(0, yTight[0]));
    const clearL34 = fxRight - f0.fx + beside - lineRight;
    if (clearL34 < TEXT_CLEAR) throw new Error(`ch10: the top face is ${clearL34.toFixed(1)} px from the L34 line`);
    // The cream bands' faces: before the lock, clear of their own label and of the labels their busts reach over (the
    // right-entering bands' labels, IND_R right of their edge); locked, clear of the right column.
    const labelEnd = (j) => X0 + (TEAM[j].right ? IND_R : -IND_L) + bands[j].labelW;
    let fxLeft = -Infinity;
    for (const i of left) {
      for (const j of [i - 1, i, i + 1]) {
        // The label's rows, in the bust's box, in both stacks; the bust must clear the label wherever they share rows.
        for (const [yi, yj] of [[ySpread.get(i), ySpread.get(j)], [yTight[i], yTight[j]]]) {
          const y0 = yj + LB - 41 - boxTop(i, yi);
          const [a] = span(faces[i].pts, y0, y0 + 50);
          if (a < Infinity) fxLeft = Math.max(fxLeft, labelEnd(j) + TEXT_CLEAR + IND_L - (a - faces[i].fx));
        }
      }
    }
    const leftEdge = Math.min(...right.map((i) => fxRight - faces[i].fx + span(faces[i].pts, -Infinity, Infinity)[0]));
    const roomLeft = Math.min(...left.map((i) => leftEdge - FACE_GAP * 3 - (span(faces[i].pts, -Infinity, Infinity)[1] - faces[i].fx)));
    if (fxLeft > roomLeft) throw new Error(`ch10: the left column needs ${(fxLeft - roomLeft).toFixed(1)} px more`);
    const fx = TEAM.map((m) => (m.right ? fxRight : fxLeft));

    // The bands' paper (a cream band runs on past its face) and tracks.
    bands.forEach((b, i) => {
      const m = TEAM[i];
      const faceRight = fx[i] - X0 + span(faces[i].pts, -Infinity, Infinity)[1] - faces[i].fx;
      const reach = Math.max(b.textW, faceRight) + PAD_R;
      const pts = outline(m.right, reach);
      const minX = Math.min(...pts.map((p) => p[0]));
      const maxX = Math.max(...pts.map((p) => p[0]));
      const shifted = pts.map(([x, y]) => [x - minX, y]);
      Object.assign(b.paper.style, {
        left: `${minX}px`, width: `${maxX - minX}px`, height: `${BH}px`,
        clipPath: clip(rough(shifted, { seed: 1001 + i * 7, amp: 4, wave: 70, spacing: 10 })),
      });
      const rest = m.right ? X0 + IND_R : X0 - IND_L;
      const off = m.right ? W + PAD_L + SLANT + 40 : -reach - 40;
      b.x = track(off, [[T.in[i], rest, 'slide'], [T.lock, X0, 'slide']]);
      b.y = track(yIn[i], [...yKeys[i], [T.close, yTight[i], CLOSE]]);
    });

    // The busts, between the bands' paper and their text.
    const faceLayer = el(world, '', {});
    world.insertBefore(faceLayer, textLayer);
    for (const [i, f] of faces.entries()) {
      const { g } = f;
      const rim = TEAM[i].bg === C.cream ? C.orange : C.cream;
      const box = el(faceLayer, '', { width: `${g.w}px`, height: `${g.h}px`, filter: SHADOW });
      box.dataset.face = i; // for tools/facecheck.mjs
      const cut = el(box, '', {
        width: `${g.w}px`, height: `${g.h}px`, clipPath: clip(rough(g.outline, { seed: 1051 + i * 7, ...FACE_JITTER })),
      });
      el(cut, '', { width: `${g.w}px`, height: `${g.h}px`, backgroundColor: rim });
      const img = (await ctx.image(`/${g.file}`)).cloneNode();
      img.className = 'abs';
      Object.assign(img.style, { width: `${g.w}px`, height: `${g.h}px` });
      cut.appendChild(img);
      f.el = box;
      f.dx = fx[i] - X0 - f.fx; // from the band's text origin to the box's left edge
    }

    // For the sound's cues: time from a move's start to its spring's first arrival (the slides, the close).
    return {
      T, world, bands, faces, dy, push, title: title.el, line: line.map((l) => l.el), LINE_IN,
      slideHit: firstHit('slide'), closeHit: firstHit(CLOSE),
    };
  },

  render(s, t0, ctx) {
    const t = Math.min(t0, ctx.dur); // hold the final 10.3 frame under ch11's cream wipe
    const { T } = s;
    s.bands.forEach((b, i) => {
      const f = s.faces[i];
      const on = t >= T.in[i];
      vis(f.el, on);
      vis(b.words, on);
      if (!vis(b.el, on)) return;
      const x = b.x(t);
      const y = b.y(t);
      b.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      b.words.style.transform = b.el.style.transform;
      f.el.style.transform = `translate(${(x + f.dx).toFixed(2)}px, ${(y + s.dy[i]).toFixed(2)}px)`;
    });
    if (vis(s.title, t >= T.slam)) s.title.style.transform = `scale(${spring(t, T.slam, 1.2, 1, 'slam')})`;
    s.line.forEach((e, i) => {
      if (vis(e, t >= T.line[i])) e.style.transform = `translateX(${spring(t, T.line[i], s.LINE_IN, 0, 'slide').toFixed(1)}px)`;
    });
    s.world.style.transform = `scale(${s.push(t)})`;
  },

  // Event times (chapter-local) for the sound: a move carries `land`, its spring's first arrival (HIT before its grid
  // time); the title's SLAM hits on `t`, where it appears. 10.1's staircase leaving is ch09's exit and ch09's cue.
  // The faces ride on their bands' slides and have no sound of their own.
  cues(s) {
    const { T } = s;
    return [
      // 10.2 the five bands, in the order they arrive (i), each panned to the side it slides in from.
      ...TEAM.map((m, k) => ({ t: T.in[k], name: 'slide', land: T.in[k] + s.slideHit, i: m.n, pan: m.right ? 0.7 : -0.7 }))
        .sort((a, b) => a.t - b.t),
      { t: T.close, name: 'snap', land: T.close + s.closeHit }, // 10.3 the stack closes up tight and drops
      { t: T.slam, name: 'stab' }, // the team name SLAMs into the freed top
      // L34's two lines slide in from the right, one per beat, and land right of centre (x 890-1590).
      ...T.line.map((t) => ({ t, name: 'slide', land: t + s.slideHit, pan: 0.4 })),
      { t: T.lock, name: 'slide', land: T.lock + s.slideHit }, // both sides glide to the common edge ("kết hợp")
    ];
  },
};
