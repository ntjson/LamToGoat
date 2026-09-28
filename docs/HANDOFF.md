# Handoff: after gate 5 (2026-09-28)

For the next session, which starts gate 6. Read `CLAUDE.md`, `docs/brief.md` and `docs/ANIMATION_GUIDE.md` first; their
rules still hold unless a decision below overrides them. Work is on branch **`film`**. There is no remote. **Never push.**

## Where things stand

| Gate | Status | Output |
|---|---|---|
| 1 Look + shotlist | approved | `docs/style_guide.md` (direction C, Saul Bass), `docs/style/*.png`, `docs/shotlist.md` |
| 2 Voice script | approved | `docs/vo_script.md`, generated from `docs/vo_lines.json` |
| 3 Voice (ElevenLabs) | skipped | the user records the voice; timeline estimated in `docs/vo_timings.json` |
| 4 Engine + ch01 | approved (look) | `index.html`, `lib/`, `scenes/ch01.js`, `render.mjs` |
| 5 Guide + ch02-ch11 | **done** | `docs/ANIMATION_GUIDE.md`, `scenes/ch02.js` … `ch11.js` (one commit each), `docs/review/chNN.md`, `docs/review_log.md`, `out/roughcut.mp4` (not committed) |
| 6 Rough cut with voice | **next**; waits for the user's voice takes and the user's OK | |
| 7 Polish, sound, final render, deliverables | not started | |

The whole film renders: `node render.mjs --out out/roughcut.mp4 --workers 10` (960×540, 30 fps, 180.0 s, about 2.5 min).
Every chapter scored 8 or higher on all seven criteria (summary table at the top of `docs/review_log.md`).

## Decisions the user made in chat (still in force)

1. **Direction C, Saul Bass title sequence.** The shotlist and voice script are approved.
2. **The user records the voice**, so there are **no ElevenLabs calls, ever**. The README credits "Voice: recorded by
   the team (Đội Kawaibu)".
3. **Timing:** estimate at 3 syllables/s until real timing arrives.
4. **ch01's look is approved.** Engine changes must keep its frames pixel-identical. The 22 reference frames are in
   `out/diff/before/` (not committed); re-create them from commit 470e6b4 if needed.
5. **The screenshot set is final.** Crops live in `docs/crops.json`; the demo manager shows as "Kawaibu".
6. **Git:** commit each chapter separately, never push.

## What gate 5 added

- **Engine** (`lib/engine.js`):
  - Chapters load dynamically; a missing file is a black frame.
  - `?only=&soft=` loads a subset.
  - `exit` lets an outgoing chapter animate its own paper over the next chapter, next to `underlap`.
  - `ctx.crop(shot)`.
  - Idle chapters get `display: none`.
- **Shared kit** (`lib/kit.js`): `text`, `tag`, `field`, `cover` (a wipe over a chapter with top-layer plates),
  `aperture`, `odometer`, `plate`, `flip`, `svg`/`stroke`/`drawOn`, `vis`, `prog`.
- **Handoff contracts** (`lib/handoff.js`): `EXIT` windows (ch02, ch04, ch08, ch09), `SHEET` (the ch02 → ch03 flip)
  and `FLIP_EDGE`.
- **`.grained`** (`lib/film.css`) is an exact copy of the stage grain for paper on the top layer (swap measured
  ≤ 1/255).
- **The cut-text filter region** (`index.html`) now extends 35 % above and below each text box. It used to shave
  stacked marks on single-line caps.
- **Tools:**
  - `tools/review.mjs --workers --tail --strip`
  - `tools/frames.mjs` (full-res stills)
  - `tools/boundary.mjs` (±2 s around a cut)
  - `tools/textcheck.mjs` (28 px floor)
  - `tools/lint_scene.mjs` (guide rules)
  - `tools/stillness.py` (rhythm: holds and gaps between visual events)
  - `render.mjs --load --tail`

## Open issues

1. **The L04-L08 test-read seconds never arrived.** Timing is still the estimate. When they come:
   `uv run python tools/vo.py calibrate L04-L08=<seconds>`, then re-render; every beat is voice-anchored and re-flows.
2. **Voice takes to come:** one WAV per line, `L01.wav` … `L35.wav`. Then run `uv run python tools/vo.py measure <folder>`.
   Gate 6 needs them.
3. **Script length vs brief:** 444 syllables / 1,924 characters against the brief's 2,400-2,600. The user asked for
   a lean script; judge pacing at gate 6.
4. **Readability to judge with the voice at gate 6:**
   - The shotlist's 36-48 px supporting labels are legible but weak on the 360 px phone sheet: ch03's B2B2C tags,
     ch04's role descriptors, ch08's column labels (the builder suggests 48 px), ch11's credits.
   - ch03's navy card is nearly blank for about 1.5 s after the flip.
5. **Shotlist additions to record (made by chapter builders, accepted at integration):**
   - ch02: the report sheet is black paper, and its red tag is DISPLAY 100.
   - ch04: role names are 72 px.
   - ch06: an orange layer bar (6.2) and a navy strip under "NGƯỜI QUYẾT ĐỊNH." (6.5).
   - ch07: "LẦN / NGƯỢC" and "MÃ BĂM", taken from the subtitles of L24/L25, and a navy layer-two bar.
   - ch09: the hard cut lands on "hai"; the break-even date is typed on the syllables.
   - ch11's credits come from deck slides 7 and 15.
   - Details are in each chapter's section of `docs/review_log.md`.
6. **Builders' proposals for shared code:**
   - A no-overshoot `count` preset. Several chapters use `{ f: 1.3, z: 0.9 }` locally.
   - An odometer "carry" option and a separate unit stamp.
   - `kit.logo()`, measured on the visible artwork (ch05 and ch11 each carry a copy).
   - A plate scroll helper (ch07 drives `plate().win/.img` for 7.3a → 7.3b).
   - A "first time a spring reaches its target" helper.
   - Exported beat times for the sound pass.
   None of them is needed for gate 6.
7. **Not built yet** (all gate 7):
   - the music bed, sound effects, voice sidechain ducking, and loudness (−14 LUFS, true peak ≤ −1 dBTP)
   - audio muxing in `render.mjs`
   - the SRT writer (display text in `vo_lines.json`: ` / ` is a line break, ` // ` starts the next subtitle)
   - `out/poster.png` (candidate: ch11's final frame), `out/contact.png`, `README.md` credits
8. **Render cost:** 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest). The final
   1080p60 render is 10,800 frames, so plan on 10 workers and about 15-20 minutes.

## Gate 6: what to do

1. With the user's takes: `tools/vo.py measure`, check the chapter lengths, commit `docs/vo_timings.json`.
2. Re-run every chapter's review (`node tools/review.mjs chNN --workers 2`). Beats follow the voice; look for anything
   that now collides or holds too long (`tools/stillness.py` on the new rough cut).
3. Render the rough cut with the voice muxed in (needs the gate-7 audio muxing, or a quick `ffmpeg` mux of the
   takes placed at their `vo_timings.json` starts), and review pacing with the user. Wait for the user's OK.
