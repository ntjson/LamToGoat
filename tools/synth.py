"""The film's synthesized sounds: the paper and UI effects, and the instruments the pitched effects are played on.

Every function is a pure function of its parameters and a seed (`rng_for`, crc32-keyed, so every render is identical)
and returns a numpy array at 48 kHz, peak-normalized to its `vel`; the mix (tools/sound.py) sets the level.

Two families:
- **Paper and UI sounds** (ticks, stamps, snips, swooshes, tears, ...) are unpitched: filtered noise and noise grains
  only, no sine and no narrow resonance, so they can never sound a note against the music. `tools/meter.tonality`
  measures that. The mix shapes each class with the EQ curves below (`shape`) so it sits in the gaps of the track's
  mids, and sets its level from the music around it.
- **Pitched sounds** (the piano, bass, vibraphone and the rest) are tuned to the Mixkit bed's measured tuning, `A4`,
  and play the notes the track itself is sounding (the harmony chart, docs/bed_harmony.json).
"""
import math
import zlib
from functools import lru_cache

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
A4 = 441.3  # Hz: the Mixkit bed's measured tuning (about +5 cents on 440); every pitched sound is tuned to it

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
NOTE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})


def midi(name):
    """'D2' -> 38."""
    return NOTE[name[:-1]] + 12 * (int(name[-1]) + 1)


def midi_hz(m):
    return A4 * 2 ** ((m - 69) / 12)


def hz(name):
    """'D2' -> Hz at A4 = 441.3."""
    return midi_hz(midi(name))


def rng_for(*keys):
    # zlib.crc32, not hash(): Python salts str hashes per process, and every render must be identical.
    return np.random.default_rng([zlib.crc32(k.encode()) if isinstance(k, str) else int(k) for k in keys])


# ---------------------------------------------------------------------------------------------------- DSP helpers
def band(x, lo=None, hi=None, order=2):
    if lo and hi:
        sos = butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    elif lo:
        sos = butter(order, lo, btype="highpass", fs=SR, output="sos")
    else:
        sos = butter(order, hi, btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def decay(dur, tau, attack=0.002):
    t = tt(dur)
    a = np.minimum(1, t / attack) if attack else 1
    return a * np.exp(-t / tau)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def resonator(x, f, q):
    """Two-pole resonant band-pass at f with quality q (metal, strings). Only the pitched instruments use it: q
    above about 4 rings as a pitch."""
    w = 2 * math.pi * f / SR
    r = math.exp(-w / (2 * q))
    return lfilter([1 - r], [1, -2 * r * math.cos(w), r * r], x)


def glide_sine(dur, f0, f1, shape=1.0):
    """A sine whose pitch glides from f0 to f1 (exponentially), phase-continuous."""
    t = tt(dur)
    u = (t / dur) ** shape
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------------------------------------------- EQ
def min_phase_fir(points, taps=1536, n_fft=16384):
    """A minimum-phase FIR (causal, no pre-ring: a transient keeps its onset) whose gain follows `points`, a list
    of (Hz, dB) interpolated in log frequency and held flat beyond the first and last."""
    f = np.fft.rfftfreq(n_fft, 1 / SR)
    hz_, g = zip(*points)
    gain = np.interp(np.log(np.maximum(f, 1.0)), np.log(hz_), g)
    mag = 10 ** (gain / 20)
    # homomorphic method: log magnitude -> real cepstrum -> fold onto positive quefrencies -> exp
    c = np.fft.irfft(np.log(mag), n_fft)
    fold = np.zeros(n_fft)
    fold[0] = c[0]
    fold[1: n_fft // 2] = 2 * c[1: n_fft // 2]
    fold[n_fft // 2] = c[n_fft // 2]
    h = np.fft.irfft(np.exp(np.fft.rfft(fold)), n_fft)[:taps]
    h *= np.hanning(2 * taps)[taps:]  # fade the tail out
    return h


@lru_cache(maxsize=None)
def _fir(points):
    return min_phase_fir(list(points))


def shape(x, points):
    """`x` through the EQ curve `points` ((Hz, dB), ...): a mono signal or (n, 2). The tail the filter adds is kept
    (the array grows by 200 samples), so nothing is cut off."""
    h = _fir(tuple(points))
    pad = 200
    if x.ndim == 1:
        return fftconvolve(np.concatenate([x, np.zeros(pad)]), h)[: len(x) + pad]
    return np.stack([shape(x[:, c], points) for c in range(x.shape[1])], axis=1)


# ---------------------------------------------------------------------------------------------------- paper and UI sounds
# All noise. Filters are wide (a band is at least an octave across) and every ring is a decaying burst of noise, so
# none of them has a pitch.
def burst(n, lo, hi, tau, t, order=2):
    """A band of noise `n` (band-passed lo-hi Hz) that dies away with time constant tau."""
    return band(n, lo, hi, order) * np.exp(-t / tau)


def tap(fc=3000, tau=0.004, body=0.25, vel=0.6, seed=0, dull=False):
    """An unpitched tick: a burst of noise around fc (a two-octave-wide band) and a soft knock under it. `dull`
    lets the tick go muffled (a low-passed tap)."""
    rng = rng_for("tap", seed)
    t = tt(max(0.03, 9 * tau))
    n = rng.standard_normal(len(t))
    y = burst(n, fc / 1.7, fc * 1.7, tau, t) + body * burst(n, 250, 1400, 2.4 * tau, t)
    if dull:
        y = band(y, hi=900) * 1.5
    return norm(y * np.minimum(1, t / 0.0004), vel)


def pop(vel=0.8, seed=0):
    """The complaint landing: a round pop, unpitched: a band of noise that falls (1.1 kHz to 380 Hz) and dies away, with
    a little paper in front of it."""
    rng = rng_for("pop", seed)
    d = 0.22
    t = tt(d)
    y = swoosh(d, 1100, 380, 1.0, seed=seed, env=np.exp(-t / 0.05), width=0.5)
    y = y + 0.4 * burst(rng.standard_normal(len(t)), 500, 2800, 0.02, t)
    return norm(y * np.minimum(1, t / 0.001), vel)


def stamp(vel=0.8, seed=0, deep=False):
    """A paper strip slammed down (caption, SLAM; `deep` for a seal or tag struck down): the paper's slap, a soft
    knock of low noise under it (noise, so it is a thud and not a note) and a short crack."""
    rng = rng_for("stamp_deep" if deep else "stamp", seed)
    t = tt(0.45 if deep else 0.35)
    n = rng.standard_normal(len(t))
    slap = burst(n, 200 if deep else 250, 2600, 0.045 if deep else 0.04, t)
    knock = burst(rng.standard_normal(len(t)), 70 if deep else 90, 260 if deep else 320, 0.10 if deep else 0.07, t, 3)
    crack = burst(rng.standard_normal(len(t)), 2800, 8000, 0.005, t)
    y = 0.9 * slap + (1.0 if deep else 0.7) * knock + (0.3 if deep else 0.35) * crack
    return norm(y * np.minimum(1, t / 0.0015), vel)


def stamp_deep(vel=0.8, seed=0):
    return stamp(vel, seed, deep=True)


def snip(vel=0.7, seed=0):
    """One scissor snip: the blades meeting (a short hiss of high noise) and the paper giving way."""
    rng = rng_for("snip", seed)
    t = tt(0.12)
    n = rng.standard_normal(len(t))
    y = burst(n, 3000, 11000, 0.010, t) + 0.6 * burst(n, 1300, 4200, 0.02, t) + 0.35 * burst(n, 5000, 14000, 0.0025, t)
    return norm(y * np.minimum(1, t / 0.0007), vel)


def cut_rasp(dur, vel=0.7, seed=0):
    """Scissors running through paper: a crackling rasp that ends in a snip."""
    rng = rng_for("rasp", seed)
    t = tt(dur)
    crackle = np.zeros(len(t))
    k = 0
    while True:
        k += rng.exponential(1 / 110)
        if k >= dur:
            break
        crackle[int(k * SR)] = rng.uniform(0.3, 1)
    grains = lfilter([1], [1, -0.94], crackle)  # each click rings ~ a millisecond
    body = band(rng.standard_normal(len(t)), 2200, 7000) * 0.25
    y = band(grains, 1500, 8000) + body
    env = np.clip(t / (0.3 * dur), 0, 1) * np.clip((dur - t) / 0.03, 0, 1)
    y = y * env
    y = np.concatenate([y, snip(1.0, seed + 1)])
    return norm(y, vel)


def swoosh(dur, f0, f1, vel=0.6, seed=0, env=None, width=0.35):
    """Paper sliding: noise whose band moves from f0 to f1 (a bank of bands, cross-faded in log frequency)."""
    rng = rng_for("swoosh", seed)
    t = tt(dur)
    centres = np.geomspace(250, 6000, 10)
    x = rng.standard_normal(len(t))
    lf = np.log(f0) + (np.log(f1) - np.log(f0)) * (t / dur)
    y = np.zeros(len(t))
    for c in centres:
        w = np.exp(-((np.log(c) - lf) ** 2) / (2 * width**2))
        y += band(x, c / 1.35, c * 1.35) * w
    if env is None:
        env = np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return norm(y * env, vel)


def tear(dur, vel=0.8, seed=0):
    """Paper tearing open: fibres snapping faster and faster, over a dry rip."""
    rng = rng_for("tear", seed)
    t = tt(dur)
    crackle = np.zeros(len(t))
    k = 0.0
    while k < dur:
        rate = 60 + 700 * (k / dur) ** 1.5
        k += rng.exponential(1 / rate)
        if k < dur:
            crackle[int(k * SR)] = rng.uniform(0.2, 1)
    grains = lfilter([1], [1, -0.9], crackle)
    rip = band(rng.standard_normal(len(t)), 700, 5000) * (0.2 + 0.8 * (t / dur) ** 2) * 0.4
    y = band(grains, 900, 7000) + rip
    return norm(y * np.clip((dur - t) / 0.01, 0, 1), vel)


def flip_fx(vel=0.7, seed=0):
    """A panel turning on its axis: air rising to the edge-on moment and falling past it, then the paper's soft flap."""
    rng = rng_for("flip", seed)
    d = 0.34
    t = tt(d)
    y = np.zeros(len(t))
    up = swoosh(0.16, 900, 3000, 1.0, seed=seed)
    down = swoosh(0.17, 2600, 800, 0.8, seed=seed + 1)
    y[: len(up)] += up
    j = int(0.13 * SR)
    y[j: j + len(down)] += down[: len(y) - j]
    flap = band(rng.standard_normal(len(t)), 150, 1200) * np.exp(-np.maximum(t - 0.26, 0) / 0.025) * (t >= 0.26)
    return norm(y + 0.7 * norm(flap), vel)


def pin_fx(vel=0.7, seed=0):
    """A pin pushed through paper into board: the point's tick and a short woody tock (both noise)."""
    rng = rng_for("pin", seed)
    t = tt(0.12)
    n = rng.standard_normal(len(t))
    y = norm(burst(n, 1300, 4600, 0.012, t)) + norm(burst(n, 4200, 11000, 0.0015, t), 0.8)
    y += norm(burst(n, 180, 640, 0.022, t), 0.45)
    return norm(y * np.minimum(1, t / 0.0005), vel)


def punch_fx(vel=0.8, seed=0):
    """A hole punched through paper: the press's thump, the die's chunk and the paper giving way."""
    rng = rng_for("punch", seed)
    t = tt(0.3)
    n = rng.standard_normal(len(t))
    y = norm(burst(n, 110, 460, 0.05, t, 3)) + norm(burst(n, 1500, 3800, 0.016, t), 0.6)
    y += norm(burst(n, 3200, 10000, 0.004, t), 0.5) + norm(burst(n, 500, 3500, 0.035, t), 0.35)
    return norm(y * np.minimum(1, t / 0.0008), vel)


def flutter_fx(dur=1.1, vel=0.6, seed=0, strips=5):
    """Paper strips falling away: each flaps as it tumbles (noise gated by a flapping rate), staggered."""
    rng = rng_for("flutter", seed)
    t = tt(dur)
    y = np.zeros(len(t))
    for s in range(strips):
        n = rng.standard_normal(len(t))
        rate = 15 + 10 * rng.random() + 6 * t / dur
        flap = (0.5 + 0.5 * np.sin(2 * math.pi * np.cumsum(rate) / SR + rng.random() * 6)) ** 3
        start = s * 0.07 + 0.03 * rng.random()
        env = np.clip((t - start) / 0.05, 0, 1) * np.clip((dur - t) / (0.55 * dur), 0, 1)
        y += band(n, 600 + 300 * rng.random(), 4000) * (0.25 + 0.75 * flap) * env
    return norm(y, vel)


def thud_fx(vel=0.8, seed=0):
    """A heavy landing: a soft low knock (noise, so a thud and not a note) and the paper's contact."""
    rng = rng_for("thud", seed)
    t = tt(0.45)
    n = rng.standard_normal(len(t))
    y = norm(burst(n, 70, 280, 0.09, t, 3)) + norm(burst(n, 400, 2600, 0.02, t), 0.4)
    y += norm(burst(n, 800, 3000, 0.006, t), 0.15)
    return norm(y * np.minimum(1, t / 0.002), vel)


def click_fx(vel=0.6, seed=0):
    """A button pressed, a clip clicking on: a press and its softer release."""
    rng = rng_for("click", seed)
    t = tt(0.07)
    n = rng.standard_normal(len(t))
    c = norm(burst(n, 2000, 10000, 0.0012, t)) + norm(burst(n, 2400, 5600, 0.004, t), 0.4)
    y = c.copy()
    j = int(0.026 * SR)
    y[j:] += 0.45 * c[: len(c) - j]
    return norm(y, vel)


def creak_fx(dur=0.45, vel=0.6, seed=0):
    """Paper giving way as a window opens: stick-slip grains at a wandering rate through three broad resonances."""
    rng = rng_for("creak", seed)
    t = tt(dur)
    imp = np.zeros(len(t))
    k = 0.0
    while True:
        k += 1 / max(15, 45 + 30 * math.sin(2 * math.pi * 1.4 * k + 1) + 10 * rng.standard_normal())
        if k >= dur:
            break
        imp[int(k * SR)] = rng.uniform(0.5, 1)
    y = resonator(imp, 480, 2.5) + 0.7 * resonator(imp, 1250, 3) + 0.5 * resonator(imp, 2600, 3)
    return norm(y * np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 0.7, vel)


def friction_fx(dur, vel=0.6, seed=0):
    """A tag dragged along a bar: a rough scrape of stick-slip grains that slows as it goes."""
    rng = rng_for("friction", seed)
    t = tt(dur)
    imp = np.zeros(len(t))
    k = 0.0
    while True:
        k += 1 / max(20, 90 * (1 - 0.55 * k / dur) + 8 * rng.standard_normal())
        if k >= dur:
            break
        imp[int(k * SR)] = rng.uniform(0.4, 1)
    y = norm(resonator(imp, 1300, 2.5)) + norm(band(lfilter([1], [1, -0.9], imp), 2000, 7000), 0.5)
    y += norm(band(rng.standard_normal(len(t)), 400, 2500), 0.15)
    return norm(y * np.minimum(1, t / 0.05) * np.clip((dur - t) / 0.02, 0, 1), vel)


def scratch_fx(dur=0.22, vel=0.6, seed=0):
    """A nail scratching across paper: bright noise in jagged strokes."""
    rng = rng_for("scratch", seed)
    t = tt(dur)
    strokes = 0.3 + 0.7 * (np.sin(2 * math.pi * 33 * t + rng.random() * 6) > 0)
    y = band(rng.standard_normal(len(t)), 2200, 7500) * band(strokes, hi=400) * np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 0.5
    return norm(y, vel)


def rattle(dur, vel=0.5, seed=0, pitch=2400, r0=34, r1=7):
    """Odometer digits rolling: clicks at a rate that slows from r0 to r1 per second as the digits settle. `pitch`
    is the clicks' centre frequency (a broad band, not a note)."""
    rng = rng_for("rattle", seed)
    t = tt(dur)
    imp = np.zeros(len(t))
    k = 0.0
    while True:
        k += 1 / (r1 + (r0 - r1) * (1 - k / dur) ** 1.6)
        if k >= dur:
            break
        imp[int(k * SR)] = rng.uniform(0.6, 1)
    y = norm(resonator(imp, pitch, 2.5)) + norm(band(imp, 3000, 10000), 0.5)
    return norm(y, vel)


def lock_fx(vel=0.7, seed=0):
    """The count locking: a firm clack with a little body."""
    rng = rng_for("lock", seed)
    t = tt(0.12)
    n = rng.standard_normal(len(t))
    y = norm(burst(n, 1000, 3300, 0.011, t)) + norm(burst(n, 3000, 10000, 0.0015, t), 0.8)
    y += norm(burst(n, 200, 720, 0.02, t), 0.4)
    return norm(y * np.minimum(1, t / 0.0005), vel)


def sweep_fx(dur, vel=0.5, seed=0):
    """Windows lighting in a sweep: a rattle of little lamp ticks (noise grains) that speeds up and climbs."""
    rng = rng_for("sweep", seed)
    y = np.zeros(int((dur + 0.05) * SR))
    g = tt(0.03)
    k = 0.0
    while True:
        k += 1 / (14 + 70 * (k / dur) ** 1.3)
        if k >= dur:
            break
        u = k / dur
        f = 1500 * (2.4 ** u) * (1 + 0.05 * rng.standard_normal())
        i = int(k * SR)
        grain = band(rng.standard_normal(len(g)), f / 1.6, f * 1.6) * np.exp(-g / 0.004) * rng.uniform(0.5, 1) * (0.5 + 0.5 * u)
        y[i: i + len(g)] += grain[: len(y) - i]
    return norm(y, vel)


def cell_fx(vel=0.4, seed=0):
    """One cell of a façade flipping: a tiny, bright tick (a noise grain, its band a little different every time)."""
    rng = rng_for("cell", seed)
    t = tt(0.03)
    fc = 3300 + 1800 * rng.random()
    y = band(rng.standard_normal(len(t)), fc / 1.6, fc * 1.6) * np.exp(-t / 0.0014)
    return norm(y * np.minimum(1, t / 0.0003), vel)


def paper_tick(vel=0.5, seed=0):
    """A HARD CUT: a small, dry paper tick."""
    rng = rng_for("paper_tick", seed)
    t = tt(0.05)
    n = rng.standard_normal(len(t))
    y = burst(n, 1200, 7000, 0.004, t) + 0.3 * burst(n, 600, 1500, 0.006, t)
    return norm(y, vel)


def snap_fx(vel=0.7, seed=0):
    """A short, stiff settle: a crisp snap of card."""
    rng = rng_for("snap", seed)
    t = tt(0.09)
    n = rng.standard_normal(len(t))
    y = norm(burst(n, 1400, 6500, 0.007, t)) + norm(burst(n, 1100, 2700, 0.012, t), 0.5)
    y += norm(burst(n, 200, 640, 0.015, t), 0.28)
    return norm(y * np.minimum(1, t / 0.0005), vel)


# ---------------------------------------------------------------------------------------------------- pitched instruments
# (carried over from the first sound pass; retuned to A4 = 441.3 through hz())
def pluck_bass(f0, dur, vel=0.8, seed=0, fall=None):
    """Upright bass: Karplus-Strong string (finger pluck, dark), a body low-pass and a soft thump; `fall` = (start s,
    semitones, length s) bends the note down, for a note that falls."""
    n = int(dur * SR)
    rng = rng_for("bass", seed)
    if fall:
        # A falling note: additive, so the pitch can glide.
        t = tt(dur)
        start, semis, length = fall
        u = np.clip((t - start) / length, 0, 1)
        u = u * u * (3 - 2 * u)
        f = f0 * 2 ** (-semis * u / 12)
        ph = 2 * math.pi * np.cumsum(f) / SR
        y = sum((0.9 ** k) / k * np.sin(k * ph) * np.exp(-t * (0.9 + 0.5 * k)) for k in range(1, 9))
        y *= np.minimum(1, t / 0.004)
        return norm(band(y, hi=1400), 0.9 * vel)
    N = max(2, int(round(SR / f0 - 0.5)))
    exc = np.zeros(n)
    burst = rng.standard_normal(N) * np.hanning(N)
    burst = lfilter([0.25], [1, -0.75], burst)  # finger, not pick: a dark excitation
    exc[:N] = burst
    a = np.zeros(N + 2)
    a[0] = 1
    a[N] = a[N + 1] = -0.4985
    y = lfilter([1.0], a, exc)
    t = tt(dur)
    y = band(y, hi=650, order=4) + 0.35 * np.max(np.abs(y)) * np.sin(2 * math.pi * f0 * t) * np.exp(-t / 0.09)
    rel = np.clip((dur - t) / 0.05, 0, 1)  # the next note damps this one
    return norm(y * rel, vel)


def piano(names, dur, vel=0.8, seed=0, spread=0.3):
    """Additive piano: inharmonic partials, two detuned strings per note, faster decay for upper partials, a
    two-stage envelope and a hammer knock. Returns stereo (n, 2), spread across the stereo field by pitch."""
    rng = rng_for("piano", seed)
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for i, name in enumerate(names):
        f0 = hz(name)
        K = max(3, min(16, int(9000 / f0)))
        y = np.zeros_like(t)
        for k in range(1, K + 1):
            fk = k * f0 * math.sqrt(1 + 0.00035 * k * k)
            ak = vel ** (0.4 + 0.12 * k) / k ** 1.15
            tau = 2.2 * (261.6 / f0) ** 0.45 / (1 + 0.28 * (k - 1))
            det = 1 + 0.0008 * (rng.random() - 0.5)
            ph1, ph2 = rng.random() * 6.28, rng.random() * 6.28
            y += ak * np.exp(-t / tau) * 0.5 * (np.sin(2 * math.pi * fk * t + ph1) + np.sin(2 * math.pi * fk * det * t + ph2))
        y *= 0.55 * np.exp(-t / 0.18) + 0.45  # the quick drop after the hammer, then the long ring
        knock = band(rng.standard_normal(len(t)), 900, 4000) * np.exp(-t / 0.006) * 0.25 * vel
        y = (y + knock) * np.minimum(1, t / 0.002)
        pan = spread * ((math.log2(f0 / 261.6)) / 2)
        th = (max(-1, min(1, pan)) + 1) * math.pi / 4
        out[:, 0] += y * math.cos(th)
        out[:, 1] += y * math.sin(th)
    return norm(out, vel)


def brush_slap(vel=0.7, seed=0):
    rng = rng_for("slap", seed)
    d = 0.25
    t = tt(d)
    noise = band(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t / 0.07)
    body = np.sin(2 * math.pi * 185 * t) * np.exp(-t / 0.045) * 0.5
    return norm((noise + body) * np.minimum(1, t / 0.003), vel)


def brush_swish(dur, beat, seed=0):
    """The brush circling on the snare head: band-passed noise swelling once per beat."""
    rng = rng_for("swish", seed)
    t = tt(dur)
    x = band(rng.standard_normal(len(t)), 1800, 9000)
    phase = (t / beat) % 1.0
    env = 0.35 + 0.65 * np.sin(math.pi * phase) ** 2
    return x * env


def crash(dur=2.6, vel=0.8, seed=0):
    """A brush crash on a ride cymbal: bright noise and a few inharmonic metal modes, long decay."""
    rng = rng_for("crash", seed)
    t = tt(dur)
    wash = band(rng.standard_normal(len(t)), 3500, 14000) * np.exp(-t / 0.9)
    metal = sum(np.sin(2 * math.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
                for f, tau in [(3240, 0.7), (4710, 0.55), (5930, 0.5), (7350, 0.4), (8820, 0.35)])
    y = (wash + 0.12 * metal) * np.minimum(1, t / 0.004)
    return norm(y, vel)


def vibes(names, dur, vel=0.6, seed=0, at=0.0, motor=4.8, depth=0.3, damp=None, spread=0.4):
    """Vibraphone: each bar rings its fundamental, the tuned 4x partial and a faint ~10x one; the resonator under it
    swells and dips with the motor's discs (tremolo, locked to film time `at`, so it runs on from note to note); a soft
    yarn mallet. `damp` (s after the hit) lifts the pedal. Returns stereo (n, 2), spread across the field by pitch."""
    rng = rng_for("vibes", seed)
    t = tt(dur)
    trem = 1 - depth * (0.5 + 0.5 * np.sin(2 * math.pi * motor * (t + at)))
    out = np.zeros((len(t), 2))
    for name in names:
        f0 = hz(name)
        tau = 3.0 * (349.2 / f0) ** 0.4
        y = np.sin(2 * math.pi * f0 * t + rng.random() * 6.28) * np.exp(-t / tau) * trem
        y += 0.3 * vel * np.sin(2 * math.pi * 4 * f0 * t + rng.random() * 6.28) * np.exp(-t / (0.35 * tau))
        y += 0.06 * vel * np.sin(2 * math.pi * 9.92 * f0 * t + rng.random() * 6.28) * np.exp(-t / 0.08)
        y += band(rng.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.004) * 0.06 * vel
        y *= np.minimum(1, t / 0.0015)
        th = (max(-1, min(1, spread * math.log2(f0 / 440) / 1.5)) + 1) * math.pi / 4
        out[:, 0] += y * math.cos(th)
        out[:, 1] += y * math.sin(th)
    if damp is not None:
        out *= np.where(t < damp, 1.0, np.exp(-np.maximum(t - damp, 0) / 0.1))[:, None]
    return norm(out, vel)


def piano_comp(names, hold, vel=0.5, seed=0):
    """A short comping chord: the piano, with the damper coming down after `hold` s."""
    dur = hold + 0.3
    t = tt(dur)
    return piano(names, dur, vel, seed=seed, spread=0.25) * np.where(t < hold, 1.0, np.exp(-np.maximum(t - hold, 0) / 0.05))[:, None]


def brass(names, dur, vel=0.9, seed=0):
    """Low brass for the alarm: sawtooth-rich notes whose brightness opens with the attack and closes as the note
    sits, a small scoop up into the pitch and a little breath."""
    rng = rng_for("brass", seed)
    t = tt(dur)
    cut = 320 + 2400 * np.minimum(1, t / 0.03) * np.exp(-t / 0.22) + 380 * np.exp(-t / 1.2)  # brightness, Hz
    out = np.zeros(len(t))
    for name in names:
        f0 = hz(name)
        ph = 2 * math.pi * np.cumsum(f0 * 2 ** (-0.4 * np.exp(-t / 0.02) / 12)) / SR
        for k in range(1, int(7000 / f0) + 1):
            out += np.exp(-k * f0 / cut) / k ** 0.7 * np.sin(k * ph + rng.random())
    breath = band(rng.standard_normal(len(t)), 300, 2500) * np.exp(-t / 0.05) * 0.05 * len(names)
    env = np.minimum(1, t / 0.012) * (0.7 + 0.3 * np.exp(-t / 0.08)) * np.clip((dur - t) / 0.09, 0, 1)
    return norm((out + breath) * env, vel)


def snare(vel=0.9, seed=0):
    """A stick on the snare (the alarm's accent): the head's tone, the crack and the wires' rattle."""
    rng = rng_for("snare", seed)
    t = tt(0.4)
    head = np.sin(2 * math.pi * 185 * t) * np.exp(-t / 0.06) + 0.45 * np.sin(2 * math.pi * 330 * t) * np.exp(-t / 0.035)
    wires = band(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t / 0.13)
    crack = band(rng.standard_normal(len(t)), 700, 4500) * np.exp(-t / 0.01)
    return norm((0.7 * head + wires + 0.8 * crack) * np.minimum(1, t / 0.0008), vel)


def ride(vel=0.5, seed=0, dur=1.4):
    """A brush tip on the ride cymbal: the ride's ping and wash."""
    rng = rng_for("ride", seed)
    t = tt(dur)
    ping = sum(np.sin(2 * math.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
               for f, tau in [(2980, 0.55), (4150, 0.45), (5370, 0.35), (7010, 0.25), (8440, 0.18)])
    wash = band(rng.standard_normal(len(t)), 4500, 14000) * np.exp(-t / 0.4)
    tip = band(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.005)
    return norm((0.15 * ping + 0.6 * wash + 0.8 * tip) * np.minimum(1, t / 0.001), vel)


def kick(vel=0.5, seed=0):
    """A feathered bass drum: felt on a loose head, felt more than heard."""
    rng = rng_for("kick", seed)
    d = 0.35
    t = tt(d)
    y = glide_sine(d, 85, 46, 0.3) * np.exp(-t / 0.1) + band(rng.standard_normal(len(t)), 100, 800) * np.exp(-t / 0.008) * 0.3
    return norm(y * np.minimum(1, t / 0.002), vel)


def arco(f0, dur, vel=0.7, seed=0):
    """The upright bass bowed: a sawtooth-like string through a dark body, a slow bow attack, a late slow vibrato."""
    rng = rng_for("arco", seed)
    t = tt(dur)
    vib = 1 + 0.0035 * np.sin(2 * math.pi * 4.6 * t) * np.clip((t - 0.5) / 0.8, 0, 1)
    ph = 2 * math.pi * np.cumsum(f0 * vib) / SR
    y = sum(np.sin(k * ph + rng.random() * 6) / k / (1 + (k * f0 / 500) ** 2) for k in range(1, int(3000 / f0) + 1))
    y = y + band(rng.standard_normal(len(t)), 150, 1500) * 0.01  # the bow hair
    env = np.sin(np.clip(t / 0.45, 0, 1) * math.pi / 2) ** 2 * np.clip((dur - t) / 0.25, 0, 1)
    return norm(band(y, hi=1200) * env, vel)


# ---------------------------------------------------------------------------------------------------- pitched effects
def tone_tick(pitch=1650, muffled=False, vel=0.6, seed=0):
    """A chat bubble arriving: a short pitched 'tick' with a tiny click."""
    rng = rng_for("tick", seed)
    d = 0.09
    t = tt(d)
    y = glide_sine(d, pitch * 1.3, pitch, 0.25) * np.exp(-t / 0.016)
    y += band(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.002) * 0.4
    if muffled:
        y = band(y, hi=700) * 1.4
    return norm(y * np.minimum(1, t / 0.0008), vel)


def bell_fx(name="D6", vel=0.6, seed=0, dur=1.8):
    """A small bell: a handbell's inharmonic partials and the strike."""
    rng = rng_for("bell", seed)
    f0 = hz(name)
    t = tt(dur)
    y = sum(a * np.sin(2 * math.pi * r * f0 * t + rng.random() * 6) * np.exp(-t / tau)
            for r, a, tau in [(1, 1, 1.1), (2.0, 0.35, 0.6), (2.76, 0.3, 0.45), (5.4, 0.15, 0.2), (8.93, 0.06, 0.1)])
    y = y + band(rng.standard_normal(len(t)), 3000, 12000) * np.exp(-t / 0.0015) * 0.3
    return norm(y * np.minimum(1, t / 0.0008), vel)


def rising_tone(dur, f0, f1, vel=0.5, tail=0.35):
    """A soft reedy tone gliding up from f0 to f1 over dur, then letting go."""
    t = tt(dur + tail)
    u = np.clip(t / dur, 0, 1)
    ph = 2 * math.pi * np.cumsum(f0 * (f1 / f0) ** (u * u * (3 - 2 * u))) / SR
    y = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.06) * np.where(t < dur, 1.0, np.exp(-np.maximum(t - dur, 0) / 0.12))
    return norm(y * env, vel)


def slab_fx(name, vel=0.7, seed=0):
    """A slab or step rising into place: a pitched thump, like a felt mallet on a tom."""
    rng = rng_for("slab", seed)
    f = hz(name)
    d = 0.5
    t = tt(d)
    y = norm(glide_sine(d, f * 1.25, f, 0.2) * np.exp(-t / 0.16)) + norm(band(rng.standard_normal(len(t)), 150, 1200) * np.exp(-t / 0.02), 0.3)
    return norm(y * np.minimum(1, t / 0.002), vel)


# ---------------------------------------------------------------------------------------------------- the bed's own voices
# The pitched effects are played on the Mixkit bed's instruments, as measured (docs/bed_kit.md): its keys, its bass and its
# hi-hat. The bed has no kick, snare, ride or cymbal, and no brass, so no effect uses one.
KEYS_DB = [0.0, -16.0, -21.3, -24.9, -28.5, -32.8, -36.8, -40.8]  # the keys' partials 1..8 re the fundamental: mellow, fundamental-heavy
# The bass's partials 2..7 re its fundamental, by the fundamental's pitch (Hz): the 2nd harmonic dominates the lowest notes.
BASS_PARTIALS = {44: [5.6, -5.8, -18.6, -13.8, -26.9, -31.1], 55: [7.4, -12.0, -16.0, -28.0, -25.0, -34.0],
                 65: [-7.1, -25.9, -32.3, -33.0, -37.3, -38.2], 69: [-6.3, -24.6, -31.6, -37.3, -46.7, -51.7],
                 87: [-18.0, -27.0, -38.0, -40.0, -45.0, -48.0], 110: [-24.0, -30.0, -42.0, -45.0, -50.0, -52.0]}


def keys(midis, dur, vel=0.7, seed=0, tau=0.28, bright=0.0, knock=0.05, wide=0.4):
    """The bed's keys: a chord of staccato notes, each fundamental-heavy with the bed's roll-off (partials 2..8 at -16 to
    -41 dB), ringing with time constant `tau` (0.28 s as measured; the upper partials die a little faster), a 4 ms attack
    with a faint felt knock, two strings a fraction of a cent apart, and each note placed a little left of centre and
    wide, as the bed has them. `bright` lifts partials 2-8 by up to that many dB (a chime, a bell, a bright tick).
    Returns stereo (n, 2), peak-normalized to `vel`."""
    rng = rng_for("keys", seed)
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for m in midis:
        f0 = midi_hz(m)
        y = np.zeros(len(t))
        for k in range(1, 9):
            fk = k * f0
            if fk > 11000:
                break
            a = 10 ** ((KEYS_DB[k - 1] + (bright * min(1.0, (k - 1) / 3) if k > 1 else 0.0)) / 20)
            tk = tau * 0.8 ** ((k - 1) / 3)
            for det in (1 - 0.00008, 1 + 0.00008):
                y += 0.5 * a * np.exp(-t / tk) * np.sin(2 * math.pi * fk * det * t + rng.random() * 6.28)
        y = y * np.minimum(1, t / 0.004) + knock * band(rng.standard_normal(len(t)), 500, 3500) * np.exp(-t / 0.008)
        pan = max(-1.0, min(1.0, -0.15 + wide * (rng.random() - 0.5) * 2 + 0.2 * math.log2(f0 / 349.2)))
        th = (pan + 1) * math.pi / 4
        out[:, 0] += y * math.cos(th)
        out[:, 1] += y * math.sin(th)
    return norm(out, vel)


def _bass_amps(f0):
    """The bass's partial amplitudes 1..7 for a fundamental f0 (Hz), from BASS_PARTIALS interpolated in log frequency."""
    anchors = sorted(BASS_PARTIALS)
    x = np.log(np.clip(f0, anchors[0], anchors[-1]))
    db = [np.interp(x, np.log(anchors), [BASS_PARTIALS[a][k] for a in anchors]) for k in range(6)]
    return [1.0] + [10 ** (d / 20) for d in db]


def bass_note(f0, dur, vel=0.8, seed=0, held=False, bend=None):
    """The bed's bass: a soft plucked, gated note, fundamental-heavy with the bed's partials (the 2nd dominant on the lowest
    notes), a 25 ms attack, a decay of about 0.13 s and a gate that releases at 0.2 s, as on the bed's 8ths. `held` lets
    the note ring instead (a decay of 2.5 s, a 0.12 s swell, a 0.25 s release at the end: the bed's held notes, longer).
    `bend` = (start s, semitones, length s) bends the note down. Centred, mono."""
    t = tt(dur)
    f = f0 * np.ones(len(t))
    if bend:
        start, semis, length = bend
        u = np.clip((t - start) / length, 0, 1)
        f = f0 * 2 ** (-semis * (u * u * (3 - 2 * u)) / 12)
    ph = 2 * math.pi * np.cumsum(f) / SR
    y = sum(a * np.sin((k + 1) * ph) for k, a in enumerate(_bass_amps(f0)))
    if held:
        env = (1 - np.cos(math.pi * np.minimum(1, t / 0.12))) / 2 * np.exp(-t / 2.5) * np.clip((dur - t) / 0.25, 0, 1)
    else:
        env = (1 - np.cos(math.pi * np.minimum(1, t / 0.025))) / 2 * np.exp(-t / 0.13) * np.where(t < 0.2, 1.0, np.exp(-(t - 0.2) / 0.06))
    return norm(y * env, vel)


def hat(vel=0.6, seed=0, dur=0.45, tau=0.08):
    """The bed's hi-hat: a burst of noise (0.9-14 kHz, centroid near 8 kHz), 6 ms to rise, decaying with tau about 80 ms,
    the two channels decorrelated, as the bed's are. Returns stereo (n, 2)."""
    rng = rng_for("hat", seed)
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for c in range(2):
        out[:, c] = band(rng.standard_normal(len(t)), 900, 14000) * np.exp(-t / tau) * np.minimum(1, t / 0.0075)
    return norm(out, vel)


def tone_glide(dur, f0, f1, vel=0.5, tail=0.35):
    """A smooth tone gliding up from f0 to f1 over `dur`, then letting go: the keys' spectrum (partials 2 and 3 at -16 and
    -21 dB), for the band that grows along a scale."""
    t = tt(dur + tail)
    u = np.clip(t / dur, 0, 1)
    ph = 2 * math.pi * np.cumsum(f0 * (f1 / f0) ** (u * u * (3 - 2 * u))) / SR
    y = np.sin(ph) + 10 ** (KEYS_DB[1] / 20) * np.sin(2 * ph) + 10 ** (KEYS_DB[2] / 20) * np.sin(3 * ph)
    env = np.minimum(1, t / 0.06) * np.where(t < dur, 1.0, np.exp(-np.maximum(t - dur, 0) / 0.12))
    return norm(y * env, vel)
