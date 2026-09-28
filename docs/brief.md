You are director, animator, sound designer and render engineer for a 3:00, 16:9 pitch film
for Làm Tổ (team Kawaibu, RnD to Startup 2026), made entirely in code. Multi-session production.

One line: a resident's photo becomes a verifiable maintenance-fund expense, and nobody can
quietly rewrite the building's books. Judges should leave thinking "this is trustworthy and it already works."

Beat sheet (a starting point: reorder or merge chapters if it makes a better film, but keep every fact;
a visual payoff every 3-5 s, voice starts after a 1-2 s visual hook):
0:00-0:08 ch01 Hook: a complaint lost in a chat; a fund figure silently changes. "Tiền quỹ đi đâu?"
0:08-0:30 ch02 Problem: 1.363 tòa; 17% cụm tòa có tranh chấp; 36% vụ tranh chấp về quỹ bảo trì;
          52% chưa bàn giao quỹ; báo cáo vài lần/năm, không chứng từ.
0:30-0:45 ch03 Market: B2B2C; tòa 300-700 căn, dưới 10 năm, có Ban quản trị;
          TAM 96-120 tỷ, SAM 32,4 tỷ, SOM 0,54-5,4 tỷ; 20.000đ/căn/tháng.
0:45-1:00 ch04 Who hurts: Ban quản trị (buyer) / Ban quản lý (daily user) / Cư dân (beneficiary),
          each pain flips into LamTo's answer.
1:00-1:25 ch05 Demo 1: resident reports in the app (assets/screens/app/flow-*) → AI suggests a
          category and urgency, a named manager decides (desktop-report-triage).
1:25-1:45 ch06 USP 1: AI price band 18-34tr; a 46tr quotation gets flagged before approval.
          No UI screenshot exists for this: visualize it your own way, never as a fake app screen.
1:45-2:10 ch07 USP 2: publish → resident traces the expense back to the report (app ledger screens)
          → sealed on 4 independent Besu nodes → someone edits the record → desktop-explorer-verified@2x.png
          turns into desktop-explorer-mismatch@2x.png ("Phát hiện sai lệch toàn vẹn").
          The two are a pixel-matched pair: only the badge and the time differ.
          Crop to the integrity card only; the step badges on that page say anchoring is off.
2:10-2:22 ch08 Competition: only LamTo has real AI intake plus a tamper-proof ledger
          (CyHome, PiHome, HomeID, Building Care, Landsoft).
2:22-2:40 ch09 Business: a 500-unit building = 10tr/month, 59,2% net margin; 200 triệu for 8 months;
          break-even 08/2027; roadmap GĐ0-GĐ3 → 20-25 buildings, MRR 160-200tr.
2:40-2:52 ch10 Team: 5 members, ĐH Ngoại thương, Học viện Tài chính, ĐH Công nghệ.
2:52-3:00 ch11 Close: logo lockup (assets/brand), github.com/ntjson/LamTo, Đội Kawaibu.

Voice: Vietnamese, about 150 s of speech, 2,400-2,600 spoken characters. Music-only breaths at the
hook and between chapters. Until real voice files exist, estimate timing at about 3 syllables/s.

Gates (wait for my OK at 1, 2, 4 and 6):
1. docs/style_guide.md with 2-3 distinct visual directions of your own (one rendered still each).
   After I pick one, docs/shotlist.md (per shot: time, asset, motion, text, SFX).
2. docs/vo_script.md: display text and spoken text per line, character count, credit estimate.
3. Voice: read-only account check (credits left, models that support "vi", voices the API allows).
   Then Voice Design with 3 previews saved to audio/tests/ for me to pick, OR wait for my website files.
   Build docs/vo_timings.json.
4. Engine and ch01 only: stills, critique loop, I approve the look.
5. Write docs/ANIMATION_GUIDE.md, then subagents build ch02-ch11 in parallel,
   each chapter passing its own critique loop.
6. Rough cut at 960x540 with the voice; review pacing with me.
7. Polish, sound pass, final 1920x1080 60 fps render, deliverables.

Deliverables: out/final.mp4, out/final.vi.srt, out/poster.png, out/contact.png, and a README.md
that credits "Voice: elevenlabs.io".