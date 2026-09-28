# Review log

Scores are 1-10. **Hook**, **VN** (Vietnamese correctness: accents, line breaks), **Read** (readability at
1080p and in the 360 px phone test), **Motion**, **Brand**, **Voice** (voice sync), **Variety**.
Target: every applicable score 8 or higher before anything is shown.

## Summary: final scores per chapter

The last round of each chapter, re-checked by the director at integration: the review sheets (contact and 360 px
phone), full-resolution stills where needed, and the cut from the previous chapter (`node tools/boundary.mjs chNN`).
Each chapter's rounds are in `docs/review/chNN.md`; ch01's are under gate 4 below.

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Rounds | Status |
|---|---|---|---|---|---|---|---|---|---|
| ch01 Hook | 8 | 9 | 8 | 9 | 8 | 8 | 8 | 3 | approved at gate 4; frames unchanged by gate 5 (0 px) |
| ch02 Problem | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 4 | integrated |
| ch04 Who hurts | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 3 | integrated |

## Gate 1: style frames (2026-09-28)

All three frames show the same beat so they compare like for like: ch07, the moment an edited record
is caught ("Phát hiện sai lệch toàn vẹn"). They are stills, so **Motion** and **Voice** are n/a until gate 4.
Test per round: full 1920x1080 render, plus a Lanczos downscale to 360 px wide, viewed at that size.

### Round 1

| Frame | Hook | VN | Read | Motion | Brand | Voice | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| A transit v1 | 7 | 8 | 6 | n/a | 8 | n/a | 7 | a branch crossed the "Sổ quỹ công khai" label; the card's grey rows unreadable at 360 px; red connector wandered across the frame |
| B isotype v1 | 6 | 9 | 6 | n/a | 7 | n/a | 6 | paper read grey; pictograms too small at 360 px; "≠" floating with empty top-right |
| C bass v1 | 9 | 8 | 7 | n/a | 6 | n/a | 8 | no brand navy; black strip far wider than its line; the card's grey rows unreadable at 360 px |

Fixes:
- All: crop the explorer card to its header row only (title + badge, white interior 700,1198 1480x126 @2x) at 1.2x.
  Badge text is 31 px at 1080p; the rows that failed the phone test are gone.
- A: mirrored the map so the edited record sits directly above the verdict badge; the red link is now a short drop.
- B: warmer, lighter paper (#F7EFDD, grain at 60 %); pictograms at 1.25x; removed the floating "≠".
- C: the four copies in brand navy; black strip trimmed to its text; second line up to 150 px.

### Round 2

| Frame | Hook | VN | Read | Motion | Brand | Voice | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| A transit v3 | 7 | 9 | 8 | n/a | 9 | n/a | 7 | calm to the point of flat: one colour for everything, nothing signals alarm at the station |
| B isotype v2 | 7 | 9 | 8 | n/a | 8 | n/a | 7 | two table rows read as a slide; no pattern for the eye to catch; empty band above the card |
| C bass v2 | 9 | 8 | 8 | n/a | 8 | n/a | 8 | (none below 8) |

Fixes:
- A: sealing branches in brand orange (the four copies) against the navy route; the edited station's ring turns red;
  headline to 132 px.
- B: one pattern-breaking row: four identical sealed copies, "≠", then the odd red book; pictograms at 1.6-1.9x.
- B: widened house spacing so the four hashes don't touch.

### Round 3

| Frame | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| A transit v4 | 8 | 9 | 8 | n/a | 9 | n/a | 8 | reads left to right: copies, station, red hash, verdict |
| B isotype v3 | 8 | 9 | 8 | n/a | 8 | n/a | 8 | the odd-one-out row carries the idea even at 360 px |
| C bass v2 | 9 | 8 | 8 | n/a | 8 | n/a | 8 | rough-edge filter leaves every diacritic intact (Ử, É, Á, Ỗ checked at 100 %) |

All applicable scores are 8+. Stills: `docs/style/a-transit.png`, `b-isotype.png`, `c-bass.png`, side by side in `compare.png`.

## Gate 4: ch01 hook (2026-09-28)

Timing is the 3 syllables/s estimate (`docs/vo_timings.json`, source "estimate"); voice sync is judged against those
anchors and re-flows when the L04-L08 test read arrives. Test per round: `node tools/review.mjs ch01`, which renders the
960x540 30 fps draft, then a 2 fps contact sheet and a 360 px phone sheet, plus every-other-frame strips around the
fast beats (cut, drop, tear, slam).

### Round 1

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| ch01 v1 | 7 | 9 | 8 | 7 | 8 | 6 | 8 | complaint scrolled off ~1.1 s before the voice says "trôi mất"; first 1.5 s was a small bubble quietly popping on black; the tear read as a spiky comic splat, not torn paper |

Fixes:
- Voice sync: the bubble cadence is now solved in `build`. It searches the opening interval so the complaint leaves
  the frame on "trôi" (L01, syllable 7), and it stays in sync when the timeline re-flows.
- Hook: the complaint slams in (scale 1.25 → 1) at 72 px and keeps a hand-placed −1.5° tilt.
- Tear: slow lobes plus fine fibre jitter instead of spikes, and a thin cream fringe like a real torn edge.
  The question grew to 340 px.

### Round 2

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch01 v2 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | exit lands on "trôi"; tear reads as ripped paper; complaint legible at 360 px; stacked diacritics (Ề, Ỹ, Â) intact under the cut-text filter |

All scores are 8+. Also checked: the same frame renders pixel-identically twice, and a frame from the parallel render
matches a standalone still (37.4 dB PSNR; the difference is draft compression).

### Round 3 (polish)

The tear was on screen for about 0.1 s before black took the frame, so the signature torn-paper beat went by unseen.
It now starts in the breath after L02 and opens in two stages: the ragged hole with its cream fringe eats through the
figure for about 0.4 s, then swallows the frame, then a beat of black before the slam. Scores unchanged (motion 8 → 9).

## Gate 5: chapters ch02-ch11 (2026-09-28)

Each chapter was built by its own builder against `docs/ANIMATION_GUIDE.md` and reviewed in rounds until every score
was 8 or higher (`docs/review/chNN.md`). Timing is still the 3 syllables/s estimate. At integration the director
re-ran `node tools/review.mjs chNN --workers 2` (with `--tail` for chapters that own an exit), viewed the sheets, and
checked the cut from the previous chapter with `node tools/boundary.mjs chNN`.

### ch02 Problem

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch02 v4 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | skyline + 1.363 counted digit by digit on the voice; push into a tower; 745-cell façade with 129 cells to orange; 36% strip cut, piece to navy; 13 of 25 "quỹ" boxes cut out; black report sheet with red stamp, flipping into ch03 |

Director's check: an orange field with a scissor-cut edge covers ch01's held question by +0.36 s (boundary strip), and
one figure owns each shot, so the stats never stack into a wall. The report sheet ends exactly at `SHEET` and turns
edge-on as ch03's navy card opens out of it (33.67 → 33.77 s). Accepted deviations: the report sheet is black paper
(a cream sheet on the contract's cream ground wouldn't read); the red tag is DISPLAY 100, not 64, as the frame's key
message. Text check: 18 texts, none under 28 px. Render cost is the film's highest (the skyline), which is acceptable.

### ch04 Who hurts

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch04 v3 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | three orange panels with cut-paper figures; each pain flips to its navy answer on the voice; doors exit into ch05 |

Director's check: the black curtain (three strips) covers ch03's held TAM/SAM/SOM frame by +0.5 s and the panels swing
in on their strings; pain tags and answers read on the phone sheet; the doors exit cleanly onto ch05's cream by +0.7 s.
Accepted deviations: role names at 72 px (not 64) for the phone; answer 3 takes an extra line break to fit the 520 px
panel; pain 3 lands one syllable early, on "nhưng", so it gets about 1 s before its flip. Text check: 18 texts, none
under 28 px.
