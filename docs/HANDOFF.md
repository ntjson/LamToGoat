# Handoff: after gate 4 (2026-09-28)

For the next session, which starts gate 5. Read `CLAUDE.md` and `docs/brief.md` first; their rules still hold unless
a decision below overrides them. Work is on branch **`film`** (branched from `master` for the gate 1-4 commit).
There is no remote. **Never push.**

## Where things stand

| Gate | Status | Output |
|---|---|---|
| 1 Look + shotlist | approved | `docs/style_guide.md` (direction C), `docs/style/*.png`, `docs/shotlist.md` |
| 2 Voice script | approved | `docs/vo_script.md`, generated from `docs/vo_lines.json` |
| 3 Voice (ElevenLabs) | skipped | the user records the voice; timeline estimated in `docs/vo_timings.json` |
| 4 Engine + ch01 | approved (look) | `index.html`, `lib/`, `scenes/ch01.js`, `render.mjs`; renders in `out/ch01/` (not committed) |
| 5 Guide + ch02-ch11 | **next** | see "Gate 5" below |
| 6 Rough cut with voice | waits for the user's voice takes; needs the user's OK | |
| 7 Polish, sound, final render, deliverables | not started | |

## Decisions the user made in chat

1. **Direction C, Saul Bass title sequence** (cut paper, orange/black/cream fields, heavy condensed caps). The user
   declined my recommendation, A. The decision is recorded at the top of `docs/style_guide.md`.
2. **Shotlist approved** (`docs/shotlist.md`). The user accepted the flagged points as proposed:
   - ch06 shows the deck's price band as a labelled example ("Ví dụ"), never as demo footage; the real UI says the
     AI price prediction was unavailable in the demo.
   - The triage case (report #7, elevator A) and the traced expense (elevator B, 18.500.000 đ) stay distinct in the voice.
   - Test-string areas in the app screenshots stay cropped out.
   - "Zalo" stays in ch04.
3. **Demo manager shows as "Kawaibu"** in the screenshots (formerly "Fenikong").
4. **The screenshot set is final and complete:** web @4x, explorer pair @5x, app @3x (the `@Nx` files in
   `assets/screens/`). Every ch05/ch07 crop was re-measured on these; the triage layout changed, so no old numbers were
   reused. The crops are in `docs/crops.json`.
5. **The user records the voice**, so there are **no ElevenLabs calls, ever**. Keep the script lean. The README credits
   "Voice: recorded by the team (Đội Kawaibu)"; the user may swap in their own name.
6. **Timing:** estimate at 3 syllables/s until real timing arrives. The user will send seconds for a test read of L04-L08.
7. **ch01 look approved.**
8. **Gate 5 git rules: commit each chapter separately, never push.**

## Open issues

1. **The test-read seconds never arrived.** The user's message said "L04-L08 took [XX] seconds"; the number didn't come
   through. Timing is still the estimate (`vo_timings.json` source "estimate", 148.0 s of speech in 180.0 s). Ask for
   the number. When it comes: `uv run python tools/vo.py calibrate L04-L08=<seconds>`, check the chapter lengths it
   prints, and commit.
2. **Voice takes to come:** one WAV per line, `L01.wav` ... `L35.wav`. Then run `uv run python tools/vo.py measure <folder>`.
   Gate 6 needs them.
3. **Script length vs brief:** 444 syllables / 1,924 characters against the brief's 2,400-2,600. The user asked for lean.
   If the read is faster than 3/s, the tool spreads the spare time into breaths; judge pacing at gate 6.
   The timeline assumes Kawaibu = 3 syllables and Zalo = 2.
4. **Not built yet** (all gate 7):
   - the music bed, sound effects, voice sidechain ducking, and loudness (−14 LUFS, true peak ≤ −1 dBTP)
   - audio muxing in `render.mjs`
   - the SRT writer (display text in `vo_lines.json`: ` / ` is a line break, ` // ` starts the next subtitle)
   - `out/poster.png` and `out/contact.png`
5. **Chapter registration is a shared file.** `scenes/index.js` is a static manifest, which parallel builders would all
   edit. Fix it first in gate 5 (step 1).
6. **Render cost:** 1080p60 renders at about 7 fps with 5 workers, so the full film takes about 25 minutes.
   `tools/review.mjs` has no `--workers` option yet (step 1).

## What exists

| Path | What |
|---|---|
| `index.html`, `lib/film.css` | Stage 1920×1080; fonts (Bricolage Grotesque, IBM Plex Mono, both OFL) via @font-face; CSS transitions and animations disabled; grain overlays |
| `lib/engine.js` | Loads `docs/vo_timings.json`, builds chapters after fonts load, `window.seek(t)`, `window.__ready`. Once ready it throws on `Math.random`, `setTimeout`, `setInterval` and `requestAnimationFrame` |
| `lib/motion.js` | Closed-form springs: `step`, `spring`, `track` (one spring summed per target change) and presets `slide` `snap` `slam` `drop` `tear` `settle`; `hash`, `rng`, `noise1` |
| `lib/paper.js` | Cut-paper geometry: `rough`, `rect`, `bubble`, `blob`, `jagged`, `clip` (clip-path `path()`, even-odd holes), `el`, palette `C` |
| `scenes/ch01.js` | **Reference chapter.** Approved look; every beat anchored to voice lines |
| `render.mjs` | Parallel render: `--chapters`, `--from/--to`, `--fps`, `--scale`, `--final` (1080p60, CRF 16, slow), `--workers`. Splits at chapter boundaries and 2 s chunks, joins with ffmpeg concat |
| `tools/review.mjs` | `node tools/review.mjs chNN`: draft (960×540, 30 fps), 2 fps contact sheet and 360 px phone sheet in `out/review/` |
| `tools/still.mjs` | One frame: `node tools/still.mjs index.html out/x.png --t 9.0 [--scale 0.5]` |
| `tools/vo.py` | `build`, `calibrate`, `measure`; writes `vo_script.md` + `vo_timings.json` from `vo_lines.json` |
| `tools/crops.py` | Re-measures the UI crops and minimum text sizes into `docs/crops.json` |
| `tools/check_font_vi.py`, `tools/gen_textures.sh`, `tools/find_cards.py`, `tools/serve.mjs` | Font coverage, seeded textures, card finder, static server |
| `docs/shotlist.md` | The spec: every shot's asset, motion, on-screen text and SFX. Its times are gate-1 estimates; real times come from `vo_timings.json` |
| `docs/crops.json` | 18 UI crops for ch05/ch07: source rect, on-screen scale, measured minimum text (all ≥ 28 px) |
| `docs/review_log.md` | Every critique round so far (gate 1 frames, ch01 rounds 1-3) |
| `docs/style/` | Gate-1 stills; `ch01.jpg` is the approved ch01 look |

Current timeline (estimate): ch01 0.00-9.73, ch02 -33.57, ch03 -49.05, ch04 -62.40, ch05 -84.66, ch06 -105.25,
ch07 -128.10, ch08 -138.76, ch09 -159.77, ch10 -171.20, ch11 -180.00. Scenes must read these from the timeline,
never copy them.

## Gate 5: exactly what to do

1. **Prepare the tools (one commit).**
   - Replace the static manifest: `lib/engine.js` imports `scenes/<id>.js` dynamically for every chapter in
     `vo_timings.json`, and a missing file means a black frame. Then delete `scenes/index.js`.
   - Add a `--workers` passthrough to `tools/review.mjs` so parallel builders can cap Chromium (2 each).
   - Verify ch01 is unchanged: render sample frames before and after and pixel-diff them (0 px).
   - If the test-read seconds have arrived, calibrate first (open issue 1).
2. **Write `docs/ANIMATION_GUIDE.md` (one commit).** It is the contract every chapter builder follows:
   - **Module API:** `build(ctx)` / `render(state, t, ctx)` / `underlap`, `ctx.line(id)`, `ctx.syl(id, k)`,
     `ctx.image(src)`, and the `ctx.root` (under the grain) vs `ctx.top` (above it, for UI plates) layers.
   - **Timing:** every beat derives from `ctx.line`/`ctx.syl`. Small offsets relative to an anchor are fine;
     film-absolute seconds and hard-coded chapter lengths are not.
   - **Motion:**
     - springs only, from `lib/motion.js`
     - nothing fades: elements appear by visibility plus scale/translate/clip
     - `hash`/`rng` only for build-time layout
   - **Look:** the palette, the DISPLAY/LABEL/MONO classes and sizes, `.cut-text` on DISPLAY type, rough edges via
     `lib/paper.js`, and ch01 as the craft bar.
   - **Banned list:** from CLAUDE.md.
   - **Text:** nothing under 28 px at 1080p; the key message must read at 360 px wide.
   - **UI plates:**
     - rects and scales come only from `docs/crops.json`
     - drawn straight, never redrawn, no glow
     - either a 14 px offset paper backing or an aperture overlapping the UI by 4 px
     - placed on `ctx.top`
   - **Transitions:** each chapter owns its opening transition and sets `underlap` so the previous chapter paints
     underneath. Each chapter's render must hold its final state for t past its end.
   - **Vietnamese:** NFC; units and amounts never break across lines; line-height ≥ 1.1 under caps; stacked
     diacritics checked at 100% on a 1080p still.
   - **Review loop:**
     - `node tools/review.mjs chNN --workers 2`
     - look at the contact sheet, the phone sheet, and every-other-frame strips around fast beats
     - score the 7 criteria and fix the 3 worst
     - repeat until every score is 8 or higher
   - **Parallel-work rules** (step 3).
3. **Build ch02-ch11 with parallel subagents**, in two waves of five (ch02-ch06, then ch07-ch11) to keep the machine
   responsive. Each subagent gets:
   - its chapter's section of `docs/shotlist.md`
   - the guide
   - `docs/crops.json` (ch05, ch07)
   - `scenes/ch01.js` as reference
   - the relevant facts in `docs/vo_script.md`

   Each subagent:
   - edits only `scenes/chNN.js` and writes its review rounds to `docs/review/chNN.md`
   - never edits `lib/`, other chapters, or shared docs; it proposes shared helpers in its report instead
   - never commits
   - uses only facts from the deck/README as listed in the shotlist's source table
4. **Integrate and commit each chapter separately.** As each subagent finishes:
   - re-run its review and view the sheets yourself
   - render ±2 s around its boundary with the previous chapter to check the handoff
   - append its final scores to `docs/review_log.md`
   - commit only that chapter: `scenes/chNN.js`, `docs/review/chNN.md`, the log. One commit per chapter; never push.
5. **Continuity pass:** render the whole film silent at draft quality (`node render.mjs --out out/draft.mp4`) and make a
   whole-film contact sheet. Check that a new visual event arrives every 3-4 s, that the transitions are clean, and
   that the loop pays off (the hook's complaint bubble returns in 7.3). Fix, commit, then stop: gate 6 needs the
   user's voice takes and the user's OK.

## Don'ts

- No ElevenLabs calls. No push. No redrawn UI. No reused pre-@Nx crop numbers.
- No hard-coded seconds; the timeline re-flows when the real voice arrives.
- Don't change the approved ch01 look without asking; engine refactors must leave its frames pixel-identical.
