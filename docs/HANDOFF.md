# Handoff: after the whole-film sound pass, the Mixkit music bed and the team's faces (2026-09-29)

For the next session. Read `CLAUDE.md`, `docs/brief.md` and `docs/ANIMATION_GUIDE.md` first; their rules hold unless
something below overrides them. Work is on branch **`film`**. There is no remote. **Never push.**

## Where things stand

| Gate | Status |
|---|---|
| 1 Look + shotlist | approved: direction C, after Saul Bass (`docs/style_guide.md`, `docs/shotlist.md`) |
| 2 Voice script | approved, then superseded: there is no voice-over. The 35 lines L01-L35 live on as story beats. |
| 3 Voice | dropped. No ElevenLabs calls, ever. |
| 4 Engine + ch01 | approved |
| 5 Guide + ch02-ch11 | done: every chapter built, reviewed (8+ on all criteria) and committed separately |
| 6 Rough cut review | done without a voice |
| 7 Polish, sound, final render, deliverables | **the whole-film sound is done and reviewed (every chapter 8+): the Mixkit bed "Upbeat Jazz" under the synthesized effects (2026-09-29). It waits for the user's ear.** Then the final render and deliverables. |

Review files for the user:
- `out/preview_1080p.mp4`: 1920×1080, 30 fps, CRF 23, 180.0 s, with the mix (AAC 320 kbps, 48 kHz).
- `out/roughcut_sound.mp4`: the 960×540 30 fps draft with the mix; per-chapter clips with sound in
  `out/review/chNN.mp4`.
- `out/sound/film.wav` (48 kHz stereo float), `out/sound/cues.json`, `out/sound/score.json` (every note and effect).
- `out/sound/analysis.png`: level, spectrogram with chapter lines and cue marks, and the score as a piano roll with
  each bar's chord; per chapter in `out/review/sound_chNN.png`; sync sheets in `out/review/sync_chNN.png`.
- `out/sound/bed.wav` and `bed.json` (the arranged Mixkit bed, its plan, joins and pitch classes per beat);
  `out/review/bed_joins.png` (a spectrogram around each join).
- The rounds and all measurements are in `docs/review_log.md`, "Sound pass" and "Music bed".
- ch10 with the team's faces: `out/review/ch10.mp4` (960×540) and `out/review/ch10_1080p.mp4` (1920×1080, CRF 18),
  both with the current mix; sheets `out/review/ch10_contact.png`, `ch10_phone.png`; the two treatments the user chose
  between, `out/team/`. Rounds in `docs/review/ch10.md` (9-11) and `docs/review_log.md`, "ch10: the team's faces".

**Be honest with the user: the mix was checked by measurement and by reading the score, never by ear.**

## Decisions the user made in chat (in force)

1. **Look:** direction C, after Saul Bass.
2. **No voice-over.** The voice pipeline is kept but unused (`tools/vo.py`, `docs/vo_*`; `tools/timeline.py --voice`
   goes back to it). The README needs no voice credit.
3. **Exactly 3:00, timed by reading on a 108 BPM grid.** Rules below. Cuts approved.
4. **The ch01 sound sketch is approved**, and the whole-film sound keeps it note for note (below).
5. **ch01's look is approved.** Changes to shared code must keep its frames pixel-identical.
6. **The screenshot set is final.** Crops are in `docs/crops.json`; the demo manager shows as "Kawaibu".
7. **Git:** one commit per logical unit (per chapter when chapters change), never push.
8. **Music bed (2026-09-29):** "Upbeat Jazz" by Francisco Alvear (Mixkit) replaces the synthesized score, stretched to
   108 BPM and arranged to 3:00 by `tools/bed.py` (`CLAUDE.md`, Sound). The effects stay synthesized on the cues.
9. **Team faces (2026-09-29):** each ch10 band carries its member's real photo (used with consent), from the deck's
   ĐỘI NGŨ page (`assets/team/`, `tools/team.py extract`), cut out as a full-colour paper bust (`tools/team.py cut`,
   `docs/team.json`, `ctx.portrait(k)`). The user picked full colour over a duotone and accepted its Brand 7.
   `CLAUDE.md`: team photos only from `assets/team/`, never redrawn, distorted or AI-altered beyond cutout and colour
   treatment; faces at least 300 px tall, never over a name, a role or another face (`tools/facecheck.mjs`).

## 3:00 timing (unchanged by the sound pass)

- `docs/timeline.json` is built by `uv run python tools/timeline.py` (81 bars) from `docs/onscreen.json`; never edit
  it by hand. 108 BPM, 4/4 from t = 0, every chapter a whole number of bars.
- Reading pace fixed at 0.82; only holds were trimmed to fit 3:00 (ch05, ch02, ch09, ch03 lost a bar each).
- `node tools/readcheck.mjs chNN`: every text in all 11 chapters passes.
- **If on-screen text ever changes,** the timeline re-flows: rebuild it, then re-run `readcheck`, the chapter
  review, `node tools/cues.mjs` and `tools/sound.py` (the music and every cue sit on the timeline).
- The accepted ch05 soft spot stands: the confirmation screen is open about 0.64 s (73.24-73.89 s); the small bell
  rings on `T.conf`.

## The sound, as built

**The music bed is "Upbeat Jazz" by Francisco Alvear (Mixkit)** (the user's choice, 2026-09-29, from four auditioned
candidates; `audio/music/SOURCES.md` for the source and license). The effects are synthesized in `tools/sound.py`.
- **Cues.** Every chapter exports `cues(state, ctx)`: its event times, from its own `T` table, in one vocabulary of
  42 names (`docs/ANIMATION_GUIDE.md`, section 12: name, what happens on screen, which effect plays). `sound.py`
  stops on any other name. `node tools/cues.mjs` collects them (418 cues) into `out/sound/cues.json`.
- **The bed** (`tools/bed.py`, `out/sound/bed.wav`):
  - The track (110.005 BPM measured) is stretched by rubberband to exactly 108 BPM.
  - It is arranged on the film's 81 bars, joined only at phrase boundaries, with a 10 ms crossfade just before each
    bar line.
  - The plan, film bars from source bars:

    | Film bars | Source bars | Section | Chapters |
    |---|---|---|---|
    | 1-9 | 1-9 | intro | ch01-ch02 |
    | 10-17 | 2-9 | intro repeat | ch02-ch03 |
    | 18-25 | 2-9 | intro repeat | ch03-ch04 |
    | 26-67 | 6-47 | intro's second group, the lift on ch05's downbeat, then A1 B1 A2 B2 A3 as recorded | ch04-ch09 |
    | 68-78 | 33-43 | B2 and A3's first group again | ch09-ch11 |
    | 79-81 | 48-50 | coda; final chord on the last bar | ch11 |

  - The track's form at 108 BPM: intro 1-9, A1 10-17, B1 18-24, A2 25-32, B2 33-39, A3 40-47, coda 48-49, final
    chord 50.
- **The mix** (`sound.py`, `--music bed`, the default):
  - Levels: the bed at -17.5 dB. The sparse intro is +4 dB until ch05's downbeat, and the bed eases -2.5 dB through
    ch10-ch11.
  - Breaks: the bed dips out from ch01's drop to ch02. From ch07's push to ch08 it thins to a low-passed trace under
    one bowed note on its bass.
  - Notes: stabs, chimes, pitched thumps and ticks, the rising tone, the bell and the loop's warm chord take their
    notes from what the bed sounds on that beat (`bed.json`). ch01's approved hits keep theirs. The ch11 `chord`
    cue is silent: the bed's own final chord ends the film.
- **The synthesized score** is kept as `--music synth` (the walking bass, brushes, vibraphone and stabs of the first
  sound pass). Its ch01 still rebuilds the approved sketch byte for byte.
- **Master.** Normalize and limit, an exact true-peak stage, then an AAC check: the mix is encoded as `render.mjs`
  muxes it, decoded, and lowered locally wherever the AAC would pass -1.2 dBTP. `--no-aac-check` skips it.
- **Measured:** see `docs/review_log.md`, "Music bed". Two runs of `bed.py` and of `sound.py` give identical bytes.

Rebuild and check (deterministic). **While another session has uncommitted scene or engine edits, build and render
from a clean worktree** (`git worktree add --detach ../LamToGoat-build HEAD`, symlink `node_modules`); a broken
chapter in the working tree stops `cues.mjs`, and a scene edited mid-render mixes versions.

```sh
node tools/cues.mjs                                                     # out/sound/cues.json
uv run python tools/bed.py                                              # out/sound/bed.wav + bed.json
uv run --with numpy --with scipy python tools/sound.py --score out/sound/score.json   # out/sound/film.wav
uv run --with numpy --with scipy --with matplotlib python tools/soundcheck.py         # analysis + report
node tools/synccheck.mjs                                                # picture-side sync + sheets
node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10
```

The approved ch01 sketch (`out/ch01_sound.mp4`, the synthesized score) stays on record: `sound.py --music synth
--chapters ch01 --cues <ch01 cues> --no-aac-check` rebuilds it byte for byte (sha256 55c09f38…).

## Next, only with the user's OK on the sound

- Their notes on the sound first; each fix goes through `soundcheck.py` / `synccheck.mjs` and a review-log round.
- **Final render:** `node render.mjs --final --audio out/sound/film.wav --out out/final.mp4` (1920×1080, 60 fps,
  CRF 16, preset slow; 10,800 frames, about 25-30 min with 8-10 workers). Measure the muxed file again
  (`ffmpeg -i out/final.mp4 -af ebur128=peak=true -f null -` and `loudnorm=print_format=json`): the AAC encode is the
  same as the preview's, so it should read -14.0 LUFS and about -1.2 dBTP.
- `out/poster.png`: candidate is ch11's final frame at 1920×1080. `out/contact.png`: a whole-film contact sheet.
- `README.md` credits: music and sound synthesized in code; fonts Bricolage Grotesque and IBM Plex Mono (OFL); the
  team (Đội Kawaibu). No voice credit.
- **Open question for the user:** the brief asks for `out/final.vi.srt`, but the film has no voice. Drop it, or ship
  a text track of the on-screen story text from `docs/onscreen.json`?

## Tools

| Tool | What it does |
|---|---|
| `render.mjs` | Parallel render. `--chapters`, `--from/--to`, `--load`, `--tail`, `--final`, `--workers`, `--audio wav` (muxes the mix, trimmed to the rendered range). |
| `tools/review.mjs chNN` | The review loop: draft, 2 fps contact sheet, 360 px phone sheet, `--strip`, text-size check. |
| `tools/frames.mjs chNN dir t…` | Full-resolution stills at chapter-local times (for pixel diffs; render before/after with the same time list). |
| `tools/boundary.mjs chNN` | ±2 s around a chapter's start, both chapters loaded. |
| `tools/readcheck.mjs chNN` | Each text's real readable time against the reading model. |
| `tools/textcheck.mjs chNN` | The 28 px floor. |
| `tools/lint_scene.mjs` | Checks a scene against the guide's rules. |
| `tools/stillness.py video` | Rhythm: holds, and gaps between visual events. |
| `tools/timeline.py` | Builds the timeline. `--voice` is only for a future voice. |
| `tools/cues.mjs` | Collects the scenes' cues. |
| `tools/sound.py` | Scores the film, places the effects, mixes and masters (`--chapters`, `--stems`, `--stem-dir`, `--score`, `--no-aac-check`). |
| `tools/soundcheck.py` | Analysis image; loudness per chapter, grid, harmony, and an onset in the mix for every hit cue. |
| `tools/synccheck.mjs` | Every appearance cue starts on its frame; sync sheets of the stabs, alarms, slams, stamps and cuts. |
| `tools/team.py` | `extract`: the five team photos from the deck into `assets/team/`, pixel for pixel. `cut`: the busts ch10 shows (`assets/team/cut/`, `docs/team.json`); `--treat duotone` for the other option. Both deterministic. |
| `tools/facecheck.mjs chNN` | Every frame: no text or face under a face; each face's height in frame at rest (the 300 px floor). |
| `lib/engine.js` | `?only=&soft=` loads a subset; `?timeline=/path.json` uses another timeline; collects `window.__cues`; `ctx.portrait(k)` serves `docs/team.json`. |

## Open issues

1. **Not heard.** The sound has never been listened to by the one who built it; the user's ear is the real test,
   above all for the bed's five joins.
2. **The bed's license.** Mixkit's full legal text was not read (it is rendered by script). Its summary allows
   commercial use in online video with no attribution, and forbids redistributing the track itself. So the MP3 must
   not be published with this repository. Read the license before the final release.
3. Weak supporting labels on the phone sheet (ch04's role descriptors, ch09's phase labels, ch03's B2B2C tags, ch11's
   credits): all pass the 28 px floor, and the user has accepted them so far.
4. `frames.mjs` stills can differ by a few anti-aliased edge pixels between browser sessions or seek orders; compare
   before/after renders made with the same time list, one right after the other.
5. Render cost: 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest).
6. ch10's faces: photos 1, 2 and 4 are small in the deck (240 px, 240 px, 324 px wide) and are enlarged 1.48-1.75×,
   so they look soft at 100 %; sharper originals from the team would fix that (re-take `tools/team.py`'s per-photo
   measurements). The layout is at its limits: before the lock, at the push, the right column is 18-28 px from the
   frame's edge, and Hưng's crown about 20 px from the L34 line (`build()` throws if either ever stops fitting).
