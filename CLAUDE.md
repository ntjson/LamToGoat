# LamTo pitch film: studio rules

## Truth
- Facts only from refs/pitchdeck.pdf and ~/Projects/LamTo/README.md. Never invent numbers or names.
- Product UI only from assets/screens/{web,app} and from real-time recordings of the real app in assets/recordings/
  (tools/record_app.mjs records them against the design sandbox, logs every tap, key, cursor move and click, and leaves
  the sandbox as it found it). Crop, mask and animate the real screenshots; never redraw UI.
- A recording counts as real UI: crop, mask, scale and time-remap it (speed ramps, holds), never redraw or retouch it.
  The device frame, the hand and the cursor drawn around it are overlays: the hand taps exactly where and when the
  recording tapped, and nothing is drawn that the recording doesn't show (no keyboard, no status bar).
- Team photos only from assets/team/ (real photos, used with consent; tools/team.py extracts them from the deck).
  Never redraw, distort or AI-alter them beyond cutout and colour treatment.

## Engine
- One timeline; chapters in scenes/chNN.js, each a pure function of local time. window.seek(t) paints frame t.
- Render mode: no timers, requestAnimationFrame, CSS transitions or Math.random. Seeded RNG only.
- All motion uses closed-form springs from lib/motion.js; a value that changes target several times sums one spring per change.
- render.mjs uses playwright-core with executablePath /usr/bin/chromium, takes --from/--to/--fps/--scale,
  renders chapters in parallel workers, then joins them with ffmpeg concat.
- Drafts at 960x540, 30 fps. Final at 1920x1080, 60 fps, H.264 yuv420p, CRF 16.
- Reading time drives timing (there is no voice-over): tools/timeline.py builds docs/timeline.json from the
  on-screen text in docs/onscreen.json, so every shot holds long enough to read its text at a relaxed pace.
  Everything sits on the music's beat grid (108 BPM; chapters on bar lines); cuts and SLAMs snap to it.
  Scenes read the timeline through ctx and never hard-code seconds.
- The film is exactly 3:00 (81 bars). To fit, only holds are trimmed, never reading time: the reading pace is
  fixed, and shots whose length is set by their text keep every frame. tools/readcheck.mjs checks each text's
  real on-screen time.

## Look (your call: the deck is the source of facts, not of style)
- Choose your own visual direction: palette, type, texture, camera language. Don't copy the slides.
- Name each direction after a real style or reference, not adjectives. Propose 2-3 at gate 1, one rendered still each.
- Fixed: the LamTo logo as-is (assets/brand) and the real product screenshots and recordings. Everything else is open.
- Fonts: any family with full Vietnamese support and a license that allows use in video (e.g. OFL).
  Keep the files in assets/fonts, load via @font-face, await document.fonts.ready before the first frame.
- Nothing smaller than 28 px at 1080p; every frame must read on a phone. Exception: app text inside a recording in a
  wide device shot may be smaller, as long as anything the viewer must read gets a push-in (to 28 px or more) or a
  story caption.
- Banned: centered title on a gradient, everything fading in, corner labels and frame borders,
  glow on UI, particle bursts, walls of numbers that just sit there.
- Numbers count up on springs. A new visual event every 3-4 s.

## Story text (no voice-over)
- The film is music and sound effects only; the on-screen text carries the whole story.
- Every story beat's message (the old voice lines L01-L35) must be on screen, as display type or a caption strip
  in the film's style, never as subtitle text along the bottom. docs/onscreen.json lists each beat's text and logs
  what was added.
- The same text never appears twice in one frame: no phrase or statement shows twice at once, counting the film's own
  type and the real UI's text (a UI that repeats itself is left out or cropped). One shared word is not a repeat
  ("CÔNG BỐ" in a title and on the "Công bố đề xuất" button). The one exception: ch07's four identical hash copies
  (7.4-7.6), where the repetition is the picture.

## Voice (kept for a possible later voice; not in use)
- The pipeline stays: docs/vo_lines.json, tools/vo.py, docs/vo_script.md, docs/vo_timings.json.
  `tools/timeline.py --voice` puts the timeline back on a voice.
- If a voice is ever generated with ElevenLabs (free tier: 10,000 credits/month, non-commercial, max 2 requests at once):
  - Key is ELEVENLABS_API_KEY in .env. Never print it, log it, or write it into any other file.
  - eleven_flash_v2_5, language_code "vi", one request per line, NFC-normalized spoken text, fixed seed.
  - Before any paid call: read remaining credits, estimate the cost, and ask me if a batch is over 1,500 credits.
  - Skip lines whose spoken text hasn't changed. On a 402 or quota error, stop and list the missing lines.

## Sound
- Music bed: "Upbeat Jazz" by Francisco Alvear (Mixkit; license and source in audio/music/SOURCES.md), stretched to
  exactly 108 BPM and arranged to 3:00 on the film's bar lines by tools/bed.py: sections repeat only at phrase
  boundaries, following the mood arc (sparse to ch05, brighter from ch05, driving ch08-ch09, resolving ch10-ch11).
  No other stock tracks, no Eleven Music. The synthesized score stays available (tools/sound.py --music synth).
- Sound effects are synthesized in code (tools/synth.py), following the shotlist's Sound section. They sit on the scenes'
  own event times, and they fit the bed:
  - Pitched effects are tuned to the bed's measured tuning (A4 = 441.3 Hz), voiced on the chord the bed plays at their
    bar (docs/bed_harmony.json: F minor is home, the intro sits on D) and played on the bed's own voices (docs/bed_kit.md:
    keys, bass and hi-hat; it has no kick, snare, cymbal or brass). A layer the bed already plays at that moment is left out.
  - Rhythmic effects are straight 8ths, never swung.
  - Paper and UI sounds are unpitched noise, EQ'd into the gaps of the music's mids, and none stands more than +3 dB over
    the music (loudness and the 250 Hz - 4 kHz mids: tools/meter.py, checked from the stems by tools/sfxcheck.py).
    Pitch is checked by tools/tunecheck.py, harmony by tools/soundcheck.py.
- Final mix -14 LUFS, true peak at most -1 dBTP. If a voice is added, duck the music under it (sidechain).

## Before showing me anything
1. Render a contact sheet (2 fps) and a 360 px phone test of the changed chapter, and look at them.
2. Score 1-10: hook, Vietnamese correctness (accents, line breaks), readability, motion,
   brand match, sync (beat grid and reading time), variety.
3. Log the scores in docs/review_log.md, fix the 3 worst problems, repeat until all are 8+. Then render.