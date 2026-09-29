# Animation guide

The contract every chapter follows. Read it with `CLAUDE.md` (studio rules), `docs/shotlist.md` (what each shot
shows), `docs/style_guide.md` (direction C, Saul Bass) and `scenes/ch01.js` (the approved reference chapter).
When this guide and the shotlist disagree on *how*, this guide wins; on *what* (facts, wording, assets), the shotlist
and `docs/vo_script.md` win. Anything this guide doesn't settle is the chapter author's call, made in the spirit of
ch01, and noted in the chapter's review file.

## 1. Where you work

| You may edit | You may not edit |
|---|---|
| `scenes/chNN.js` (your chapter only) | `lib/*`, `index.html`, `render.mjs`, `tools/*` |
| `docs/review/chNN.md` (your review rounds) | other chapters, `docs/*` except your review file |
| scratch files under `out/tmp/chNN/` | `docs/timeline.json`, `docs/onscreen.json`, `docs/vo_*.json`, `docs/crops.json` |

- Chapters are built in parallel. Never commit, never push, never touch another chapter's files.
- Cap Chromium at 2 workers (`--workers 2`).
- If you need something shared (a helper, a contract change, a new crop), don't build it into `lib/`. Write it
  under **Proposals** in your report; the director decides.
- Facts come only from the deck and README, via `docs/shotlist.md` ("Where every figure comes from") and
  `docs/vo_script.md`. Never invent a number, name, date, source or claim. Wording on screen follows the shotlist.
  If you need a word the shotlist doesn't give, take it from the beat's text in `docs/onscreen.json` or the old voice
  line's subtitle text (`docs/vo_script.md`). The deck slides are
  `refs/slide-NN.png` if you need to confirm something.

## 2. Module API

`scenes/chNN.js` default-exports `{ build, render, underlap?, exit?, cues? }`. The engine (`lib/engine.js`) loads it
dynamically; a missing file is a black frame. `cues(state, ctx)` lists the chapter's event times for the sound
(section 12).

```js
import { step, spring, track, hash, rng, clamp, lerp } from '../lib/motion.js';
import { C, el, rough, rect, bubble, blob, clip, jagged, pathData } from '../lib/paper.js';
import { W, H, txt, text, tag, field, cover, aperture, odometer, plate, flip, svg, stroke, drawOn, vis, prog } from '../lib/kit.js';
import { EXIT, SHEET } from '../lib/handoff.js';

export default {
  underlap: 0.8,            // optional: s at your start during which the previous chapter paints underneath you
  exit: EXIT.ch04,          // optional: s after your end during which you paint on top of the next chapter
  async build(ctx) { ...; return state; },
  render(state, t, ctx) { ... },
};
```

- **`build(ctx)`** runs once, after the fonts have loaded (so `offsetWidth`/`offsetHeight` measure real glyphs).
  - It creates all DOM and precomputes everything: layout, clip-path strings, beat times, `track()`s.
  - It may be `async`; `await plate(...)` for screenshots.
  - It returns your state object.
- **`render(state, t, ctx)`** paints chapter-local time `t`.
  - It's a pure function of `t`: frames are rendered out of order by parallel workers.
  - Set every property you animate on every call, for every element you control, from `t` alone. Never rely on what
    the previous frame left behind.
  - Don't create DOM or set `innerHTML` in `render`; toggle and transform what `build` made.
  - `t` runs past `ctx.dur` during the next chapter's underlap and your own exit (section 7). After those windows,
    hold your final state for any larger `t`.
- **`ctx`**:
  - `ctx.line(id)` → `{ start, end, dur, syllables }` of a story beat (L01-L35), in chapter-local seconds, on the grid.
  - `ctx.syl(id, k)` → subdivision `k` (0-based) of that beat, snapped to 16th notes (section 3).
  - `ctx.snap(t, division = 4)`, `ctx.beat`, `ctx.grid`, `ctx.bpm`: the music's grid (section 3).
  - `ctx.dur`: your chapter's length. It ends when your last line ends.
  - `ctx.crop(shot)` → the `docs/crops.json` entry for a UI shot (`'5.5a'`).
  - `ctx.image(src)` → Promise of a decoded image.
  - `ctx.root` / `ctx.top`: your two layers (next list).
- **Layers.**
  - `ctx.root` is under the stage's paper grain: all paper, type and fields go here.
  - `ctx.top` is above the grain, for UI plates and the paper that must overlap them (apertures, brackets, tags
    touching a plate). Paper on `ctx.top` must be `grained` (kit helpers take `grained: true`). The CSS class
    `.grained` is an exact copy of the stage grain; set `backgroundColor`, never the `background` shorthand.
  - Never style `ctx.root` or `ctx.top` themselves; the engine owns them.
  - Every `ctx.top` layer sits above every chapter's `ctx.root`. That is why covering wipes over ch05/ch07 need
    `cover()` (section 7).
- **Your ground.** Paint your own full-frame ground first in `ctx.root`: a `field()`, or
  `el(ctx.root, '', { width: W + 'px', height: H + 'px', background: C.cream })`.
  - If the previous chapter exits over you, your ground is there from `t = 0`.
  - If you open with a cover, your ground is the covering paper, or it appears once the cover is complete.
- **Seeds.** Use your chapter number × 100 + k for every `rough`/`jagged`/`blob`/`rng` seed (ch04 uses 400-499),
  so no two chapters share an edge.

## 3. Timing: reading time on the beat grid

**The film has no voice-over** (decision 2026-09-28): music and sound effects only, so the on-screen text carries
the whole story.

- **Timeline.** `docs/timeline.json` is built by `tools/timeline.py` from `docs/onscreen.json` and must not be edited
  by hand. It holds the 35 story beats, which keep the ids of the old voice lines L01-L35.
  - Each beat holds long enough to read its on-screen text at a comfortable pace, including the one-beat gap that
    follows it.
  - Everything sits on the music's grid at 108 BPM: beats start and end on 8th notes, and every chapter is a whole
    number of 4/4 bars, so chapter changes land on downbeats.
  - The film is exactly 3:00 (81 bars). The reading pace is fixed; to fit, the tool trims whole bars from holds only
    (shots held longer than their text needs). Text-bound shots never change length.
  - `docs/timeline.md` is the readable table. The voice pipeline (`tools/vo.py`, `docs/vo_*.json`) is kept for a
    possible later voice, but nothing reads it now.
- **Anchors.** Every beat derives from `ctx.line(id)`, `ctx.syl(id, k)`, `ctx.dur` or `ctx.snap(t)`. Small offsets
  from an anchor are fine; film-absolute seconds and hard-coded chapter lengths are not. The timeline changes whenever
  on-screen text changes, so collect beats in one `T = {...}` object in `build` like ch01 does.
  - `ctx.syl(id, k)` is subdivision k of a beat. It is still indexed by the syllables of the old voice line (the
    "Read this" column of `docs/vo_script.md`), spread evenly and **snapped to 16th notes**.
  - `ctx.snap(t, division)` snaps any chapter-local time to the grid (4 = 16ths, 2 = 8ths, 1 = beats).
  - `ctx.beat` is seconds per beat (0.556 s) and `ctx.grid` seconds per 16th (0.139 s).
- **Sync to the music.**
  - SLAMs, stamps, count landings and paper landings go on grid times: `ctx.syl`/`ctx.line` times, or a slide started
    `firstHit` early so it lands on one.
  - A hit may lead its grid point by up to 2 frames (0.05 s); it never trails it.
  - Cuts and HARD CUTs sit exactly on a grid time. If a cut is computed with an offset (`L05.end + 0.1`), wrap it in
    `ctx.snap()`.
  - The sound designer puts the music's hits on the grid, so an off-grid cut will look late.
- **Reading holds.**
  - A text that carries a beat's message stays fully visible and unoccluded, landed and legible, until its beat ends.
    Its reading time was budgeted for that.
  - Counting figures show their unit from their first frame ("59,2%", never "59,2" then "%").
- **Rhythm.** A new visual event every 3-4 s at most (CLAUDE.md): something enters, is cut, flips, counts, slams or
  the shot changes. No frame holds still for more than 2 s, except the holds the shotlist asks for (the end of ch11).

## 4. Motion

- **Springs only**, from `lib/motion.js`.
  - `spring(t, t0, from, to, preset)` for one move.
  - `track(v0, [[t, v, preset], ...])` for a value that changes target several times: it sums one spring per change,
    as CLAUDE.md requires.
  - `step(t - t0, preset)` / `prog(t, t0, preset)` for a 0 → 1 progress.
  - `lerp`/`clamp` only to map a spring's progress, never to make time-based motion.
- **Presets** (the verbs of `docs/shotlist.md`):

  | Preset | Use it for |
  |---|---|
  | `slide` | SLIDE, paper entering along an axis |
  | `snap` | SNAP, a short stiff settle |
  | `slam` | SLAM, type from scale 1.08-1.25 to 1 |
  | `drop` | pieces leaving the frame, no bounce |
  | `tear` | torn reveals |
  | `settle` | slow, calm arrivals and the PUSH |
  | `count` | COUNT (the odometer's default) |
  | `flip` | FLIP (`kit.flip`) |

  Custom `{ f, z }` is fine when a beat needs it (ch01 does).
- **Nothing fades.** Elements appear by visibility plus scale, translate, clip or draw-on. No `opacity` animation, no
  colour tweens, no blur.
  - Show and hide with `vis(el, on)`, which sets visibility `inherit`/`hidden`. Don't use `'visible'`.
  - Colour changes are HARD CUTs, FLIPs or a new piece of paper sliding over.
- **Randomness.** Seeded only: `rng(seed)` in `build` for layout; `hash(i, seed)` is stateless and may be used in
  `render`. `Math.random`, timers, `requestAnimationFrame` and CSS transitions/animations throw or are disabled.
- **Verbs** (from `docs/shotlist.md`):
  - SLIDE: translate on `slide`, entering from off-frame.
  - SNAP: short `snap`.
  - SLAM: `scale(spring(t, t0, 1.08, 1, 'slam'))` and it appears on `t0`; ch01's complaint uses 1.25.
  - FLIP: `kit.flip` → `scaleX(sx)` about the panel centre; swap to the back face when `back`.
  - CUT: a scissor stroke drawn with `stroke`/`drawOn` along a `jagged` line, then the pieces part on `drop`.
    ch01's chat cut is the model.
  - TEAR: a `blob`/`jagged` edge with a thin cream fringe, as in ch01.
  - WIPE: a `field()` translating across the frame.
  - PUNCH: a hole appears (even-odd `clip`) with a small `snap` of the paper around it.
  - PUSH: slow `settle` scale-in.
  - COUNT: `odometer`.
  - HARD CUT: visibility switches on a beat.
- **Performance.** Precompute clip-path strings in `build`; in `render` only switch between them. Keep 1080p frames
  cheap (ch01 renders at about 50 ms per frame).

## 5. Look (direction C, after Saul Bass)

- **Palette** (`C` in `lib/paper.js`):
  - ORANGE `#FF7C00`, CREAM `#F4ECDC`, BLACK `#151311`, NAVY `#003080`, RED `#D0271D`.
  - BAR `#CDBFA8` is only for the anonymous-chat bars.
  - No other colours, no gradients.
- **Colour meaning:**
  - The problem half (ch01-ch04) plays on orange and black.
  - The solution half (ch05-ch07) plays on cream and navy, with orange as the accent.
  - Navy is LamTo's truth: copies, verification, the named manager.
  - Red appears only for tampering, over-limit figures and missing receipts.
  - Green appears only inside the real UI.
- **Type** (classes in `lib/film.css`):
  - DISPLAY `disp cut-text`: Bricolage Grotesque 800, 75 % width, CAPS, with the hand-cut edge. Every DISPLAY
    element gets `cut-text`.
  - LABEL `label`: Bricolage Grotesque 700, sentence case.
  - MONO `mono`: IBM Plex Mono 600, for hashes, dates and tick labels.
  - Figures are tabular (`disp` sets `tabular-nums`).
  - Use the sizes in the shotlist.
- **Paper.**
  - Every shape is cut paper: `rough(rect(...))` → `clip(...)` for hand-cut edges, `jagged` for scissor lines,
    `blob` for tears, `bubble` for chat.
  - Flat colour only. Lifted paper may cast ch01's small hard shadow (`filter: drop-shadow(0 5px 4px
    rgba(0,0,0,0.28))`).
  - No other shadow, no glow, no blur, no 3D.
- **Composition.**
  - One idea per frame, in big flat fields: bold, asymmetric framing, type set flush left, diagonal cuts.
  - Frames are dense with shape, not with words.
  - The camera language is flat planes and hard graphic match cuts. Paper crossing the frame acts as the wipe.
  - There is no 3D camera; a PUSH is a 2D scale.
- **The craft bar is ch01.** Look at `docs/style/ch01.jpg` and `docs/style/c-bass.png` before you start.
  Your frames must sit next to those without looking like a different film.

## 6. Text

- **Size floor.** Nothing under 28 px at 1080p, ever, including captions and tick labels.
  - The frame's key message is DISPLAY 100 px or larger, so it reads at 360 px wide (the phone sheet).
  - Supporting labels are 40 px or larger.
  - 28-36 px only for sources and small captions.
  - `node tools/textcheck.mjs chNN` (also run at the end of every review) fails any text that never reaches 28 px.
- **NFC.** All on-screen strings are NFC. Type Vietnamese as precomposed characters; `txt()`/`text()` normalize
  anyway, and the lint checks your file.
- **No automatic wrapping.** Text is `white-space: nowrap`; break lines explicitly with ` / ` (the shotlist's notation),
  so units and amounts never break: `20.000đ/căn/tháng`, `18–34tr`, `59,2%`, `08/2027`, `1.363`.
  Vietnamese number format: `.` for thousands, `,` for decimals, `–` (en dash) for ranges, `đ` attached.
- **Line height.** 1.1 or more under caps (DISPLAY default in `text()`). Check stacked diacritics (Ề, Ỗ, Ữ, Ậ, Ẫ, Ỹ)
  at 100 % on a full-resolution still: `node tools/frames.mjs chNN out/tmp/chNN <t>`. The cut-text filter must
  leave every mark intact and marks must not touch the line above.
  - The filter region extends 35 % of the element's height above and below it, so marks that rise above a
    single-line box at 1.1 are no longer shaved. It used to extend only 3 %, which flattened the tilde of Ễ at 72 px.
    The ch10 builder found this.
- **Story text without a voice.** Every beat's message is on screen; `docs/onscreen.json` lists the text each beat
  shows and, under `added`, what was added when the voice was dropped. Use that wording exactly.
  - Set added text as DISPLAY type or as a **caption strip**: `kit.tag` with `cls: 'disp cut-text'` (or `label` for a
    sentence), paper in the palette (BLACK on ORANGE, CREAM on BLACK or NAVY), a hand-placed tilt of ±1-3°.
  - Place it inside the frame's main group, where the shot's idea is. Never centre it along the bottom like a
    subtitle, and never put it in a corner.
- **Sources.** A source caption ("Nguồn: CBRE, Savills") sits directly under the figure it sources, as part of that
  group, never in a frame corner: corner labels are banned.

## 7. Transitions

Every boundary has one owner. There are two mechanisms:

- **Cover (`underlap`).** The incoming chapter sets `underlap: s`; for its first `s` seconds the previous chapter
  keeps painting underneath (at `t` past its end, holding its final frame) and the incoming chapter's paper covers
  it. At `t = underlap` the previous chapter disappears, so the cover must be complete by then.
  - Covering ch05 or ch07 (UI plates on their top layer): use `cover(ctx, color)` and call
    `place(x, y, t < underlap)`. It travels on `ctx.top` while the previous chapter paints, then swaps to an
    identical copy on `ctx.root` (the swap is invisible; measured ≤ 1/255).
  - Anything else of yours that must appear before `underlap` also belongs on `ctx.top` (grained).
- **Exit (`exit`).** The outgoing chapter sets `exit: EXIT.chNN` (from `lib/handoff.js`). For that long after its
  end, it keeps painting on top of the next chapter, so it can animate its own paper out of frame. Everything it
  leaves in frame covers the next chapter. By the end of the window its paper must be gone or must match the next
  chapter's frame exactly. The next chapter paints normally underneath from its `t = 0` and must not put anything on
  `ctx.top` during that window.
- **Review both ends.**
  - To see your exit, render with `--tail <exit>`.
  - The previous chapter loads in your review (leniently: if it's broken or missing, it's black), so you can judge
    your cover.
  - The director checks every boundary at integration.

| Boundary | Shot | Owner and mechanism | Contract |
|---|---|---|---|
| ch01 → ch02 | 2.1 | ch02, `underlap` (about 0.8 s) | An ORANGE field slides in from the right over ch01's held last frame (the question, cream/orange on black). The first slabs start to rise as it lands. |
| ch02 → ch03 | 3.1 | ch02 `exit: EXIT.ch02` (= `FLIP_EDGE`, 0.167 s) and ch03 | **ch02** ends on a CREAM ground with the report sheet exactly at `SHEET`: centre (960, 560), 1120 × 680, −3°. Everything else of 2.6 is either on the sheet or gone by `ctx.dur`. In its exit ch02 flips the sheet with `flip(t, ctx.dur)` about the sheet's vertical centre line, drawing the front only while `!back`. **ch03** has a CREAM ground from `t = 0` and its NAVY card at `SHEET`. It draws the card with `flip(t, 0)`, visible only when `back`, and may move or resize it afterwards. |
| ch03 → ch04 | 4.1 | ch04, `underlap` | A BLACK curtain drops from the top over ch03's held last frame. |
| ch04 → ch05 | 5.1 | ch04 `exit: EXIT.ch04` (0.8 s) | **ch04** ends with three NAVY panels (answers on them) on its BLACK ground. In the exit, the frame parts like doors into three columns, each column being a panel with its strip of ground: left out left, right out right, centre down, on `drop`/`slide`. **ch05** has a CREAM ground from `t = 0` and nothing else in frame until `EXIT.ch04`. |
| ch05 → ch06 | 6.1 | ch06, `underlap` + `cover()` | BLACK slides down over ch05's held last frame, including its plates, then the numeral SLAMs. |
| ch06 → ch07 | 7.1 | ch07, `underlap` | ch06 ends on its BLACK ground (6.5) with no `ctx.top` content. ch07 tears it away: CREAM paper with a torn diagonal edge (jagged, cream fringe) sweeps across, then the "2" SLAMs. |
| ch07 → ch08 | 8.1 | ch08, `underlap` + `cover()` | CREAM slides in from the right over ch07's held last frame (the pushed-in mismatch plate). |
| ch08 → ch09 | 9.1 | ch08 `exit: EXIT.ch08` (0.6 s) | **ch08** grows the NAVY "LÀM TỔ" strip until it covers the whole frame. **ch09** is a full NAVY ground at `t = 0` and still is at `EXIT.ch08`; its content starts after. |
| ch09 → ch10 | 10.1 | ch09 `exit: EXIT.ch09` (0.7 s) | **ch09**'s staircase and its CREAM ground slide out to the left together (the ground's right edge is hand-cut). **ch10** has a BLACK ground from `t = 0` and nothing else until `EXIT.ch09`. |
| ch10 → ch11 | 11.1 | ch11, `underlap` | A CREAM field wipes over ch10's held last frame. |

## 8. UI plates (ch05, ch07)

- **Source.** Only real screenshots, only through `plate(ctx, shot, opts)`:
  - Rects and scales come from `docs/crops.json` (measured on the final web @4x, app @3x and explorer @5x set;
    every entry keeps its smallest text at 28 px or more). Never type a rectangle or a scale into scene code.
  - The only allowed change is `zoom` > 1 for a PUSH.
  - Never reference `assets/screens/` paths directly (the lint rejects it).
- **Drawn straight.** No rotation, skew, recolouring, filter, glow or redraw. A plate may translate, scale up
  (PUSH), be clipped by an aperture, and HARD CUT to another plate. Don't draw on the UI: brackets, tags and seals go
  beside or under the UI text, never over it.
- **Mounting**, one of two, on `ctx.top`:
  - `plate(..., { backing: C.navy })`: a hard cut-paper backing offset 14 px down-right, in a second colour.
  - An `aperture(ctx.top, color, { x, y, w, h })` above the plate, whose paper edge overlaps the UI by 4 px on
    every side (a façade window).
- **Covering.** A plate is on `ctx.top`, so anything that must pass over it (a wipe, a sliding strip) must also be on
  `ctx.top` and `grained`.
- **Test strings.** The crops already exclude the test-string description box and the explorer's step badges.
  Don't widen them.

## 9. Banned (CLAUDE.md)

- A centred title on a gradient.
- Everything fading in (nothing fades at all, section 4).
- Corner labels and frame borders.
- Glow on UI.
- Particle bursts.
- Walls of numbers that just sit there. At most three figures on screen at once, each arriving with its own motion
  and landing with its word.
- Redrawn UI.
- Invented facts.
- Film-absolute seconds.

## 10. Review loop

Run it for every round, until every score is 8 or higher:

```sh
node tools/lint_scene.mjs scenes/chNN.js
node tools/review.mjs chNN --workers 2 [--tail <exit>] [--strip a:b ...]
node tools/frames.mjs chNN out/tmp/chNN <t> [<t> ...]
```

1. **Lint.** It must print `lint ok`. Answer each WARN in your review notes or fix it.
2. **Review.** This renders the 960×540 30 fps draft, `out/review/chNN_contact.png` (2 fps) and
   `out/review/chNN_phone.png` (360 px tiles). With `--strip a:b` (chapter-local seconds) it adds every-other-frame
   strips of fast beats. It then prints the text-size check. Tiles are labelled `film time · +chapter time`.
3. **Full-resolution stills** (`frames.mjs`) of the key frames, to check diacritics and edges at 100 %.
   **Reading check:** `node tools/readcheck.mjs chNN` measures how long each text is actually readable (visible,
   full size, in frame, not covered by paper) against its reading time. Every text must pass. A text that lands
   late in its beat is the usual cause.
4. **Look** at the contact sheet, the phone sheet and a strip of every fast beat (cuts, slams, flips, transitions).
   Open the images; don't guess.
5. **Score** 1-10:
   - **Hook**: the opening grabs, and the chapter ends on a payoff.
   - **VN**: accents, NFC, line breaks, marks intact.
   - **Read**: 1080p and the 360 px phone sheet; the key message reads on the phone.
   - **Motion**: springs, craft, no dead or jittery frames.
   - **Brand**: Bass look, palette meanings, UI rules, sits beside ch01.
   - **Sync**: cuts and SLAMs land on the beat grid, and every text holds long enough to read at the timeline's pace.
   - **Variety**: a new event every 3-4 s, and verbs not repeated to boredom.
6. **Fix** the 3 worst problems and repeat. Log each round in `docs/review/chNN.md`:

```md
### Round N
| Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|
| 7 | 9 | 8 | 7 | 8 | 8 | 7 | ... |

Fixes: ...
```

When every score is 8 or higher, finish with a final round that re-renders from scratch and confirms it.

## 11. Report back

Return to the director:
1. Final scores (the last round's table row).
2. What the chapter does, beat by beat, with anchors.
3. Contract notes: which transition you own or depend on and how you met it.
4. Facts on screen, each with its source row.
5. Proposals: shared helpers or contract changes, if any.
6. Open issues.

## 12. Sound cues

The film's sound is synthesized by `tools/sound.py`: a music bed on the timeline's grid, and effects on the scenes'
own event times. Each chapter tells the sound where its events are with `cues(state, ctx)`.

- **What it returns:** a new array of `{ t, name, ... }` in chapter-local seconds.
  - `t` is when the sound starts. For an instant event (a SLAM appears, a stamp or snip hits) that is the hit.
  - A move that travels and lands (slide, rise, bar, count...) starts at `t` and carries `land`: the time it lands,
    which is its hit on the grid.
  - `i` numbers the events of a run (the n-th bubble, cell, slab, strip); some effects step their pitch with it.
  - `pan` (-1 left … 1 right) places the sound where the event is, when it is clearly on one side of the frame.
  - Times may run past `ctx.dur` for an exit the chapter paints over the next one.
- **Pure.** `cues()` reads the state `build()` returned and nothing else: it never touches the DOM, never changes
  the state, and never changes a frame. If it needs a time that `build()` computed but didn't keep, `build()` may add
  it to the state it returns. Proof, for every chapter that gets or changes `cues()`: sampled chapter-local frames
  rendered before and after (`tools/frames.mjs`) compare with `magick compare -metric AE` = 0.
- **Which events.** Follow the SFX column of each shot in `docs/shotlist.md`, with the times from the chapter's
  `T` table (the shotlist's times are voice-era estimates). One sound per event the eye follows: a supporting label
  that arrives with its figure doesn't get its own.
- **Names.** Only the names below. `tools/sound.py` stops on any other name.
- **Collect them** with `node tools/cues.mjs` (film seconds, in `out/sound/cues.json`).

| Cue | On screen | Sound |
|---|---|---|
| `stab` | A SLAM the music marks: "TIỀN QUỸ / ĐI ĐÂU?" (ch01), the "1" (ch06), the "2" (ch07), "LÀM TỔ / CÓ CẢ HAI." (ch08), "20–25 TÒA" (ch09), "ĐỘI KAWAIBU" (ch10). `soft: true` for a small one (SAM in ch03) | the chapter's stab chord: piano, bass and a brush crash (piano only when soft) |
| `alarm` | A figure breaks the rule: "VƯỢT KHUNG" (ch06), the verified → mismatch cut (ch07) | two-note alarm stab: low brass and snare |
| `chord` | The film resolves: the end card's chord (ch11) | the final chord on vibraphone, piano and bass, left to ring |
| `push` | The camera PUSHes in to close a chapter (ch07's badge) | the music thins to one low sustained note until the chapter ends |
| `drop` | ch01 only: the "500" falls out of frame | a falling swoosh; the music drops out and one bass note falls until the stab |
| `complaint` | The hook's complaint bubble slams in | a round pop |
| `bubble` | A chat bubble arrives; the last of a run is muffled. With `land`: the hook's bubble returns and snaps flush (ch07) | a pitched tick; with `land`, a snap and a warm chord on the landing |
| `caption` | A caption strip slams onto the paper | a paper stamp |
| `slam` | DISPLAY type SLAMs | a paper stamp |
| `stamp` | A seal or stamp tag is struck down | a deep stamp |
| `slide` | Paper slides in and lands (`land`) | a swoosh over the travel and a soft landing thump |
| `rise` | Type rises out of a slot and lands (`land`) | a short, light upward swoosh |
| `bar` | A layer bar shoots across and lands (`land`) | a fast swoosh and a thud |
| `wipe` | A field crosses the whole frame (a cover, a wipe); `land` if it lands | a long whoosh |
| `pan` | Everything in frame travels across together and settles (`land`) | a long, low swoosh |
| `doors` | Paper parts like doors, or two fields close in | two swooshes, left and right |
| `split` | The halves of a cut sheet part | two swooshes, left and right (ch01 adds its low piano cluster) |
| `lift` | A piece lifts off the paper | a short rising swoosh and a light snap |
| `scroll` | A UI plate scrolls inside its window | a soft paper swoosh |
| `scissor` | A scissor line runs across the paper | a scissor rasp ending in a snip |
| `snip` | Scissors cut a piece out; `n: 1` for a single snip | snip-snip (one snip with `n: 1`) |
| `tear` | Paper tears; `land` when the tear is complete | a tear |
| `flip` | A panel turns on its vertical axis | a paper flip |
| `chime` | A pain flips into LamTo's answer (ch04) | a warm chime |
| `cell` | One small cell or window of a façade flips or lights, in a run of many (`i`) | a tiny tick, kept down as texture |
| `sweep` | A run of windows lights in one sweep, from `t` to `land` | a rising rattle |
| `count` | An odometer COUNTs from `t` and locks at `land` | an odometer rattle and a lock click |
| `tick` | A tick mark or a step clicks on | a small click |
| `climb` | A bracket steps up a list (`i` = step) | ticks that climb in pitch |
| `pin` | A tag or label is pinned on | a pin |
| `snap` | A short, stiff settle: a bracket, a flag, a tag | a snap |
| `click` | A UI button is pressed, a clip clicks on | a click |
| `bell` | A confirmation appears | a small bell |
| `open` | A façade window opens onto a UI plate | a paper creak |
| `band` | A band grows along a scale, from `t` to `land` | a rising tone |
| `friction` | A tag drags along a bar and stops dead at `land` | a friction slide and a thud |
| `thud` | A heavy landing: a curtain drops, a strip stops | a low thud |
| `slab` | A slab or step rises from the bottom edge (`i` = which, left to right) | a pitched thump, rising with `i` |
| `punch` | A hole is punched through paper | a punch |
| `flutter` | Strips fall away with a spin | paper flutter |
| `sly` | The edited copy slips in crooked, landing at `land` | a sly paper slide and a scratch |
| `cut` | A HARD CUT inside a shot | a small, dry paper tick |
