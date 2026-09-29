# The bed's players, measured: kit, bass and keys

"Upbeat Jazz" (Francisco Alvear, Mixkit), as `tools/bed.py` stretches it to 108 BPM. Written for the effects remake:
what the track plays and when, so an effect can avoid doubling it, match its sound and keep to its rhythm.
**Nobody has listened to it.** Everything below is measured (band envelopes, note decomposition, a source-separation
pass used only for analysis) and read off spectrograms. Confidence is stated per claim.

- Mixkit's own tags for the track: Jazz, Humorous, Lively, **Bass, Drums**, Comedy (the track also appears on Mixkit's
  Piano page, but "Piano" is not among its visible tags).
- Tools: `tools/bedhits.py` (onsets by instrument, per-cue report). Scratch scripts, figures and data are in
  `out/tmp/remake/kit/` (git-ignored). Times are film seconds on `out/sound/bed.wav` unless a *source* bar is named;
  film bar n of the plan (`out/sound/bed.json`) is source bar n for film bars 1-9, n-8 for 10-17 (source 2-9), n-16 for
  18-25 (source 2-9), n-20 for 26-67 (source 6-47), n-35 for 68-78 (source 33-43), n-31 for 79-81 (source 48-50).
- Source separation (htdemucs, CPU, MIT) was run on the stretched track only to find out what is in it. Nothing from it
  is in the film.

## (a) Inventory

| Voice | What it is | Evidence | Confidence |
|---|---|---|---|
| **Hi-hat** | one noise burst on every straight 8th, constant level, from film bar 2 (2.18 s) to the last bar (177.5 s) | 647 air-band (9-16 kHz) onsets in 80 bars: 8 a bar, 8 in every bar of the body; peak level spread ±1.2 dB; the drums stem holds nothing else | role high; closed vs half-open vs shaker cannot be told apart by measurement (rise 6 ms, decay τ about 80 ms: looser than a closed hat) |
| **Bass** | one plucked, gated note on every 8th (body, film bar 30 on); notes held to about 200 ms; a few held longer | one onset on every even 16th slot of every one of the 38 body bars (39-43 per slot over 38 bars: a few double detections), pitch tracked per note | behaviour high; electric vs upright vs synth unknown (fundamental-heavy, soft 25 ms attack) |
| **Keys** | staccato chord stabs, about 10 mid-band events a bar over the whole 16th grid, strongest on the beats; fundamental-heavy, smooth roll-off, rings τ about 0.3 s | note decomposition (NNLS), 98 chord hits of 3+ notes in the body, median 4 notes, F4-F5, range G3-Eb6 | role high; "piano" is probable (Mixkit lists the track on its Piano page), not certain; an electric piano fits the numbers as well |
| **Intro pad and stab** | film bars 2-9 (and every repeat): a sustained bright chord, plus a bright stab on the 16th after beat 4 whose 3-8 kHz partials bloom 0.15-0.4 s after the hit and ring over 1 s | slot-13 event in every intro bar; band envelopes in `stab_intro_env.png` | role high; instrument unknown |
| **Intro sub pulse** | a steady tone near 69 Hz (Db2), gated to about 80 ms, on every beat of the intro (film bars 2-9 and repeats), under the bass in bars 6-9 | narrow-band frequency 69, 65, 70, 72, 71 Hz over 0-80 ms (no downward sweep); envelope flat to 60 ms, -12 dB at 80, -17 at 100; the same waveform every time | high that it is pitched and gated; **not a kick drum** |
| Lead / melody | none found that stands apart from the chord hits | no separate line in the note decomposition; the highest notes are the tops of chord hits | medium |
| Mallets, horn, guitar, organ | not identified | the partial series and envelopes above do not need them; cannot be ruled out without ears | low |

**The kit is one hi-hat.** No kick, no snare, no ride, no noise cymbal. Evidence:
- the drums stem's 35-130 Hz band sits 22-28 dB under the bass stem's and does not favour beats 1 and 3
  (`kicktest`, `drumslots` in the scratch folder);
- no slot in the body has a broadband transient (1-8 kHz rise) except the hats; the odd bright hit on slot 13 is a
  pitched keys stab with a noisy edge (`slot13_zoom.png`);
- the 9-16 kHz map of every 8th of every bar (`swellmap.png`) shows only hats; no bar in film bars 30-67 has a raised
  floor between hits;
- `bedhits.py --scan`: 0 kick, 0 snare, 0 ride on the whole bed.

The only cymbal-like events (`crash` in `bedhits.py`):
- **seven short accents on the 4& (beat 4.5) of source bars 5 and 9**: a hat-like burst 5 dB louder than its neighbours
  with a tail 19 dB down at 150-250 ms, no noise wash. Film times 10.79, 19.69, 28.57, 37.46, 46.34, 55.24 and 64.13 s
  (film bars 5, 9, 13, 17, 21, 25, 29). No cue starts within 60 ms of one.
- **the final chord has no cymbal.** Its tail is tonal (spectral flatness 0.11, against 0.28-0.37 for hats), the
  2.5-9 kHz band decays from -28 to -45 dB (re full scale) over 1.5 s, and nothing above 9 kHz.

## (b) The groove

Events per bar at each 16th slot (slot 0 = the beat-1 line, times moved +18 ms; from `bedhits.py`, film bars):

| Section | | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A (30-37, 45-52, 60-67) | hat | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | .2 | 1 | . |
| | bass | 1 | .1 | 1 | . | 1 | . | 1 | . | 1 | . | 1 | .1 | 1 | . | 1 | . |
| | keys | .9 | .6 | .5 | .5 | 1 | .4 | .7 | .2 | 1 | .3 | .5 | .7 | .6 | .6 | .5 | .3 |
| B (38-44, 53-59) | hat | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | .1 | 1 | . |
| | bass | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | .6 | .4 | .9 | . |
| | keys | 1 | .5 | .4 | .3 | 1 | .6 | .6 | .6 | 1 | .4 | .7 | .4 | .9 | .9 | .3 | .4 |
| Intro (2-9) | hat | .9 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | . | 1 | .4 | .6 | . |
| | bass and pulse | 1 | .3 | .9 | .8 | 1 | . | 1 | .6 | 1 | .3 | .9 | .6 | 1 | .9 | . | . |
| | keys | .9 | . | .6 | .5 | 1 | . | .9 | .9 | .9 | .4 | .8 | .5 | 1 | 1 | .6 | . |

("." = under 0.1; the odd-slot bass counts are harmonic ripple, not notes; in the intro `bedhits` reports bass
events for the low pad notes too, and its `note` there is the pad's, not the pulse's.)

The bass line, per 8th (pitch class of the strongest bass partial, from the bass stem; `out/tmp/remake/kit/bass_pattern.json`):
- **A:** F F F F | Db Db C C, per bar. Variants: F F F F | F G Ab Bb (film bars 33, 37) and F F F F | F C F C (film bars 48,
  52, 56, 63, 67, at the end of each 8-bar A).
- **B:** Bb Bb Bb Bb | Eb Eb Eb Eb; Ab Ab Bb Bb C C Ab Ab; G G G G | C C G Gb; F F F F F F F C; then the same again (B2 varies a little).
- **Intro bars 6-9:** F F C C C C C C; C F F F D G F F; F F F F C C C C; F F F F D D Gb F. Bars 2-5 have no bass.
- The notes named F are F1 (44 Hz) whose 2nd harmonic is louder than the fundamental; the low end is F1, Bb1, G1, Ab1,
  C2, Db2, Eb2 and up.

**Swing check: straight everywhere.** Onset position against the film's straight 8th grid (`swing1.py`, `swing2.py`):

| Voice | On-beat 8ths | Off-beat 8ths | Off minus on | Within 15 ms (lead-corrected) of a straight 8th | of a swung 8th (0.6) |
|---|---|---|---|---|---|
| Hat (n 304, body) | -19.9 ms | -17.2 ms | **+2.7 ms** (swung: +55) | 1.00 (0.50 on the beat, 0.50 on the 8th) | 0.00 |
| Bass (n 324) | -23.6 ms | -23.4 ms | **+0.1 ms** | 0.51 of notes (detector jitter is ±20 ms) | 0.01 |
| Keys (n 161 chord hits) | (16th grid) | | none at 0.6 or 0.667 | 0.36 within 15 ms of any 16th slot (NNLS timing is ±25 ms); 54 % of hits on 8th positions, 46 % on 16th offbeats | 0.00 |

Hat inter-onset intervals: on→off 277.5 ms, off→on 275.6 ms (straight 277.8); swing ratio 0.503.

**Where the instruments sit against the film's grid** (the beat lines are the beat tracker's; T0 = 83 ms):
- hats' edge **18 ms early** (IQR -29..-13; -19.5 in the intro);
- bass's steepest rise **4.5 ms late** (IQR -8..+16); its 10-90 % attack is 25 ms, so it starts about 10 ms early;
- keys' attack edges about 17 ms early (n 39, IQR -41..+6);
- the two big downbeat entries come earlier still: the body's first bass note (F2, the lift) is at 64.362 s, **82 ms
  before ch05's bar line (64.444 s)**; the final chord's bass note is at 177.636 s and its keys chord at 177.693 s,
  **142 and 85 ms before the last bar line (177.778 s)**.

## (c) Timbre, in numbers to copy

Levels are RMS re the whole bed's RMS (source-separation stems, so sums are approximate): body (bars 10-47) bass
-1.8 dB, keys -6.0 dB, hat -17 dB; intro (bars 2-9) bass stem -3.8 dB, keys and pad -5.8 dB, drums stem -7.0 dB (it holds
the hat and the sub pulse). The hat's own 9-16 kHz peak is about 25 dB under the bed's total in the body and about 10 dB
under it in intro bars 2-5, where the total is small.

**Hat**
- attack: 10-90 % rise 6.0 ms, peak 1 ms after the edge;
- decay of the 6-16 kHz envelope (amplitude): -6 dB at 50 ms, -10 dB at 90 ms, -20 dB at 190 ms, τ about 70-85 ms;
- spectrum (drums stem, 2-20 kHz): centroid 8.1 kHz, 50 % of the energy under 7.1 kHz, 85 % under 13.3 kHz, broad from
  0.8 to 12 kHz; the mixture's own 5-9 kHz band falls -10 dB by 200 ms, 9-16 kHz -27 dB by 240 ms;
- constant velocity (peak spread ±1.2 dB); balanced in level (L-R +0.4 dB) but decorrelated between channels
  (correlation 0.17 in 9-16 kHz), so wide, not a point;
- coherent averaging of 386 hits gives 5 % coherence: the noise differs every time (or the time-stretch decorrelated it).

**Bass** (bass stem, body)
- attack: 10-90 % rise 25 ms (IQR 19-30);
- decay: -5 dB at 25 ms, -7 at 50, -10 at 100, -16 at 150, **-27 at 200 ms**: τ 160 ms to 100 ms, then a release with
  τ 60 ms, so the gate is about 200 ms of a 278 ms 8th (72 %); 10 % of the notes are held (τ 740 ms, release near 230 ms);
- level by slot: -9.4 to -10.1 dB at slots 0-12, **-7.1 dB at slot 14** (the bar's last 8th is 2.5 dB louder);
- partials re the note's own fundamental (median dB):

| Fundamental | n | k=1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| F1 (44 Hz) | 88 | 0 | **+5.6** | -5.8 | -18.6 | -13.8 | -26.9 | -31.1 | -35.9 |
| Bb1, G1, Ab1 (49-58 Hz) | 36 | 0 | **+7.1 to +7.7** | -10.5 to -14.5 | -11 to -22 | -26 to -30 | -19 to -31 | -30 to -38 | -31 to -36 |
| C2 (65 Hz) | 69 | 0 | -7.1 | -25.9 | -32.3 | -33.0 | -37.3 | -38.2 | -41.6 |
| Db2 (69 Hz) | 33 | 0 | -6.3 | -24.6 | -31.6 | -37.3 | -46.7 | -51.7 | -46.7 |
| F2, Eb2, G2, Bb2 | 63 | 0 | -15 to -29 | -17 to -37 | -31 to -45 | -28 to -49 | -33 to -59 | -35 to -58 | -44 to -57 |

- so it is **fundamental-heavy, with the 2nd harmonic dominant on the lowest notes**; 95 % of the stem's energy is under
  135 Hz, centroid 92 Hz (30-4000 Hz); harmonics are exact multiples (no inharmonicity measurable);
- tuning: +3.5 cents on A4 = 441.3 Hz (IQR -5..+9);
- centred: L-R +0.3 dB, side/mid -22 dB, correlation 0.93; no vibrato or tremolo.

**Keys** (upper note of each chord hit, MIDI 60-79, in the mixture, so an upper bound on the harmonics)
- partials re the fundamental (median dB): k=2 -16.0, k=3 -21.3, k=4 -24.9, k=5 -28.5, k=6 -32.8 (roughly -4 dB per
  harmonic above k=3): a soft, mellow tone;
- ring: notes fall to -9 dB in a median 140 ms (IQR 71-216; G3-B3 181 ms, C4-B4 129 ms, C5-C6 140 ms); after an isolated
  chord (n 34) the top note's fundamental is 5.9 dB down 200 ms later: **τ about 0.3 s**; there is no visible gate but
  the next hit often comes within 140 ms;
- brightness (other stem, 100-12000 Hz): centroid 457 Hz, 50 % under 350 Hz, 85 % under 705 Hz, 95 % under 1050 Hz;
- stereo: wide and a little left (L-R -0.7 dB at 200-500 Hz, -2.3 dB at 500-1200 Hz, -0.8 dB at 1.2-4 kHz; inter-channel
  correlation 0.64, 0.41, 0.50);
- attack: not separable from the stem (the mids carry hat leakage); its edges sit about 17 ms early;
- vibrato and tremolo: none found; the amplitude-modulation spectrum of 400-3000 Hz has only rhythmic peaks (1.8, 3.6,
  7.2, 10.8 Hz and sub-1 Hz phrasing) and nothing at 4-7 Hz off the grid (`tremolo.py`).

**Intro sub pulse:** steady 65-72 Hz, no glide, gate about 80 ms (-12 dB at 80 ms, -21 at 120), 35-130 Hz band -27 dB on the
beats against -36 dB between them; sample-identical every time (waveforms overlay across bars 3-5).

## (d) Crashes, kicks, snares: where the track has them

| Event | Film times | Note |
|---|---|---|
| Crash / cymbal wash | none | the final chord's tail is tonal |
| Cymbal-like accent (louder open-hat burst) | 10.79, 19.69, 28.57, 37.46, 46.34, 55.24, 64.13 s | 4& of film bars 5, 9, 13, 17, 21, 25, 29; +5 dB over the hats |
| Kick | none | not even at the beats of the intro (the pulse is a pitched tone) |
| Snare / backbeat | none | nothing on beats 2 and 4 but the hat and the bass |
| Ride | none | |
| The lift | bass note 64.362 s (film bar 30 starts 64.444 s) | +8.6 dB, bass and keys enter together; no cymbal |
| The final chord | bass F2 177.636 s, keys 177.693 s | rings to the cut (180.0 s): RMS -26 dB at 177.9 s, -48 dB at 179.5 s |

So no effect can double a kick, a snare or a crash. A crash on a stab and a snare on the alarm add instruments the track
does not have. What an effect can double is the **hat (every 8th, 18 ms early)**, the **bass note (every 8th)** and the
**keys chord**.

## (e) Spectrum and gaps

1/3-octave power, dB re the mixture's total power in the section (`out/tmp/remake/kit/ltas_stems.json`); the drums stem
below 8 kHz is mostly bleed:

| Hz | 63 | 79 | 99 | 125 | 157 | 198 | 250 | 315 | 500 | 794 | 1000 | 1587 | 2000 | 2520 | 3175 | 4000 | 5040 | 6350 | 8000 | 10k | 12.7k | 16k |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Body mix | -7 | -7 | -9 | -8 | -13 | -14 | -12 | -15 | -16 | -18 | -20 | -26 | -30 | -28 | -33 | -37 | -38 | -42 | -45 | -41 | -41 | -41 |
| Body bass stem | -5 | -10 | -9 | -7 | -22 | -22 | -25 | -30 | -34 | -41 | -43 | -45 | -48 | -50 | -54 | -64 | -68 | -76 | -72 | -75 | -79 | -81 |
| Body keys ("other") | -37 | -35 | -29 | -26 | -19 | -17 | -13 | -17 | -16 | -19 | -21 | -27 | -31 | -29 | -34 | -40 | -40 | -58 | -65 | -66 | -68 | -68 |
| Body hat ("drums") | -27 | -32 | -32 | -27 | -25 | -28 | -35 | -39 | -39 | -44 | -44 | -42 | -41 | -41 | -42 | -42 | -43 | -43 | -45 | -41 | -41 | -41 |
| Intro mix | -17 | -5 | -12 | -11 | -8 | -10 | -12 | -17 | -13 | -20 | -19 | -22 | -22 | -24 | -22 | -22 | -26 | -28 | -32 | -31 | -31 | -31 |

Three registers: the bass owns 60-130 Hz, the keys 150 Hz-3 kHz (peak 200-315 Hz), the hat everything above 6 kHz
(the mix and the hat are the same curve above 8 kHz).

**Spectral gaps.** A band's level against the mean of the four bands around it (±2), 200 Hz-8 kHz:
- body: 4 kHz -4.7 dB, 8 kHz -4.8, 2 kHz -4.0, 198 Hz -3.3, 6.3 kHz -2.9, 1.6 kHz -2.6; nothing reaches -6 dB;
- A sections: **1.6 kHz -6.0 dB**, 1.26 kHz -4.1, 8 kHz -5.1, 6.3 kHz -3.5, 4 kHz -3.0;
- B sections: **4 kHz -5.9 dB**, 8 kHz -5.8, 1 kHz -4.9, 2 kHz -4.6, 6.3 kHz -4.0;
- intro: 315 Hz -5.4, 8 kHz -4.1, 794 Hz -3.7.
So the mids are smooth: no deep notch to hide in. The quietest region above 1 kHz is **6-9 kHz** (-42 to -45 dB re
the total, against -37 at 4 kHz and -41 for the hat's air above 10 kHz), then the dip at 2 kHz.

**Gaps in time.** Median level of each 16th cell against the median of the 16 (`slotlevel.json`), A sections:
- 200-500 Hz: beats 1-4 (slots 0, 4, 8, 12) +3.6 to +4.7 dB, slots 2, 3, 6, 7 -1.6 to -3.5;
- 500 Hz-4 kHz: slots 4, 8, 11, 12, 13 up +0.5 to +6.1 dB (slot 8 loudest); **in 1-4 kHz, slots 3, 5, 6, 7, 14, 15 down -2 to -4.5 dB**;
- 8-16 kHz: even slots +2.7, odd slots -2.6 (the hat's pulse only);
- B sections: mids loudest on slots 4, 8, 12 (+2 to +5 dB); in 500 Hz-2 kHz slots 0, 2, 3, 14, 15 are down -2 to -5 dB;
- intro: slot 13 is +4 to +9 dB in 200 Hz-4 kHz (the stab), slot 14 up to +4.5 dB in 200-500 Hz; the rest is mostly within ±3 dB (slot 1 in 200-500 Hz is -6).

## (f) What the track plays under each cue

`python tools/bedhits.py --cues` (87 instrument-like cues; JSON `out/tmp/remake/kit/cue_hits.json`, one record per cue with
every event in [-40, +120] ms of the effect's onset, `land` for stamp, thud, slab and the loop's bubble). Within ±40 ms:

| Cue | Track plays | Cue | Track plays |
|---|---|---|---|
| ch01 split 5.556 | hat -17 (the intro's beat pulse starts 47 ms early) | ch06 band 88.626 | bass Gb2 -28, hat -12 |
| ch01 drop 7.083 | bass D3 -1 | ch06 alarm 95.000 | hat -14 |
| ch01 stab 9.127 | bass D3 -10, keys +20 | ch07 stab 107.778 | hat -5, bass Db2 +1, keys -35 |
| ch03 stab 42.480 (soft) | bass Eb3 -35, hat -7 | ch07 climb 115.417 / .694 / .972 / 116.250 | free / keys -16 / free / keys +34 |
| ch04 chime 52.188 | bass F3 +14, hat +18 | ch07 bubble land 117.222 | hat -38 |
| ch04 chime 58.994 | free | ch07 alarm 123.750 | free |
| ch04 chime 60.938 | free | ch07 push 125.833 | hat -4, bass Eb2 -1, keys +7 |
| ch05 bell 73.022 | bass Bb2 +16, hat +21 | ch08 stab 138.581 | hat +19, bass F2 +32 |
| ch06 stab 83.333 | hat -17, bass Eb2 +19, keys -14 | ch09 stab 153.026 | hat +16 |
| | | ch10 stab 167.192 | hat +1, bass F2 +21, keys +29 |

Counts over all 87 (free = nothing within 40 ms; the others land within 25 ms of a bed hat, bass note or keys chord):

| Cue | n | free | hat | bass | keys | | Cue | n | free | hat | bass | keys |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stab | 7 | 0 | 6 | 4 | 2 | | slab | 29 | 8 | 9 | 8 | 6 |
| alarm | 2 | 1 | 1 | 0 | 0 | | slam | 20 | 4 | 11 | 9 | 10 |
| drop | 1 | 0 | 0 | 1 | 0 | | stamp | 5 | 0 | 5 | 3 | 1 |
| chime | 3 | 2 | 1 | 1 | 0 | | thud | 6 | 1 | 4 | 3 | 3 |
| bell | 1 | 0 | 1 | 1 | 0 | | punch | 2 | 0 | 2 | 1 | 2 |
| climb | 4 | 2 | 0 | 0 | 1 | | caption | 3 | 1 | 0 | 0 | 1 |
| band | 1 | 0 | 1 | 0 | 0 | | push | 1 | 0 | 1 | 1 | 1 |

No cue lands on a crash, kick, snare or ride (none exist). `note` in the JSON is the strongest partial in 32-300 Hz,
an octave above the bass's fundamental for the low F, Bb, G and Ab notes; for chords, `notes` lists the strongest
peaks in 200-1100 Hz (approximate).

## (g) What it means for the effects

1. Free to keep: the stab's crash (the bed has none, and no stab is within 60 ms of an accent) and the alarm's snare (the
   bed plays no backbeat).
2. Doubled: the stab's bass notes and piano chord land with the bed's own bass and keys (bass within 25 ms on 4 of 7
   stabs, within 40 ms on 6); ch01's drop bends a bass note the bed plays at the same instant.
3. Timing: an effect on the film's beat line follows the hat by about 18 ms and meets the bass's rise; it is ahead of nothing.
4. Match: keys tone k=2 -16, k=3 -21, k=4 -25 dB, τ 0.3 s, upper notes F4-F5 in 4-note voicings, slightly left and wide;
   bass tone as in the table, 8th-note gate 200 ms, soft 25 ms attack; the hat burst 6 ms rise, τ 80 ms, centroid 8 kHz.
5. Quiet places for paper and UI sounds: 6-9 kHz (5-8 dB under the 4 kHz level), and 1-4 kHz on slots 3, 5, 6, 7, 14 and
   15 of A (500 Hz-2 kHz on slots 0, 2, 3 of B).

## Caveats

- Not listened to; the instrument names are inference.
- `bedhits.py`: hat, bass and keys are validated on the bed (counts and timing above). The kick, snare and ride rules are
  strict and fire on nothing there. The crash rule fires only on the seven accents. `--selftest` lays tools/sound.py's
  own sounds on the bed: its crash, ride, snare and piano chord are seen (the snare as crash or keys), its kick at the
  bed's level as a low event, and a bass note 4 dB under the bed is masked. So a thump 4 dB under the bed's local level
  is not heard as a separate low hit either.
- Timing of the keys is only good to about ±25 ms; the bass's `note` in the intro is the pad's.
- The source separation is imperfect (the drums stem holds the intro's low pulse and a keys stab's noisy edge); every
  claim that leans on it was also checked on the mixture.

Figures (all in `out/tmp/remake/kit/`): `cqt_full.png` (parent's, `out/tmp/remake/`), `zoom_b11.png`, `spec_b10_12.png`,
`slot13_zoom.png`, `swellmap.png`, `coda.png`, `bass_wave.png`, `kick_wave.png`, `bar9.png`, `drums_b11_12.png`,
`stab_intro_env.png`, `intro_low.png`, `roll_b11_12.png`. Data: `ltas.json`, `ltas_stems.json`, `slotlevel.json`,
`bass_pattern.json`, `bed_events.json`, `cue_hits.json`.
