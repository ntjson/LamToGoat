# Handoff: before the whole-film sound pass (2026-09-29)

For the next session, which builds the **whole-film sound**. Read `CLAUDE.md`, `docs/brief.md` and
`docs/ANIMATION_GUIDE.md` first; their rules hold unless something below overrides them. Work is on branch **`film`**.
There is no remote. **Never push.**

## Where things stand

| Gate | Status |
|---|---|
| 1 Look + shotlist | approved: direction C, after Saul Bass (`docs/style_guide.md`, `docs/shotlist.md`) |
| 2 Voice script | approved, then superseded: there is no voice-over. The 35 lines L01-L35 live on as story beats. |
| 3 Voice | dropped. No ElevenLabs calls, ever. |
| 4 Engine + ch01 | approved |
| 5 Guide + ch02-ch11 | done: every chapter built, reviewed (8+ on all criteria) and committed separately |
| 6 Rough cut review | done without a voice (see below) |
| 7 Polish, sound, final render, deliverables | **in progress.** The ch01 sound sketch is approved; **the whole-film sound pass is next.** |

Gate 6, as it happened:
- The user's notes on the silent rough cut are fixed ("59,2%", "CÓ CẢ HAI.", two typed-on texts, the ch03 count).
- **No voice-over:** the on-screen text carries the story, and 13 beats got text added (`docs/onscreen.json`,
  `added`).
- **The film is exactly 3:00.** The user approved the cuts on 2026-09-29.

The silent rough cut renders with `node render.mjs --out out/roughcut.mp4 --workers 10` (960×540, 30 fps, 5,400
frames = 180.0 s, about 2.5 min). Scores are in the summary table at the top of `docs/review_log.md`.

## Decisions the user made in chat (in force)

1. **Look:** direction C, after Saul Bass.
2. **No voice-over.**
   - The voice pipeline is kept but unused: `tools/vo.py`, `docs/vo_*`; `tools/timeline.py --voice` goes back to it.
   - The README needs no voice credit.
3. **Exactly 3:00, timed by reading on a 108 BPM grid.** Rules below. Cuts approved.
4. **The ch01 sound sketch is approved** (details below).
5. **ch01's look is approved.** It is the committed `scenes/ch01.js`, which has the no-voice caption strips since
   74c84c3. Changes to shared code must keep its frames pixel-identical. The old reference frames in
   `out/diff/before/` predate the captions; don't use them.
6. **The screenshot set is final.** Crops are in `docs/crops.json`; the demo manager shows as "Kawaibu".
7. **Git:** one commit per logical unit (per chapter when chapters change), never push.

## 3:00 timing and trim rules

- **Source of truth.** `docs/timeline.json` is built by `uv run python tools/timeline.py` (default `--bars 81`) from
  the on-screen text in `docs/onscreen.json`. `docs/timeline.md` is the readable table, with a "Trimmed to fit"
  section. Never edit either by hand.
- **Grid.**
  - 108 BPM, 4/4, from film time 0. **81 bars = exactly 180.0 s.**
  - Every chapter is a whole number of bars, so chapter changes land on downbeats.
  - Shots (story beats) start and end on 8th notes.
  - `ctx.syl(id, k)` snaps to 16ths; `ctx.snap(t)` snaps any other time.
  - Times are stored at full precision on purpose: rounding moved fast edges by fractions of a pixel.
- **Reading pace is fixed** at factor 0.82, the relaxed pace the user approved at 3:09. At that pace the natural
  length is 85 bars.
- **Trim rule.** To fit 81 bars, whole bars come out of **holds only**: shots held longer than their text needs,
  because their animation was given more time. The chapter that can give up a bar most gently goes first.
- **Never trimmed:**
  - the 17 shots whose length is set by their text, which include every one of the busiest shots
  - the transition breaths (2 beats before each chapter, where the wipes, covers and flips play)
  - the 1-beat breaths between shots
  - the last chapter and its end hold
- **What was cut** (4 bars = 8.9 s):

  | Chapter | From | Length now |
  |---|---|---|
  | ch05 | L15 −0.56 s, L16 −0.56 s, L17 −0.28 s, L18 −0.83 s | 17.8 s |
  | ch02 | L04 −0.83 s, L06 −0.56 s, L08 −0.83 s | 20.0 s |
  | ch09 | L30 −1.11 s, L31 −1.11 s | 17.8 s |
  | ch03 | L10 −1.11 s, L11 −1.11 s | 13.3 s |

  ch01, ch04, ch06, ch07, ch08, ch10 and ch11 only start earlier; their frames are pixel-identical to the 3:09 cut.
- **Chapters at 3:00:**

  | Ch | Start | End | Bars |
  |---|---|---|---|
  | ch01 | 0.00 | 11.11 | 5 |
  | ch02 | 11.11 | 31.11 | 9 |
  | ch03 | 31.11 | 44.44 | 6 |
  | ch04 | 44.44 | 64.44 | 9 |
  | ch05 | 64.44 | 82.22 | 8 |
  | ch06 | 82.22 | 106.67 | 11 |
  | ch07 | 106.67 | 128.89 | 10 |
  | ch08 | 128.89 | 140.00 | 5 |
  | ch09 | 140.00 | 157.78 | 8 |
  | ch10 | 157.78 | 171.11 | 6 |
  | ch11 | 171.11 | 180.00 | 4 |

- **Reading check.** `node tools/readcheck.mjs chNN` measures, frame by frame, how long each text is actually
  readable (visible, full size, in frame, not covered by paper) against the reading model. Every text in all 11
  chapters passes.
- **If on-screen text ever changes:** rebuild the timeline; the trim may pick different chapters. Then re-run
  `readcheck` and the review loop for every chapter whose timing changed. **Don't change the timeline during the
  sound pass:** the music and every cue are built on it.

## The ch05 soft spot (accepted with the cuts)

- **What:** the app's confirmation screen ("Phản ánh của bạn đã được ghi nhận.") is fully open for about **0.64 s**,
  film time ≈ 73.24-73.89 s. At 3:09 it had about 0.8 s. It sits at the end of shot 5.4, before the hard cut to 5.5
  on L17's start.
- **Why:** L16 was trimmed from 4.17 to 3.61 s, and the whole app flow (form, picker, filled report, close onto
  "Gửi phản ánh", confirmation) follows L16's subdivisions.
- **Why it's accepted:** it is a glance at a real screenshot, with a 0.6 s glance budget, not story text. The story
  line "CƯ DÂN GỬI / PHẢN ÁNH" is up for about 3 s. `readcheck` measures DOM text only, so it doesn't see screenshot
  text.
- **If it ever needs more time,** in `scenes/ch05.js`:
  - `T.conf = T.press + 2 * g` (line 188) → `T.press + g` gives it about 0.78 s.
  - Or move `T.press` from `s16(12)` to `s16(11)`, which takes the time from the filled-report screen.
  - Then re-review ch05. Don't do this without the user's OK.
- **For the sound pass:** the shotlist gives 5.4 a "snap, small bell". The bell belongs on `T.conf`.

## The approved ch01 sound sketch

- **Approved file:** `out/ch01_sound.mp4`, 1920×1080, 60 fps, 11.1 s, AAC 320 kbps, 48 kHz stereo. Its WAV is
  `out/sound/ch01.wav` and its cues `out/sound/cues.json`. `out/` is not in git.
- **Measured on the muxed file** (`ffmpeg ... -af ebur128=peak=true`): **-14.0 LUFS integrated, true peak -1.2 dBTP.**
- **Code:** everything is synthesized in `tools/sound.py`, at commit 9934853 and unchanged since. No samples, no stock
  audio, no Eleven Music.
- **Where the cues come from:**
  - `tools/cues.mjs` loads the film and saves every chapter's `cues()` with the beat grid.
  - A chapter exports `cues(state, ctx)`: a list of `{ t, name, ...}` in chapter-local seconds, with `land` for a
    move that lands.
  - `lib/engine.js` collects them into `window.__cues` (film seconds).
  - ch01's cues are in `scenes/ch01.js`: `complaint`, `bubble` ×9, `caption` ×3, `scissor`, `split`, `slide` (with
    `land`), `snip`, `drop`, `tear`, `stab`.
- **Settings** (top of `tools/sound.py`):
  - `SR = 48000`, `TARGET_LUFS = -14.0`.
  - `TP_CEIL = -1.2` dBTP: 0.2 dB under the rule, as margin for the AAC encode.
  - `SWING = 0.6` (swung 8ths).
  - Stem levels `STEMS = {bass: -11, drums: -2, piano: 0, sfx: 0}` dB: the music is a bed under the effects.
  - `CHARTS["ch01"]` = Dm, Bb, Gm, A7, Dm: one bar each, walking-bass quarter notes.
- **Instruments:**
  - `pluck_bass`: Karplus-Strong string, finger-dark, with an additive falling-note mode.
  - `piano`: additive, inharmonic partials, two strings per note.
  - brushes: `brush_slap`, `brush_swish`.
  - `crash`: a brush on the ride.
- **Effects:** `tick`, `pop`, `stamp`, `snip`, `cut_rasp`, `swoosh`, `tear`.
- **Mix and master:**
  - `compose()` places the music on the grid and the effects on the cues.
  - `Bus` holds the stems.
  - `master()` normalizes with a BS.1770-4 meter and a 4× oversampled look-ahead true-peak limiter.
- **What ch01 does:**
  - Walking bass from bar 1; brushes from bar 2 until the `drop` cue (swish, slaps on 2 and 4, a swung tap).
  - A pop for the complaint; ticks for the bubbles (the last one muffled); a stamp for each caption.
  - A scissor rasp; two swooshes and a low piano cluster at the split.
  - A slide with a soft landing thump; two snips; a falling bass note that rings under the tear.
  - The stab on "TIỀN QUỸ ĐI ĐÂU?": piano D-F-A-Bb-D, bass D2 and D1, and the crash.
- **Rebuild (deterministic):**

  ```sh
  node tools/cues.mjs --chapters ch01
  uv run --with numpy --with scipy python tools/sound.py --chapters ch01 --out out/sound/ch01.wav
  node render.mjs --chapters ch01 --final --workers 8 --out out/sound/ch01_1080p60_silent.mp4
  ffmpeg -y -i out/sound/ch01_1080p60_silent.mp4 -i out/sound/ch01.wav -map 0:v -map 1:a -c:v copy \
    -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/ch01_sound.mp4
  ```

  Two runs at HEAD give identical bytes. HEAD differs from the approved file only in timing: since the timeline went
  to full precision, the `slide` and `stab` cues arrive 1.6-2.1 samples (0.04 ms) earlier. That is inaudible; the
  approved mp4 stays the reference.

## The sound pass: exactly what to do

Goal: music and effects for all 180 s, built on the approved sketch's code, settings and balance. Deliver a
review file, then **stop and wait for the user's OK** before the final render and deliverables.

1. **One cue vocabulary.**
   - Define every cue name once:
     - a "Sound cues" table in `docs/ANIMATION_GUIDE.md` (name, meaning, which effect plays)
     - the matching dispatch in `tools/sound.py`
   - Start from the shotlist's effects palette: bubble tick, paper slide, snap, snip, tear, stamp, flip, odometer
     rattle, pin, punch, flutter, thud, alarm stab, warm chord.
   - Keep ch01's names as they are.
   - ch06 and ch07 already export cues, under their own names, which `sound.py` doesn't map yet:
     - ch06: `slide`, `slam`, `rise`, `bar`, `wipe`, `tick`, `tear`, `tag`, `stab`, `split`, `scissor`, `pan`,
       `friction`, `count`, `band`
     - ch07: `rise`, `slide`, `slam`, `tear`, `doors`, `stamp`, `stab`, `snap`, `sly`, `scroll`, `push`, `cut`,
       `count`, `climb`, `bubble`, `bar`
   - Map these, or rename them in the scenes.
   - *Done when* every name any chapter emits is in the table and handled by `sound.py`.
2. **`cues()` for every chapter.**
   - Add `cues(state, ctx)` to ch02, ch03, ch04, ch05, ch08, ch09, ch10 and ch11. Build them from each chapter's
     existing `T` beat table, following the SFX column of that chapter's shots in `docs/shotlist.md`.
   - The shotlist's times are voice-era estimates; the times come from `T`.
   - Moves that land carry `land`. Counts carry their start and lock time (the odometer rattle).
   - `cues()` must be pure. It must not touch the DOM or change any frame. Prove it for each chapter: render sampled
     chapter-local frames before and after with `tools/frames.mjs`; `magick compare -metric AE` must be 0.
   - Commit per chapter.
   - *Done when* `node tools/cues.mjs` lists cues for all 11 chapters and every chapter's frames are unchanged.
3. **Music for the whole film** (`CHARTS` and `compose()` in `tools/sound.py`), following the shotlist's Sound section:
   - One continuous 4/4 grid from t = 0 at 108 BPM, swung 8ths. Chapter changes are bar lines, so chart changes
     go on chapter starts.
   - **ch01-ch04:** minor and sparse. ch01 exactly as approved; ch02-ch04 continue in D minor.
   - **ch05-ch07:** open to major with a vibraphone (a new synthesized instrument). ch07's end (7.7, the pushed-in
     mismatch badge and "KHÔNG AI XÓA / ĐƯỢC DẤU VẾT.") thins to a low sustained note before ch08.
   - **ch08-ch09:** driving.
   - **ch10-ch11:** resolving. The final chord rings out and is cut cleanly at 180.0 s, with a ~30 ms fade like the
     sketch's.
   - **Stabs land on the SLAMs:** ch01's question (done), the "1" (ch06) and "2" (ch07) numerals, "LÀM TỔ / CÓ CẢ
     HAI." (ch08), "20–25 TÒA" (ch09) and "ĐỘI KAWAIBU" (ch10).
   - **Alarm stabs** (low brass + snare) go on "VƯỢT KHUNG" (ch06) and the "SỬA LÉN?" / "BÁO LỖI NGAY." mismatch
     cut (ch07).
   - **Brushes need a general rule.** ch01's brushes run from bar 2 to its `drop` cue, which is ch01-specific.
   - **Balance:**
     - Keep the sketch's stem balance: the music is a bed and the effects lead.
     - There is no voice, so no sidechain.
     - Each chapter's effects are its own `cues()` mapped through the vocabulary. The volume of events that repeat
       fast (129 flip ticks, 13 snips, window lights) is kept down so they read as texture.
4. **Keep ch01 as approved.**
   - In the whole-film mix, ch01's section must keep the sketch's instruments, timing and relative levels.
   - Allowed differences: the whole-film master gain, and sound ringing on past 11.11 s into ch02 (the stab's tail).
   - Check it: compare ch01's slice of the film mix with the ch01 rebuild, level-matched, and say what differs.
5. **Master the whole film.**
   - -14 LUFS integrated, true peak ≤ -1 dBTP (keep `TP_CEIL = -1.2` for the AAC margin).
   - Measure with ffmpeg `ebur128=peak=true` **on the muxed file**, not only on the WAV, and report both numbers.
   - Seeded and deterministic: two runs must give identical bytes.
6. **Muxing in `render.mjs`.**
   - Add `--audio <wav>`: AAC 320 kbps, 48 kHz, `-shortest`, `+faststart`.
   - For `--chapters` or `--from/--to` renders, trim the WAV to the rendered range (`atrim`), so any draft carries
     its sound.
   - Rendering without `--audio` must be unchanged.
7. **The review file.**
   - Outputs:
     - `out/sound/film.wav`, 48 kHz stereo
     - `out/sound/cues.json`
     - **`out/roughcut_sound.mp4`**: the 960×540 30 fps draft with the mix
     - an analysis image: level curve and spectrogram, with chapter lines and cue marks
   - Report to the user:
     - the loudness numbers
     - the per-chapter music (key, mood, instruments)
     - where the stabs and alarms land
     - anything that differs from the shotlist's Sound section
   - Be honest that the mix was checked by measurement, not by ear.
8. **Stop.** Wait for the user's OK on the whole-film sound. Commit each logical unit (vocabulary, each chapter's
   `cues()`, music, mastering, the `render.mjs` change) and never push.

**After the sound pass** (the rest of gate 7, only with the user's OK):
- `node render.mjs --final --audio out/sound/film.wav --out out/final.mp4` (1920×1080, 60 fps, CRF 16). That is
  10,800 frames; at about 7 fps with 8-10 workers, plan on about 25-30 min.
- `out/poster.png`: candidate is ch11's final frame at 1920×1080.
- `out/contact.png`: a whole-film contact sheet.
- `README.md` credits: music and sound synthesized in code; fonts Bricolage Grotesque and IBM Plex Mono (OFL); the
  team (Đội Kawaibu). No voice credit.
- **Open question for the user:** the brief asks for `out/final.vi.srt`, but the film has no voice. Drop it, or ship
  a text track of the on-screen story text from `docs/onscreen.json`?

## Tools

| Tool | What it does |
|---|---|
| `render.mjs` | Parallel render. Options: `--chapters`, `--from/--to`, `--load`, `--tail`, `--final`, `--workers`. |
| `tools/review.mjs chNN` | The review loop: draft, 2 fps contact sheet, 360 px phone sheet, `--strip`, text-size check. |
| `tools/frames.mjs chNN dir t…` | Full-resolution stills at chapter-local times (for pixel diffs). |
| `tools/boundary.mjs chNN` | ±2 s around a chapter's start, both chapters loaded. |
| `tools/readcheck.mjs chNN` | Each text's real readable time against the reading model. |
| `tools/textcheck.mjs chNN` | The 28 px floor. |
| `tools/lint_scene.mjs` | Checks a scene against the guide's rules. |
| `tools/stillness.py video` | Rhythm: holds, and gaps between visual events (use `--event 8` to count small events). |
| `tools/timeline.py` | Builds the timeline (see above). `--voice` is only for a future voice. |
| `tools/cues.mjs` | Collects the scenes' cues. |
| `tools/sound.py` | Synthesizes the music and effects, mixes and masters. |
| `lib/engine.js` | `?only=&soft=` loads a subset; `?timeline=/path.json` uses another timeline; collects `window.__cues`. |

## Open issues (not part of the sound pass)

1. **Weak supporting labels on the phone sheet:** ch04's role descriptors and ch09's phase labels (36 px), ch03's
   B2B2C tags, ch11's credits. All pass the 28 px floor, and the user has accepted them so far.
2. **Builders' proposals for shared code** (optional, none needed now):
   - a no-overshoot count preset (several chapters use `{ f: 1.3, z: 0.9 }`)
   - `kit.logo()` (ch05 and ch11 each carry a copy)
   - a plate scroll helper (ch07)
   - a "first time a spring reaches its target" helper
3. **Render cost:** 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest).
