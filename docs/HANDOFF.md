# Handoff: ch07's payoff as a match cut; no text twice in one frame (2026-10-04)

For the next session. Read `CLAUDE.md`, `docs/brief.md` and `docs/ANIMATION_GUIDE.md` first; their rules hold unless
something below overrides them. Work is on branch **`film`**. There is no remote. **Never push.**

**The task just done (the user, 2026-10-04): ch07's payoff (7.3) reworked, and 7.2 with it, under a new rule** (commits `ba22b78`, `4fd7466`,
`0586777`, docs after):
- **The rule** (CLAUDE.md, Story text; the guide, section 6): the same text never appears twice in one frame. No phrase or statement shows twice at
  once, counting the film's own type and the real UI's text (a UI that repeats itself is left out or cropped); one shared word is not a repeat
  ("CÔNG BỐ" in a title and on the "Công bố đề xuất" button); the one exception is ch07's four identical hash copies (7.4-7.6).
- **7.3, the match cut** (the user picked it from three options shown as stills: A match cut, B tear reveal, C wordless callback): after the
  chain, the façade's window shuts on the old cut (+9.86); the hook's bubble slams in alone on the next beat (+10.0), set at the size, line break
  and line pitch of the real report's title (53.2 px, solved in the page because optical sizing widens the type; both lines end within about 2 px
  of the report's); one beat later (+10.56) the HARD CUT to the real report: the words stay put, only the paper around them changes. "Phản ánh gốc"
  is dropped (the caption's "về phản ánh ban đầu" says it); the report sits centred.
- **7.2:** the label now reads "ngay cả ban quản lý / cũng không sửa được" (the user picked it from two; the old one repeated the seal's "niêm
  phong" and the UI's "không thể chỉnh sửa"); the lock note (7.2a) is left out, since its last words are the checkbox line's; the checkbox line and
  the button moved up against the title.
- **Kept:** ch07's 10 bars; every time in the timeline (L24 is pinned at its 9 beats with `beats` in `docs/onscreen.json`, which
  `tools/timeline.py` now honours; `timeline.json` differs only in L24's `read`, 5.36 → 4.37); the grid; the real UI (no crop changed; only the lock note is left out). Outside the
  changed beats ch07's frames are pixel-identical to `261897d` (27 sampled). All 16 texts pass `readcheck`.
- **Sound:** the cues are the old ones less the lock note's slide (415 now); the bubble's tick (+10.0) and the match cut's snap and warm chord
  (+10.56) are the old `bubble` cue, so the callback and its tuning are unchanged. Removing the slide re-levelled some of ch07's effects through
  `Film.finalize()` (around 109-110 s, and -2.3 to +4.1 dB in 7.4-7.6's dense run; see Open issues); elsewhere it differs from the old mix by -68.6 dB
  (median per second; -51 dB at most). Every check passes.
- Rounds: `docs/review/ch07.md` (7-9) and `docs/review_log.md`, "ch07: the payoff as a match cut". The gate stills are in `out/tmp/ch07match/`
  (`gate/options.png`, `label/wordings.png`); the preview, mix and reports from before are in `out/tmp/ch07match/before/`.

**The task before that (the user, 2026-10-04): ch05 rebuilt on recordings of the real app** (commits `3b04ff5`..`19fb90f`, docs `261897d`): no
cropped screenshots in ch05. Real-time recordings of the real app (`assets/recordings/`, 51 MB, made by `tools/record_app.mjs` against a throwaway
copy of the design sandbox) play on a cut-paper ORANGE phone held in a BLACK hand that taps where and when the recording tapped, then on a NAVY
laptop with the logged cursor; speed ramps on the recording's own events, push-ins and story captions on paper for what must be read. Gate picks:
cut paper, no photo step (the web build cannot attach one), pilot-resident-2. CLAUDE.md treats recordings as real UI. 8 bars, the timeline and the
grid kept; ch05's cues rebuilt (`tap`, `key`, the bell). Details: decision 11 below, `docs/review/ch05.md` (8-11) and `docs/review_log.md`,
"ch05: the real app, recorded".

**Before it (the user, 2026-09-29): ch04's flip order** (commit `0698eaa`): each role flips to navy right after its own pain, before the
next pain lands; details in `docs/review_log.md`, "ch04: each role flips right after its own pain".

**And before that (the user, 2026-09-29): all the sound effects remade to fit the Mixkit bed**, ch01's hits from the approved sketch
included. Every effect is on its cue time; the picture and the timeline are untouched. What changed, per chapter, with the checks and the
scored rounds, is in `docs/review_log.md`, "Sound effects remake". Below: where things stand, what the effects now are and how to rebuild
and check them, and what is left.

## Where things stand

| Gate | Status |
|---|---|
| 1 Look + shotlist | approved: direction C, after Saul Bass (`docs/style_guide.md`, `docs/shotlist.md`) |
| 2 Voice script | approved, then superseded: there is no voice-over. The 35 lines L01-L35 live on as story beats. |
| 3 Voice | dropped. No ElevenLabs calls, ever. |
| 4 Engine + ch01 | approved |
| 5 Guide + ch02-ch11 | done: every chapter built, reviewed (8+ on all criteria) and committed separately. ch10 carries the team's faces (`47ba699`). |
| 6 Rough cut review | done without a voice |
| 7 Polish, sound, final render, deliverables | **Music: the Mixkit bed. Effects: remade to fit it. ch04's flip order fixed (`0698eaa`). ch05 rebuilt on recordings of the real app (2026-10-04). ch07's payoff a match cut, no text twice in one frame (2026-10-04). Next: the user's look and listen, then the final render and deliverables.** |

Review files for the user:
- `out/preview_1080p.mp4`: 1920×1080, 30 fps, CRF 23, 180.0 s, with the current mix (AAC 320 kbps, 48 kHz), the new ch05 and the new ch07 (2026-10-04;
  rendered from the working tree at `0586777`, docs aside; 6 min 53 s, 10 workers); measured on the file: -14.0 LUFS (ebur128), true peak -1.2 dBFS;
  loudnorm input -14.05 LUFS, -1.22 dBTP, LRA 6.8 LU; audio aligned with `film.wav` at 0 samples of lag (codec residual -37.7 dB over the whole film).
  The preview before the ch07 rework, with its mix and checks, is in `out/tmp/ch07match/before/`; the one before the ch05 rework in `out/tmp/ch05rework/before/`.
- `out/review/ch07.mp4`: ch07 at 960×540 with the current mix and 0.8 s of ch08's cover (2026-10-04). `out/review/ch05.mp4`: ch05 with the mix of
  2026-10-04 before ch07's rework (outside ch07 the new mix differs from it by -51 dB at most). `out/roughcut_sound.mp4`: the 960×540 30 fps draft of the whole film with an
  **older** mix and the old ch05 and ch07 (rendered at `0698eaa`; not re-rendered). `out/review/ch04.mp4` carries the mix of 2026-09-29 (with ch04's exit,
  +0.9 s); the other per-chapter clips `out/review/chNN.mp4` still carry older mixes. The preview and draft from before the flip-order change are in `out/tmp/flip/before/` (with that
  mix's `film.wav`, `cues.json`, `score.json` and check reports); older ones (and the first remake build's, before the skyline fix) are in `out/tmp/old_mix/` for A/B.
- `out/sound/film.wav` (48 kHz stereo float), `out/sound/cues.json`, `out/sound/score.json` (every note and effect, with each paper/UI event's level and poke-out),
  `out/sound/stems/*.wav` (each stem at its level in the master, plus `bed_ref.wav`, the music the effects are judged against).
- Check reports: `out/sound/sfxcheck.txt`, `tunecheck.txt`, `soundcheck.txt`, `synccheck.txt`; the analysis image `out/sound/analysis.png`.
- `out/sound/bed.wav` and `bed.json`: the arranged bed, its plan and joins. `out/review/bed_joins.png`: a spectrogram around each join.
- The rounds and all measurements: `docs/review_log.md`, "Sound pass", "Music bed", "ch10: the team's faces", "Sound effects remake",
  "ch04: each role flips right after its own pain", "ch05: the real app, recorded", "ch07: the payoff as a match cut".

**Be honest with the user: the mix was checked by measurement and by reading the score against the bed's chord chart, never by ear.**

## Decisions the user made in chat (in force)

1. **Look:** direction C, after Saul Bass.
2. **No voice-over.** The voice pipeline is kept but unused (`tools/vo.py`, `docs/vo_*`; `tools/timeline.py --voice` goes back to it).
3. **Exactly 3:00, timed by reading on a 108 BPM grid.** Rules below. Cuts approved.
4. **ch01's look is approved.** Changes to shared code must keep its frames pixel-identical. (ch01's *sound* was approved as a sketch, then remade with all the
   other effects at the user's request on 2026-09-29; the sketch's byte-for-byte rebuild check is retired.)
5. **The screenshot set is final.** Crops are in `docs/crops.json`; the demo manager shows as "Kawaibu".
6. **Git:** one commit per logical unit (per chapter when chapters change), never push.
7. **Music bed (2026-09-29):** "Upbeat Jazz" by Francisco Alvear (Mixkit) replaces the synthesized score, stretched to 108 BPM and arranged to 3:00 by
   `tools/bed.py` (`CLAUDE.md`, Sound). The effects stay synthesized on the cues.
8. **Team faces (2026-09-29):** each ch10 band carries its member's real photo (used with consent), cut out as a full-colour paper bust
   (`tools/team.py`, `ctx.portrait(k)`). The user picked full colour over a duotone and accepted its Brand 7. `CLAUDE.md`: team photos only from
   `assets/team/`, never redrawn, distorted or AI-altered beyond cutout and colour treatment; faces at least 300 px tall, never over a name, a role or another face.
9. **The effects remake (2026-09-29):** (a) tune every pitched effect to the bed's A4 = 441.3 Hz and to the chord it actually plays at each cue's bar; (b) rhythmic effects
   straight 8ths, match its timbre, drop any effect that doubles a hit the track plays; (c) paper and UI sounds unpitched, EQ'd into the gaps of its mids, none more than about
   3 dB over the music. Every effect stays on its cue time, the picture timeline is untouched, the old score's rebuild check is retired. These are now in `CLAUDE.md`.
10. **ch04's flip order (2026-09-29):** each role flips to navy right after its own pain has been read and before the next role's pain lands (pain 1, flip 1, pain 2,
    flip 2, pain 3, flip 3), the manager's flip inside L13. Chapter length, timeline and grid unchanged; every text still passes `readcheck`. This replaces the shotlist's
    first plan (panel 2 flipping after panel 3 stepped forward).
11. **ch05 on recordings of the real app (2026-10-04):** no cropped screenshots in ch05; real-time recordings of the real app
    (`assets/recordings/`, `tools/record_app.mjs`) count as real UI, the cut-paper phone, hands, laptop and cursor are overlays (the user picked
    cut paper over a clean flat device); no photo step (the web build cannot attach one); pilot-resident-2's account (a clean list); report #7 for the
    manager (no AI endpoint in the sandbox, so a new report gets no real suggestion); app text in wide device shots may go under 28 px when what must be
    read gets a push-in or a story caption (CLAUDE.md). 8 bars, timeline, grid, ch04's doors and ch06's cover unchanged.
12. **No text twice in one frame (2026-10-04):** no phrase or statement shows twice at once, counting the film's own type and the real UI's
    text; one shared word is not a repeat; the one exception is ch07's four identical hash copies (CLAUDE.md, the guide's section 6).
13. **ch07's payoff and 7.2 (2026-10-04):** 7.3 is a match cut (the hook's bubble alone for a beat, then a hard cut to the real report, the words
    unmoved; "Phản ánh gốc" dropped); 7.2's label is "ngay cả ban quản lý / cũng không sửa được" and its lock note is left out (its slide cue
    with it); the timeline, music and cues stay as they were (L24 pinned at 9 beats).

## What to ask the user (four judgement calls made without them)

1. **"None poking out more than about 3 dB above the music"** was implemented as a *level* limit (loudness and the 250 Hz - 4 kHz mids, the larger of the two, +3 dB), with a
   single-band guard of +14 dB so crisp noise cannot splash. The effects end up a median 3 dB *under* the music in loudness and 10-14 dB over it in the thin upper bands. A strict
   per-band +3 dB reading would make them about 8-10 dB duller and softer (`BAND_CAP` and the class `poke` values in `tools/sound.py`). `docs/review_log.md` explains why.
2. **The stabs on "1" (ch06), "2" (ch07) and "ĐỘI KAWAIBU" (ch10) are gone:** the bed's own bass note and keys chord land within 14-35 ms of each, so every layer of the stab
   doubled the track. ch08's and ch09's keep the keys chord; ch01's is whole (the bed is dipped there). If the user wants them back: `Film.doubled()` in `tools/sound.py`.
3. **The bed is F minor, not "F major with F minor colour"** (the earlier key-profile reading). The effects follow the measured chords.
4. **ch07's real report repeats two names in its own fields** (found after the user's picks): its title says "Thang máy B kẹt cửa ở tầng 3, …" and its
   location row "Goldmark City / Tầng 3 / Thang máy B · B-1204". They are the app's data in two fields of one screenshot, and the row was in the
   option A still the user approved, so it stays. If the user reads the rule strictly here too, the façade's window can end just above the location
   row (the report then shows its "Đã hoàn thành" badge and its title only); no crop changes.

## 3:00 timing (unchanged; one beat pinned)

- `docs/timeline.json` is built by `uv run python tools/timeline.py` (81 bars) from `docs/onscreen.json`; never edit
  it by hand. 108 BPM, 4/4 from t = 0, every chapter a whole number of bars.
- Reading pace fixed at 0.82; only holds were trimmed to fit 3:00 (ch05, ch02, ch09, ch03 lost a bar each).
- **Pinned:** L24 keeps 9 beats (`"beats": 9` in `docs/onscreen.json`, with its reason). Its text needs 4.37 s since "Phản ánh gốc" was dropped, so
  it holds about a second longer than its reading needs; `tools/timeline.py` never makes a pinned beat shorter nor trims it. `docs/onscreen.json` also
  logs rewordings (`changed`) and removals (`dropped`).
- `node tools/readcheck.mjs chNN`: every text in all 11 chapters passes.
- **If on-screen text ever changes,** the timeline re-flows: rebuild it, then re-run `readcheck`, the chapter
  review, `node tools/cues.mjs` and `tools/sound.py` (the music and every cue sit on the timeline). If a chapter
  moves, re-fit `tools/bed.py`'s `PLAN`: the track's lift must still land on ch05's downbeat.
- ch05's soft spots (since the rework): the app's confirmation is up about 0.64 s (73.06-73.69 s; the bell rings on `T.conf`, 73.06 s);
  "Việc của tôi" with the new report holds about 0.45 s (73.89-74.30 s) before the pan to the laptop.


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
  - At master gain its body reads -13.5 LUFS (ch05-ch09 median) and the whole mix there -12.8: the effects add under 1 LU,
    since each paper or UI sound stays within +3 dB of the music (a median 3 dB under it). Before the remake the bed sat near -18 LUFS
    there and the slams stood +4 to +6 LU over it.
- **Dips:**
  - From ch01's `drop` cue to ch02: -32 dB, 0.15 s in, 0.02 s out.
  - From ch07's `push` to ch08: -26 dB, 0.35 s in. Under it: a 320 Hz low-passed trace of the bed at -9 dB, and one
    held note in the bed's own bass voice (`synth.bass_note(held=True)`, stem `bass`, +2 LU over the music) on the bass pitch class of the
    beat's chord, the lowest in MIDI 28-40 (Eb2).
- **ch11's `chord` cue is silent** in bed mode: the bed's own final chord ends the film.
- `master()` normalizes the whole mix to -14 LUFS, so louder effects push the bed down in the master. Since the effects' levels are now set
  from the bed, it is the bed that sets the mix's loudness. Watch `soundcheck.py`'s per-chapter loudness.

## The sound effects: how they are built

Code, all deterministic (two runs give identical bytes): `tools/synth.py` (every synth), `tools/sound.py` (the mix), `tools/meter.py` (the measurements), and the data
`docs/bed_harmony.json` (the chord the bed plays on each of its 200 beats) and `docs/bed_kit.md` (what its instruments are and do).

1. **Cues** (the picture side): each chapter's `cues(state, ctx)` -> `node tools/cues.mjs` -> `out/sound/cues.json` (415 cues since ch07's rework, 43 names, `docs/ANIMATION_GUIDE.md` section 12).
2. **Handlers** (`fx_<name>` in `tools/sound.py`, run name by name over the cues; `EFFECTS` maps names to them). Two kinds:
   - **Paper and UI** (ticks, stamps, snips, slides, tears, flips, ...): `f.fx(q, class, sig, at, pan, rel)`. The synths (`tools/synth.py`) are noise only; **`tools/meter.tonality`**
     reads at most 0.026 on every class. `Film.finalize()` then, per class (`CLASSES`: hit, cut, move, tick, texture): matches the class's EQ to a designed spectrum (a tilt, a low cut,
     a high roll-off; `shape()` is a minimum-phase FIR, no pre-ring), carves in the music's gaps (`meter.fine_structure`, intro and body separately), sets each event alone to its class's
     poke over the music (`meter.poke`), then measures all events together as `tools/sfxcheck.py` does and lowers any that still exceed +3 dB (or the +14 dB band guard).
   - **Pitched** (stab, alarm, drop's bass bend, ch01's cluster, the loop's warm chord, chime, bell, climb, band, slab, the held low note under ch07's push): `f.hit(q, layers, at, rel, what)`.
     Notes come from `Film.harm(t)` (the chart entry for the beat: `tones`, `ext`, `safe`, `hold`, `avoid`, `bass_pc`; `chord_order`, `voice`, `bar_extras`, `lowest` in the code),
     the voices are the bed's own (`synth.keys`, `synth.bass_note`; `synth.hat` exists but no effect uses it), and the whole hit is set to `rel` dB over the music.
     `Film.doubled(t)` (the bed's own hits, from `tools/bedhits.py`) leaves out a layer the bed already plays within 45 ms; `Film.skip()` logs it.
   - Every level is a measurement against the music, never a hand-set dB. The music is the bed without its two dips and with its fade-in bar replaced by the second bar
     (`Film.set_reference`), so the opening effects and the ones inside the dips are judged against the music that is coming or that the dip replaces.
   - `--music synth` keeps the old synthesized score and its legacy handlers (`legacy_*`); it runs, but ch01 is no longer the sketch byte for byte.
3. **Bus and master:** `Bus` sums the stems (`sfx`, `tone`, `piano`, `bass`, `vibes`, `brass`, `drums`, `bed`); `master()` normalizes to -14 LUFS and limits true peaks to -1.2 dBTP;
   `aac_safe()` encodes to AAC 320k as `render.mjs` does and lowers the PCM where the decode would pass -1.2 dBTP. `--stem-dir DIR` writes each stem at its level in the master and
   `bed_ref.wav`. `--score FILE` writes every note and effect placed (paper/UI events with class, gain, poke, loudness, mids, guard, dip).
4. **The bed's levels** (`Film.bed_music()`): `BED_GAIN` -17.5 dB; the sparse intro +4 dB (`BED_INTRO_DB`) until a 20 ms ramp onto ch05's downbeat; -2.5 dB (`BED_RESOLVE_DB`) over
   ch10's first 8 beats; the dips (ch01's drop to ch02, -32 dB; ch07's push to ch08, -26 dB with a 320 Hz low-passed trace at -9 dB under the held bass note). ch11's `chord` cue is silent.

**What the effects are, per family** (`docs/review_log.md` has every chapter): paper and UI sounds unpitched, at most +2.9 dB over the music (median -3.3), their spectral fine structure
anti-correlated with the bed's (r -0.78 intro, -0.57 body); pitched notes within 3.3 cents of A4 = 441.3 (median 0.0), 0 of 47 outside the chord the bed plays; 301 of 301 hit cues have an
onset in the effects' stems within 12 ms; every pitched hit within 0.3 dB of the level it was set to; no swing anywhere.

## Rebuild and check

All of it is deterministic. **While another session has uncommitted scene or engine edits, build and render from a clean worktree**
(`git worktree add --detach ../LamToGoat-build HEAD`, then symlink `node_modules`). A broken chapter in the working tree stops `cues.mjs`, and a scene edited mid-render mixes versions.

```sh
node tools/cues.mjs                                                     # out/sound/cues.json (415 cues)
uv run python tools/bed.py                                              # out/sound/bed.wav + bed.json (if the bed changes)
uv run python tools/bedharmony.py                                       # docs/bed_harmony.json (if the bed changes; hand overrides inside)
uv run --with numpy --with scipy python tools/sound.py --stem-dir out/sound/stems --score out/sound/score.json   # out/sound/film.wav (about 1 min)
uv run --with numpy --with scipy python tools/sfxcheck.py               # paper/UI: poke-out, guard, tonality, gaps, dips (needs the stems)
uv run --with numpy --with scipy python tools/tunecheck.py              # every pitched note against A4 = 441.3
uv run --with numpy --with scipy --with matplotlib python tools/soundcheck.py --stem-dir out/sound/stems   # loudness, grid, harmony vs the chart, cue onsets, analysis.png
node tools/synccheck.mjs                                                # picture-side sync + sheets
node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10
```

- **One chapter with sound:** `node render.mjs --chapters ch05 --audio out/sound/film.wav --out out/review/ch05.mp4` (960×540). `--audio` must be the whole-film mix (`render.mjs` cuts it by film time).
  `sound.py --chapters ch05` builds only that chapter (4 s), normalized on its own: for a quick listen, not for muxing.
- **`tools/bedhits.py`** (`--scan`, `--cues`, `--selftest`): what the bed plays and when; `sound.py` imports its `hits()`. **`docs/bed_kit.md`** has its measurements and caveats.
- Last measured on the mix (2026-10-04, after ch07's rework): -14.00 LUFS, -1.22 dBTP (`sound.py`'s AAC 320k round trip: -1.22 dBTP; the preview file: -14.05 LUFS, -1.22 dBTP).
- **After a scene edit that moves cues** (as ch04's flip order did): run `node tools/cues.mjs` and diff `out/sound/cues.json` against the old one (only the intended cues should move;
  ch04's change moved 3 of 418; ch05's rework replaced its 34 with 32; ch07's removed one), then `tools/sound.py` and the four checks. The new `film.wav` should then differ from the old one only around the moved cues (match their gain first;
  the change was +0.004 dB elsewhere). The picture can be checked the same way: render the chapter from a clean worktree at the previous commit and compare frame by frame (an H.264
  encode adds lookahead noise of a few levels to the frames just before a change; lossless `frames.mjs` stills don't). Render the preview from a clean worktree at the new commit.
  `../LamToGoat-build` was used for this and removed afterwards (`git worktree add --detach ../LamToGoat-build HEAD`, symlink `node_modules`).


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
- In `out/preview_1080p.mp4` and `out/roughcut_sound.mp4` (both rendered after the faces went in).


## Next

1. **The user's look at the new ch07** (`out/review/ch07.mp4`, `out/preview_1080p.mp4` 1:46.7-2:08.9): 7.2's new label and column (1:47.8-1:52.5),
   the match cut (1:56.5 the window shuts, 1:56.7 the bubble, 1:57.2 the report), and ask question 4 above (the report's own "Thang máy B"/"tầng 3").
2. **The user's look at the new ch05** (`out/review/ch05.mp4`, `out/preview_1080p.mp4` 1:04-1:22): the phone and the laptop on the real app, the
   speed ramps, the soft spots above (the confirmation up about 0.64 s, the refreshed list about 0.45 s), the arm's sweep to the back arrow.
3. **The user's listen and notes** on the effects (and the five joins in the bed: 0:20.0, 0:37.8, 0:55.6, 2:28.9, 2:53.3). Ask the questions above first. Places to listen:
   ch01's cluster (5.56 s) and ch03's soft stab (42.5 s) sit on the intro's D pedal, whose synth lines are diffuse and whose drone is +36 and +14 cents off the grid, so they may beat;
   the effects are quiet against the music by design; ch06, ch07 and ch10's SLAMs are the bed's own hit; ch04's three chimes are now all `A4 F5` (the bed plays F at all three flips), and the
   middle one, the manager's, rings at 55.94 s, 0.38 s after the bed's join 3 (55.56 s) with a bed bass note 36 ms after it. Each fix goes through the same checks and a review-log round.
4. **Final render:** `node render.mjs --final --audio out/sound/film.wav --out out/final.mp4` (1920×1080, 60 fps, CRF 16, preset slow; 10,800 frames, about 25-30 min with 8-10 workers).
   - Measure the muxed file again: `ffmpeg -i out/final.mp4 -af ebur128=peak=true -f null -`, and `loudnorm=print_format=json`. The AAC encode is the same as the preview's, so it should read -14.0 LUFS and about -1.2 dBTP.
5. `out/poster.png`: the candidate is ch11's final frame at 1920×1080. `out/contact.png`: a whole-film contact sheet.
6. `README.md` credits:
   - music: "Upbeat Jazz" by Francisco Alvear (Mixkit), arranged for the film; sound effects synthesized in code;
   - fonts: Bricolage Grotesque and IBM Plex Mono (OFL);
   - the team (Đội Kawaibu);
   - no voice credit.
7. **Open question for the user:** the brief asks for `out/final.vi.srt`, but the film has no voice. Drop it, or ship a text track of the on-screen story text from `docs/onscreen.json`?

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
| `tools/timeline.py` | Builds the timeline. Honours a beat's pinned length (`beats` in `docs/onscreen.json`). `--voice` is only for a future voice. |
| `tools/cues.mjs` | Collects the scenes' cues (`--out` for another path). |
| `tools/bed.py` | Stretches the Mixkit track to 108 BPM and arranges it on the film's 81 bars (`PLAN`, `XF`, `RIDE`). Writes `out/sound/bed.wav` and `bed.json`. |
| `tools/bedharmony.py` | The chord the bed plays on every beat (NNLS note decomposition, read by hand, tiers per bar) -> `docs/bed_harmony.json`; `--check`, `--cues`, `--review A B`. |
| `tools/bedhits.py` | The bed's own hits by instrument (hat, bass, keys, accent), the per-cue report; `sound.py` uses `hits()` to leave out doubled layers. `docs/bed_kit.md` is its write-up. |
| `tools/synth.py` | Every synth: the noise-only paper and UI sounds, `shape()` (minimum-phase EQ), the bed's keys, bass and hat, the old instruments for `--music synth`; `A4 = 441.3`. |
| `tools/sound.py` | Places the effects on the cues over the bed, sets their levels from the music, mixes and masters (`--music bed\|synth`, `--chapters`, `--stems`, `--stem-dir`, `--score`, `--no-aac-check`). |
| `tools/meter.py` | The measurements: band and loudness levels, `poke()`, `tonality()`, `fine_structure()`. |
| `tools/sfxcheck.py` | Paper/UI from the stems: poke-out, band guard, tonality, spectral gaps, the events inside the dips. |
| `tools/tunecheck.py` | Every pitched note's fundamental in its stem against A4 = 441.3, in cents. |
| `tools/soundcheck.py` | Analysis image; loudness per chapter, the bed's grid, harmony against the chart, and an onset for every hit cue (`--stem-dir` for the effects' own stems). |
| `tools/synccheck.mjs` | Every appearance cue starts on its frame; sync sheets of the stabs, alarms, slams, stamps and cuts. |
| `tools/team.py` | `extract`: the five team photos from the deck into `assets/team/`. `cut`: the busts ch10 shows. |
| `tools/record_app.mjs` | Records the real app for ch05 (`app`: the Flutter web build as pilot-resident-2; `web`: the workspace as Kawaibu) against a throwaway copy of the design sandbox's database, logs every tap, key, cursor move, click and scroll, restores the sandbox. `--only app\|web`; `--marks` (no sandbox). |
| `lib/footage.js` | Plays a recording on a screen (`screen`, frames decoded only when shown), film → recording time (`remap`, `unmap`), `settled`, `cursorAt`. |
| `lib/props.js` | The cut-paper phone, the hand holding it, the tapping hand, the laptop and the cursor (overlays on `ctx.top`). |
| `tools/facecheck.mjs chNN` | Every frame: no text or face under a face; each face's height in frame at rest (the 300 px floor). |
| `lib/engine.js` | `?only=&soft=` loads a subset; `?timeline=/path.json` uses another timeline; collects `window.__cues`; `ctx.portrait(k)` serves `docs/team.json`; `ctx.recording(name)` serves `assets/recordings/<name>.json`. |

Two scratch scripts are not in git (`out/` is ignored): `out/tmp/music/bed_analysis.py` (the tempo fit, stretch, downbeats and bar similarity used to find the form) and
`out/tmp/music/seams.py` (the joins' measurements). The remake's analysis scripts, figures and the old mix (for comparison) are in `out/tmp/remake/` and `out/tmp/old_mix/`.

## Open issues

1. **Not heard by the builder.** The sound was checked only by measurement. See Next, item 3.
2. **The bed's license.** Mixkit's full legal text was not read (it is rendered by script). Its summary allows commercial use in online video with no attribution, and forbids
   redistributing the track itself. So the MP3 must not be published with this repository. Read the license before the final release, especially on modification: the film stretches, cuts and repeats the track.
3. **The chord chart is a reading.** `docs/bed_harmony.json` was read from note decompositions by hand (tiers H/M/L per bar: 100 beats H, 80 M, 20 L). Its weakest bars are 2-5 (the D pedal, with nothing
   above 300 Hz on three of four beats), 9, 19, 21, 22, 43 and 48-50. The instrument names in `docs/bed_kit.md` ("piano" for the keys, "hat") are inference.
4. Weak supporting labels on the phone sheet (ch04's role descriptors, ch09's phase labels, ch03's B2B2C tags, ch11's credits): all pass the 28 px floor, and the user has accepted them so far.
5. `frames.mjs` stills can differ by a few anti-aliased edge pixels between browser sessions or seek orders; compare before/after renders made with the same time list, one right after the other.
6. Render cost: 1080p frames take about 0.5-0.8 s each per worker (ch02's skyline is the heaviest).
7. **ch04's tightest reading margin:** the manager's second pain tag ("không ai theo dõi") is readable 1.40 s for the 1.24 s its text needs. Its flip can't move a 16th later without the
   chime landing 15 ms before the bed's keys chord at 56.09 s (`docs/bed_kit.md` (f)), nor its tag earlier without crowding the last bubble and the chat's drift-off (`docs/review/ch04.md`, round 7).
8. **ch10's faces:**
   - Photos 1, 2 and 4 are small in the deck (240 px, 240 px and 324 px wide). They are enlarged 1.48-1.75×, so they look soft at 100 %. Sharper originals from the team would fix that; re-take `tools/team.py`'s per-photo measurements.
   - The layout is at its limits. Before the lock, at the push, the right column is 18-28 px from the frame's edge, and Hưng's crown is about 20 px from the L34 line. `build()` throws if either ever stops fitting.
9. **ch05's recordings:**
   - No photo is attached in the recording: the Flutter web build cannot (the app's photo store uses `dart:io`/`path_provider`), and the sandbox's
     "report photos" are text placeholders. A phone build (Android/iOS) and a real photo would allow a re-record with the photo step.
   - Report #7's AI suggestion is the one the sandbox's seed stored ("design-sample"); no AI endpoint runs there. The resident's new report (#13) is a
     different report from #7, as in the old ch05.
   - Headless Chromium draws the native location list outside the page, so the recording shows the field's value stepping through the options
     with no visible list; the browser's tap highlight is turned off for the capture (it is not the app's).
   - The frames are committed (51 MB). A re-record (`node tools/record_app.mjs`) gives different timings; the scene derives every key from the logs,
     but the review loop must be run again.
10. **The effects' level solver reaches across a chapter.** `Film.finalize()` matches each class's EQ to the average of all its events, then lowers events
    with an iterative limiter. Taking one effect out (ch07's lock note slide) moved the 'move' and 'hit' averages by up to 1 dB in a few bands, and the
    limiter then settled differently in 7.4-7.6's dense run: the copies' slides and clicks, the count and "BÁO LỖI NGAY."'s slide moved -2.3 to +4.1 dB
    (`docs/review_log.md`, "ch07: the payoff as a match cut"). Every check passes; a listen would tell which balance is better. To keep a change local,
    freeze the class spectra or limit per window.
11. **The no-repeat rule (2026-10-04) has been applied to ch07 only.** The other chapters have not been audited against it. Text inside screenshots and
    recordings needs eyes (no tool reads it), e.g. wherever the app shows a report's text and its location together, as ch07's report does (question 4).
