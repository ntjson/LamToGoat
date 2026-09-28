# Shotlist: direction C (Saul Bass title sequence)

> **No voice-over since 2026-09-28.** The film is music and sound effects only.
> - The "Draft voice" lines below are now story beats whose message is carried on screen: `docs/onscreen.json` lists
>   each beat's text, including the 13 additions.
> - The times now come from reading time on a 108 BPM grid (`docs/timeline.md`); the estimates below are historical.

**Status:** approved at gate 1 (2026-09-28). Wording now lives in `docs/vo_script.md` (built from `docs/vo_lines.json`),
and current times live in `docs/vo_timings.json`. The times in this file are the gate-1 estimate.

**Decisions from the gate-1 review**
- The voice will probably be recorded by you; the timing re-flows from your L04-L08 test read, then from the real takes.
- The final screenshot set is in (web @4x, explorer pair @5x, app @3x). Every crop was re-measured on it; the triage
  page's layout changed (the AI hint now wraps to two lines), so no old numbers were reused. ch05/ch07 plates are built
  at gate 5 from `docs/crops.json`.
- The demo manager shows as "Kawaibu" in the new screenshots.
- Accepted as proposed: ch06 presents the deck's labelled example; the triage case (#7) and the elevator B case stay
  distinct in the voice; the test-string areas stay cropped out. Zalo stays in ch04.

**Timing basis.** Draft voice at 3 syllables/s: 35 lines, 441 syllables, 147.0 s of speech. The film is exactly 180.0 s.
Voice enters at 1.6 s. Every chapter opens with a 1.1-1.3 s music-only breath.
Times below are estimates. Each shot is anchored to a voice line (L01-L35), and at build time the scenes read
`docs/vo_timings.json` rather than these numbers.

| Ch | Beat | Est. time | Lines |
|---|---|---|---|
| 01 | Hook: a complaint lost in chat, a fund figure cut | 0.0-9.8 | L01-L03 |
| 02 | Problem | 9.8-33.7 | L04-L08 |
| 03 | Market | 33.7-48.6 | L09-L11 |
| 04 | Who hurts: three roles, pain flips to answer | 48.6-62.1 | L12-L14 |
| 05 | Demo 1: report, then AI suggestion, then a named manager decides | 62.1-84.4 | L15-L18 |
| 06 | USP 1: AI price band (layer 1, before approval) | 84.4-104.8 | L19-L22 |
| 07 | USP 2: publish, trace back, 4 copies, tamper caught (layer 2) | 104.8-127.8 | L23-L27 |
| 08 | Competition | 127.8-138.5 | L28-L29 |
| 09 | Business | 138.5-159.6 | L30-L32 |
| 10 | Team | 159.6-171.1 | L33-L34 |
| 11 | Close: logo lockup | 171.1-180.0 | L35 |

**The loop.** The hook's lost complaint is the product's real report text: "Thang máy B kẹt cửa ở tầng 3,
phải bấm nhiều lần mới mở được." In ch07 the resident traces the verified 18.500.000 đ expense back to that same report
(`android-light-06-issue-detail`), and the hook's chat bubble slides in beside it with the same words.
The complaint that got lost is the one LamTo can prove.

---

## Conventions

**Colours.** ORANGE `#FF7C00`, CREAM `#F4ECDC`, BLACK `#151311`, NAVY `#003080`, RED `#D0271D`.
- The problem half (ch01-ch04) plays on orange and black.
- The solution half (ch05-ch07) moves to cream and navy, with orange as an accent.
- Red only marks tampering, over-limit figures and missing receipts. The logo only sits on cream.

**Type.**
- DISPLAY: Bricolage Grotesque 800, 75% width, caps, with the seeded hand-cut edge.
- LABEL: Bricolage Grotesque 700, optical size auto, sentence case.
- MONO: IBM Plex Mono 600.
- Sizes are px at 1080p; nothing goes under 30. Numbers use `tabular-nums` and COUNT like an odometer, with digits
  rolling in fixed slots on springs.
- Line breaks inside on-screen text are marked ` / `.

**Motion verbs.** Every move is a closed-form spring; nothing fades.

| Verb | What happens |
|---|---|
| SLIDE | Paper enters along one axis with a slight overshoot |
| SNAP | Short, stiff settle |
| SLAM | Type lands from scale 1.08 to 1 with a hard settle |
| FLIP | Panel turns on its vertical axis (scaleX 1 → 0 → 1) and swaps faces |
| CUT | A scissor line crosses the paper and the piece slides away |
| TEAR | Torn-edge reveal of the layer beneath |
| WIPE | A paper field crosses the frame and reveals the next scene |
| PUNCH | A hole is knocked through paper |
| PUSH | Camera scale-in |
| COUNT | Odometer digits roll to the value |
| HARD CUT | Instant change |

**UI plates.** Crops of the real screenshots are always straight and clean, with no glow. They sit either on a
cut-paper backing (a hard 14 px offset in a second colour) or inside a façade window (an aperture) whose paper edge
overlaps the UI by 4 px.
- Scale rule: the UI's smallest visible text must be at least 28 px. The scales below were measured from cap heights,
  not guessed: web screens (1440 wide, @1x) at 2.1–2.3×, the identity crop at 2.6×, app screens (780 wide) at 1.2–1.4×,
  and the @2x explorer at 1.2× or pushed further in.
- Crop sizes and coordinates are in the reference table at the end.

**Sound.** All synthesized. There is no Eleven Music and no stock audio.
- **Music:** a walking upright-bass line, brushed snare and piano stabs at about 108 BPM with swung eighths.
  - ch01-ch04: minor and sparse.
  - ch05-ch07: opens to major with vibraphone.
  - ch08-ch09: driving.
  - ch10-ch11: resolves.
  - Stabs land on the SLAMs; the music ducks under the voice with a sidechain.
- **Effects palette:** bubble tick, paper slide, snap, snip, tear, stamp, flip, odometer rattle, pin, punch,
  flutter, thud, alarm stab, warm chord.

---

## ch01 Hook (0.0-9.8)

| Line | Est. | Draft voice |
|---|---|---|
| L01 | 1.6-4.6 | Phản ánh gửi vào nhóm chat, rồi trôi mất. |
| L02 | 5.6-7.9 | Số dư quỹ lặng lẽ thay đổi. |
| L03 | 8.4-9.8 | Tiền quỹ đi đâu? |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 1.1 | 0.0-1.6 | Drawn: cream chat bubbles on BLACK. The text is quoted from the real report in `android-light-03-issues` | The complaint bubble SNAPs in at 0.15 s. At 0.8 s an anonymous bubble (grey bars, no words) SNAPs in below, and the stack starts to rise. Visual hook before the voice. | "Thang máy B kẹt cửa ở tầng 3, / phải bấm nhiều lần mới mở được." LABEL 52 BLACK on CREAM | bubble tick; walking bass enters at 0.0 |
| 1.2 | 1.6-4.6 | same | Bubbles arrive faster (every 0.25 s down to 0.12 s, seeded). The stack scrolls up and the complaint bubble leaves the top edge at about 3.4 s. | none new | ticks accelerate; last one muffled |
| 1.3 | 4.6-5.6 | same | CUT: a scissor line slices diagonally through the stack; the halves drop and slide off, revealing ORANGE. | none | snip, paper slide, low piano cluster |
| 1.4 | 5.6-8.3 | Drawn: CREAM strip on ORANGE. The figure is the demo fund balance from `desktop-fund` / `android-light-02-home` | The strip SLIDEs in from the left. At 6.6 s the "500" block is CUT out and drops out of frame, leaving a BLACK hole: "981.▮▮▮.000 đ". No invented replacement number. | "Quỹ bảo trì" LABEL 48; "981.500.000 đ" DISPLAY 190 BLACK | snip-snip, slide down, one bass note falls |
| 1.5 | 8.3-9.8 | drawn | The hole TEARs open into a full BLACK field; the question SLAMs. | "TIỀN QUỸ / ĐI ĐÂU?" DISPLAY 230 CREAM, left-aligned | stab (piano + bass + brush crash), ring out |

## ch02 Problem (9.8-33.7)

| Line | Est. | Draft voice |
|---|---|---|
| L04 | 11.1-15.4 | Hà Nội có một nghìn ba trăm sáu mươi ba tòa chung cư. |
| L05 | 15.9-20.2 | Mười bảy phần trăm chung cư thương mại có tranh chấp, khiếu kiện. |
| L06 | 20.7-25.1 | Ba mươi sáu phần trăm vụ tranh chấp là về quỹ bảo trì. |
| L07 | 25.6-28.9 | Năm mươi hai phần trăm chưa được bàn giao quỹ. |
| L08 | 29.4-33.7 | Báo cáo thu chi chỉ vài lần mỗi năm, không kèm chứng từ. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 2.1 | 9.8-11.1 | drawn | WIPE: ORANGE slides in from the right over the question; the first slabs start to rise. | none | slide, first thumps |
| 2.2 | 11.1-15.4 | Drawn skyline: about 24 BLACK slabs with CREAM windows | Slabs rise from the bottom edge in a seeded, staggered wave. "1.363" COUNTs at top left. | "1.363" DISPLAY 260 BLACK; "tòa chung cư tại Hà Nội" LABEL 56; "Nguồn: CBRE, Savills" LABEL 30 | pitched thump per slab, odometer rattle |
| 2.3 | 15.4-20.2 | Drawn façade: 745 cells (35 × 21 + 10) | PUSH into one slab; its face becomes the 745-cell grid (CREAM on BLACK). 129 cells FLIP to ORANGE in a seeded scatter. "17%" SLAMs at left. | "17%" DISPLAY 300 ORANGE; "cụm, tòa chung cư thương mại / có tranh chấp, khiếu kiện" LABEL 48 CREAM; "129/745 · Thanh tra Chính phủ" MONO 32 CREAM | 129 flip ticks, slam |
| 2.4 | 20.2-25.1 | Drawn: one strip standing for all disputes | HARD CUT to CREAM. A BLACK strip SLIDEs across; it is CUT at 36%, and that piece turns NAVY and lifts 120 px. "36%" SLAMs. | "36%" DISPLAY 300 NAVY; "vụ tranh chấp là về quỹ bảo trì" LABEL 48 BLACK; "Bộ Xây dựng" LABEL 30; the lifted piece reads "quỹ bảo trì" LABEL 44 CREAM | slide, snip, lift, slam |
| 2.5 | 25.1-28.9 | Drawn: 25 BLACK slabs, each with a CREAM "quỹ" box | WIPE: ORANGE rises. 13 of the 25 boxes (13/25 = 52%) are CUT out and fall, left to right on sixteenth notes. "52%" SLAMs. | "52%" DISPLAY 300 BLACK; "chung cư thương mại chưa được / bàn giao quỹ bảo trì" LABEL 48 | 13 snips, slam |
| 2.6 | 28.9-33.7 | Drawn: a report sheet with an empty paper clip | CREAM field. The sheet SLIDEs in at −3°; the clip holds nothing; a RED tag STAMPs across. | "BÁO CÁO THU – CHI" DISPLAY 110; "vài lần mỗi năm" LABEL 56; tag "KHÔNG KÈM CHỨNG TỪ" DISPLAY 64 CREAM on RED | slide, empty clip click, stamp |

## ch03 Market (33.7-48.6)

| Line | Est. | Draft voice |
|---|---|---|
| L09 | 34.8-38.8 | Ban quản trị trả hai mươi nghìn đồng mỗi căn mỗi tháng. |
| L10 | 39.2-43.9 | Khách hàng: tòa ba trăm đến bảy trăm căn, dưới mười năm, có Ban quản trị. |
| L11 | 44.3-48.6 | Thị trường mục tiêu: ba mươi hai phẩy bốn tỷ đồng mỗi năm. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 3.1 | 33.7-34.8 | drawn | FLIP: the report sheet turns over; its back is NAVY and becomes the price card. | none | flip |
| 3.2 | 34.8-38.8 | drawn | On CREAM: "20.000đ" COUNTs on the NAVY card. Two tags SLIDE in above it with a cut-paper arrow between them. | "Mô hình B2B2C" LABEL 44; tag "Ban quản trị trả phí" LABEL 48 CREAM on NAVY; tag "Cư dân hưởng lợi" LABEL 48 BLACK on ORANGE; "20.000đ" DISPLAY 240 CREAM; "/căn/tháng" LABEL 64 CREAM | slide ×2, rattle, stamp |
| 3.3 | 38.8-43.9 | Drawn: one tall BLACK façade slab | The card slides left and the slab rises. Three tags pin onto it, one per beat. | "300–700 căn" (ORANGE), "dưới 10 năm" (CREAM), "có Ban quản trị" (NAVY), all LABEL 56 | slide up, 3 pins |
| 3.4 | 43.9-48.6 | Drawn: nested cut rectangles | TAM (ORANGE), then SAM (NAVY) inside it, then SOM (CREAM) inside SAM, each SLIDEs in and COUNTs. SAM lands on the voice. | "TAM · 96–120 tỷ đ/năm"; "SAM · 32,4 tỷ đ/năm" DISPLAY 150 CREAM + "thị trường mục tiêu" LABEL 40; "SOM · 0,54–5,4 tỷ đ/năm" | 3 slides (descending), rattles, soft stab on SAM |

## ch04 Who hurts (48.6-62.1)

| Line | Est. | Draft voice |
|---|---|---|
| L12 | 49.7-53.4 | Ban quản trị bị nghi ngờ, kể cả khi làm đúng. |
| L13 | 53.9-58.2 | Ban quản lý nhận phản ánh qua Zalo, không ai theo dõi. |
| L14 | 58.7-62.1 | Cư dân đóng phí, nhưng không rõ tiền đi đâu. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 4.1 | 48.6-49.7 | drawn | WIPE: a BLACK curtain drops from the top. | none | slide down, thump |
| 4.2 | 49.7-53.4 | Drawn: three ORANGE panels (520 × 760), each with a BLACK cut-paper figure | The panels hang in. Panel 1 steps forward (scale 1.04) and shows its pain. | "BAN QUẢN TRỊ" / "người quyết định mua"; "BAN QUẢN LÝ" / "người dùng hằng ngày"; "CƯ DÂN" / "người thụ hưởng" (DISPLAY 64 + LABEL 36); pain 1 "Bị nghi ngờ, / kể cả khi làm đúng" LABEL 48 | slide, snap |
| 4.3 | 53.4-58.2 | same | Panel 2 steps forward with its pain. Panel 1 FLIPs to NAVY with its answer. | pain 2 "Phản ánh qua Zalo, / không ai theo dõi"; answer 1 "Lịch sử thu chi / không thể sửa lén" LABEL 48 CREAM on NAVY | flip, warm chime |
| 4.4 | 58.2-62.1 | same | Panel 3 steps forward with its pain. Panel 2 FLIPs at 58.9 s; panel 3 FLIPs at 61.2 s. | pain 3 "Không rõ tiền đi đâu"; answer 2 "Gửi phản ánh 24/7, / AI gợi ý, có lưu vết"; answer 3 "Biết từng khoản chi / vào việc gì, cho nhà thầu nào" | flip, flip, chime |

## ch05 Demo 1 (62.1-84.4)

| Line | Est. | Draft voice |
|---|---|---|
| L15 | 63.4-68.0 | Làm Tổ biến một phản ánh thành khoản chi ai cũng kiểm chứng được. |
| L16 | 68.5-73.2 | Cư dân gửi phản ánh bất kỳ lúc nào, kèm ảnh và vị trí. |
| L17 | 74.6-78.9 | Ây-ai gợi ý nhóm sự cố, mức khẩn và hạn xử lý. |
| L18 | 79.4-84.4 | Nhưng người quyết định là một quản lý có tên; mọi bước đều lưu vết. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 5.1 | 62.1-63.4 | drawn | The three NAVY panels slide apart like doors onto CREAM. The music opens to major. | none | door slides, warm chord |
| 5.2 | 63.4-68.0 | `assets/brand/lamto-logo.png`, as-is (460 px), no shadow | The logo SLIDEs in at left; the line SLIDEs in at right. | "Từ một phản ánh / đến khoản chi / ai cũng kiểm chứng được" LABEL 64 BLACK, with "kiểm chứng được" in NAVY | slide, snap |
| 5.3 | 68.0-73.2 | App: (a) report form, (b) location picker, (c) filled location, photo and submit (the test-string description is cropped out) | A NAVY façade (8 × 5 CREAM windows) SLIDEs in. One window opens as an aperture. The UI rises inside and changes at 68.0 s, 69.9 s and 71.6 s. | right of the aperture: "Ảnh · vị trí · 24/7" LABEL 56 CREAM | slides, aperture creak, click on "Gửi phản ánh" |
| 5.4 | 73.2-74.6 | App: confirmation banner and "Nhận thông báo cập nhật" | The aperture SNAPs to the confirmation. | from UI: "Phản ánh của bạn đã được ghi nhận." | snap, small bell |
| 5.5 | 74.6-78.9 | Web: report #7 card, then the AI suggestion card | HARD CUT to CREAM. Plate 1 SLIDEs in; at 76.2 s plate 2 slides up over it. Three ORANGE cut brackets SNAP under "Thang máy", "Cao" and "240 phút", placed below the text and never on it. | tag "AI GỢI Ý" DISPLAY 110 BLACK on ORANGE | slide, slide, 3 snaps |
| 5.6 | 78.9-84.4 | Web: confirm panel (top), "Xác nhận phân loại" button, manager identity (avatar + name; "Kawaibu" in the new screenshots), case #2 accountability chain | The panel SLIDEs in from the right (79.4 s). The button and identity SNAP beneath it with a NAVY tag (80.8 s). The all-green chain SLIDEs along the bottom and reveals left to right, one step per tick (82.4 s). | tag "NGƯỜI QUYẾT ĐỊNH" DISPLAY 64 CREAM on NAVY; "mọi bước đều lưu vết" LABEL 52 | slide, stamp, 6 ticks |

## ch06 USP 1: before approval (84.4-104.8)

No UI screenshot exists for the price check, so this chapter is drawn paper only and never looks like an app screen.
The 18–34tr band and the 46tr quote are the deck's example and are labelled "Ví dụ".

| Line | Est. | Draft voice |
|---|---|---|
| L19 | 85.5-89.9 | Quỹ chung có hai lớp bảo vệ. Lớp một: trước khi duyệt chi. |
| L20 | 90.4-95.4 | Ây-ai đưa ra khung giá hợp lý từ những việc tương tự đã làm. |
| L21 | 96.0-100.0 | Một báo giá bốn mươi sáu triệu vượt khung, bị cảnh báo ngay. |
| L22 | 100.5-104.8 | Ây-ai chỉ gợi ý; ban quản lý xem lại và quyết định. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 6.1 | 84.4-85.5 | drawn | WIPE: BLACK slides down; a giant cut numeral SLAMs. | "1" DISPLAY 620 ORANGE | slam, bass hit |
| 6.2 | 85.5-89.9 | drawn | The claim SLIDEs in beside the numeral. | "Hai lớp bảo vệ quỹ chung" LABEL 48 ORANGE; "TRƯỚC KHI / DUYỆT CHI" DISPLAY 120 CREAM | slide |
| 6.3 | 89.9-95.4 | Drawn: CREAM scale bar | The numeral slides out. The bar SLIDEs across the frame with ticks at 0, 18tr, 34tr and 46tr, at proportional positions and with no other labels. An ORANGE band grows from 18 to 34 on a spring. | "Ví dụ" LABEL 40; "Khung giá hợp lý" LABEL 52 CREAM; "18–34tr" DISPLAY 110 ORANGE; tick labels MONO 40 | long slide, rising tone, tick clicks |
| 6.4 | 95.4-100.0 | drawn | A RED tag SLIDEs along the bar from the left, crosses the band and stops at 46 with a jolt. The 34→46 segment TEARs and turns RED; a RED strip SLAMs. | tag "Báo giá 46tr" LABEL 52 CREAM on RED; strip "VƯỢT KHUNG" DISPLAY 140 CREAM on RED; "cảnh báo trước khi duyệt" LABEL 48 CREAM | friction slide, thud, two-note alarm stab, tear |
| 6.5 | 100.0-104.8 | drawn | Two lines SLAM in turn; a caption SLIDEs under them. | "AI GỢI Ý." DISPLAY 170 ORANGE; "NGƯỜI QUYẾT ĐỊNH." DISPLAY 170 CREAM; "AI có bước tự kiểm tra · ảnh và thông tin cá nhân / cư dân không gửi cho AI" LABEL 34 CREAM | slam, slam |

## ch07 USP 2: after publication (104.8-127.8)

| Line | Est. | Draft voice |
|---|---|---|
| L23 | 105.9-110.9 | Lớp hai: sau khi công bố, khoản chi được niêm phong, không thể chỉnh sửa. |
| L24 | 111.5-115.8 | Cư dân lần ngược từ khoản chi về đúng phản ánh ban đầu. |
| L25 | 116.6-120.6 | Mã băm của bản ghi được giữ ở bốn nơi độc lập. |
| L26 | 121.4-124.8 | Ai sửa lén số cũ, hệ thống báo lỗi ngay. |
| L27 | 125.8-127.8 | Không ai xóa được dấu vết. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 7.1 | 104.8-105.9 | drawn | TEAR: the BLACK field rips away diagonally to CREAM; a giant numeral SLAMs. | "2" DISPLAY 620 NAVY | tear, slam |
| 7.2 | 105.9-110.9 | Web: the publish lock note, the confirm checkbox line, the "Công bố đề xuất" button (all `desktop-proposal-new`) | The title SLIDEs in (105.9 s). The lock note SLIDEs in (107.3 s), then the checkbox line (108.4 s), then the button (109.3 s). A NAVY cut-paper seal STAMPs beside the button, never on the UI. | "SAU KHI / CÔNG BỐ" DISPLAY 120 BLACK; seal "NIÊM PHONG" DISPLAY 48 CREAM on NAVY; from UI: "Tôi hiểu rằng việc công bố sẽ cố định đề xuất này và không thể chỉnh sửa." | slide ×2, click, deep stamp |
| 7.3 | 110.9-115.8 | App: (a) "Khoản chi này đã được xác minh" with 18.500.000 đ and Công ty TNHH Thang máy Việt Tiến; (b) the "Chuỗi trách nhiệm" steps; (c) the original report "Phản ánh #2" | **Payoff.** A NAVY façade aperture opens on (a). At 112.6 s it scrolls to (b), and a CREAM bracket climbs from step 4 up to step 1. At 114.2 s it HARD CUTs to (c), and the hook's chat bubble from shot 1.1 SLIDEs in beside it and SNAPs flush: the same words. | "Phản ánh gốc" LABEL 52 CREAM | slides; the hook's bubble tick resolves into a warm chord |
| 7.4 | 115.8-120.6 | Web: explorer card header, verified (green "Bản ghi đã xác minh") | Same layout as the gate-1 still: an ORANGE field cut diagonally at left, the card SLIDEs up at the bottom, and four NAVY strips SLIDE in one by one. | "4 nơi độc lập" LABEL 48; strips "9f2a…c1" ×4, MONO 52 CREAM | 4 slides (rising pitch) + lock clicks |
| 7.5 | 120.6-121.4 | drawn | A beat of silence in the voice. A RED torn strip slips in crooked (−5°) under the stack: the edit. | "4b70…e8" MONO 52 CREAM on RED | sly paper slide, scratch |
| 7.6 | 121.4-124.8 | Web: the same crop from the mismatch file | On "hệ thống" (about 122.9 s) HARD CUT verified → mismatch; the pair is pixel-matched, so only the badge (and the time, which is outside this crop) changes. "SỬA LÉN?" SLAMs on the ORANGE field and the BLACK strip SLIDEs under it. This is `docs/style/c-bass.png`. | "SỬA LÉN?" DISPLAY 250 BLACK; "BÁO LỖI NGAY." DISPLAY 150 CREAM on BLACK; from UI: "Phát hiện sai lệch toàn vẹn" | alarm stab (low brass + snare), paper slam |
| 7.7 | 124.8-127.8 | same | PUSH in on the red badge (scale 0.48 → 0.96 of the @5x source, so the badge text is about 60 px) while the paper slides away. Only the integrity card is ever in frame. Hold. | none (the voice says it) | low sustained note; silence from 127.6 s |

## ch08 Competition (127.8-138.5)

| Line | Est. | Draft voice |
|---|---|---|
| L28 | 128.9-135.5 | Chưa đối thủ nào có Ây-ai xử lý yêu cầu thực chất, hay sổ thu chi chống sửa đổi. |
| L29 | 136.8-138.5 | Làm Tổ có cả hai. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 8.1 | 127.8-128.9 | drawn | WIPE: CREAM from the right; two ORANGE columns stand at right. | "AI xử lý yêu cầu / thực chất"; "Sổ thu chi / chống sửa đổi" LABEL 40 BLACK on ORANGE | slide |
| 8.2 | 128.9-135.5 | drawn | Five BLACK strips SLIDE in one per beat, each stopping short of the first column with a torn end. Then the NAVY strip runs through both columns, and two holes PUNCH through it where it crosses them, with orange showing through. | "CYHOME", "PIHOME", "HOMEID", "BUILDING CARE", "LANDSOFT" DISPLAY 64 CREAM on BLACK; "LÀM TỔ" DISPLAY 64 CREAM on NAVY; "Nguồn: website và công bố của các nhà cung cấp" LABEL 30 BLACK | 5 slides with stop-thuds, one long slide, 2 punches |
| 8.3 | 135.5-138.5 | drawn | The five BLACK strips fall away with gravity and a slight spin, staggered; the NAVY strip stays. | "LÀM TỔ / CÓ CẢ HAI." DISPLAY 140 NAVY | flutter, thud, slam |

## ch09 Business (138.5-159.6)

| Line | Est. | Draft voice |
|---|---|---|
| L30 | 139.6-145.6 | Tòa năm trăm căn: mười triệu mỗi tháng, lợi nhuận ròng năm mươi chín phẩy hai phần trăm. |
| L31 | 146.1-152.4 | Cần hai trăm triệu cho tám tháng đầu; hòa vốn vận hành tháng tám năm hai không hai bảy. |
| L32 | 152.9-159.6 | Giai đoạn ba: hai mươi đến hai mươi lăm tòa, một trăm sáu mươi đến hai trăm triệu mỗi tháng. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 9.1 | 138.5-139.6 | drawn | The NAVY strip expands to fill the frame. | none | whoosh |
| 9.2 | 139.6-145.6 | Drawn: a façade of 500 windows (25 × 20) | The windows light ORANGE in a sweep and "10 triệu/tháng" COUNTs. At about 143.5 s the bar under it is CUT into 59,2% CREAM and the rest ORANGE. | "500 căn × 20.000đ" LABEL 56 CREAM; "10 triệu/tháng" DISPLAY 150 ORANGE; "59,2%" DISPLAY 150 CREAM; "lợi nhuận ròng" LABEL 52 | rising rattle, count, snip |
| 9.3 | 145.6-152.4 | drawn | HARD CUT to CREAM. The capital strip SLAMs; a timeline band SLIDEs in from 10/2026; an ORANGE flag SNAPs up at 08/2027 on "hòa vốn". | "200 triệu" DISPLAY 170 CREAM on BLACK; "cho 8 tháng đầu" LABEL 56; "10/2026" … "08/2027" MONO 40; flag "HÒA VỐN VẬN HÀNH" DISPLAY 56 BLACK on ORANGE | stamp, slide, flag snap |
| 9.4 | 152.4-159.6 | Drawn: a four-step staircase of façades | The steps rise left to right, one per beat, with their windows lighting. The goal SLAMs on the top step. | "GĐ0 · Hoàn thiện MVP · 10/2026–01/2027"; "GĐ1 · Thí điểm · 02–05/2027"; "GĐ2 · Thương mại hóa · 06–11/2027"; "GĐ3 · Mở rộng quy mô · 12/2027–11/2028" LABEL 36; "20–25 tòa" DISPLAY 150; "MRR 160–200 triệu" DISPLAY 90 | 4 ascending thumps, stab |

## ch10 Team (159.6-171.1)

| Line | Est. | Draft voice |
|---|---|---|
| L33 | 160.7-167.7 | Đội Kawaibu: năm thành viên từ Đại học Ngoại thương, Học viện Tài chính và Đại học Công nghệ. |
| L34 | 168.1-171.1 | Công nghệ kết hợp kinh doanh và tài chính. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 10.1 | 159.6-160.7 | drawn | The staircase slides out left onto BLACK. | none | slide |
| 10.2 | 160.7-167.7 | Drawn: five bands (ORANGE, CREAM, NAVY, CREAM, ORANGE) | The bands SLIDE in from alternating sides, one every 1.1 s. Each carries the name (DISPLAY 72) with role and school (LABEL 36): BLACK text on ORANGE and CREAM, CREAM text on NAVY. | "NGUYỄN VĂN THÁI HƯNG · Trưởng nhóm · Điều phối, nhân sự · ĐH Ngoại thương" / "NGUYỄN HOÀNG SƠN · Tài chính · Phát triển kinh doanh · Học viện Tài chính" / "NGUYỄN THÁI SƠN · Lập trình · An toàn thông tin · ĐH Công nghệ" / "PHẠM NGỌC LÂM · AI · Dữ liệu · ĐH Ngoại thương" / "CÔNG BẢO CHÂU · Thiết kế · Marketing, Sales · ĐH Ngoại thương" | 5 slides, alternating left/right |
| 10.3 | 167.7-171.1 | drawn | The bands close up tight and the team name SLAMs across the top. | "ĐỘI KAWAIBU" DISPLAY 160 ORANGE | slam |

## ch11 Close (171.1-180.0)

| Line | Est. | Draft voice |
|---|---|---|
| L35 | 172.2-175.2 | Làm Tổ: sổ quỹ không ai sửa lén được. |

| Shot | Time | Asset | Motion | On-screen text | SFX |
|---|---|---|---|---|---|
| 11.1 | 171.1-172.2 | drawn | WIPE to CREAM. | none | slide; the music starts to resolve |
| 11.2 | 172.2-176.5 | `assets/brand/lamto-logo.png`, as-is, 560 px, on CREAM | The logo SLIDEs in at left; the text SLIDEs in line by line at right. | "github.com/ntjson/LamTo" MONO 48; "Đội Kawaibu" LABEL 56; "RnD to Startup 2026" LABEL 44 | slide, final chord |
| 11.3 | 176.5-180.0 | drawn | At 177.0 s a thin NAVY façade strip rises along the bottom edge with every window lit CREAM. Hold to the end. | none | chord rings out; cut at 180.0 |

---

## UI crop reference

Measured on the final screenshot set (app @3x, web @4x, explorer pair @5x) by `tools/crops.py`, which writes
`docs/crops.json`. Scenes read that file; no rectangle is typed into scene code. Scale is on-screen px per source px
at 1080p, so every plate is a downscale and stays sharp. "Min text" is the smallest text on screen, measured from a
probe glyph's cap height (or ascender-to-descender height); all are 28 px or more.

| Shot | File | Crop x,y w×h | Scale | On screen | Min text | Content |
|---|---|---|---|---|---|---|
| 5.3a | app/android-light-12-report-form@3x.png | 0,0 1170×690 | 0.8 | 936×552 | 38.3 | header + empty report box |
| 5.3b | app/flow-00-picker@3x.png | 0,0 1170×900 | 0.8 | 936×720 | 38.3 | location picker, first rows |
| 5.3c | app/flow-01-form-filled@3x.png | 48,780 1074×1035 | 0.8 | 859×828 | 33.8 | location, photo, submit (the test-string description box is excluded) |
| 5.4 | app/flow-02-submitted@3x.png | 48,1347 1074×342 | 0.9333 | 1002×319 | 42.0 | confirmation banner + notify pill |
| 5.5a | web/desktop-report-triage@4x.png | 1184,856 2608×972 | 0.55 | 1434×535 | 30.7 | report #7 card |
| 5.5b | web/desktop-report-triage@4x.png | 1184,2096 2608×1156 | 0.575 | 1500×665 | 28.9 | AI suggestion card |
| 5.6a | web/desktop-report-triage@4x.png | 3920,716 1680×1000 | 0.575 | 966×575 | 28.9 | confirm panel: title, Danh mục, Mức khẩn |
| 5.6b | web/desktop-report-triage@4x.png | 4000,2760 1520×176 | 0.55 | 836×97 | 31.5 | Xác nhận phân loại button |
| 5.6c | web/desktop-report-triage@4x.png | 64,3188 870×194 | 0.65 | 566×126 | 30.8 | manager identity: avatar, Kawaibu, email |
| 5.6d | web/desktop-case-completed@4x.png | 1184,4328 2848×440 | 0.575 | 1638×253 | 28.9 | case #2 accountability chain, all Hoàn tất |
| 7.2a | web/desktop-proposal-new@4x.png | 4240,892 1280×464 | 0.55 | 704×255 | 30.7 | publish lock note |
| 7.2b | web/desktop-proposal-new@4x.png | 1248,5140 2040×144 | 0.525 | 1071×76 | 28.6 | confirm checkbox line |
| 7.2c | web/desktop-proposal-new@4x.png | 1280,5492 632×176 | 0.55 | 348×97 | 32.3 | Công bố đề xuất button |
| 7.3a | app/android-light-07-ledger-detail@3x.png | 48,192 1074×1044 | 0.8333 | 895×870 | 30.5 | verified header + amount/contractor |
| 7.3b | app/android-light-07-ledger-detail@3x.png | 0,1300 1170×1232 | 0.8333 | 975×1027 | 35.2 | Chuỗi trách nhiệm steps |
| 7.3c | app/android-light-06-issue-detail@3x.png | 0,168 1170×402 | 0.9333 | 1092×375 | 39.4 | Phản ánh #2 header: badge, title, location |
| 7.4 | web/desktop-explorer-verified@5x.png | 1750,2995 3700×315 | 0.48 | 1776×151 | 31.3 | integrity card header, verified badge |
| 7.6 | web/desktop-explorer-mismatch@5x.png | 1750,2995 3700×315 | 0.48 | 1776×151 | 29.8 | same crop, mismatch badge; 7.7 pushes to 0.96 |

7.7 pushes the 7.6 crop from 0.48 to 0.96, so the badge text reaches about 60 px; only the integrity card is ever in frame.

Not used, on purpose:
- The flow-01/02 description box: it contains a test string ("Kiểm thử thiết kế mới 74329" in the final set).
- The "So sánh giá" row of `desktop-proposal-published`: it says "Dự đoán AI không khả dụng — dùng giá tham chiếu mẫu",
  so in this demo the AI price check fell back to a sample reference price. The screenshots don't demonstrate
  that feature, so ch06 presents the deck's labelled example ("Ví dụ") as how it works, never as demo footage.
- The explorer's step badges ("chưa bật neo blockchain"), which the brief excludes.
- The mobile explorer pair: the brief names the desktop pair.

## Where every figure comes from

| Figure | Source |
|---|---|
| 1.363 tòa; 17% (129/745); 36%; 52%; báo cáo vài lần mỗi năm, không kèm chứng từ | deck, "Bối cảnh và cơ hội" (sources printed there: CBRE, Savills; Thanh tra Chính phủ; Bộ Xây dựng) |
| B2B2C; 300–700 căn, dưới 10 năm, có Ban quản trị; TAM 96–120, SAM 32,4, SOM 0,54–5,4 tỷ đ/năm; 20.000đ/căn/tháng | deck, "Thị trường mục tiêu và quy mô" |
| Three roles, their pains and LamTo's answers | deck, "Nhu cầu và tranh chấp Làm Tổ giải quyết" |
| AI suggests category, urgency and deadline; a named manager decides | README, "Why it matters"; deck, "Sản phẩm" |
| Two layers; price band 18–34tr, quote 46tr (the deck's example); AI self-check, residents' photos and personal data not sent to AI | deck, "Công nghệ cốt lõi" |
| Sealed on publication; copies at 4 independent places; `9f2a…c1` vs `4b70…e8`; "báo lỗi ngay; không ai xóa được dấu vết" | deck, "Công nghệ cốt lõi"; README (four-validator Besu, MISMATCH) |
| Competitors, and none with real AI intake or an anti-tamper ledger | deck, "Bức tranh cạnh tranh" |
| 500 căn → 10 triệu/tháng, 59,2%; 200 triệu for 8 months; hòa vốn vận hành 08/2027; GĐ0–GĐ3 dates; 20–25 tòa, MRR 160–200 triệu | deck, "Đơn vị kinh tế", "Nhu cầu vốn", "Lộ trình" |
| 5 members, roles, schools | deck, "Đội ngũ" |
| 981.500.000 đ; 18.500.000 đ; Công ty TNHH Thang máy Việt Tiến; the manager name ("Kawaibu" in the new screenshots); report texts | the product's own (synthetic) demo data, shown in its screenshots |
