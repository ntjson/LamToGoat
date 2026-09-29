# Handoff: the music bed as built, for the sound-effects remake (2026-09-29)

For the next session. Read `CLAUDE.md`, `docs/brief.md` and `docs/ANIMATION_GUIDE.md` first; their rules hold unless
something below overrides them. Work is on branch **`film`**. There is no remote. **Never push.**

**The next task (the user, 2026-09-29): remake all the sound effects to match the music bed.** The bed, "Upbeat Jazz"
by Francisco Alvear (Mixkit), is settled. Below: how it was stretched and edited, what it measures, where the mix and
the effects live and how to rebuild them, and the ch10 faces now in the film.

## Where things stand

| Gate | Status |
|---|---|
| 1 Look + shotlist | approved: direction C, after Saul Bass (`docs/style_guide.md`, `docs/shotlist.md`) |
| 2 Voice script | approved, then superseded: there is no voice-over. The 35 lines L01-L35 live on as story beats. |
| 3 Voice | dropped. No ElevenLabs calls, ever. |
| 4 Engine + ch01 | approved |
| 5 Guide + ch02-ch11 | done: every chapter built, reviewed (8+ on all criteria) and committed separately. ch10 now carries the team's faces (`47ba699`, below). |
| 6 Rough cut review | done without a voice |
| 7 Polish, sound, final render, deliverables | **The music is settled: the Mixkit bed, stretched and arranged to 3:00. Next: the effects over it, which the user wants remade to match it.** Then the final render and deliverables. |

Review files for the user:
- `out/preview_1080p.mp4`: 1920×1080, 30 fps, CRF 23, 180.0 s, with the current mix (AAC 320 kbps, 48 kHz).
  **It predates the ch10 faces:** it was rendered from a clean worktree at `a350881`, so its ch10 has the bands
  without faces. The cues didn't change, so the mix still fits the picture. Re-render it after the effects remake.
- `out/roughcut_sound.mp4`: the 960×540 30 fps draft with the current mix, also without the faces. Per-chapter clips
  with the current mix are in `out/review/chNN.mp4`; ch10's (`ch10.mp4`, `ch10_1080p.mp4`) have the faces.
- `out/sound/film.wav` (48 kHz stereo float), `out/sound/cues.json`, `out/sound/score.json` (every note and effect).
- `out/sound/analysis.png`: level, spectrogram with chapter lines and cue marks, and the score as a piano roll.
  Per chapter in `out/review/sound_chNN.png`; sync sheets in `out/review/sync_chNN.png`.
- `out/sound/bed.wav` and `bed.json`: the arranged bed, its plan, its joins, and the pitch classes on every beat.
  `out/review/bed_joins.png`: a spectrogram around each join.
- The rounds and all measurements are in `docs/review_log.md`: "Sound pass", "Music bed", "ch10: the team's faces".
  ch10's rounds 9-11 are in `docs/review/ch10.md`; the two face treatments the user chose between are in `out/team/`.

**Be honest with the user: the mix was checked by measurement and by reading the score, never by ear.**

## Decisions the user made in chat (in force)

1. **Look:** direction C, after Saul Bass.
2. **No voice-over.** The voice pipeline is kept but unused (`tools/vo.py`, `docs/vo_*`; `tools/timeline.py --voice`
   goes back to it). The README needs no voice credit.
3. **Exactly 3:00, timed by reading on a 108 BPM grid.** Rules below. Cuts approved.
4. **The ch01 sound sketch is approved.** Its hits still play note for note over the bed (see Next about the remake).
5. **ch01's look is approved.** Changes to shared code must keep its frames pixel-identical.
6. **The screenshot set is final.** Crops are in `docs/crops.json`; the demo manager shows as "Kawaibu".
7. **Git:** one commit per logical unit (per chapter when chapters change), never push.
8. **Music bed (2026-09-29):** "Upbeat Jazz" by Francisco Alvear (Mixkit) replaces the synthesized score, stretched to
   108 BPM and arranged to 3:00 by `tools/bed.py` (`CLAUDE.md`, Sound). The effects stay synthesized on the cues. The
   user wants them all remade to match the bed (the next task).
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
  review, `node tools/cues.mjs` and `tools/sound.py` (the music and every cue sit on the timeline). If a chapter
  moves, re-fit `tools/bed.py`'s `PLAN`: the track's lift must still land on ch05's downbeat.
- The accepted ch05 soft spot stands: the confirmation screen is open about 0.64 s (73.24-73.89 s); the small bell
  rings on `T.conf`.

## The music bed

**The file:** `audio/music/upbeat-jazz_francisco-alvear_mixkit.mp3`.
- "Upbeat Jazz" by Francisco Alvear, from Mixkit: 1:50, 44.1 kHz stereo MP3, sha256 `47427e8614cb7472…`.
- Source, license and the no-redistribution note: `audio/music/SOURCES.md`.
- All four auditioned tracks (this one included) are in `audio/music/candidates/`, with their notes; untracked on
  purpose.

**The stretch** (`tools/bed.py`, `stretched()`):
- ffmpeg resamples the track to 48 kHz, then rubberband sets `tempo=108/110.005` (×0.981774, `channels=together`).
  Pitch is kept.
- 110.005 BPM (±0.002, 6 ms of beat jitter) is a line fitted through the recording's tracked beats.
- At 108 BPM one bar of the track lasts one film bar (2.2222 s). Its first downbeat is at 0.083 s, so source bar n
  starts at 0.083 + (n − 1) × 2.2222 s.

**Measured after stretching** (on `out/sound/bed.wav`, 2026-09-29):
- **Tempo: 108 BPM.**
  - The stretched track measures 107.997 ± 0.0015 BPM (5 ms of jitter).
  - In the arranged bed, the longest uncut run (film bars 26-67) measures 107.997 ± 0.002 BPM. That is under 3 ms
    of drift from 108 across the run. Its beats sit +3.7 ms (median) from the film's grid, 19.5 ms at most.
  - In the B2-A3 repeat (film bars 68-78) they sit +2.6 ms (median) from the grid.
  - In the intro runs and the coda, beat tracking locks onto the 8ths. Folding their onsets on the grid puts the
    peaks on the beat and on the half beat, within 10 ms. Every run is on the grid.
- **Key: F major** (Krumhansl-Kessler r 0.58), with F minor close behind (0.54): the track mixes major and minor color.
  - The intro reads weakly: F major 0.39, D minor 0.37. The body reads F major 0.55, F minor 0.53.
  - The source MP3 reads F major too (0.60, F minor level with it), as it should: the stretch keeps the pitch.
- **Tuning: about +5 cents sharp (A4 ≈ 441.3 Hz).**
  - librosa's pitch tracking reads +5.5 cents on both the source and the bed.
  - The long-term spectrum's strongest peaks read +5 to +6 cents above 200 Hz. The bass's strongest partials read
    higher (up to +18 cents, energy-weighted).
  - `sound.py` tunes to A4 = 440 (`hz()`), 5 cents under the bed. That is slight, but long notes (the bell, the warm
    chord, ch07's bow) can beat slowly against it.
- **Feel: straight 8ths.** In the body, onsets peak on the beat (3.4× the mean) and on the half beat (2.8×), with
  nothing at a swung 8th. The old synthesized score swung its 8ths (`SWING = 0.6`); anything rhythmic laid over the
  bed should be straight.

**The track's form at 108 BPM** (50 bars):

    intro 1-9 (bar 1 fades in; groups 2-5 and 6-9) | A1 10-17 | B1 18-24 | A2 25-32 | B2 33-39 | A3 40-47 |
    coda 48-49 | final chord 50

- An A has 8 bars, in two 4-bar groups. A B has 7: a 4-bar group, then a 3-bar group.
- The A/B pair repeats every 15 bars.

**The edit: the section map** (`PLAN` in `tools/bed.py`). Every run starts and ends on a phrase boundary, on the
film's bar lines:

| Film bars | Film time | Source bars | What plays | Chapters |
|---|---|---|---|---|
| 1-9 | 0:00.0-0:20.0 | 1-9 | the intro as recorded | ch01, ch02 |
| 10-17 | 0:20.0-0:37.8 | 2-9 | **repeat:** the intro's phrase | ch02, ch03 |
| 18-25 | 0:37.8-0:55.6 | 2-9 | **repeat:** the intro's phrase again | ch03, ch04 |
| 26-67 | 0:55.6-2:28.9 | 6-47 | **repeat:** the intro's second group (6-9); then, as recorded from bar 10, the lift on ch05's downbeat (film bar 30, 1:04.4) and A1 B1 A2 B2 A3 | ch04-ch09 |
| 68-78 | 2:28.9-2:53.3 | 33-43 | **repeat:** B2 and A3's first group | ch09, ch10, ch11 |
| 79-81 | 2:53.3-3:00.0 | 48-50 | the coda; the final chord on the film's last bar (2:57.8), ringing to the cut | ch11 |

Under each chapter:

| Chapter | Film bars (start) | The bed, by source bar |
|---|---|---|
| ch01 | 1-5 (0:00.0) | intro 1 (the fade-in), 2-5 |
| ch02 | 6-14 (0:11.1) | intro 6-9, then 2-5 (the restart at 0:20.0), 6 |
| ch03 | 15-20 (0:31.1) | intro 7-9, then 2-4 (the restart at 0:37.8) |
| ch04 | 21-29 (0:44.4) | intro 5-9, then 6-9 again (from 0:55.6) |
| ch05 | 30-37 (1:04.4) | A1 10-17: the lift on its downbeat |
| ch06 | 38-48 (1:22.2) | B1 18-24, A2 25-28 |
| ch07 | 49-58 (1:46.7) | A2 29-32, B2 33-38 (thinned from the push, below) |
| ch08 | 59-63 (2:08.9) | B2 39, A3 40-43 |
| ch09 | 64-71 (2:20.0) | A3 44-47, then B2 33-36 (from 2:28.9) |
| ch10 | 72-77 (2:37.8) | B2 37-39, A3 40-42 |
| ch11 | 78-81 (2:51.1) | A3 43, the coda 48-49 (from 2:53.3), the final chord 50 |

**The five joins** (`joins` in `bed.json`):
- Each comes after a bar that sounds like the bar the incoming section follows in the recording.
- Each is a 10 ms equal-power crossfade, centred 7 ms before the bar line and ending 2 ms before it. The outgoing bar
  plays to its end, and the incoming downbeat comes whole from its own recording.
- Where the intro restarts, a +3 dB ride (`RIDE`) eases to 0 dB over four bars. Without it the restarts drop 4.2 dB;
  with it, about 1 dB.
- Measured against the recording's own downbeats: spectral flux median 0.234 (max 0.335), high-frequency bursts up
  to +1.2 dB, bar-to-bar level steps within ±3.6 dB. The script is `out/tmp/music/seams.py` (scratch, not in git).

| # | Film bar (time) | Source bars | Why it joins there | Flux | HF burst | Level step |
|---|---|---|---|---|---|---|
| 1 | 10 (0:20.00) | 9 → 2 | bar 2 comes after the intro's pull-back bar 9, as it comes after the fade-in bar 1 | 0.277 | +0.6 dB | -1.3 dB |
| 2 | 18 (0:37.78) | 9 → 2 | as join 1 | 0.277 | +0.6 dB | -1.3 dB |
| 3 | 26 (0:55.56) | 9 → 6 | bar 9 sounds like bar 5, which leads into 6 | 0.181 | -0.7 dB | +6.4 dB: the song's own pull-back-to-entry gesture (its lift is +8.6) |
| 4 | 68 (2:28.89) | 47 → 33 | A3's end (47) is A2's end (32), which leads into 33 | 0.249 | +0.4 dB | +3.9 dB (32 → 33 in the recording: +2.2) |
| 5 | 79 (2:53.33) | 43 → 48 | A3's group end (43) is its end (47), which leads into the coda | 0.208 | +1.5 dB: bar 48's own cymbal | +0.3 dB |

**`bed.json`**, for effects that play notes over the bed:
- the plan and the joins;
- for each of the film's 324 beats: `t`, `source_beat`, and 12-value `chroma` and `bass` chroma, each scaled to its
  strongest value.

**How the mix uses the bed** (`Film.bed_music()` in `tools/sound.py`):
- **Levels:**
  - The bed plays at `BED_GAIN` -17.5 dB.
  - The sparse intro is +4 dB (`BED_INTRO_DB`) until a 20 ms ramp onto ch05's downbeat.
  - It eases down 2.5 dB (`BED_RESOLVE_DB`) over ch10's first 8 beats and stays there.
  - At master gain its body sits near -18 LUFS (ch05-ch09 median). There the slams stand +4 to +6 LU over it, the
    stamps +4 to +7.
- **Dips:**
  - From ch01's `drop` cue to ch02: -32 dB, 0.15 s in, 0.02 s out.
  - From ch07's `push` to ch08: -26 dB, 0.35 s in. Under it: a 320 Hz low-passed trace of the bed at -9 dB, and one
    bowed note (`arco`, stem `bass`, -6 dB) on the bed's bass pitch class, the lowest in MIDI 28-40.
- **ch11's `chord` cue is silent** in bed mode: the bed's own final chord ends the film.
- `master()` normalizes the whole mix to -14 LUFS, so louder effects push the bed down in the master. Watch the bed's
  level in `soundcheck.py`'s per-chapter loudness.

## The sound effects: where the code lives

Everything is in `tools/sound.py` (1,662 lines). Line numbers are as of `47ba699`. The chain runs from the scene's
cue, through a handler and a synth, to the bus and the master.

1. **Cues** (the picture side; fixed for the remake):
   - Each chapter's `cues(state, ctx)` in `scenes/chNN.js` returns its event times from its own `T` table.
     `node tools/cues.mjs` collects them into `out/sound/cues.json` (418 cues).
   - A cue has `t` (film seconds) and a `name` from the 42-name vocabulary in `docs/ANIMATION_GUIDE.md` §12. Optional
     fields: `land` (a move's spring's first arrival: the hit goes there), `pan`, `i` (its place in a run), and the
     variants `soft` and `n`.
   - The remake needs no scene changes. A new cue name would mean editing the guide, `EFFECTS` and the scene, and a
     picture review.
   - Cues per name: cell 129 (ch02's skyline), slide 56 (every chapter), slab 29, slam 20, bubble 16, snap 16, snip
     15, tick 14, rise 11, count 10, pin 9, wipe 8, stab 7, click 7, cut 6, thud 6, stamp 5, flip 5, tear 4, sweep 4,
     climb 4, and 1-3 each for the other 21 names.
   - Per chapter: ch01 20, ch02 184, ch03 19, ch04 28, ch05 34, ch06 27, ch07 43, ch08 21, ch09 22, ch10 10, ch11 10.
2. **Handlers** ("the effects", lines 1264-1605):
   - There is one `fx_<name>(f, q, k, run)` per cue name. `q` is the cue, `k` its place in its chapter's run of that
     name, `run` the whole run.
   - `EFFECTS` maps names to handlers. `effects(f)` runs them name by name (ch01's names first, in the sketch's order),
     chapter by chapter. `main()` stops on any name outside the vocabulary.
   - Helpers:
     - `f.add(sig, at, gain_db, pan=, stem=)` places a sound. The stem is `sfx` by default; the musical hits use
       `piano`, `bass`, `drums`, `vibes` or `brass`.
     - `f.note(...)` logs a pitched event into `score.json`.
     - `f.seed(q, k, part)` gives a deterministic seed. ch01 keeps the sketch's `SEED01` seeds and `PAN01` pans.
   - **Each effect's level is the `gain_db` in its handler's `f.add` calls** (a slam -10, a deep stamp -9, a skyline
     thump -21). Per-stem trims are in `STEMS`.
3. **Synths:**
   - Each one is a function of its parameters and a seed (`rng_for`, crc32-keyed), returning a numpy array at 48 kHz.
   - "effects" (188-284): `tick`, `pop`, `stamp`, `snip`, `cut_rasp`, `swoosh`, `tear`.
   - "more effects" (378-606): `stamp_deep`, `flip_fx`, `pin_fx`, `punch_fx`, `flutter_fx`, `thud_fx`, `click_fx`,
     `bell_fx`, `creak_fx`, `rising_tone`, `friction_fx`, `scratch_fx`, `rattle`, `lock_fx`, `sweep_fx`, `slab_fx`,
     `cell_fx`, `paper_tick`, `snap_fx`.
   - The musical hits use the "instruments" (99-187, 285-377): `pluck_bass`, `piano`, `crash`, `vibes`, `brass`,
     `snare`, `arco` and the rest.
   - DSP helpers (58-98): `band`, `decay`, `resonator`, `glide_sine`.
4. **Notes from the bed** (`CLAUDE.md`: an effect that sounds notes takes them from what the bed plays on that beat):
   - `f.bed_pcs(t)` (line 1031) reads `bed.json`. It blends t's beat 60/40 with the next. It returns the pitch classes
     at 45 % or more of the strongest, strongest first, and the bass's pitch class.
   - `place(pcs, lo, hi)` (line 1247) turns pitch classes into MIDI notes in a range.
   - The handlers that use them (in bed mode, outside ch01), with their MIDI ranges:
     - `fx_stab`: piano over the bed's bass note, the bass in two octaves, and a crash. The soft stab is the piano
       alone.
     - `fx_chime`: two of the bed's notes, 67-79.
     - `fx_climb`: each step on its own beat, rising from 86.
     - `fx_bell`: the bed's strongest note, 84-95.
     - `fx_band`: the rising tone from its lowest note to its highest, 62-73.
     - `fx_slab`: the skyline's and the stairs' thumps, from 50 in ch02 and ch09, 41 elsewhere.
     - `fx_bubble` with `land`: the loop's warm chord, 55-71.
     - The ch07 bow, in `bed_music()`.
   - `fx_alarm`'s brass (two tritones falling a semitone, `ALARM`) keeps fixed notes: it clashes on purpose. The
     other effects are unpitched.
   - `tools/soundcheck.py` checks a note against the bed only if its `what` is in its list: stab, soft stab, chime,
     climb, bell, rising tone, warm chord, low sustained note. Add a new pitched effect's `what` there, or it goes
     unchecked.
5. **Bus and master** ("the mix bus", 607-640; "loudness", 641-754):
   - `Bus` sums the stems.
   - `master()` normalizes to -14 LUFS and limits true peaks to -1.2 dBTP.
   - `aac_safe()` encodes the mix to AAC 320k as `render.mjs` does, decodes it, and lowers it locally wherever the
     decoded AAC would pass -1.2 dBTP.
   - `--stem-dir DIR` writes each stem at its level in the master (`sfx.wav`, `bed.wav`, `piano.wav`, …), so the
     effects can be heard alone or over the bed. `--score FILE` writes every note and effect placed, for
     `soundcheck.py`.
6. **ch01** keeps the approved sketch's hits: the same synths, seeds, pans and notes (decision 4). Its D minor sits in
   the bed's F.
7. **`--music synth`** keeps the whole synthesized score: the walking bass, brushes, vibraphone and stabs of the first
   sound pass. Its ch01 rebuilds the approved sketch byte for byte (sha256 `55c09f38…`), with `sound.py --music synth
   --chapters ch01 --cues <ch01 cues> --no-aac-check`. That check breaks if a synth or a ch01 handler it uses changes.

## Rebuild and check

All of it is deterministic: two runs of `bed.py` and of `sound.py` give identical bytes.

**While another session has uncommitted scene or engine edits, build and render from a clean worktree**
(`git worktree add --detach ../LamToGoat-build HEAD`, then symlink `node_modules`). A broken chapter in the working
tree stops `cues.mjs`, and a scene edited mid-render mixes versions.

```sh
node tools/cues.mjs                                                     # out/sound/cues.json (418 cues)
uv run python tools/bed.py                                              # out/sound/bed.wav + bed.json (if the bed changes)
uv run --with numpy --with scipy python tools/sound.py --score out/sound/score.json   # out/sound/film.wav
uv run --with numpy --with scipy --with matplotlib python tools/soundcheck.py         # analysis + report
node tools/synccheck.mjs                                                # picture-side sync + sheets
node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10
```

- **One chapter with sound:** `node render.mjs --chapters ch05 --audio out/sound/film.wav --out out/review/ch05.mp4`
  (960×540).
  - `render.mjs` cuts the audio out of the whole-film mix by film time, from the first frame on or after the
    chapter's start. So `--audio` must be the whole-film mix.
  - `sound.py --chapters` writes only those chapters, from their start, normalized on their own. It's for a quick
    listen, not for muxing.
- `soundcheck.py` reports:
  - loudness per chapter;
  - the bed's beats against the grid;
  - every pitched note against the bed;
  - an onset in the mix for each hit cue. Now 301 of 304 fall within 12 ms; three neighbours in ch02's 40 ms skyline
    run merge in the detector.
- `synccheck.mjs` checks that the 71 appearance cues start on their frames.
- Last measured on the preview: loudnorm -14.08 LUFS, -1.20 dBTP, LRA 8.9 LU. The audio matches `film.wav` at
  0 samples of lag.

## The team's faces in ch10 (in the film since `47ba699`)

- **What's on screen:**
  - Each of ch10's five bands carries its member's real photo, used with consent. The photos come from the deck's
    ĐỘI NGŨ page (PDF page 13), extracted pixel for pixel by `tools/team.py extract` into `assets/team/`.
  - Each is cut out as a full-colour paper bust (`tools/team.py cut`, `assets/team/cut/`, geometry in
    `docs/team.json`). The engine serves them as `ctx.portrait(k)`.
- **Checks:**
  - `tools/facecheck.mjs` checks every frame: no face over a text or another face, every face at least 300 px tall
    at rest. They measure 309 px or more.
  - `tools/lint_scene.mjs` has a rule for portraits.
  - ch01's frames stay pixel-identical with the new engine code.
- **Sound:** the busts enter with their bands' slides and have no sound of their own. ch10's 10 cues (8 slides, a
  snap, a stab) and every other cue time are unchanged. `node tools/cues.mjs` at `47ba699` gives a `cues.json`
  identical to the one the current mix was built from (checked 2026-09-29).
- **Review:** `docs/review/ch10.md` (rounds 9-11) and `docs/review_log.md`, "ch10: the team's faces". The clips are
  `out/review/ch10.mp4` and `ch10_1080p.mp4`, both with the current mix.
- Not yet in `out/preview_1080p.mp4` or `out/roughcut_sound.mp4`.

## Next

1. **The effects remake.** Before changing anything, settle two points with the user:
   - **ch01's hits:** they are the approved sketch's (decision 4) and still play note for note over the bed. Does
     "all the effects" include them?
   - **The synth regression:** `--music synth` shares the synths and handlers. Its ch01 rebuilds the approved sketch
     byte for byte only while those stay as they are. Keep the old ones for synth mode, or retire that check?

   Then, chapter by chapter:
   - keep every effect on its cue (`t`, or `land` for a move);
   - take notes from the bed (`bed_pcs`, `place`), minding its tuning (+5 cents) and its straight 8ths;
   - run `soundcheck.py` and `synccheck.mjs`;
   - log a review-log round with the sync score (8+ everywhere).
2. The user's notes on the sound. Each fix goes through the same checks and a review-log round.
3. **Final render:** `node render.mjs --final --audio out/sound/film.wav --out out/final.mp4` (1920×1080, 60 fps,
   CRF 16, preset slow; 10,800 frames, about 25-30 min with 8-10 workers).
   - Measure the muxed file again: `ffmpeg -i out/final.mp4 -af ebur128=peak=true -f null -`, and
     `loudnorm=print_format=json`.
   - The AAC encode is the same as the preview's, so it should read -14.0 LUFS and about -1.2 dBTP.
4. `out/poster.png`: the candidate is ch11's final frame at 1920×1080. `out/contact.png`: a whole-film contact sheet.
5. `README.md` credits:
   - music: "Upbeat Jazz" by Francisco Alvear (Mixkit), arranged for the film; sound effects synthesized in code;
   - fonts: Bricolage Grotesque and IBM Plex Mono (OFL);
   - the team (Đội Kawaibu);
   - no voice credit.
6. **Open question for the user:** the brief asks for `out/final.vi.srt`, but the film has no voice. Drop it, or ship
   a text track of the on-screen story text from `docs/onscreen.json`?

## Tools

| Tool | What it does |
|---|---|
| `render.mjs` | Parallel render. `--chapters`, `--from/--to`, `--load`, `--tail`, `--final`, `--workers`, `--audio wav` (muxes the whole-film mix, cut to the rendered range by film time). |
| `tools/review.mjs chNN` | The review loop: draft, 2 fps contact sheet, 360 px phone sheet, `--strip`, text-size check. |
| `tools/frames.mjs chNN dir t…` | Full-resolution stills at chapter-local times (for pixel diffs; render before/after with the same time list). |
| `tools/boundary.mjs chNN` | ±2 s around a chapter's start, both chapters loaded. |
| `tools/readcheck.mjs chNN` | Each text's real readable time against the reading model. |
| `tools/textcheck.mjs chNN` | The 28 px floor. |
| `tools/lint_scene.mjs` | Checks a scene against the guide's rules. |
| `tools/stillness.py video` | Rhythm: holds, and gaps between visual events. |
| `tools/timeline.py` | Builds the timeline. `--voice` is only for a future voice. |
| `tools/cues.mjs` | Collects the scenes' cues (`--out` for another path). |
| `tools/bed.py` | Stretches the Mixkit track to 108 BPM and arranges it on the film's 81 bars (`PLAN`, `XF`, `RIDE`). Writes `out/sound/bed.wav` and `bed.json`. |
| `tools/sound.py` | Places the effects on the cues over the bed, mixes and masters (`--music bed\|synth`, `--chapters`, `--stems`, `--stem-dir`, `--score`, `--no-aac-check`). |
| `tools/soundcheck.py` | Analysis image; loudness per chapter, the bed's grid, harmony against the bed, and an onset in the mix for every hit cue. |
| `tools/synccheck.mjs` | Every appearance cue starts on its frame; sync sheets of the stabs, alarms, slams, stamps and cuts. |
| `tools/team.py` | `extract`: the five team photos from the deck into `assets/team/`, pixel for pixel. `cut`: the busts ch10 shows (`assets/team/cut/`, `docs/team.json`); `--treat duotone` for the other option. Both deterministic. |
| `tools/facecheck.mjs chNN` | Every frame: no text or face under a face; each face's height in frame at rest (the 300 px floor). |
| `lib/engine.js` | `?only=&soft=` loads a subset; `?timeline=/path.json` uses another timeline; collects `window.__cues`; `ctx.portrait(k)` serves `docs/team.json`. |

Two scratch scripts are not in git (`out/` is ignored):
- `out/tmp/music/bed_analysis.py`: the tempo fit, stretch, downbeats, and bar similarity used to find the form.
- `out/tmp/music/seams.py`: the joins' measurements.

## Open issues

1. **Not heard by the builder.** The sound was checked only by measurement. The user chose the bed from audition clips
   and now wants the effects remade to match it. The five joins still need a listen: 0:20.0, 0:37.8, 0:55.6, 2:28.9,
   2:53.3.
2. **The bed's license.** Mixkit's full legal text was not read (it is rendered by script). Its summary allows
   commercial use in online video with no attribution, and forbids redistributing the track itself. So the MP3 must
   not be published with this repository. Read the license before the final release, especially on modification:
   the film stretches, cuts and repeats the track.
3. Weak supporting labels on the phone sheet (ch04's role descriptors, ch09's phase labels, ch03's B2B2C tags, ch11's
   credits): all pass the 28 px floor, and the user has accepted them so far.
4. `frames.mjs` stills can differ by a few anti-aliased edge pixels between browser sessions or seek orders; compare
   before/after renders made with the same time list, one right after the other.
5. Render cost: 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest).
6. **ch10's faces:**
   - Photos 1, 2 and 4 are small in the deck (240 px, 240 px and 324 px wide). They are enlarged 1.48-1.75×, so they
     look soft at 100 %. Sharper originals from the team would fix that; re-take `tools/team.py`'s per-photo
     measurements.
   - The layout is at its limits. Before the lock, at the push, the right column is 18-28 px from the frame's edge,
     and Hưng's crown is about 20 px from the L34 line. `build()` throws if either ever stops fitting.
