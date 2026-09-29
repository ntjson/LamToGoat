# Review log

Scores are 1-10. **Hook**, **VN** (Vietnamese correctness: accents, line breaks), **Read** (readability at
1080p and in the 360 px phone test), **Motion**, **Brand**, **Voice** (voice sync), **Variety**.
Target: every applicable score 8 or higher before anything is shown.

## Summary: final scores per chapter

The last round of each chapter, re-checked by the director at integration: the review sheets (contact and 360 px
phone), full-resolution stills where needed, and the cut from the previous chapter (`node tools/boundary.mjs chNN`).
Each chapter's rounds are in `docs/review/chNN.md`; ch01's are under gate 4 below.

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Rounds | Status |
|---|---|---|---|---|---|---|---|---|---|
| ch01 Hook | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 4 + 2 sound | sound: the approved sketch, in the film mix |
| ch02 Problem | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 9 + 2 sound | sound: 184 cues on the frames; D minor bed |
| ch03 Market | 9 | 9 | 8 | 8 | 8 | 9 | 8 | 8 + 2 sound | sound: soft stab on SAM |
| ch04 Who hurts | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 6 + 2 sound | sound: a chime as each pain turns |
| ch05 Demo 1 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 7 + 2 sound | sound: opens to major, bell on T.conf |
| ch06 USP 1: before approval | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound | sound: stab on "1", alarm on "VƯỢT KHUNG" |
| ch07 USP 2: after publication | 9 | 9 | 8 | 8 | 8 | 9 | 9 | 6 + 2 sound | sound: stab on "2", alarm, the bow under the push |
| ch08 Competition | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound | sound: driving, stab on "CÓ CẢ HAI." |
| ch09 Business | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound | sound: stairs climb into the stab |
| ch10 Team | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 8 + 2 sound | sound: two-feel, stab on "ĐỘI KAWAIBU" |
| ch11 Close | 9 | 9 | 8 | 8 | 9 | 9 | 8 | 7 + 2 sound | sound: the final chord rings to 180.0 s |

Since 2026-09-28 the film has no voice-over, so the **Voice** column (voice sync) became **Sync**: cuts and SLAMs
on the 108 BPM grid, and every text holds long enough to read. Since the sound pass (2026-09-29) **Sync** also
covers the sound: every hit on the frame where its event happens, the music on the grid. Whole film: `out/roughcut.mp4`
(960×540, 30 fps, 5,400 frames, exactly 180.0 s, silent); with the mix, `out/roughcut_sound.mp4` and
`out/preview_1080p.mp4`. Their checks are in the last sections below.

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

### ch03 Market

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch03 v3 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | navy card flips out of ch02's sheet; 20.000đ counts on the voice; "KHÁCH HÀNG" + a 700-window slab filled to 300, then 700; TAM ⊃ SAM ⊃ SOM nested and counted, SAM on "ba mươi hai phẩy bốn" |

Director's check: the flip meets exactly (same centre, same tilt, edge-on at `FLIP_EDGE`). The chapter reads as three
clean ideas (price, customer, market), with at most three figures in the market shot. Weakest moment: the navy card is
nearly blank for about 1.5 s after the flip, carried only by the small B2B2C tags. Acceptable, and worth a look at gate 6
with the real voice. Text check: 18 texts, none under 28 px.

### ch04 Who hurts

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch04 v3 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | three orange panels with cut-paper figures; each pain flips to its navy answer on the voice; doors exit into ch05 |

Director's check: the black curtain (three strips) covers ch03's held TAM/SAM/SOM frame by +0.5 s and the panels swing
in on their strings; pain tags and answers read on the phone sheet; the doors exit cleanly onto ch05's cream by +0.7 s.
Accepted deviations: role names at 72 px (not 64) for the phone; answer 3 takes an extra line break to fit the 520 px
panel; pain 3 lands one syllable early, on "nhưng", so it gets about 1 s before its flip. Text check: 18 texts, none
under 28 px.

### ch05 Demo 1

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch05 v3 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | logo + line; navy façade, push into one window where the app screens change on the voice (5.3a-c, 5.4); AI suggestion with orange brackets under the words; named manager "Kawaibu", confirm panel and the accountability chain revealed step by step |

Director's check: ch04's doors part onto ch05's cream by 63.1 s and the logo lands on "Làm Tổ". Every plate comes from
`docs/crops.json` via `kit.plate` (5.3a-5.6d), straight, on hard navy backings or in the window. Brackets sit under the
UI words, never on them, and no test string appears. Text check: 10 texts, none under 28 px. Notes: the logo sits on
`ctx.top` so its pixels match the file exactly. The shotlist's LABEL 52-64 lines pass the phone sheet, but only "AI GỢI Ý"
is 100 px or larger; revisit sizes at gate 6 if the phone test disagrees.

### ch06 USP 1: before approval

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch06 v4 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | black cover + "1"; "TRƯỚC KHI / DUYỆT CHI" rises out of an orange layer bar; the example price band (18–34tr, "Ví dụ") grows on the voice; the 46tr quote slides and jolts past it, the overrun tears red, "VƯỢT KHUNG" slams; a scissor cut clears the frame; "AI GỢI Ý." / "NGƯỜI QUYẾT ĐỊNH." with a navy strip under the decision |

Director's check: the cover (`kit.cover`) passes over ch05's top-layer plates and has covered them by +0.4 s. The
chapter is drawn paper only and never looks like an app screen; "Ví dụ" is on screen whenever an example figure is.
The six numeric labels in 6.4 are the scale's tick labels plus the band and the quote, which read as one diagram,
not a wall of numbers. Two devices beyond the shotlist are accepted: the orange layer bar (6.2) and the navy strip
under "NGƯỜI QUYẾT ĐỊNH." (6.5), which echoes ch05's navy tag. The chapter ends on its black ground with nothing on
its top layer, as ch07's tear expects. Text check: 18 texts, none under 28 px.

### ch07 USP 2: after publication

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch07 v4 | 8 | 9 | 8 | 8 | 8 | 9 | 9 | cream tear over ch06, the "2" on a navy layer-two bar; publish lock, checkbox and button plates with the NIÊM PHONG seal; a façade window on the verified expense, scrolled to the chain with a bracket climbing 4 → 1, then the original report with the hook's bubble snapping flush (the loop); MÃ BĂM and four navy copies, the red edit, SỬA LÉN? / BÁO LỖI NGAY. on the verified → mismatch cut; push onto the red badge |

Director's check: the tear takes ch06's black frame from 105.45 s; every plate comes from `docs/crops.json` via
`kit.plate`, including the zoom-2 push plate. A pixel diff across the explorer's hard cut shows changes only inside
the badge (the pair is pixel-matched), and only the integrity card is ever in frame. The loop pays off: the complaint
bubble is ch01's construction (same text, seed 11) and lands under "Phản ánh gốc". Accepted additions from the voice's
own subtitles: "LẦN / NGƯỢC" (L24) and "MÃ BĂM" (L25), so 7.3 and 7.4 have readable type on the phone. Text check:
14 texts, none under 28 px.

### ch08 Competition

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch08 v4 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | cream cover with the two orange criteria columns; five competitor strips stop short of the first column, one per beat; the navy LÀM TỔ strip runs through both and is punched where it crosses them; the five strips fall away; "LÀM TỔ / CÓ CẢ HAI." slams; the navy strip grows over the frame (exit) |

Director's check: the cover (`kit.cover`) passes over ch07's pushed badge plate by +0.33 s, with the columns riding
it on the top layer and then swapping down. The source caption rides with the strips (not in a corner). The exit
leaves a solid navy frame that matches ch09's first frame (0 px difference, per the builder). Column labels are the
shotlist's 40 px: legible, not strong, on the phone. Text check: 12 texts, none under 28 px.

### ch09 Business

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch09 v3 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 500 windows light orange on the same spring as "10 TRIỆU/THÁNG"; the bar cut at 59,2 % (counted on the voice); "200 TRIỆU" + the timeline, the break-even flag at 08/2027 typed on the syllables; a four-step staircase GĐ0-GĐ3 with "20–25 TÒA" and "MRR 160–200 TRIỆU" counted |

Director's check: ch08's navy strip fills the frame by +0.3 s and ch09 is full navy underneath until its façade rises.
At most three figures on screen at a time. The exit slides the staircase's cream sheet out left behind a hand-cut
edge; the frame is black by +0.42 s, under ch10. Accepted deviations: the hard cut to cream lands on "hai" (with the
"200 TRIỆU" slam) instead of in the breath, so there's no empty frame; the capital is not drawn as an 8-month span,
because 8 months from 10/2026 ends before the 08/2027 break-even and a span would imply something the deck doesn't
say. Text check: 26 texts, none under 28 px.

### ch10 Team

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch10 v4 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | five name bands slide in from alternating sides, in the order the voice names the schools; the stack closes up and "ĐỘI KAWAIBU" slams; both sides settle to one edge on "kết hợp" |

Director's check: black ground under ch09's exit, first band after it. Names, roles and schools exactly as the deck's
"Đội ngũ" slide, with stacked marks (Ễ, Ạ, Â, Ư, Ộ) intact at 100 %. This chapter's builder found the cut-text
filter bug, fixed film-wide in 259a4c4. Role and school lines are 40 px, above the shotlist's 36. Text check: 11 texts,
none under 28 px.

### ch11 Close

| Chapter | Hook | VN | Read | Motion | Brand | Voice | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch11 v4 | 8 | 9 | 8 | 8 | 9 | 8 | 8 | orange-led cream wipe over ch10; the logo (whole, on cream, 559 px) lands on "Làm"; three cut-paper credit bars on "sổ", "ai", "được"; a navy façade strip rises and its windows light; still hold to 180.0 s |

Director's check: the wipe covers ch10's held frame by +0.65 s (under the 0.7 s underlap). The logo is the file as-is
on `ctx.top`. Credits come from the deck (slides 7 and 15) and the README. The final frame works as the poster at
1920×1080. The credits are small on the 360 px phone sheet at the shotlist's sizes; the logo carries the frame. Text
check: 3 texts, none under 28 px.

### Continuity pass (whole film)

`node render.mjs --out out/roughcut.mp4 --workers 10`: 5,400 frames in 159 s, no errors with all eleven chapters
loaded. Checks:
- **Rhythm** (`uv run --with numpy python tools/stillness.py out/roughcut.mp4`): no hold longer than 2 s anywhere.
  Longest gaps between clear visual events: 3.5 s (ch09, the MRR count), 3.0 s (ch05, the AI suggestion), 2.5 s
  (ch02, ch06); everything else is under 2.5 s. That meets "a new visual event every 3-4 s".
- **Transitions:** all ten cuts checked with `tools/boundary.mjs`.
  - Covers: ch02, ch04, ch06, ch07, ch08, ch11. The ch06 and ch08 covers pass over the UI plates of ch05 and ch07.
  - Exits: ch02's flip, ch04's doors, ch08's navy growth, ch09's slide-out.
  - None leaves a gap, a double frame or a stray element.
- **The loop:** the hook's complaint bubble returns word for word under "Phản ánh gốc" at 116 s (ch07, shot 7.3).
- **Look:** 1 fps sheets of all 180 s (`out/review/film_0-2.png`) read as one film.
  - The problem half is orange/black and the solution half cream/navy.
  - Red appears only for missing receipts, the over-limit quote, the edit and the alarm.
  - No fades, corner labels, frame borders or glow.
- **UI plates:** ch05 and ch07 use all 18 crops of `docs/crops.json`, all from the @3x/@4x/@5x set, through
  `kit.plate`. The smallest UI text is 28.6 px.
- **For gate 6** (with the real voice): phone readability of the shotlist's 36-48 px supporting labels (ch03 tags,
  ch04 descriptors, ch08 column labels, ch11 credits); ch03's nearly blank card for 1.5 s after the flip; and every
  voice-anchored beat, which will re-flow when the takes are measured.

## Gate 6 notes on the silent rough cut (2026-09-28)

The user's notes on `out/roughcut.mp4`, fixed before the voice arrives. Each changed chapter was re-rendered with
`node tools/review.mjs chNN` (contact sheet, 360 px phone sheet, strips around the change) and re-scored; every
score is 8 or higher. Details are in each chapter's review file.

| Note | Chapter | Fix | Scores after |
|---|---|---|---|
| ~145 s: margin reads "59,2" without "%" | ch09 | "59,2%" is one odometer, the "%" a fixed slot; the figure stamps on "phần trăm" | 8/9/9/8/8/9/8 |
| ~137 s: only "LÀM TỔ" before the cut | ch08 | "CÓ CẢ HAI." lands no later than 1.3 s before the exit; the full claim holds ~1.35 s | 8/9/9/8/8/8/8 |
| ~18-20 s: source still typing at the cut | ch02 | the source types in 0.4 s from "thương mại", complete 2 s before the cut | 8/9/8/8/8/9/8 |
| ~150-152 s: "08/2027" still typing | ch09 | the date types on in 0.3 s as the flag lands and pulses when it is read | (as above) |
| ~34 s: navy card sits blank | ch03 | the 20.000đ count starts as the card lands and locks on "hai" (…19.999 → 20.000) | 9/9/8/8/8/9/8 |

## No voice-over: text on screen, reading timeline, beat grid (2026-09-29)

The film is now music and sound effects only.
- **Timeline:** `docs/timeline.json` is built from on-screen reading time (`tools/timeline.py`,
  `docs/onscreen.json`) on a 108 BPM grid. The film is **188.9 s (3:08.9), 85 bars**.
  - Measured on the result, there are 11.9 characters of text per second of hold on average, and 15-19 on the
    busiest beats (L33, L35, L01, L05).
  - At 3:00 those beats would need 20-23 characters/s.
- **Text check:** every story beat L01-L35 was checked against the frame. Where the message was only spoken, text
  was added as DISPLAY type or a caption strip in the Bass style, never as a bottom subtitle:

| Beat | Chapter | Added on screen | Why |
|---|---|---|---|
| L01 | ch01 | "PHẢN ÁNH GỬI VÀO / NHÓM CHAT," + "RỒI TRÔI MẤT." (ORANGE strips on the chat, DISPLAY 96/140) | the chat showed a lost message, but no words said it |
| L02 | ch01 | "SỐ DƯ QUỸ LẶNG LẼ THAY ĐỔI." (BLACK strip over the balance, DISPLAY 112) | the change was shown; "quietly" was only spoken |
| L14 | ch04 | pain tag "Đóng phí, nhưng / không rõ tiền đi đâu" | the tag dropped "residents pay fees" |
| L16 | ch05 | "CƯ DÂN GỬI / PHẢN ÁNH" (DISPLAY 120) | the frame showed what, not who |
| L17 | ch05 | tags "nhóm sự cố", "mức khẩn", "hạn xử lý" under the brackets | the UI words were too small for the phone |
| L20 | ch06 | "AI đưa ra khung giá hợp lý / từ những việc tương tự đã làm" | the band didn't say AI makes it, or from what |
| L23 | ch07 | "khoản chi được niêm phong, / không thể chỉnh sửa" | only in the UI's small text |
| L24 | ch07 | "Cư dân" + "từ khoản chi / về phản ánh ban đầu" around "LẦN / NGƯỢC" | who traces, from what to what |
| L27 | ch07 | "KHÔNG AI XÓA / ĐƯỢC DẤU VẾT." (DISPLAY 150) | 7.7 had no type |
| L28 | ch08 | "CHƯA ĐỐI THỦ NÀO CÓ" (DISPLAY 112) | the claim was only spoken |
| L31 | ch09 | "CẦN 200 TRIỆU" (was "200 TRIỆU") | it read like revenue, not capital needed |
| L34 | ch10 | "Công nghệ kết hợp / kinh doanh và tài chính." (LABEL 64) | only spoken |
| L35 | ch11 | "SỔ QUỸ KHÔNG AI / SỬA LÉN ĐƯỢC." (DISPLAY 128) | the closing promise was only spoken |

The other 22 beats already carried their message on screen. Two supporting texts were also enlarged because they
now carry story: ch08's column labels (40 → 48 px) and ch06's privacy sentence (34 → 48 px).

Each chapter was re-timed to the reading timeline and snapped to the grid, and passed its own review loop (every
score 8+; rounds in `docs/review/chNN.md`). Director's checks on the whole rough cut:
- **Boundaries:** all ten cuts are clean (`tools/boundary.mjs`).
- **Holds:** no shot holds still for more than 2 s.
- **Longest gaps between visual events:**
  - Counting small events too (`tools/stillness.py --event 8`), the longest gap is **2.1 s**.
  - The default threshold misses smooth slides and small type, so it reports 4.4 s at ch06's end (the navy strip
    slides in at 111.4 s) and 3.7 s in ch02 (cells flipping in the 745-cell shot).
- **Changes to the approved shotlist by the builders, all accepted:**
  - ch03: the unit stays on the count from its first frame.
  - ch05: the suggestion card sits in a navy paper pocket so the tags cover no UI text.
  - ch07: the pushed badge rests 60 px lower.
  - ch09: shot 9.3 holds instead of pushing in.

## Exactly 3:00: holds trimmed, reading time kept (2026-09-29)

The user asked for exactly 3:00, cut from breaths and holds, never from reading time; the busiest shots stay at a
relaxed pace. 3:00 at 108 BPM is exactly 81 bars, so four bars (8.9 s) had to go from the 85-bar cut.
- **Reading pace:** fixed at the approved 3:09 value (factor 0.82).
- **Timeline rule:** `tools/timeline.py` now trims whole bars from **holds** only: shots that stayed up longer than
  their text needs because their animation had been given more time. The gentlest squeeze goes first.
- **Never trimmed:**
  - the 17 shots whose length is set by their text (all the busiest ones), which keep every frame
  - the transition breaths, where the wipes, covers and flips play
  - the breaths between shots
  - the end hold

| Chapter | Bar taken from | Lowest hold kept | Length |
|---|---|---|---|
| ch05 Demo 1 | L15 −0.56 s, L16 −0.56 s, L17 −0.28 s, L18 −0.83 s | 83 % | 20.0 → 17.8 s |
| ch02 Problem | L04 −0.83 s, L06 −0.56 s, L08 −0.83 s | 78 % | 22.2 → 20.0 s |
| ch09 Business | L30 −1.11 s, L31 −1.11 s | 78 % | 20.0 → 17.8 s |
| ch03 Market | L10 −1.11 s, L11 −1.11 s | 76 % | 15.6 → 13.3 s |

Checks:
- **Untouched chapters:** ch01, ch04, ch06, ch07, ch08, ch10 and ch11 only start 1-4 bars earlier. The same 35
  chapter-local frames render pixel-identical under both timelines. This needed full-precision times in
  `timeline.json`; 4-decimal rounding had moved fast edges by a fraction of a pixel.
- **New `tools/readcheck.mjs`:** measures, frame by frame, how long each text is actually readable (visible, full
  size, in frame, not covered by paper) against the reading model.
  - At 3:09 every text passed.
  - At 3:00 two texts in trimmed shots fell short: ch02's stamp (1.00 s, needs 1.07) and ch03's "có Ban quản trị"
    (1.17 s, needs 1.24). Both were still timed to syllables of the old voice line. They now land earlier and are
    readable for 1.43 s each.
  - Now every text in all 11 chapters passes.
- **The busiest shots** (L33 the team, L35 the end card, L01 the hook, L05, L14, L28, L32) are unchanged, frame for
  frame.
- **Rough cut:** `out/roughcut.mp4` is 5,400 frames at 30 fps = 180.0 s. All cuts next to trimmed chapters are
  clean (`tools/boundary.mjs`). No shot holds still over 2 s, and the longest gap between visual events is 2.2 s.

## Sound pass: music and effects for the whole film (2026-09-29)

The film's sound, built on the approved ch01 sketch and the shotlist's Sound section: everything synthesized in
`tools/sound.py`, the effects on the scenes' own cues (`cues()` in every chapter, one vocabulary in
`docs/ANIMATION_GUIDE.md`, section 12), the music on the timeline's grid. The pictures did not change: every
chapter's `cues()` was proven pure (202 sampled frames before and after, `magick compare -metric AE` = 0), and the
timeline is untouched, so every reading hold is as before. **VN, Read and Motion carry over. Hook, Brand and
Variety keep the picture's scores: the mix was checked by measurement and by reading the score, not by ear.
Sync now covers the sound.**

What plays:

| Ch | Music | Stabs and alarms | Effects |
|---|---|---|---|
| ch01 | the approved sketch, note for note: walking bass in D minor, brushes from bar 2, the drop's falling note | the question: piano D-F-A-Bb-D, bass, brush crash | 20 cues: bubbles, captions, scissor, split, slide, snips, tear |
| ch02 | D minor, sparse: walking bass and brushes, as ch01 | none | 184: wipes, 24 pitched slab thumps, the 1.363 count and its locks, 129 cell ticks, cut, slide, scissor, lift, 13 snips, clip click, stamp |
| ch03 | Autumn Leaves in D minor | soft stab (piano) on SAM, a deceptive Bbmaj7 | 19: flip, tag slides, the 20.000đ count, arrow snap, slab, slam, 3 pins, window sweeps, TAM/SAM/SOM (descending), counts |
| ch04 | D minor; an A-E vibraphone chime as each pain turns into its answer | none | 28: curtain wipe and thud, panels, snaps, pins, the ✓ stamp, the manager's chat (bubbles), flips, lift, the doors into ch05 |
| ch05 | opens to D major on a vibraphone chord as the doors part; vibraphone comping | none | 34: slides, slams, the window's creak, screen cuts, the "Gửi phản ánh" click, snap and small bell on T.conf, brackets, stamp, chain ticks |
| ch06 | D major; A7 through the overrun, resolving on "NGƯỜI QUYẾT ĐỊNH." | "1" (Dmaj9); alarm on "VƯỢT KHUNG" (low brass Bb/E then A/Eb, snare) | 27: cover, slides, bar, rises, pan, tick clicks, "Ví dụ" pin, rising tone with the band, count, friction and thud, tear, scissor, split, slams |
| ch07 | G major; a warm Cmaj9 as the hook's bubble snaps flush (the loop); at the push the band stops and a bowed A holds to ch08 | "2" (G6/9); alarm on the verified → mismatch cut | 43: tears, rises, slides, checkbox click, seal stamp, snap, doors, scroll, climb, cut, bubble, four copies with lock clicks, count, sly slide and scratch, slams |
| ch08 | driving: B minor to D, ride, feathered kick, comping piano, skip notes in the bass | "CÓ CẢ HAI." (D add9) | 21: cover, slams, label snaps, five strips with stop-thuds, the navy strip, two punches, flutter, the exit's whoosh |
| ch09 | driving in D; four stair thumps climb D-E-F#-G into the stab | "20–25 TÒA" (Gmaj9, pushed on the "and" of 4) | 22: rise, counts, window sweep, slams, snip, flip, hard cut with the "CẦN 200 TRIỆU" stamp, slide, flag snap, tick, pans, stair thumps, MRR slide and count |
| ch10 | resolving: two-feel bass, whole-bar vibraphone chords | "ĐỘI KAWAIBU" (D6/9) | 10: five band slides, each panned to its side, the close, L34's lines, the glide |
| ch11 | A7sus to the final D6/9 (piano, vibraphone, bass, soft crash) on the logo's landing, ringing to the 30 ms cut at 180.0 s | none | 10: wipe, logo slide, the promise's two slams, three credit slides, the façade's rise, the windows' sweep |

Every shot's SFX column is covered, with two exceptions: 3.2's "stamp" (nothing is stamped there since the unit
shows from the count's first frame; the count's lock is the hit) and 8.3's "thud" (nothing lands heavily; the five
stop-thuds of 8.2 carry it).

Checks (tools/soundcheck.py, tools/synccheck.mjs, ffmpeg):
- **Loudness.** `out/sound/film.wav` -14.0 LUFS integrated, true peak -1.2 dBFS (ebur128). Its AAC 320 kbps
  encode, as `render.mjs` muxes it: -14.0 LUFS, true peak -1.2 dBFS (ebur128); loudnorm -14.10 LUFS, -1.17 dBTP.
  Chapters -12.7 (ch07, ch08) to -15.9 LUFS (ch03): the problem half a little under, the driving half over, the
  close falling away.
- **ch01 kept as approved.** The film's ch01 slice matches the sketch to within 0.2 dB of gain; the rest of the
  difference is the limiter treating a few transients differently (residual -35 dB overall, -28 dB at worst, on
  the stab). `tools/sound.py --chapters ch01 --no-aac-check` rebuilds the handoff's file byte for byte.
- **Grid and harmony.** All 342 notes the music plays sit within 0.04 ms of a beat or a swung 8th; none of the 84
  piano and vibraphone chords has a note outside its bar's chord and tensions.
- **Sync, sound side.** The mix has an onset within 12 ms of all 304 hit-type cues (median +0.2 ms, 95 % within
  4.3 ms). The muxed AAC lines up with the WAV at 0 samples (cross-correlation).
- **Sync, picture side.** All 71 appearance cues (SLAMs, stamps, captions, pins, bubbles, hard cuts, punches)
  start on their frame at 60 fps. The sync sheets (`out/review/sync_chNN.png`: the frame before and the frame at
  every stab, alarm, slam, stamp and cut) show each one landing with its type or picture.
- **Balance.** Each effect stands over the bed at its moment about as far as ch01's do (slams +1 to +8 LU, stamps
  +5 to +7, most slides +1 to +4). Fast runs stay down as texture: the 13 snips 3 LU under the bed, and the 129
  cell ticks at about the brushes' level in their own band (2.5-6 kHz, median -0.5 dB): a light crackle.
- **Deterministic.** Two runs give identical bytes.

### Round 1 (the first whole-film mix)

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| ch01 | 8 | 9 | 9 | 8 | 8 | 8 | 8 | none: the sketch, unchanged |
| ch02 | 8 | 9 | 8 | 8 | 8 | 7 | 8 | the 129 cell ticks buried, 22 LU under the bed; the AAC encode rings to -0.1 dBTP on the snips |
| ch03 | 9 | 9 | 8 | 8 | 8 | 7 | 8 | pins, arrow snap and window sweeps under the bed; the slab thump on D over Fmaj7 |
| ch04 | 8 | 9 | 8 | 8 | 8 | 7 | 8 | the chime's D against A7's C#; snaps and pins under the bed |
| ch05 | 8 | 9 | 8 | 8 | 8 | 7 | 8 | snaps (-7 LU), chain ticks (-8) and the click (-15) under the bed |
| ch06 | 8 | 9 | 9 | 8 | 8 | 7 | 8 | rises 10 LU under the bed; the walking note rings on under the "1" stab and the alarm |
| ch07 | 9 | 9 | 8 | 8 | 8 | 7 | 9 | rises and climbs under the bed; the walking note rings on under the alarm and the push |
| ch08 | 8 | 9 | 9 | 8 | 8 | 7 | 8 | label snaps 10 LU under the bed, flutter 6 under |
| ch09 | 8 | 9 | 9 | 8 | 8 | 7 | 8 | the flag snap 11 LU under; the last stair thump (G) on F#m7; the walking note under the stab |
| ch10 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | the two-feel held a chromatic C under Dmaj7 for two beats |
| ch11 | 9 | 9 | 8 | 8 | 9 | 8 | 8 | the windows' sweep fell in pitch instead of climbing |

Fixes, all in `tools/sound.py`:
- Levels: each effect type measured against the bed at its moment and set toward ch01's contrast (snaps, ticks,
  rises, clicks, pins, doors, flutter +4 to +6 dB, cells +11 dB); the comping, ride and kick 2-3 dB down. ch01's own
  recipes untouched.
- The bass: a stab's, an alarm's or the bow's note now damps the walking note under it (one bass); the walker no
  longer goes back and forth or repeats notes, and the two-feel's held note is diatonic.
- Harmony: the chime is A-E (a chord tone or tension over every ch04 chord); ch09's last half bar is A7sus, so the
  stair thumps' G is its 7th; ch03's slab thump is F, its bar's root.
- The sweep rebuilt from grains that climb; ch05's opening chord holds exactly its bar.
- Mastering: an exact true-peak stage, then an AAC check that lowers the PCM where the encode would pass
  -1.2 dBTP (it was -0.1 on the ch02 snips).

### Round 2

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch01 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | the sketch in the film mix, 0.2 dB quieter; 14/14 appearances on their frame |
| ch02 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | cells a light crackle at the brushes' level in their band; snips safe on AAC; 5/5 appearances; stamp on "KHÔNG KÈM CHỨNG TỪ" |
| ch03 | 9 | 9 | 8 | 8 | 8 | 9 | 8 | pins +1 LU over the bed; soft stab on SAM; 5/5 appearances |
| ch04 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | chimes on the answers' edge-on frames; 12/12 appearances |
| ch05 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | the major opening on the doors; bell on T.conf; 9/9 appearances |
| ch06 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | "1" and "VƯỢT KHUNG" on their frames; resolves on "NGƯỜI QUYẾT ĐỊNH."; 5/5 appearances |
| ch07 | 9 | 9 | 8 | 8 | 8 | 9 | 9 | "2", the loop's chord, the alarm on the badge's cut, the bow under the push; 8/8 appearances |
| ch08 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stop-thuds on the strips' stops; stab on "CÓ CẢ HAI."; 5/5 appearances |
| ch09 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stairs climb D-E-F#-G into the stab on "20–25 TÒA"; 5/5 appearances |
| ch10 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | bands panned to their sides; stab on "ĐỘI KAWAIBU"; 1/1 appearance |
| ch11 | 9 | 9 | 8 | 8 | 9 | 9 | 8 | the final chord on the logo's landing, ringing to the cut; 2/2 appearances |

Every score is 8 or higher. Review files: `out/roughcut_sound.mp4` (960×540, 30 fps, with the mix), per-chapter
clips with sound in `out/review/chNN.mp4` (contact and 360 px phone sheets beside them: unchanged pictures, text
check clean in all 11), `out/review/sound_chNN.png` (level, spectrogram, cue marks, score) and
`out/review/sync_chNN.png`; the whole film's analysis is `out/sound/analysis.png`.

### Round 3 (confirm: the 1080p preview, rendered from scratch)

`node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10`:
5,400 frames in 434 s, no errors.
- **ffprobe:** video H.264 High, 1920×1080, yuv420p, 30 fps, 5,400 frames (179.999 s), x264 crf=23.0 in all 94
  segments; audio AAC LC, 48 kHz stereo, 318 kbps, 180.000 s; container 180.000 s.
- **Loudness on the muxed file:** loudnorm input_i -14.10 LUFS, input_tp -1.17 dBTP, LRA 6.5 LU; ebur128 -14.0 LUFS,
  true peak -1.2 dBFS.
- **Sync:** the file's decoded audio lines up with `out/sound/film.wav` at 0 samples of lag (codec residual -33 dB).
- Scores unchanged from round 2: every chapter 8 or higher, Sync 9 throughout.

## Music bed: "Upbeat Jazz" by Francisco Alvear (Mixkit) (2026-09-29)

The user chose candidate 2 of four auditions as the film's music, in place of the synthesized score:
- stretched to exactly 108 BPM, extended to 3:00 by repeating sections at phrase boundaries on bar lines, with no
  audible seams, following the mood arc;
- every sound effect kept on its cue, the picture timeline untouched, remixed to -14 LUFS with true peak at or below
  -1 dBTP.

`CLAUDE.md`'s sound rule now allows this one track. Source and license are in `audio/music/SOURCES.md`, the
arrangement in `tools/bed.py`, the mix in `tools/sound.py --music bed`.

**The track at 108 BPM.** It plays at 110.005 BPM (±0.002, 6 ms beat jitter), and rubberband stretches it by 0.98177
(it then measures 107.997). Its form in 50 bars, from chord changes, low hits and a bar similarity matrix (the A/B
pair repeats every 15 bars):
- intro 1-9 (bar 1 fades in; two groups, 2-5 and 6-9)
- A1 10-17 | B1 18-24 | A2 25-32 | B2 33-39 | A3 40-47
- coda 48-49 | final chord 50

**What repeats, and where:**

| Film bars | Film time | Source bars | What plays | Chapters |
|---|---|---|---|---|
| 1-9 | 0:00.0-0:20.0 | 1-9 | the intro as recorded | ch01, ch02 |
| 10-17 | 0:20.0-0:37.8 | 2-9 | **repeat:** the intro's phrase | ch02, ch03 |
| 18-25 | 0:37.8-0:55.6 | 2-9 | **repeat:** the intro's phrase again | ch03, ch04 |
| 26-29 | 0:55.6-1:04.4 | 6-9 | **repeat:** the intro's second group | ch04 |
| 30-67 | 1:04.4-2:28.9 | 10-47 | the lift on ch05's downbeat, then A1 B1 A2 B2 A3 as recorded | ch05-ch09 |
| 68-78 | 2:28.9-2:53.3 | 33-43 | **repeat:** B2 and A3's first group | ch09, ch10, ch11 |
| 79-81 | 2:53.3-3:00.0 | 48-50 | the coda, final chord on the last bar (2:57.8), ringing to the cut | ch11 |

So in the film:
- sparse through ch04 (the intro: 29 bars);
- brighter from ch05 (the track's own lift on its downbeat);
- A3, the loudest section, from ch08, with the bed back from ch07's thin-out on the turnaround bar;
- ch10 resolving from B2 into A;
- ch11 ending on the coda.

**The five joins.** Each follows a bar that sounds like the one the incoming section follows in the recording, with a
10 ms equal-power crossfade ending 2 ms before the bar line. Where the intro restarts, a +3 dB ride easing to 0 dB
by its second group keeps it from dropping. Measured against the recording's own downbeats (spectral flux median
0.234, max 0.335; high-frequency burst max +1.2 dB; bar-to-bar level steps within ±3.6 dB):

| Join | Film bar (time) | Flux | HF burst | Level step | Beats around it |
|---|---|---|---|---|---|
| 9 → 2 | 10 (20.00 s) | 0.277 | +0.6 dB | -1.3 dB | on the grid; the intro plays straight 8ths |
| 9 → 2 | 18 (37.78 s) | 0.277 | +0.6 dB | -1.3 dB | as above |
| 9 → 6 | 26 (55.56 s) | 0.181 | -0.7 dB | +6.4 dB | as above |
| 47 → 33 | 68 (148.89 s) | 0.249 | +0.4 dB | +3.9 dB | 9 ms median |
| 43 → 48 | 79 (173.33 s) | 0.208 | +1.5 dB | +0.3 dB | 7 ms median |

Notes on the table:
- **The 9 → 6 step** is the song's own gesture: its pull-back bar 9 leads into an entry, as its lift does (+8.6 dB).
- **The 47 → 33 step** compares with +2.2 dB at 32 → 33 in the recording.
- **The 43 → 48 burst** is bar 48's own cymbal: +1.2 dB at that downbeat in the recording.
- **Beat tracking in the intro** locks onto the 8ths, half a beat off. The intro's onsets fall on the beat and on
  the 8th (0.92 and 1.00 by position), so the intro is on the grid.

**The mix.**
- **Levels:**
  - The bed at -17.5 dB. That puts its body at the old score's level: -18 LUFS median in ch05-ch09, at master gain.
  - The sparse intro +4 dB until a 20 ms ramp onto ch05's downbeat, so it sits about 5 dB under the body.
  - -2.5 dB eased in over ch10's first two bars, so ch10-ch11 settle.
- **Breaks:**
  - From ch01's drop to ch02 the bed dips out: the bass note falls, the question lands alone.
  - From ch07's push to ch08 it thins to a low-passed trace under one bowed note on its bass.
- **Effects** stay on their cues at their levels. Those that sound notes take them from what the bed sounds on
  their beat:
  - the stabs (piano over the bed's bass note, bass in two octaves, crash) and the soft stab;
  - the chimes, the climb (each step on its own beat), the bell, the rising tone and the loop's warm chord;
  - the skyline and stair thumps (the skyline an octave up, clear of the bed's bass).
- **ch11's `chord` cue is silent:** the bed's own final chord ends the film.
- **ch01's approved hits keep their notes:** D minor sits in the track's F.

**Checks** (measured, not heard):
- **Preview**, `out/preview_1080p.mp4`, rendered from a clean worktree at `a350881`:
  - Another session had uncommitted, mid-edit ch10 and engine changes: `cues.mjs` stopped on ch10 in the working
    tree. The clean build's cues, bed and mix are byte-identical to the ones reviewed.
  - ffprobe: H.264 High, 1920×1080, yuv420p, 30 fps, 5,400 frames (179.999 s), crf=23.0 in all 94 segments; AAC LC,
    48 kHz stereo, 320 kbps, 180.000 s; container 180.000 s.
- **Loudness on the muxed file:** loudnorm input_i -14.08 LUFS, input_tp -1.20 dBTP, LRA 8.9 LU; ebur128 -14.0 LUFS,
  true peak -1.2 dBFS. The loudness range grew from 6.2 LU: the sparse start against the body.
- **Sync:**
  - The file's audio lines up with `out/sound/film.wav` at 0 samples of lag.
  - The bed's tracked beats sit 6 ms (median) from the film's grid in ch05-ch11 (196 beats).
  - An onset within 12 ms of 301 of 304 hit cues. Three neighbours in ch02's 40 ms skyline run merge in the
    detector; those thumps stand 11.6 LU over the bed.
  - The cues and the picture are unchanged, so the 71 appearance cues still start on their frames.
- **Harmony:** 0 of the 22 notes and chords the cues play over the bed is a note the bed isn't sounding.
- **Balance:**
  - ch05-ch09: the bed sits where the old score sat, and each effect stands over it about as far as it did (slams
    +4 to +6 LU, stamps +4 to +7).
  - ch01-ch04: the effects lead more strongly, over the sparse intro.
- **Deterministic:** two runs of `bed.py` and of `sound.py` give identical bytes.

### Round 1 (the first bed mix, the bed at -20 dB)

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| ch01 | 7 | 9 | 9 | 8 | 8 | 8 | 8 | the bed -36 LUFS median: the opening is effects over near-silence |
| ch02 | 7 | 9 | 8 | 8 | 8 | 7 | 8 | 5 of 24 skyline thumps masked under the bed's bass; the intro loop restarts 4.2 dB down |
| ch03 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | the bed 12 dB under the old score; the second restart 4.2 dB down |
| ch04 | 7 | 9 | 8 | 8 | 8 | 8 | 8 | the bed barely heard under the chimes |
| ch05 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | the lift lands, but the body 2 dB under the old score |
| ch06 | 8 | 9 | 9 | 8 | 8 | 8 | 8 | the "1" stab read against the wrong beat's notes at a beat line |
| ch07 | 9 | 9 | 8 | 8 | 8 | 7 | 9 | two climb ticks off the bed's chord (voiced from the first tick's beat) |
| ch08 | 8 | 9 | 9 | 8 | 8 | 8 | 8 | the bed low under the driving section |
| ch09 | 8 | 9 | 9 | 8 | 8 | 8 | 8 | as ch08 |
| ch10 | 7 | 9 | 8 | 8 | 8 | 8 | 7 | the bed at full body level (3.5 LU over the effects): no resolving |
| ch11 | 9 | 9 | 8 | 8 | 9 | 8 | 8 | none new |

Fixes:
- **Levels:** the bed at -17.5 dB, the intro +4 dB, ch10-ch11 eased by 2.5 dB.
- **Seams:** the +3 dB ride on the intro's restarts.
- **Pitched thumps and ticks:** the skyline thumps an octave up; the climb voiced per step.
- **The notes' beat:** looked up with a 1 ms tolerance, so a hit on a beat line reads its own beat.

### Round 2

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch01 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | the track fades in under the chat; the bed dips out for the question |
| ch02 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | skyline thumps clear of the bed; the first restart at -1.3 dB |
| ch03 | 9 | 9 | 8 | 8 | 8 | 9 | 8 | soft stab on SAM on the bed's notes |
| ch04 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | the second group enters under L13 (the song's own entry); chimes on the bed's notes |
| ch05 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | the track's lift exactly on ch05's downbeat, as the doors part |
| ch06 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | "1" and "VƯỢT KHUNG" on their frames; the overrun over B1's darker bars |
| ch07 | 9 | 9 | 8 | 8 | 8 | 9 | 9 | the loop's warm chord on the bed's notes; thin-out under the bow from the push |
| ch08 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | the bed returns on the turnaround into A3, the track's loudest section |
| ch09 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stair thumps climb on the bed's notes into "20–25 TÒA"; the 47→33 join under 9.4 |
| ch10 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | B2 resolving into A, eased 2.5 dB (committed ch10: another session is editing it) |
| ch11 | 9 | 9 | 8 | 8 | 9 | 9 | 8 | the coda; the final chord on the last bar as the windows finish lighting, ringing to the cut |

Every score is 8 or higher; the pictures, and so VN, Read and Motion, are unchanged.
