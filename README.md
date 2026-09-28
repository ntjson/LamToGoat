# Làm Tổ: pitch film

A 3:00 pitch film for Làm Tổ (Đội Kawaibu, RnD to Startup 2026), made entirely in code. Scenes are HTML/SVG,
each a pure function of time, rendered frame by frame in headless Chromium and joined with ffmpeg.
Music and sound effects are synthesized.

Status: in production. See `docs/brief.md` for the plan and gates, `docs/style_guide.md` for the look (Saul Bass
title sequence), `docs/shotlist.md` for every shot, and `docs/vo_script.md` for the voice script.

## Layout

| Path | What |
|---|---|
| `docs/` | Brief, style guide, shotlist, voice script and timeline (`vo_timings.json`), UI crops (`crops.json`), review log |
| `scenes/` | One module per chapter (`chNN.js`) |
| `lib/` | Engine, closed-form springs, seeded randomness, cut-paper helpers |
| `tools/` | Stills, voice timing, crop measurement, font and texture tools |
| `assets/` | Logo and real product screenshots, fonts, generated paper textures |

## Render

Needs Node, `/usr/bin/chromium` and ffmpeg (`npm install` fetches playwright-core).

```bash
node render.mjs --chapters ch01 --out out/ch01.mp4   # draft: 960x540, 30 fps
node render.mjs --final --out out/final.mp4          # final: 1920x1080, 60 fps, H.264 yuv420p, CRF 16
node tools/review.mjs ch01                           # draft + 2 fps contact sheet + 360 px phone sheet in out/review/
node tools/still.mjs index.html out/still.png --t 9.0  # one frame at film time 9.0 s
uv run python tools/vo.py calibrate L04-L08=<seconds>  # re-time the film from a test read
```

## Credits

- Voice: recorded by the team (Đội Kawaibu).
- Music and sound effects: synthesized in code.
- Type: Bricolage Grotesque and IBM Plex Mono, both under the SIL Open Font License 1.1 (licences in `assets/fonts/`).
- Logo and product screenshots: Làm Tổ.
