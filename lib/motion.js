// Motion: closed-form springs and seeded randomness. Everything here is a pure function of its arguments.
//
// A spring's step response rises from 0 to 1 (with overshoot when underdamped). An animated value is its start
// value plus one step response per change of target, scaled by the size of the change. By superposition a value
// can be retargeted any number of times and still be evaluated at any t without history.

const TAU = Math.PI * 2;

// f: natural frequency in Hz (higher settles faster); z: damping ratio (<1 overshoots, 1 is critical).
export const PRESETS = {
  slide: { f: 1.5, z: 0.75 }, // paper entering along an axis, slight overshoot
  snap: { f: 3.2, z: 0.7 }, // short, stiff settle
  slam: { f: 5.0, z: 0.45 }, // type landing: quick bounce, hard settle
  drop: { f: 1.1, z: 1.0 }, // pieces leaving the frame, no bounce
  tear: { f: 1.4, z: 0.9 }, // torn paper opening
  settle: { f: 0.8, z: 1.0 }, // slow, calm arrival
  count: { f: 0.9, z: 0.8 }, // odometer digits rolling to a value
  flip: { f: 1.6, z: 1.0 }, // a panel turning over (kit.flip)
};

const params = (p) => (typeof p === 'string' ? PRESETS[p] : p);

// Step response at time tau after the change (0 before it).
export function step(tau, preset = 'slide') {
  if (tau <= 0) return 0;
  const { f, z } = params(preset);
  const w = TAU * f;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
  }
  if (z === 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const r = Math.sqrt(z * z - 1);
  const r1 = -w * (z - r);
  const r2 = -w * (z + r);
  return 1 + (r2 * Math.exp(r1 * tau) - r1 * Math.exp(r2 * tau)) / (r1 - r2);
}

// One change: from `from` to `to`, starting at t0.
export const spring = (t, t0, from, to, preset = 'slide') => from + (to - from) * step(t - t0, preset);

// A value that starts at v0 and receives new targets: keys = [[time, target, preset?], ...] in time order.
// Returns t => value, the sum of one spring per change.
export function track(v0, keys) {
  const changes = [];
  let prev = v0;
  for (const [t, v, p = 'slide'] of keys) {
    changes.push([t, v - prev, p]);
    prev = v;
  }
  return (t) => {
    let x = v0;
    for (const [t0, d, p] of changes) x += d * step(t - t0, p);
    return x;
  };
}

// Seeded PRNG (mulberry32). Use for build-time layout only; render code should use hash() so a frame never
// depends on how many random numbers were drawn before it.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless hash of integers to [0, 1).
export function hash(...ns) {
  let h = 0x9e3779b9;
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

// Smooth 1D value noise in [-1, 1].
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i, seed) * (1 - u) + hash(i + 1, seed) * u) * 2 - 1;
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
