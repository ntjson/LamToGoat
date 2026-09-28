# LamTo pitch film: studio rules

## Truth
- Facts only from refs/pitchdeck.pdf and ~/Projects/LamTo/README.md. Never invent numbers or names.
- Product UI only from assets/screens/{web,app}. Crop, mask and animate the real screenshots; never redraw UI.

## Engine
- One timeline; chapters in scenes/chNN.js, each a pure function of local time. window.seek(t) paints frame t.
- Render mode: no timers, requestAnimationFrame, CSS transitions or Math.random. Seeded RNG only.
- All motion uses closed-form springs from lib/motion.js; a value that changes target several times sums one spring per change.
- render.mjs uses playwright-core with executablePath /usr/bin/chromium, takes --from/--to/--fps/--scale,
  renders chapters in parallel workers, then joins them with ffmpeg concat.
- Drafts at 960x540, 30 fps. Final at 1920x1080, 60 fps, H.264 yuv420p, CRF 16.

## Look (your call: the deck is the source of facts, not of style)
- Choose your own visual direction: palette, type, texture, camera language. Don't copy the slides.
- Name each direction after a real style or reference, not adjectives. Propose 2-3 at gate 1, one rendered still each.
- Fixed: the LamTo logo as-is (assets/brand) and the real product screenshots. Everything else is open.
- Fonts: any family with full Vietnamese support and a license that allows use in video (e.g. OFL).
  Keep the files in assets/fonts, load via @font-face, await document.fonts.ready before the first frame.
- Nothing smaller than 28 px at 1080p; every frame must read on a phone.
- Banned: centered title on a gradient, everything fading in, corner labels and frame borders,
  glow on UI, particle bursts, walls of numbers that just sit there.
- Numbers count up on springs. A new visual event every 3-4 s.

## Voice (ElevenLabs free tier: 10,000 credits/month, non-commercial, max 2 requests at once)
- Key is ELEVENLABS_API_KEY in .env. Never print it, log it, or write it into any other file.
- eleven_flash_v2_5, language_code "vi", one request per line, NFC-normalized spoken text, fixed seed.
- Before any paid call: read remaining credits, estimate the cost, and ask me if a batch is over 1,500 credits.
- Skip lines whose spoken text hasn't changed. On a 402 or quota error, stop and list the missing lines.
- Voice drives timing: scenes read docs/vo_timings.json; never hard-code seconds.

## Sound
- Music bed and sound effects synthesized in code (no Eleven Music, no stock tracks).
- Duck the music under the voice (sidechain). Final mix -14 LUFS, true peak at most -1 dBTP.

## Before showing me anything
1. Render a contact sheet (2 fps) and a 360 px phone test of the changed chapter, and look at them.
2. Score 1-10: hook, Vietnamese correctness (accents, line breaks), readability, motion,
   brand match, voice sync, variety.
3. Log the scores in docs/review_log.md, fix the 3 worst problems, repeat until all are 8+. Then render.