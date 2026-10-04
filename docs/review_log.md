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
| ch01 Hook | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 4 + 2 sound + 3 remake | sound: remade to fit the bed: the cluster, the bass bend and the stab on its D pedal |
| ch02 Problem | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 9 + 2 sound + 3 remake | sound: 164 events, noise; the skyline a keys arpeggio in F |
| ch03 Market | 9 | 9 | 8 | 8 | 8 | 9 | 8 | 8 + 2 sound + 3 remake | sound: soft stab on SAM, D major |
| ch04 Who hurts | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 6 + 2 sound + 3 remake + 2 flip order | each role flips right after its own pain (Sync 9 -> 8: one reading margin is 0.16 s); sound: a chime as each pain turns, on the bed's chords |
| ch05 Demo 1 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 7 + 2 sound + 3 remake | sound: the bed's lift on the doors, bell on T.conf |
| ch06 USP 1: before approval | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound + 3 remake | sound: "1" carried by the bed's own hit, alarm on "VƯỢT KHUNG" |
| ch07 USP 2: after publication | 9 | 9 | 8 | 8 | 8 | 9 | 8 | 6 + 2 sound + 3 remake | sound: "2" carried by the bed's own hit, alarm, the held bass under the push |
| ch08 Competition | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound + 3 remake | sound: keys stab on "CÓ CẢ HAI." |
| ch09 Business | 8 | 9 | 9 | 8 | 8 | 9 | 8 | 7 + 2 sound + 3 remake | sound: stairs climb the chords into the stab |
| ch10 Team | 9 | 9 | 8 | 8 | 7 | 9 | 8 | 8 + 2 sound + 3 faces + 3 remake | faces: the team's photos as full-colour busts (Brand 7 accepted by the user); "ĐỘI KAWAIBU" carried by the bed's own hit |
| ch11 Close | 9 | 9 | 8 | 8 | 9 | 9 | 8 | 7 + 2 sound + 3 remake | sound: the bed's final chord rings to 180.0 s |

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

## ch10: the team's faces (2026-09-29)

The five photos come from the deck's ĐỘI NGŨ page (PDF page 13), extracted pixel for pixel by `tools/team.py extract`
into `assets/team/` (240×240, 240×240, 337×421, 324×576, 455×683; photos 1-2 are the deck's circle crops, photo 4
carries the deck's own cut-out). New rule in `CLAUDE.md`: team photos only from `assets/team/`, never redrawn,
distorted or AI-altered beyond cutout and colour treatment. `tools/team.py cut` makes the busts: the background
removed by colour (photo 4: the deck's mask, the chair beside the sitter cut off by hand), a scissor line a few px
outside the smoothed silhouette, a U-shaped bust below the chin, every head 238 px from hair to chin (photo 1's circle
ends at the scarf and sets that size: its bust is 309 px tall). Geometry in `docs/team.json`, read through
`ctx.portrait(k)`. `tools/facecheck.mjs` checks every frame: no text under a face, no face under another, each face's
height in frame at rest.

Layout changes the faces needed (timeline, reading times and every cue time unchanged): faces in two columns right
of the text (orange/navy bands' faces at the far right, cream bands' faces nearer the names); the cream bands' paper
runs on under their faces; the lock's waits are 60 px (right) and 80 px (left), was 110/60, so the right column stays
in frame before the lock and its top face clears the L34 line; the arriving stack's gaps are 20 px (was 43) and it
centres 24 px below the frame's centre; the closed stack lays each band 4 px over the one above (was 8 px apart);
a band still missing between two that are in keeps its slot open (the NAVY band now slides into a waiting gap);
the bands' text sits above the faces, their paper below.

### Round 1 (two treatments, stills)

A: full-colour cut-out; B: duotone, the photo's luminance mapped black → orange → cream, keyed to each face's lit
skin. Same layout, same cut. Stills: `out/team/A-colour.png`, `out/team/B-duotone.png` (+13.33), `*-arriving.png`
(+7.9), `out/team/A-vs-B-faces-100pct.png`, `out/team/A-vs-B-phone-360px.png`. Contact and phone sheets of the build
(with B): `out/review/ch10_contact.png`, `ch10_phone.png`, strip `ch10_strip_5.60.png`.

| Option | Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems left |
|---|---|---|---|---|---|---|---|---|
| A colour | 8 | 9 | 8 | 8 | 7 | 9 | 8 | photo colour outside the flat palette; photos 1, 2 and 4 are enlarged 1.48-1.75× and look soft at 100 % |
| B duotone | 8 | 9 | 8 | 8 | 9 | 9 | 8 | Hưng (240 px photo, fringe over the eyes) is the least clear face |

Fixed before scoring (the three worst of the first build): the two cream bands' faces overlapped for 1.1 s while the
NAVY band was still missing (fix: the held slot); the cream bands' busts crossed Hưng's role line as they slid in
(fix: text above the faces); B's first curve printed Hưng's face dark and blocky (fix: keyed to the 70th percentile of
each face's luminance, a softer curve, a light bilateral before the map). Also fixed: three busts had their hair cut
flat by the crop; a sliver of photo 4's chair beside the cheek.

Checks: lint ok; `facecheck ch10` ok (no text or face covered in any frame, faces at least 309 px at rest);
`readcheck ch10` 13/13; textcheck 13 texts, none under 28 px. A's Brand 7 is the option itself (full colour); it is
the user's call. Waiting for the pick.

**The pick (user, 2026-09-29): A, full colour; Brand 7 accepted.** Faces as large and sharp as the photos allow: one
Lanczos resample from the photo at 2× the stage size, no AI upscaling, no sharpening, smoothing or retouching.

### Round 2 (A, built)

| Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems left |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 8 | 8 | 7 | 9 | 8 | full colour outside the flat palette (accepted); photos 1, 2 and 4 soft at 100 %; before the lock, at the push, the right column 18-28 px from the frame's edge; Hưng's face 26 px above his band's centre |

Contact, phone and five strips (`out/review/ch10_*`), 100 % stills, `facecheck` ok (faces at least 309 px at rest),
`readcheck` 13/13, textcheck clean, stillness (no hold over 2 s, longest gap 0.9 s), `synccheck ch10` (the stab on
its frame), both boundaries. The last two items are at their limits by design (more room on the right would push the
cream bands' names nearer the left edge for 9 s). Rounds in `docs/review/ch10.md` (9-11).

### Round 3 (final: rendered from scratch with the current mix)

`out/review/ch10.mp4` (960×540, 30 fps) and `out/review/ch10_1080p.mp4` (1920×1080, 30 fps, CRF 18) with
`out/sound/film.wav` (the Mixkit bed). ch10's 10 cues are identical to those in `out/sound/cues.json`, which the mix
was built from, so no re-mix. The clip's audio is the mix from its first frame's film time (157.8 s), residual
-38.5 dB, peak -1.2 dBFS. ch01's frames are pixel-identical with the new engine (AE 0 at five times). Scores as round 2.

## Sound effects remake: to fit the Mixkit bed (2026-09-29)

The user's brief: remake **all** the sound effects to fit the bed, ch01's hits from the approved sketch included, and retire the
synthesized score's byte-for-byte rebuild of ch01 (that score is no longer used):
1. tune every pitched effect to the bed's measured tuning (A4 about 441.3 Hz) and to the chord it actually plays at each cue's bar;
2. rhythmic effects play straight 8ths, not swung; match the bed's timbre; drop any effect that doubles a hit the track plays;
3. paper and UI sounds (slides, snips, tears, stamps, ticks, flips) stay unpitched, EQ'd to sit in the gaps of the track's mids, none
   poking out more than about 3 dB above the music.

Every effect stays on its cue time and the picture is untouched: a fresh `node tools/cues.mjs` gives a `cues.json` identical to the one the
mix is built from, and `docs/timeline.json`, `scenes/` and `lib/` have no diff. Picture-side sync is unchanged (`node tools/synccheck.mjs`: all 71
appearance cues start on their frames). **VN, Read and Motion carry over. Hook, Brand, Sync and Variety are re-scored for the sound, and the
whole remake was checked by measurement and by reading the score against the bed's chord chart, never by ear.**

### What was measured first (before any effect changed)

- **Tuning** (`docs/bed_harmony.json`): the body's notes sit on A4 = 441.3 Hz (bass median +1.0 cent, upper partials +0.8 cent). The old effects
  were at A4 = 440: **5.1 cents flat of the bed**. Two constant drone lines run under the whole track (D3 at +36 cents, F#3 at +14) and the intro's
  synth voices are diffuse (median +4 cents, spread ±22): no single offset fits the intro better than 441.3.
- **Harmony** (`tools/bedharmony.py` -> `docs/bed_harmony.json`, read from note decompositions by hand, tiers H/M/L per bar): **the body is F
  minor, not F major with a minor colour**. Fm7 is home; the A sections run Fm7 | Db7 | C7sus; the B sections run Bbm7, Eb7, Abmaj7, Gm7b5,
  C7. F major appears only in passing. The intro (film bars 1-9) is a D pedal (bass C#/D/Eb, F# and D on top); the last chord is Fm6. The old
  effects took their notes from bass-dominated chroma: **15 of their 60 pitched notes were outside the chord the bed plays** at their beat.
- **Kit and voices** (`tools/bedhits.py` -> `docs/bed_kit.md`): the bed is one hi-hat on every straight 8th, a plucked, gated bass note on every
  8th (25 ms attack, gate 200 ms, the 2nd harmonic dominant on the lowest notes) and staccato keys chords on the 16th grid (partials 2..6 at -16,
  -21, -25, -28, -33 dB, ring tau about 0.3 s). **No kick, no snare, no ride, no cymbal, no brass.** Its bass note lands within 45 ms of 6 of the 7 stabs.
- **Swing:** hat, bass and keys are straight (hat off-beat minus on-beat +2.7 ms; a swung 8th would be +55).
- **The bed's spectrum** is smooth: its gaps in the mids are shallow (2-5 dB: about 160 Hz, 300 Hz, 600 Hz, 1.1 kHz, 1.8 kHz) and it falls about
  7 dB per octave above 1 kHz, so it is 30 dB down at 8 kHz.

### Decisions, and how "poking out" is measured (please say if you meant something else)

- **Poke-out** = an event's loudest 100 ms against the music's mean over the second and a half either side, in dB, in two measures: the whole
  signal K-weighted (loudness) and the 250 Hz - 4 kHz mids; the larger is the poke (`tools/meter.py`). The limit is +3 dB, for every paper and UI
  sound. **I read "3 dB above the music" as a level, not as a band-by-band cap:** with the bed 30 dB down at 8 kHz, a per-band +3 dB cap would make every
  effect follow the bed's dull tilt and would contradict "sit in the gaps" (nothing can fill a gap if it may exceed it by 3 dB). As a guard against crisp
  noise splashing, no single 1/3-octave band from 500 Hz up may stand more than 14 dB over the music. Result: the effects sound in the upper mids and the
  air, where the bed is thin, and are a median 3 dB *under* the music in loudness. If you meant a per-band +3 dB, the effects would be about 8-10 dB duller
  and softer: it is one constant (`BAND_CAP`) and the class targets in `tools/sound.py`.
- **Levels come from the music.** No effect has a hand-set dB any more: paper and UI events are set to their class's poke (hit 2.7, cut 2.7, move
  1.7, tick 1.7, texture -3, plus a per-cue `rel`), pitched hits to a level over the music (`Film.hit`), so they follow the music's dynamics. The music
  they are judged against is the bed without its two designed dips and with its fade-in bar replaced by the second bar. Four events sound inside the dips (ch01's
  drop swoosh and tear, ch07's two slams); they are +2.7 dB or less over the music they replace and up to +21 over the dipped bed that is playing.
- **Doubling.** The bed plays a bass note on every 8th, and keys chords about ten times a bar. A stab layer (its keys chord, its bass note) is left out where
  the bed's own note or chord lands within 45 ms of the cue (`Film.doubled`, the detector in `tools/bedhits.py`); nothing is left out where the bed is dipped
  (ch01). The stab's crash and the alarm's snare and brass are gone: the bed has no cymbal, snare or brass, so they were foreign timbre. **Consequence: the
  stabs on "1" (ch06), "2" (ch07) and "ĐỘI KAWAIBU" (ch10) sound as nothing but the bed's own hit** (keys and bass within 14-35 ms of the frame); ch08's and
  ch09's keep the keys chord. `sound.py` logs each one (`skipped`, with the reason).
- **The old score's rebuild check is retired.** `--music synth` still runs; its ch01 is no longer the sketch byte for byte, since the synths are shared.

### Changes, per chapter

Every paper and UI sound in every chapter was rebuilt as unpitched noise (no sine, no narrow resonance), given its class EQ and a level from the music.
"Poke" is over the music: the old figures are the old mix's median / max, the new the remake's (ch01's old figures are inflated by the bed's
silent fade-in bar: read them as at least +6).

| Ch | Paper and UI (cues -> events) | Poke, old -> new (median / max) | Loudness, old -> new | Pitched: what changed |
|---|---|---|---|---|
| ch01 | 19 -> 22: the complaint pop (a sine glide -> a falling band of noise), the bubbles' sine ticks -> noise ticks, 3 captions (the sine thump -> paper slap), scissor, split, slide, 2 snips, the drop's swoosh, the tear | +18.7 / +49.0 -> +0.3 / +2.7 | -14.1 -> -17.0 LUFS | cluster `C2 Db2 D2 G2` (D minor) -> `Db3 D3 Eb3 A3` (the intro's own C#/D/Eb motion and the fifth over the D pedal), the bed's keys, +4 LU; bass bend A1 -> D1 kept (the chord's fifth falling to its root) but on the bed's bass; stab `D3 F3 A3 Bb3 D4` + `D2 D1` + crash -> `D4 F#4 A4` + `D2 D1` (the D the bed plays), no crash, rings out into ch02, +15 LU over the intro music (was +18 over the same music, +25 over the dipped bed) |
| ch02 | 160 -> 164: 129 cell ticks (pure sine ticks at random pitches 3-4.5 kHz, tonality 0.99 -> noise grains, 0.00), the 1.363 count and its locks, 13 snips, wipes, slides, slams, stamp, scissor, lift, click | -2.3 / +16.8 -> -3.6 / +2.7 | -16.8 -> -16.7 | the skyline's 24 low thumps -> 24 keys notes climbing through F A C over two octaves (`F3 ... C6`), the bed's F chord, each at -7 LU so the overlapping run peaks +1 dB over the music (the old thumps ran +6 to +16) |
| ch03 | 17 -> 26: flip, tag slides, 20.000đ count, arrow snap, 3 pins, window sweeps, TAM/SAM/SOM | +12.0 / +16.8 -> +1.7 / +2.9 | -17.9 -> -17.5 | soft stab on SAM `D3 Db4 Eb4 F#4` (2 of 4 outside the D) -> `D4 F#4 A4`, keys alone, +5 LU; the slab's thump `A3` (the F chord's 3rd) |
| ch04 | 25 -> 30: curtain wipe and thud, panels, snaps, pins, the stamp, bubbles, flips, lift, doors | +8.4 / +15.5 -> -0.9 / +2.9 | -14.4 -> -15.3 | chimes `C5 F5`, `D5 F5`, `C5 F5` (D5 over Fm9 clashed) -> `A4 F5` over F, `C5 F5` over Fm9, `A4 F5` over F; the bed's keys, +5 LU (was +9) |
| ch05 | 33 -> 44: slides, slams, the window's creak, cuts, snaps, the click, ticks | +6.0 / +10.3 -> -5.5 / +0.7 | -14.5 -> -12.9 | bell `Bb6` (a handbell) -> `C6`, the fifth of F7sus, in the keys' voice, +3 LU |
| ch06 | 24 -> 35: cover, slides, bars, rises, pan, tick clicks, pin, count, friction and thud, tear, scissor, split, slams | +6.3 / +12.1 -> -3.3 / +2.8 | -13.5 -> -12.8 | stab "1" `Eb3 G3 Bb3 D4` + bass + crash (D4 outside Eb7) -> **left to the bed's own hit** (its keys chord -14 ms, its bass Eb2 +19 ms); rising tone `F4 -> C5` kept (Fm7's root and fifth), keys' spectrum; alarm brass `Bb1 E2 Bb2` then `A1 Eb2 A2` + snare + bass -> keys tritone stack `Ab3 D4 Ab4` over Abmaj7, then a semitone down `G3 Db4 G4` onto G7sus's root; the bed's bass under both hits, so none added |
| ch07 | 36 -> 50: tears, rises, slides, checkbox click, seal stamp, snap, doors, scroll, cut, 4 copies with clicks, count, sly slide and scratch, slams | +7.4 / +19.0 -> -6.1 / +2.9 | -12.3 -> -12.8 | stab "2" `C3 Bb3 B3 Db4` + `C2 C1` (the wrong root over Db7) -> **left to the bed's own hit** (keys -35 ms, bass Db2 +1 ms); climb `Bb6 Bb7 Bb8 Bb9` (an octave a step) -> `G5 Ab5 Bb5 Db6`, each on its beat's chord (C7, then Bbm7); warm chord `Ab3 Bb3 D4 Eb4` (Ab and D outside Eb7) -> `G3 Bb3 Db4 Eb4`; alarm -> keys tritone stacks `F3 B3 F4`, then `E3 Bb3 E4` (Fm7 into Bbm7), no brass or snare, bass left out on hit 2 (the bed's own +4 ms); the bow (a bowed string) -> the bed's own bass held on Eb2, over the thinned bed |
| ch08 | 20 -> 26: cover, slams, label snaps, five strips with stop-thuds, the navy strip, two punches, flutter | +6.1 / +11.7 -> -0.4 / +1.1 | -12.9 -> -12.8 | stab "CÓ CẢ HAI." `F3 C4` + `F2 F1` + crash -> `F4 C5 G5` (F5 and the bar's 9th), the bass left out (the bed's +32 ms), no crash |
| ch09 | 17 -> 22: rise, counts, window sweep, slams, snip, flip, hard cut with the stamp, slide, flag snap, tick, pans, MRR count | +6.4 / +8.5 -> -7.4 / +0.3 | -13.4 -> -12.6 | four stair thumps (D E F# G, tom-like) -> `G3 C4 Eb4 G4`, each a tone of its own chord (Eb7, then Abmaj7 and its inversions); stab "20-25 TÒA" `Bb2 G3 Ab3 C4` + bass -> `Eb4 F4 Ab4 Bb4 C5 G5` (Bb7sus and the bar's 9th and 13th), the bass left out (the bed's +42 ms) |
| ch10 | 9 -> 17: five band slides, the close, L34's lines, the glide | +8.3 / +10.5 -> -3.0 / -1.4 | -13.8 -> -14.9 | stab "ĐỘI KAWAIBU" `F3 C4` + `F2 F1` + crash -> **left to the bed's own hit** (its keys +29 ms, its bass +21 ms) |
| ch11 | 9 -> 13: wipe, logo slide, two slams, three credit slides, the façade's rise, the windows' sweep (sine grains -> noise grains) | +9.8 / +12.0 -> -3.3 / +1.1 | -16.5 -> -16.8 | the `chord` cue stays silent: the bed's own final chord (Fm6) ends the film |

(369 cues became 449 events: a slide, a bar or a lift is a swoosh plus a landing.)

Code: `tools/synth.py` (new: every synth, the bed's keys, bass and hat), `tools/sound.py` (the effects, the class EQs, the level solver, the chart), `tools/meter.py`
(new: the measurements), `tools/bedharmony.py` and `docs/bed_harmony.json` (new), `tools/bedhits.py` and `docs/bed_kit.md` (new), `tools/sfxcheck.py`,
`tools/tunecheck.py` (new), `tools/soundcheck.py` (the harmony check reads the chart; the cue check can read the effects' stems).

### Checks (`out/sound/sfxcheck.txt`, `tunecheck.txt`, `soundcheck.txt`; all from the finished stems)

- **Loudness:** `out/sound/film.wav` -14.00 LUFS, true peak -1.21 dBTP; as AAC 320 kbps (as `render.mjs` muxes it) -1.24 dBTP. Two runs give identical bytes.
- **Tuning** (`tunecheck`): 77 pitched notes measured in the stems against A4 = 441.3: median 0.0 cents, 95 % within 0.7, worst -3.3.
- **Pitched levels** (`sfxcheck`): each pitched hit's loudest 100 ms over the music is within 0.3 dB of the level it was set to (stab +9.0, ch01's +14.7, soft stab +4.9, alarm +8.4, chime +5.0, climb +1.5,
  bell +3.1, cluster +4.0, bass bend +6.1, held low note +2.0); the skyline's 24 overlapping notes peak +1.4 dB at most.
- **Harmony** (`soundcheck`): 0 of 47 pitched notes and chords are outside the chord the bed plays on their beat (the chart's tones, extensions and bass, and a stab's bar
  extensions); before, 15 of 60.
- **Paper and UI** (`sfxcheck`, 449 events): poke-out median -3.3 dB, **max +2.9 dB, 0 over +3.0**; the single-band guard max +13.9 dB; **tonality** at most 0.026 in every class
  (0 of 449 above 0.3; the old ticks read a median 0.53, 23 of 31 above 0.3; 129 cell ticks 0.99). The effects' spectral fine structure against the music's: **r = -0.78 in the intro,
  -0.57 in the body**: they sound where the music is thin.
- **Sync, sound side:** 301 of 301 hit cues have an onset in the effects' stems within 12 ms (median -0.4 ms, 95 % within 1.8 ms); 3 stabs are left to the bed's own hit.
  **Sync, picture side:** 71 of 71 appearance cues start on their frames.
- **Straight 8ths:** no effect is swung: of 94 intervals in runs of repeated cues, 63 lie on straight beat, 8th or 16th positions, 29 are the picture's own free timing (the
  accelerating bubbles, the staggered skyline) and 2 are one 1.34-beat gap between ch08's last two strips (picture timing); the swing was in the retired synth score.
- **The synth score** (`--music synth`) still runs (smoke-tested on ch01, ch02, ch05, ch07).

### Round 1 (the mix as handed over, judged on the three new points)

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|---|
| ch01 | 7 | 9 | 9 | 8 | 6 | 8 | 8 | pitched sine ticks and pop; 5 of 12 pitched notes outside the D the bed plays; a stab +18 LU over the music (+25 over the dipped bed); captions and complaint far over the music |
| ch02 | 8 | 9 | 8 | 8 | 6 | 8 | 8 | 129 sine ticks at random pitches (tonality 0.99); tom-like thumps under the bed's bass |
| ch03 | 8 | 9 | 8 | 8 | 6 | 8 | 8 | the soft stab's Db and Eb outside the D; counts and pins +12 over the music |
| ch04 | 8 | 9 | 8 | 8 | 6 | 8 | 8 | the chime's D5 over Fm9; sine bubble ticks |
| ch05 | 8 | 9 | 8 | 8 | 7 | 8 | 8 | a handbell in a keys-and-bass track; snaps and slams +6 |
| ch06 | 8 | 9 | 9 | 8 | 6 | 8 | 8 | stab doubling the bed's bass and keys, plus a crash the bed does not have; a brass-and-snare alarm on a bed with neither |
| ch07 | 8 | 9 | 8 | 8 | 5 | 8 | 9 | the climb an octave a step (`Bb6 ... Bb9`); the wrong root under "2"; 5 of 15 notes outside the chord |
| ch08 | 8 | 9 | 9 | 8 | 7 | 8 | 8 | the stab doubling the bed's bass at +32 ms, plus a crash |
| ch09 | 8 | 9 | 9 | 8 | 7 | 8 | 8 | the stab doubling the bed's bass; thumps under its bass |
| ch10 | 9 | 9 | 8 | 8 | 6 | 8 | 8 | the stab doubling the bed's bass and keys |
| ch11 | 9 | 9 | 8 | 8 | 7 | 9 | 8 | sine sweep grains climbing; slams +10 |

### Round 2 (the first complete remake: pitched effects on the chart, paper and UI on the classes)

The three worst problems, found by reading the score and the levels against the chart and the bed, not by ear:
- **The alarm's second hit was lowered twice** (`F#3 C4 F#4` over G7sus instead of `G3 Db4 G4`): ch06 and ch07's Brand. Fixed: both hits come from the first hit's root.
- **ch09's stab was a tight `F G Ab Bb` cluster:** the ring ordering put a non-chord extension (G) ahead of the chord's own 4th (Eb). Fixed: chord tones always outrank extensions.
- **ch01's stab rang 1.3 s where the shotlist says "ring out",** leaving a near-silent hole at 10.6-11.1 s before ch02, and ch01 fell to -19.1 LUFS (5 LU under the old): Hook. Fixed: the
  stab rings 3 s (tau 0.8) with its bass held, +15 LU over the intro; ch01 is -17.0 LUFS.
Also fixed in the tools: the check's reference had the silent fade-in bar (the first events read +89 dB), and one dense run of cell ticks did not converge under the band guard.

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch01 | 7 | 9 | 9 | 8 | 7 | 9 | 8 | the hole after the stab; a quiet opening |
| ch02 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | cells noise; the skyline a keys arpeggio in F |
| ch03 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | soft stab D major |
| ch04 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | chimes on Fm9 and F |
| ch05 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | bell on the fifth |
| ch06 | 8 | 9 | 9 | 8 | 7 | 9 | 8 | the alarm's second hit |
| ch07 | 8 | 9 | 8 | 8 | 7 | 9 | 8 | the alarm's second hit |
| ch08 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stab keys only |
| ch09 | 8 | 9 | 9 | 8 | 7 | 9 | 8 | the stab's cluster |
| ch10 | 9 | 9 | 8 | 8 | 7 | 9 | 8 | stab left to the bed |
| ch11 | 9 | 9 | 8 | 8 | 8 | 9 | 8 | none new |

### Round 3 (final: the checks above are on this build)

| Chapter | Hook | VN | Read | Motion | Brand | Sync | Variety | Notes |
|---|---|---|---|---|---|---|---|---|
| ch01 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | the question's stab rings out into ch02; -17.0 LUFS (was -14.1: the old stab was +18 LU over the music) |
| ch02 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | 164 events all noise except the skyline's 24 keys notes; -16.7 LUFS |
| ch03 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | soft stab D4 F#4 A4 on SAM |
| ch04 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | chimes A4 F5 / C5 F5 / A4 F5 on the flips' edge-on frames |
| ch05 | 8 | 9 | 8 | 8 | 8 | 9 | 8 | bell C6 on T.conf |
| ch06 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | "1" is the bed's own hit; the alarm a tritone falling onto G7sus's root |
| ch07 | 9 | 9 | 8 | 8 | 8 | 9 | 8 | "2" is the bed's own hit; climb G5 Ab5 Bb5 Db6; the held Eb2 under the push (Variety 9 -> 8: the alarm lost its brass, snare and crash) |
| ch08 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stab F4 C5 G5, keys alone |
| ch09 | 8 | 9 | 9 | 8 | 8 | 9 | 8 | stairs G3 C4 Eb4 G4 into a Bb7sus stab |
| ch10 | 9 | 9 | 8 | 8 | 7 | 9 | 8 | "ĐỘI KAWAIBU" is the bed's own hit; Brand 7 is the faces (accepted) |
| ch11 | 9 | 9 | 8 | 8 | 9 | 9 | 8 | the bed's final chord ends the film |

One more problem was found after this round's first render, by measuring each pitched hit's achieved level against its target: **ch02's skyline, 24 overlapping keys notes each set alone at -2 LU, summed to +6 dB
over the music.** Each note now sits at -7 LU and the run peaks +1 dB; the mix and both renders below are from after that fix.

Every score is 8 or higher except ch10's Brand 7 (the full-colour faces, accepted by the user). **Still to be listened to:** the intro's D-pedal hits in ch01 and ch03 (the intro's synth lines
are diffuse and its drone is +36 and +14 cents off the grid, so those two hits may beat against them), the five joins in the bed, and the choice above (the three stabs the bed's own hit now carries).

### Round 3 (confirm: the 1080p preview, rendered from a clean worktree at `8810133`)

`node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10`: 5,400 frames in 6 min 55 s from a clean worktree (scenes, engine and
timeline as committed), so it includes ch10's faces (four of the five members are in the frame at 165 s; the fifth band arrives later).
- **ffprobe:** video H.264 High, 1920×1080, yuv420p, 30 fps, 5,400 frames (179.999 s); audio AAC LC, 48 kHz stereo, 321 kbps, 180.000 s.
- **Loudness on the muxed file:** ebur128 -14.0 LUFS integrated, true peak -1.2 dBFS; loudnorm input_i -14.05 LUFS, input_tp -1.24 dBTP, LRA 6.8 LU.
- **Sync:** the file's decoded audio lines up with `out/sound/film.wav` at 0 samples of lag (codec residual -37.7 dB).
- `out/roughcut_sound.mp4` (960×540, 30 fps) was re-rendered with the same mix. The per-chapter clips `out/review/chNN.mp4` still carry the previous mix; the previous preview and draft are in
  `out/tmp/old_mix/` for comparison, with the first remake build's preview and draft (before the skyline fix). Scores unchanged from round 3 above.

## ch04: each role flips right after its own pain (2026-09-29)

The user's request. In ch04 the manager's panel (BAN QUẢN LÝ) waited for `s14(3)`, until the residents' pain had landed,
so the manager and the residents flipped back to back at the end. Wanted order: pain 1, flip 1, pain 2, flip 2, pain 3,
flip 3, each flip right after its own pain has been read and before the next pain lands (the manager's inside L13, after
its pain and the chat's drift-off). Kept: the chapter's length, the timeline, the beat grid; flips on the grid; every pain
and answer passing `readcheck`. Rebuilt: the flip cues and the mix. The chapter's rounds are in `docs/review/ch04.md`
(7 and 8); `docs/shotlist.md` carries a note under ch04's table (its first plan had panel 2 flip after panel 3 stepped forward).

| Role | Pain tags land (chapter-local s) | Flip, edge-on (grid units) | Before |
|---|---|---|---|
| Ban quản trị | 2.61, 4.27 | 7.74 (56) | unchanged |
| Ban quản lý | 8.44, 9.97 (the chat drifts off from 9.97, gone by 10.6) | **11.49 (83)** | 14.55 (105), after the residents' tags had landed |
| Cư dân | 13.02, **14.55** | 16.49 (119) | unchanged; the second tag was 13.72, before the first could be read |

The change in `scenes/ch04.js`: `T.flip[1]` from `s14(3)` to `L13.end - ctx.grid`, and the residents' second tag from `s14(2)` to
`s14(3)`, the beat the manager's flip used to hold. Everything else in the scene is as it was.

### Round 1 (the manager's flip moved, nothing else)

| Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|
| 8 | 9 | 8 | 8 | 8 | 8 | 7 | (1) a 2.2 s hold and a 2.7 s gap between events in the residents' pain (13.72-16.33), where the chapter had none over 2 s; (2) the residents' second tag 0.69 s after the first, before it is read; (3) the manager's second tag readable 1.40 s of the 1.24 s it needs |

Fixed (1) and (2) together: the residents' second tag on `s14(3)`, 1.53 s after the first (the other two roles: 1.67 s and
1.53 s), 1.80 s of reading before its flip (needs 1.49 s). (3) stays: it passes, and both alternatives cost more (the flip
one 16th later would put its chime 15 ms before the bed's keys chord, hat and bass on film beat 101; the tag one 16th earlier
would land 0.14 s after the last bubble and 0.14 s before the chat's drift-off, three events in 0.28 s).

### Round 2 (final)

| Hook | VN | Read | Motion | Brand | Sync | Variety | Worst problems |
|---|---|---|---|---|---|---|---|
| 8 | 9 | 8 | 8 | 8 | 8 | 8 | none new (Sync 9 -> 8 for the 0.16 s margin above) |

- **Reading** (`readcheck ch04`: 15 texts, none short). Readable time against need, before -> after: "Phản ánh qua Zalo," 5.97 -> 2.93 s
  (1.24); "không ai theo dõi" 4.43 -> 1.40 (1.24); answer 2 5.47 -> 8.53 (2.61); "không rõ tiền đi đâu" 2.63 -> 1.80 (1.49); the rest unchanged
  (answer 1 12.30, answer 3 3.60 against 2.48, "Đóng phí, nhưng" 3.33, the board's two tags).
- **Rhythm:** no hold over 2 s; longest gap between clear events 1.8 s (was 1.9 s). **Grid:** flips' edge-on frames on grid units 56, 83, 119.
- **Nothing else moved:** frames identical to a render from the previous commit before 11.10 s and after 16.00 s (only H.264 lookahead
  noise, max 2 of 255, in the 7 frames before the first change); lossless stills at +0.5, +5.0, +7.0, +10.9, +16.2, +18.0, +19.9 pixel-identical.
  Lint ok; text check 19 texts, none under 28 px; contact sheet, phone sheet, and strips of the three flips looked at.
- **Sound:** `node tools/cues.mjs` -> 418 cues as before, three with new times: the manager's flip 58.827 -> 55.771 s, its chime 58.994 -> 55.938 s,
  and the residents' second pin 58.160 -> 58.994 s. The mix was rebuilt (`sound.py`, about 50 s): -14.00 LUFS, -1.21 dBTP (AAC 320k: -1.24), and it
  differs from the previous mix only between 55 and 62 s (+0.004 dB of master gain elsewhere; a -55 dB residual near 143 s from the effects'
  joint level iteration).
  - `soundcheck`: 47 pitched notes, 0 outside the chord the bed plays; 301 of 301 hit cues have an onset within 12 ms (median -0.4 ms); ch04 -15.38 LUFS (was -15.34).
  - `tunecheck`: identical (worst -3.3 cents; the chimes 0.0). `sfxcheck`: 449 paper/UI events, max +2.9 dB over the music, none over +3.0; flips -2.0 .. +1.8 (was +1.4);
    chimes +4.9 .. +5.0 against the +5.0 target. `synccheck`: ch04 12/12.
  - The chimes are now `A4 F5` on all three flips (the bed plays F at film beats 93, 100 and 109), where the middle one was `C5 F5` over Fm9 at 58.99 s. The new
    chime has no bed keys chord within 40 ms; the bed's bass plays a Db3 36 ms after it (`docs/bed_kit.md` (f) updated).

### Confirm: the 1080p preview and the drafts, rendered from a clean worktree at `0698eaa`

- `node render.mjs --scale 1 --fps 30 --crf 23 --audio out/sound/film.wav --out out/preview_1080p.mp4 --workers 10`: 5,400 frames in 6 min 46 s, from a clean worktree
  (scenes, engine and timeline as committed; the worktree's `cues.mjs` gives the same 418 cues the mix was built from).
- **ffprobe:** video H.264 High, 1920×1080, yuv420p, 30 fps, 5,400 frames (179.999 s); audio AAC LC, 48 kHz stereo, 321 kbps, 180.000 s.
- **Loudness on the muxed file:** ebur128 -14.0 LUFS integrated, true peak -1.2 dBFS, LRA 6.8 LU; loudnorm input_i -14.05 LUFS, input_tp -1.24 dBTP.
- **Sync:** the file's decoded audio lines up with `out/sound/film.wav` at 0 samples of lag (codec residual -37.7 dB).
- **The order in the file itself** (frames pulled from the mp4 at film 51.94, 55.44, 55.94, 56.44, 58.44, 59.44, 60.94 and 61.44 s): the board still orange at 51.94 with both tags, the manager's
  two tags and no chat at 55.44, the manager edge-on at 55.94 and navy with its answer at 56.44, the residents forward with their first tag only at 58.44 and both at 59.44, edge-on at 60.94, navy at 61.44.
- `out/roughcut_sound.mp4` (960×540, 30 fps, 5,400 frames, 2 min 40 s) and `out/review/ch04.mp4` (with ch04's exit: 627 frames) were re-rendered with the same mix. The rough cut lines up at 0 samples
  (residual -37.7 dB, -14.0 LUFS); the ch04 clip starts at its first frame's film time (44.467 s, the first whole frame) and lines up at 0 samples (residual -35.0 dB).
- The preview and draft from before the change, and that mix's `film.wav`, `cues.json`, `score.json` and check reports, are in `out/tmp/flip/before/`. Scores unchanged from round 2.

## ch05: the real app, recorded (2026-10-04)

**The task (the user):** rework ch05 with no cropped phone screenshots; it should feel like a real person using a real
phone, step by step. Record the real resident app (the Flutter web build against the design sandbox) at 390 × 844, DPR 3,
in real time: "Phản ánh", the hook's words typed, Tầng 3 → Thang máy B, a photo from the sandbox's report photos, submit,
the confirmation, "Việc của tôi" with the new report; log every tap; play it on an original cut-paper phone with a hand
that taps where and when the recording tapped; the same for the manager on a laptop with a cursor, from the AI
suggestion to "Xác nhận phân loại" as Kawaibu; update CLAUDE.md for recordings and small app text; keep the 8 bars, the
timeline, ch04's doors and ch06's cover; rebuild ch05's sound; storyboard and two designs before building.

**What the sandbox showed (probed on a throwaway copy of `lamto_design`, then restored), told to the user at the gate:**
- No photo can be attached in the web build: the app copies picked photos with `dart:io`/`path_provider`, which Flutter
  web lacks (even a valid JPEG throws "No implementation found for method …"). The sandbox's "report photos" are 28-byte
  text placeholders named `.jpg`.
- No AI endpoint is configured, so a new report's triage job stays `PENDING`: report #7 (its suggestion seeded by
  `seed_design.py`, "design-sample") is recorded, as before.
- The pilot resident's "Việc của tôi" starts with four test-string reports; pilot-resident-2's is clean.
- The new report is #13, and no recorded screen shows its number (ch07's "Phản ánh #2" is not contradicted).

**The user's picks at the gate:** the cut-paper treatment (A, over a clean flat device), skip the photo step,
pilot-resident-2. Storyboard: `out/tmp/ch05sb/storyboard.png` and `designs.png` (scratch, not in git).

**The recordings** (`tools/record_app.mjs`, committed with their frames):
- CDP screencast, Chromium launched with `--force-device-scale-factor` (without it the frames come at CSS size); a frame
  each time the page repaints, about 20-30 fps under motion, none while still; JPEG as sent (q92 phone, q90 laptop).
- app: 141 frames over 15.0 s, 1170 × 2532, 19 MB; 7 taps (held 90 ms through CDP touch events), 61 key inputs, marks.
- web: 96 frames over 11.9 s, 2880 × 1800, 32 MB; 289 cursor points, 2 clicks, the scroll, the triage and case pages' boxes.
- Chromium's mobile tap highlight (a translucent blue box it paints over the Flutter host on every touch) is turned off
  for the capture; the app's own ripples and pressed states are in the frames. The native location list is not (headless
  Chromium draws it outside the page); the field's value is seen stepping through the options as the keys move.
- The script starts lamto-db-1 if it is stopped, copies `lamto_design` to `lamto_design_rec`, runs the design API on it
  and a static server for the build, records, then stops both, drops the copy and stops the container again; the LamTo
  working tree is checked unchanged. `lamto_design` itself was dumped before the first probe and compared after: identical
  data (the dumps differ only in pg_dump's random `\restrict` key).

**The build:** `scenes/ch05.js` on `lib/footage.js` (frames, remap) and `lib/props.js` (phone, hands, laptop, cursor).
The remap puts each logged tap on an 8th and plays the stretch after it at real speed until the screen settles:
"+ Phản ánh" 4.17, the box 5.28, "Chọn vị trí" 6.39, "Tầng 3" 6.94, "Thang máy B" 7.50, "Gửi phản ánh" 8.06, the
confirmation 8.61 (bell), back 9.17, the refreshed list 9.44; on the laptop the cursor crosses "Thang máy", "Cao" and
"240 phút" on the brackets' 11.11, 11.39 and 11.94, clicks the location on 13.61 (L18's first beat) and the button on
14.72, and the case page lands on 15.0 with the stamp. Rounds in `docs/review/ch05.md` (8-11): the last frame's two
windows and NAVY band, the cursor under the tags, the quick push, the sheets' boxes.

**Sound:** new cues `tap` and `key` (unpitched, tick class) on the recording's events; the bell on the app's
confirmation (tuned: 0.0 cents). Only ch05's cues changed (34 → 32); the remix differs from the previous one by about
-80 dB outside ch05 after a 0.02 dB gain match. -14.00 LUFS, -1.21 dBTP (AAC -1.23); 445 paper/UI events, max +2.9 dB
over the music; 47 pitched notes, 0 outside the chord; 300 of 300 hit cues with an onset within 12 ms; picture sync 68 of
68 appearances on their cue (ch05 6 of 6). ch05: 40 events, median -3.7 dB, max +2.9 dB; taps -6.6 dB, keys -14.6 dB in
the 100 ms loudness (short clicks measure low, like the film's other ticks). **Not heard by the builder.**
