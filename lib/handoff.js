// Handoff contracts between neighbouring chapters (docs/ANIMATION_GUIDE.md, "Transitions"). Both sides of a boundary
// import the same numbers from here, so chapters built in parallel meet exactly. Only the director edits this file.
import { step } from './motion.js';

// Seconds after the preset's start at which a kit.flip() is edge-on (the angle passes 90 degrees).
function edgeOn(preset) {
  let a = 0;
  let b = 2;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (step(m, preset) < 0.5) a = m;
    else b = m;
  }
  return b;
}
export const FLIP_EDGE = edgeOn('flip');

// Exit windows (seconds after the chapter's end during which it still paints, on top of the next chapter).
export const EXIT = {
  ch02: FLIP_EDGE, // 3.1 the report sheet turns edge-on; ch03 turns its back face (the NAVY card) out of it
  ch04: 0.8, // 5.1 the three panels leave like doors and reveal ch05's CREAM field
  ch08: 0.6, // 9.1 the NAVY strip expands until it fills the frame; ch09 starts on a full NAVY field
  ch09: 0.7, // 10.1 the staircase and its ground slide out to the left and reveal ch10's BLACK field
};

// 2.6 -> 3.1: where the report sheet (ch02) is when it flips, and where ch03's NAVY card is when it turns out.
// Centre, size and tilt, in stage px and degrees. Both chapters flip about the vertical line through cx with
// kit.flip(t, t0): ch02 with t0 = ctx.dur (its end) drawing the front while !back, ch03 with t0 = 0 drawing the back.
export const SHEET = { cx: 960, cy: 560, w: 1120, h: 680, rot: -3 };
