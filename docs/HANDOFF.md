# Handoff: after the whole-film sound pass (2026-09-29)

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
| 7 Polish, sound, final render, deliverables | **the whole-film sound is done and reviewed (every chapter 8+); it waits for the user's ear.** Then the final render and deliverables. |

Review files for the user:
- `out/preview_1080p.mp4`: 1920×1080, 30 fps, CRF 23, 180.0 s, with the mix (AAC 320 kbps, 48 kHz).
- `out/roughcut_sound.mp4`: the 960×540 30 fps draft with the mix; per-chapter clips with sound in
  `out/review/chNN.mp4`.
- `out/sound/film.wav` (48 kHz stereo float), `out/sound/cues.json`, `out/sound/score.json` (every note and effect).
- `out/sound/analysis.png`: level, spectrogram with chapter lines and cue marks, and the score as a piano roll with
  each bar's chord; per chapter in `out/review/sound_chNN.png`; sync sheets in `out/review/sync_chNN.png`.
- The rounds and all measurements are in `docs/review_log.md`, "Sound pass".

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

Everything is synthesized in `tools/sound.py` (no samples, no stock audio, no Eleven Music).
- **Cues.** Every chapter exports `cues(state, ctx)`: its event times, from its own `T` table, in one vocabulary of
  42 names (`docs/ANIMATION_GUIDE.md`, section 12: name, what happens on screen, which effect plays). `sound.py`
  stops on any other name. `node tools/cues.mjs` collects them (418 cues) into `out/sound/cues.json`.
- **Music** on the timeline's grid, chord changes on chapter starts, swung 8ths (`CHORDS`, `FEEL`, `KEY`, `Film`):
  - ch01: the approved sketch (`CHARTS["ch01"]`, its seeds, gains and order untouched).
  - ch02-ch04: D minor, sparse (walking bass and brushes); ch04 adds an A-E vibraphone chime as each pain turns.
  - ch05-ch07: opens to D major on a vibraphone chord as ch04's doors part; vibraphone comping; ch07 lifts to G, its
    loop gets a warm chord, and at its push the band stops for one bowed A.
  - ch08-ch09: driving (ride, feathered kick, comping piano, skip notes); ch10-ch11: resolving (two-feel), the final
    D6/9 on the logo's landing, ringing to the 30 ms cut at 180.0 s.
  - Stabs on the `stab` cues (the question, "1", "2", "CÓ CẢ HAI.", "20–25 TÒA", "ĐỘI KAWAIBU"; soft on SAM), alarms
    (two falling tritones, low brass and snare) on `alarm` ("VƯỢT KHUNG", the mismatch cut).
  - The walking bass is generated from the charts, seeded per chord; a stab's, alarm's or the bow's note takes the
    bass. Brushes run through every chapter in its feel and stop only for ch01's drop, ch07's push and the final
    chord.
- **Balance.** The sketch's stems (`STEMS`) plus vibes and brass; each effect's level set so it stands over the bed
  about as far as ch01's do, and fast runs stay down as texture.
- **Master.** The sketch's normalize-and-limit loop, then an exact true-peak stage, then an AAC check: the mix is
  encoded as `render.mjs` muxes it, decoded, and lowered locally wherever the AAC would pass -1.2 dBTP (ch02's snips
  made the encoder overshoot by 1.7 dB). `--no-aac-check` skips it.
- **Measured:** WAV -14.0 LUFS, true peak -1.2 dBFS; its AAC -14.0 LUFS (ebur128), loudnorm -14.10 LUFS and
  -1.17 dBTP. Two runs give identical bytes.

Rebuild and check (deterministic):

```sh
node tools/cues.mjs                                                     # out/sound/cues.json
uv run --with numpy --with scipy python tools/sound.py --score out/sound/score.json   # out/sound/film.wav
uv run --with numpy --with scipy --with matplotlib python tools/soundcheck.py         # analysis + report
node tools/synccheck.mjs                                                # picture-side sync + sheets
node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10
```

ch01 regression: `node tools/cues.mjs --chapters ch01 --out out/tmp/cues_ch01.json` then
`tools/sound.py --chapters ch01 --cues out/tmp/cues_ch01.json --no-aac-check` rebuilds the handoff's ch01 file byte
for byte (sha256 55c09f38…). The approved `out/ch01_sound.mp4` stays the reference.

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
| `lib/engine.js` | `?only=&soft=` loads a subset; `?timeline=/path.json` uses another timeline; collects `window.__cues`. |

## Open issues

1. **Not heard.** The sound has never been listened to by the one who built it; the user's ear is the real test.
2. Weak supporting labels on the phone sheet (ch04's role descriptors, ch09's phase labels, ch03's B2B2C tags, ch11's
   credits): all pass the 28 px floor, and the user has accepted them so far.
3. `frames.mjs` stills can differ by a few anti-aliased edge pixels between browser sessions or seek orders; compare
   before/after renders made with the same time list, one right after the other.
4. Render cost: 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest).
