# Music

## The film's bed

`upbeat-jazz_francisco-alvear_mixkit.mp3`: **"Upbeat Jazz" by Francisco Alvear**, from Mixkit (genre Jazz, 1:50,
44.1 kHz stereo MP3, sha256 `47427e8614cb7472…`).
- File: https://assets.mixkit.co/music/644/644.mp3.
- License: Mixkit Stock Music Free License (https://mixkit.co/license/). Mixkit's own summary
  (https://mixkit.co/llm-info/) says:
  - commercial use in online video is allowed, and no attribution is required;
  - you may not sell or redistribute the track itself.
  - The full legal text is rendered by script and was not read. Read it before final release, especially on
    modification, which the film does (stretching, cutting, repeating), and on broadcast.
  - Crediting Mixkit and the artist is welcome, for example: *Music: "Upbeat Jazz" by Francisco Alvear (Mixkit).*
- Because of the no-redistribution term, don't publish this repository with the MP3 in it.

Measured (`tools/bed.py`, `out/tmp/music/bed_analysis.py`):
- **Tempo:** 110.005 BPM (±0.002, 6 ms of beat jitter), stretched ×0.98177 to 108 BPM.
- **Key:** F major (with F minor color).
- **Form at 108 BPM:** 50 bars. Intro 1-9 (bar 1 fades in), A1 10-17, B1 18-24, A2 25-32, B2 33-39, A3 40-47,
  coda 48-49, final chord 50.

`tools/bed.py` arranges it to the film's 81 bars; the plan and its joins are in its docstring and in
`docs/review_log.md`.

The other candidates auditioned on 2026-09-29 are in `candidates/` (not in the film, not committed).
