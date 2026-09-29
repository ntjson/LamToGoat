"""The film's sound: the music bed and the sound effects, mixed to -14 LUFS / -1 dBTP.

Reads docs/timeline.json (tempo, bars, chapters) and out/sound/cues.json (the scenes' own event times, written by
tools/cues.mjs) and writes a stereo 48 kHz WAV for the selected chapters (default: the whole film).

Two music beds:
- `--music bed` (the default): "Upbeat Jazz" by Francisco Alvear (Mixkit), stretched to 108 BPM and arranged to the
  film's 81 bars by tools/bed.py (out/sound/bed.wav). It dips where the score breaks: from ch01's drop to ch02, and
  from ch07's push to ch08, where it thins to a dark trace under one bowed note.
- `--music synth`: the synthesized score (a walking upright-bass line, brushed snare and piano stabs at 108 BPM, swung
  eighths; minor and sparse for ch01-ch04, open to major with a vibraphone for ch05-ch07, driving for ch08-ch09,
  resolving for ch10-ch11), with ch01 as the approved sketch, note for note.

The effects are synthesized in code: the cue vocabulary of docs/ANIMATION_GUIDE.md, section 12, on the cue times.
Over the Mixkit bed, every cue that sounds notes (the stabs, chimes, pitched thumps and ticks, the rising tone, the
bell, the loop's warm chord, the bow) takes them from the pitch classes the bed is sounding at that beat; ch01's
approved hits keep theirs (D minor sits in the track's key). Everything is seeded, so the same inputs always give
the same file.

Usage: uv run --with numpy --with scipy python tools/sound.py [--chapters ch01,ch02] [--out out/sound/film.wav]
       [--cues out/sound/cues.json] [--music bed|synth] [--stems] [--score out/sound/score.json]
"""
import argparse
import json
import math
import subprocess
import tempfile
import zlib
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, lfilter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
TARGET_LUFS = -14.0
TP_CEIL = -1.2  # dBTP after limiting: 0.2 dB under the -1 dBTP rule, for the AAC encode
AAC_CEIL = -1.2  # dBTP the film's AAC encode may reach when decoded (render.mjs muxes AAC 320 kbps, 48 kHz)
SWING = 0.6  # swung 8ths: the off-beat falls at 60 % of the beat

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
NOTE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})


def hz(name):
    """'D2' -> Hz (A4 = 440)."""
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[pitch] + 12 * (octave + 1) - 69) / 12)


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
    """Two-pole resonant band-pass at f with quality q (metal, strings)."""
    w = 2 * math.pi * f / SR
    r = math.exp(-w / (2 * q))
    return lfilter([1 - r], [1, -2 * r * math.cos(w), r * r], x)


def glide_sine(dur, f0, f1, shape=1.0):
    """A sine whose pitch glides from f0 to f1 (exponentially), phase-continuous."""
    t = tt(dur)
    u = (t / dur) ** shape
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------------------------------------------- instruments
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


# ---------------------------------------------------------------------------------------------------- effects
def tick(pitch=1650, muffled=False, vel=0.6, seed=0):
    """A chat bubble arriving: a short pitched 'tick' with a tiny click."""
    rng = rng_for("tick", seed)
    d = 0.09
    t = tt(d)
    y = glide_sine(d, pitch * 1.3, pitch, 0.25) * np.exp(-t / 0.016)
    y += band(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.002) * 0.4
    if muffled:
        y = band(y, hi=700) * 1.4
    return norm(y * np.minimum(1, t / 0.0008), vel)


def pop(vel=0.8, seed=0):
    """The complaint landing: a rounder pop with a little paper in it."""
    rng = rng_for("pop", seed)
    d = 0.2
    t = tt(d)
    y = glide_sine(d, 640, 390, 0.3) * np.exp(-t / 0.05)
    y += band(rng.standard_normal(len(t)), 400, 2600) * np.exp(-t / 0.035) * 0.35
    return norm(y * np.minimum(1, t / 0.001), vel)


def stamp(vel=0.8, seed=0):
    """A paper strip slammed down (caption, SLAM): a low thump, the paper's slap and a crack."""
    rng = rng_for("stamp", seed)
    d = 0.35
    t = tt(d)
    thump = glide_sine(d, 120, 55, 0.4) * np.exp(-t / 0.085)
    slap = band(rng.standard_normal(len(t)), 300, 3200) * np.exp(-t / 0.04) * 0.6
    crack = band(rng.standard_normal(len(t)), 3000, None) * np.exp(-t / 0.006) * 0.35
    return norm((thump + slap + crack) * np.minimum(1, t / 0.0015), vel)


def snip(vel=0.7, seed=0):
    """One scissor snip: blades meeting (a metallic ring) and paper giving way."""
    rng = rng_for("snip", seed)
    d = 0.12
    t = tt(d)
    n = rng.standard_normal(len(t))
    y = resonator(n, 4300, 14) * np.exp(-t / 0.02) * 0.6 + band(n, 3000, 11000) * np.exp(-t / 0.012)
    y += np.sin(2 * math.pi * 2650 * t) * np.exp(-t / 0.01) * 0.3
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


def swoosh(dur, f0, f1, vel=0.6, seed=0):
    """Paper sliding: noise whose band moves from f0 to f1 (a bank of bands, cross-faded in log frequency)."""
    rng = rng_for("swoosh", seed)
    t = tt(dur)
    centres = np.geomspace(250, 6000, 10)
    x = rng.standard_normal(len(t))
    lf = np.log(f0) + (np.log(f1) - np.log(f0)) * (t / dur)
    y = np.zeros(len(t))
    for c in centres:
        w = np.exp(-((np.log(c) - lf) ** 2) / (2 * 0.35**2))
        y += band(x, c / 1.35, c * 1.35) * w
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


# ---------------------------------------------------------------------------------------------------- more instruments
# The rest of the band, for ch02-ch11: a vibraphone for the major half, low brass and a snare for the two alarms, a
# ride and a feathered kick for the driving half, the bass's bow for ch07's held note, and a damped piano for comping.
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


# ---------------------------------------------------------------------------------------------------- more effects
# The rest of the palette (docs/ANIMATION_GUIDE.md, section 12). Each is normalized to its `vel` peak; the mix sets
# its level.
def stamp_deep(vel=0.8, seed=0):
    """A seal or tag struck down: the stamp's slap and crack over a deeper, longer thump."""
    rng = rng_for("stamp_deep", seed)
    d = 0.45
    t = tt(d)
    thump = glide_sine(d, 100, 40, 0.4) * np.exp(-t / 0.11)
    slap = band(rng.standard_normal(len(t)), 250, 2800) * np.exp(-t / 0.045) * 0.55
    crack = band(rng.standard_normal(len(t)), 2500, None) * np.exp(-t / 0.006) * 0.3
    return norm((thump + slap + crack) * np.minimum(1, t / 0.0015), vel)


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
    """A pin pushed through paper into board: the point's tick and a short woody tock."""
    rng = rng_for("pin", seed)
    t = tt(0.12)
    n = rng.standard_normal(len(t))
    y = norm(resonator(n, 1850, 10) * np.exp(-t / 0.014)) + norm(band(n, 4000, 11000) * np.exp(-t / 0.0015), 0.8)
    y += norm(np.sin(2 * math.pi * 260 * t) * np.exp(-t / 0.025), 0.4)
    return norm(y * np.minimum(1, t / 0.0005), vel)


def punch_fx(vel=0.8, seed=0):
    """A hole punched through paper: the press's thump, the die's metal chunk and the paper giving way."""
    rng = rng_for("punch", seed)
    d = 0.3
    t = tt(d)
    n = rng.standard_normal(len(t))
    y = norm(glide_sine(d, 170, 70, 0.35) * np.exp(-t / 0.05)) + norm(resonator(n, 2400, 9) * np.exp(-t / 0.018), 0.6)
    y += norm(band(n, 3000, None) * np.exp(-t / 0.004), 0.5) + norm(band(n, 500, 3500) * np.exp(-t / 0.035), 0.35)
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
    """A heavy landing: a low body thump and the paper's contact."""
    rng = rng_for("thud", seed)
    d = 0.45
    t = tt(d)
    n = rng.standard_normal(len(t))
    y = norm(glide_sine(d, 92, 44, 0.35) * np.exp(-t / 0.12)) + norm(band(n, 60, 500) * np.exp(-t / 0.04), 0.45)
    y += norm(band(n, 800, 3000) * np.exp(-t / 0.006), 0.15)
    return norm(y * np.minimum(1, t / 0.002), vel)


def click_fx(vel=0.6, seed=0):
    """A button pressed, a clip clicking on: a press and its softer release."""
    rng = rng_for("click", seed)
    t = tt(0.07)
    n = rng.standard_normal(len(t))
    c = norm(band(n, 2000, 10000) * np.exp(-t / 0.0012)) + norm(np.sin(2 * math.pi * 3200 * t) * np.exp(-t / 0.004), 0.4)
    y = c.copy()
    j = int(0.026 * SR)
    y[j:] += 0.45 * c[: len(c) - j]
    return norm(y, vel)


def bell_fx(name="D6", vel=0.6, seed=0, dur=1.8):
    """A small bell: a handbell's inharmonic partials and the strike."""
    rng = rng_for("bell", seed)
    f0 = hz(name)
    t = tt(dur)
    y = sum(a * np.sin(2 * math.pi * r * f0 * t + rng.random() * 6) * np.exp(-t / tau)
            for r, a, tau in [(1, 1, 1.1), (2.0, 0.35, 0.6), (2.76, 0.3, 0.45), (5.4, 0.15, 0.2), (8.93, 0.06, 0.1)])
    y = y + band(rng.standard_normal(len(t)), 3000, 12000) * np.exp(-t / 0.0015) * 0.3
    return norm(y * np.minimum(1, t / 0.0008), vel)


def creak_fx(dur=0.45, vel=0.6, seed=0):
    """Paper giving way as a window opens: stick-slip grains at a wandering rate through two small resonances."""
    rng = rng_for("creak", seed)
    t = tt(dur)
    imp = np.zeros(len(t))
    k = 0.0
    while True:
        k += 1 / max(15, 45 + 30 * math.sin(2 * math.pi * 1.4 * k + 1) + 10 * rng.standard_normal())
        if k >= dur:
            break
        imp[int(k * SR)] = rng.uniform(0.5, 1)
    y = resonator(imp, 480, 7) + 0.7 * resonator(imp, 1250, 9) + 0.35 * resonator(imp, 2600, 12)
    return norm(y * np.sin(math.pi * np.clip(t / dur, 0, 1)) ** 0.7, vel)


def rising_tone(dur, f0, f1, vel=0.5, tail=0.35):
    """A soft reedy tone gliding up from f0 to f1 over dur, then letting go."""
    t = tt(dur + tail)
    u = np.clip(t / dur, 0, 1)
    ph = 2 * math.pi * np.cumsum(f0 * (f1 / f0) ** (u * u * (3 - 2 * u))) / SR
    y = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.06) * np.where(t < dur, 1.0, np.exp(-np.maximum(t - dur, 0) / 0.12))
    return norm(y * env, vel)


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
    y = norm(resonator(imp, 1300, 4)) + norm(band(lfilter([1], [1, -0.9], imp), 2000, 7000), 0.5)
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
    """Odometer digits rolling: clicks at a rate that slows from r0 to r1 per second as the digits settle."""
    rng = rng_for("rattle", seed)
    t = tt(dur)
    imp = np.zeros(len(t))
    k = 0.0
    while True:
        k += 1 / (r1 + (r0 - r1) * (1 - k / dur) ** 1.6)
        if k >= dur:
            break
        imp[int(k * SR)] = rng.uniform(0.6, 1)
    y = norm(resonator(imp, pitch, 18)) + norm(band(imp, 3000, 10000), 0.5)
    return norm(y, vel)


def lock_fx(vel=0.7, seed=0):
    """The count locking: a firm clack with a little body."""
    rng = rng_for("lock", seed)
    t = tt(0.12)
    n = rng.standard_normal(len(t))
    y = norm(resonator(n, 1600, 12) * np.exp(-t / 0.012)) + norm(band(n, 3000, 10000) * np.exp(-t / 0.0015), 0.8)
    y += norm(np.sin(2 * math.pi * 420 * t) * np.exp(-t / 0.02), 0.35)
    return norm(y * np.minimum(1, t / 0.0005), vel)


def sweep_fx(dur, vel=0.5, seed=0):
    """Windows lighting in a sweep: a rattle of little lamp clicks that speeds up and climbs in pitch."""
    rng = rng_for("sweep", seed)
    y = np.zeros(int((dur + 0.05) * SR))
    g = tt(0.03)
    k = 0.0
    while True:
        k += 1 / (14 + 70 * (k / dur) ** 1.3)
        if k >= dur:
            break
        u = k / dur
        f = 1100 * (2.5 ** u) * (1 + 0.03 * rng.standard_normal())
        i = int(k * SR)
        grain = np.sin(2 * math.pi * f * g) * np.exp(-g / 0.006) * rng.uniform(0.5, 1) * (0.5 + 0.5 * u)
        y[i: i + len(g)] += grain[: len(y) - i]
    return norm(y, vel)


def slab_fx(name, vel=0.7, seed=0):
    """A slab or step rising into place: a pitched thump, like a felt mallet on a tom."""
    rng = rng_for("slab", seed)
    f = hz(name)
    d = 0.5
    t = tt(d)
    y = norm(glide_sine(d, f * 1.25, f, 0.2) * np.exp(-t / 0.16)) + norm(band(rng.standard_normal(len(t)), 150, 1200) * np.exp(-t / 0.02), 0.3)
    return norm(y * np.minimum(1, t / 0.002), vel)


def cell_fx(vel=0.4, seed=0):
    """One cell of a façade flipping: a tiny, bright tick."""
    rng = rng_for("cell", seed)
    t = tt(0.03)
    y = np.sin(2 * math.pi * (3000 + 1500 * rng.random()) * t) * np.exp(-t / 0.003)
    y += band(rng.standard_normal(len(t)), 4000, 12000) * np.exp(-t / 0.001)
    return norm(y, vel)


def paper_tick(vel=0.5, seed=0):
    """A HARD CUT: a small, dry paper tick."""
    rng = rng_for("paper_tick", seed)
    t = tt(0.05)
    y = band(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t / 0.004) + 0.3 * np.sin(2 * math.pi * 900 * t) * np.exp(-t / 0.006)
    return norm(y, vel)


def snap_fx(vel=0.7, seed=0):
    """A short, stiff settle: a crisp snap of card."""
    rng = rng_for("snap", seed)
    t = tt(0.09)
    n = rng.standard_normal(len(t))
    y = norm(band(n, 1400, 6500) * np.exp(-t / 0.007)) + norm(resonator(n, 1750, 7) * np.exp(-t / 0.012), 0.5)
    y += norm(np.sin(2 * math.pi * 300 * t) * np.exp(-t / 0.015), 0.25)
    return norm(y * np.minimum(1, t / 0.0005), vel)


# ---------------------------------------------------------------------------------------------------- the mix bus
# Stem levels (dB) applied at mixdown: the music is a bed under the effects, the stabs are the loudest moments.
STEMS = {"bass": -11.0, "drums": -2.0, "piano": 0.0, "sfx": 0.0, "vibes": 0.0, "brass": 0.0, "bed": 0.0}
BED = ROOT / "out" / "sound" / "bed.wav"  # tools/bed.py writes it (and bed.json beside it)
BED_GAIN = -17.5  # dB: the Mixkit track (about -11 LUFS in its body) as a bed under the effects, where the old score sat
BED_INTRO_DB = 4.0  # the sparse intro (film start to ch05) this much higher, so it is heard under ch01-ch04; the lift
# on ch05's downbeat (+8.6 dB in the recording) stays a lift
BED_RESOLVE_DB = -2.5  # ch10-ch11 resolve: the bed eases down this much over ch10's first two bars and stays there


class Bus:
    """Stereo stems; add() places a mono or stereo signal at a time, gain and pan."""

    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.stems = {k: np.zeros((self.n, 2)) for k in STEMS}

    def add(self, sig, at, gain_db=0.0, pan=0.0, stem="sfx"):
        if at < 0:
            sig = sig[int(-at * SR):]
            at = 0
        g = 10 ** (gain_db / 20)
        i = int(round(at * SR))
        if sig.ndim == 1:
            th = (max(-1, min(1, pan)) + 1) * math.pi / 4
            sig = np.stack([sig * math.cos(th), sig * math.sin(th)], axis=1) * math.sqrt(2)
        j = min(self.n, i + len(sig))
        if j > i:
            self.stems[stem][i:j] += g * sig[: j - i]

    def mix(self):
        return sum(x * 10 ** (STEMS[k] / 20) for k, x in self.stems.items())


# ---------------------------------------------------------------------------------------------------- loudness (BS.1770-4)
def k_weight(x):
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    y = k_weight(x)
    block, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + block] ** 2, axis=0).sum() for i in range(0, len(y) - block + 1, hop)])
    l = -0.691 + 10 * np.log10(np.maximum(z, 1e-12))
    z1 = z[l > -70]
    rel = -0.691 + 10 * np.log10(np.mean(z1)) - 10
    return -0.691 + 10 * np.log10(np.mean(z[l > rel]))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limit(x, ceiling_db):
    """Look-ahead peak limiter on the 4x-oversampled envelope: gain never lets a true peak pass the ceiling."""
    c = 10 ** (ceiling_db / 20)
    env = resample_poly(np.max(np.abs(x), axis=1), 4, 1)
    env = np.maximum.reduceat(np.abs(env), np.arange(0, len(env), 4))[: len(x)]
    need = np.minimum(1.0, c / np.maximum(env, 1e-12))
    look = int(0.004 * SR)
    # attack: the minimum over a ±4 ms window (look-ahead); release: a one-pole recovery (80 ms)
    g = minimum_filter1d(need, size=2 * look + 1)
    rel = math.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else v + (cur - v) * rel
        out[i] = cur
    return x * out[:, None]


def limit_tp(x, ceiling_db):
    """The same limiter on the exact true-peak envelope: each channel 4x oversampled, then the loudest of the four
    sub-samples and of the two channels, per sample."""
    c = 10 ** (ceiling_db / 20)
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=0)), axis=1)
    env = np.maximum.reduceat(up, np.arange(0, len(up), 4))[: len(x)]
    need = np.minimum(1.0, c / np.maximum(env, 1e-12))
    look = int(0.004 * SR)
    g = minimum_filter1d(need, size=2 * look + 1)
    rel = math.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else v + (cur - v) * rel
        out[i] = cur
    return x * out[:, None]


def aac_roundtrip(x):
    """x encoded the way render.mjs muxes it (ffmpeg's AAC, 320 kbps, 48 kHz) and decoded again, sample-aligned."""
    with tempfile.TemporaryDirectory() as d:
        src, enc = Path(d) / "x.wav", Path(d) / "x.m4a"
        wavfile.write(src, SR, x.astype(np.float32))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:a", "aac", "-b:a", "320k", "-ar", str(SR), str(enc)], check=True)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(enc), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                             check=True, capture_output=True).stdout
    y = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)[: len(x)]
    return np.pad(y, ((0, len(x) - len(y)), (0, 0)))


def aac_safe(x, ceiling_db=AAC_CEIL):
    """Keep the true peak of the AAC encode under the ceiling. The encoder rings on the sharpest transients (a snip is a
    fraction of a millisecond of metal) and can overshoot the PCM's peak by more than a dB; where the decoded file
    would pass the ceiling, lower the PCM there by what it needs, over a window wider than an AAC frame, and check
    again. Returns the PCM and the decoded file's true peak."""
    c = 10 ** (ceiling_db / 20)
    look = int(0.024 * SR)
    rel = math.exp(-1 / (0.08 * SR))
    for _ in range(6):
        y = aac_roundtrip(x)
        up = np.max(np.abs(resample_poly(y, 4, 1, axis=0)), axis=1)
        env = np.maximum.reduceat(up, np.arange(0, len(up), 4))[: len(x)]
        if env.max() <= c:
            break
        need = minimum_filter1d(np.minimum(1.0, c / np.maximum(env, 1e-12)), size=2 * look + 1)
        g = np.empty_like(need)
        cur = 1.0
        for i, v in enumerate(need):
            cur = v if v < cur else v + (cur - v) * rel
            g[i] = cur
        x = x * g[:, None]
    return x, 20 * np.log10(env.max())


def master(x):
    """Normalize to TARGET_LUFS with every true peak under TP_CEIL (limit, re-measure, repeat). On a long mix the
    first limiter (whose envelope is the rectified signal's) can leave a true peak a hair over the ceiling; the exact
    true-peak limiter finishes the job. (ch01's sketch never needed it, so it is unchanged.)"""
    for _ in range(6):
        g = 10 ** ((TARGET_LUFS - lufs(x)) / 20)
        x = x * g
        if true_peak_db(x) <= TP_CEIL + 0.02:
            break
        x = limit(x, TP_CEIL - 0.1)
    for _ in range(4):
        if true_peak_db(x) <= TP_CEIL + 0.02:
            break
        x = limit_tp(x, TP_CEIL - 0.1)
        x = x * 10 ** ((TARGET_LUFS - lufs(x)) / 20)
    return x


# ---------------------------------------------------------------------------------------------------- harmony
# Chord symbols are a root and a quality; the intervals are semitones from the root.
QUAL = {"": (0, 4, 7), "m": (0, 3, 7), "6": (0, 4, 7, 9), "69": (0, 4, 7, 9, 14), "7": (0, 4, 7, 10),
        "7sus": (0, 5, 7, 10), "m7": (0, 3, 7, 10), "maj7": (0, 4, 7, 11), "maj9": (0, 4, 7, 11, 14),
        "m7b5": (0, 3, 6, 10)}
# Rootless voicings for the vibraphone and the comping piano: 3rd, 7th (or 6th), 9th, and the 5th or 13th.
VOICE = {"": (4, 9, 14, 7), "m": (3, 10, 14, 7), "6": (4, 9, 14, 7), "69": (4, 9, 14, 7), "7": (4, 10, 14, 9),
         "7sus": (5, 10, 14, 7), "m7": (3, 10, 14, 7), "maj7": (4, 11, 14, 7), "maj9": (4, 11, 14, 7),
         "m7b5": (3, 6, 10, 12)}
VOICE_MINOR_V = (4, 10, 13, 8)  # a dominant in a minor key: 3rd, 7th, b9, b13
SCALE = {"Dm": (2, 4, 5, 7, 9, 10, 0), "D": (2, 4, 6, 7, 9, 11, 1), "G": (7, 9, 11, 0, 2, 4, 6)}
PC_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def midi(name):
    return NOTE[name[:-1]] + 12 * (int(name[-1]) + 1)


def name_of(m):
    return f"{PC_NAMES[m % 12]}{m // 12 - 1}"


def chord(sym):
    """'F#m7' -> (root pitch class, quality)."""
    r = sym[:2] if len(sym) > 1 and sym[1] in "#b" else sym[:1]
    return NOTE[r], sym[len(r):]


def tones(sym):
    r, q = chord(sym)
    return {(r + i) % 12 for i in QUAL[q]}


def voicing(sym, key, prev=None, lo=53, hi=72):
    """A close rootless voicing of sym inside [lo, hi] (MIDI), led from prev by the smallest total motion."""
    r, q = chord(sym)
    iv = VOICE_MINOR_V if (q == "7" and key == "Dm") else VOICE[q]
    pcs = sorted({(r + i) % 12 for i in iv})  # close position: each rotation is an inversion spanning under an octave
    best = None
    for rot in range(len(pcs)):
        order = pcs[rot:] + pcs[:rot]
        for base in range(lo, lo + 12):
            if base % 12 != order[0]:
                continue
            v = [base]
            for pc in order[1:]:
                m = v[-1] + 1
                while m % 12 != pc:
                    m += 1
                v.append(m)
            if v[-1] > hi:
                continue
            cost = sum(abs(a - b) for a, b in zip(v, prev)) if prev else abs(sum(v) / len(v) - (lo + hi) / 2)
            if best is None or cost < best[0]:
                best = (cost, v)
    return best[1]


# ---------------------------------------------------------------------------------------------------- the score
# One continuous 4/4 grid from t = 0 at 108 BPM, swung 8ths; chapters are whole bars, so the harmony changes on
# chapter starts. The problem half (ch01-ch04) is D minor and sparse (bass and brushes, as the approved ch01); the
# solution half opens to D major with a vibraphone (ch05-ch06) and lifts to G for the seal and the trace (ch07); the
# market fight and the business drive (ch08-ch09) add a ride, a feathered kick and comping piano; the team and the
# close resolve in D (ch10-ch11) in a two-feel, down to the final chord.
FEEL = {"ch01": "sparse", "ch02": "sparse", "ch03": "sparse", "ch04": "sparse", "ch05": "open", "ch06": "open",
        "ch07": "open", "ch08": "driving", "ch09": "driving", "ch10": "resolving", "ch11": "resolving"}
KEY = {"ch01": "Dm", "ch02": "Dm", "ch03": "Dm", "ch04": "Dm", "ch05": "D", "ch06": "D", "ch07": "G", "ch08": "D",
       "ch09": "D", "ch10": "D", "ch11": "D"}
# The harmony, one entry per bar ("A7:3 D:1" splits a bar by beats; two chords without counts get two beats each).
CHORDS = {
    "ch01": "Dm | Bb | Gm | A7 | Dm",
    "ch02": "Dm7 | Dm7 | Bbmaj7 | A7 | Dm7 | Gm7 | Em7b5 A7 | Dm7 | Dm7 D7",
    "ch03": "Gm7 | C7 | Fmaj7 | Bbmaj7 | Em7b5 A7 | Bbmaj7 A7",  # SAM lands on the deceptive Bbmaj7
    "ch04": "Dm7 | Bbmaj7 | Gm7 | A7 | Dm7 | Bbmaj7 | Gm7 | Em7b5 | A7",
    "ch05": "Dmaj7 | Bm7 | Em7 | A7 | Dmaj7 | Gmaj7 | Em7 | A7",  # opens to major on the doors
    "ch06": "Dmaj7 | Gmaj7 | F#m7 B7 | Em7 | A7 | Dmaj7 | A7 | A7 | Dmaj7 | Gmaj7 | Am7 D7",  # resolves on the person
    "ch07": "Gmaj7 | Em7 | Am7 D7 | Gmaj7 | Cmaj7 | Bm7 E7 | Am7 D7 | Gmaj7 | A7 | A7",
    "ch08": "Bm7 | Gmaj7 | Em7 | A7 | D",
    "ch09": "Dmaj7 | Bm7 | Em7 | A7 | Dmaj7 | Em7 A7sus | Gmaj7 | Em7 A7",  # the stairs climb D-E-F#-G to the stab
    "ch10": "Dmaj7 | Bm7 | Gmaj7 | Em7 A7 | Dmaj7 | Gmaj7 Em7",
    "ch11": "A7sus D69 | D69 | D69 | D69",
}
# ch01's bass line, written out note by note: the approved sketch.
CHARTS = {
    "ch01": [("Dm", ["D2", "F2", "A2", "C3"]), ("Bb", ["Bb1", "D2", "F2", "A1"]), ("Gm", ["G1", "Bb1", "D2", "E2"]),
             ("A7", ["A1", None, None, None]), ("Dm", [None, None, None, None])],
}
# Stab voicings (piano) and bass (two octaves) for the SLAMs the music marks; ch01's is the approved D-F-A-Bb-D.
STABS = {
    "ch01": (["D3", "F3", "A3", "Bb3", "D4"], "D2", "D1"),
    "ch06": (["D3", "A3", "C#4", "E4", "F#4"], "D2", "D1"),  # the "1": Dmaj9
    "ch07": (["D3", "G3", "B3", "E4", "A4"], "G2", "G1"),  # the "2": G6/9, the lift to G
    "ch08": (["D3", "F#3", "A3", "E4", "A4"], "D2", "D1"),  # "CÓ CẢ HAI.": D add9, home after B minor
    "ch09": (["D3", "G3", "B3", "F#4", "A4"], "G2", "G1"),  # "20–25 TÒA": Gmaj9 on top of the stairs
    "ch10": (["F#3", "B3", "E4", "A4", "D5"], "D2", "D1"),  # "ĐỘI KAWAIBU": D6/9
}
ALARM = (["Bb1", "E2", "Bb2"], ["A1", "Eb2", "A2"])  # two tritones, falling a semitone
FINAL = {"piano": ["D2", "A2", "E3", "F#3", "B3"], "vibes": ["F#3", "A3", "B3", "E4", "A4"], "bass": ("D2", "D1")}
# Pitched thumps for runs of rising slabs: D minor pentatonic across ch02's skyline, the line up to G in ch09.
SLABS = {"ch02": ["D2", "F2", "G2", "A2", "C3", "D3", "F3", "G3", "A3", "C4"], "ch03": ["F2"],
         "ch09": ["D3", "E3", "F#3", "G3"]}
SLIDE_STEP = {"ch03": -3, "ch07": 2, "ch08": 1, "ch11": 2}  # semitones per `i` in a run of slides (3.4 descends)

KIT = {  # brushes per feel: swish level; slap on 2 and 4 (vel, dB); swung taps (beat, vel, dB); kick and ride
    "sparse": {"swish": -30, "slap": (0.7, -19), "taps": [(2, 0.35, -26)]},
    "open": {"swish": -30, "slap": (0.7, -19), "taps": [(2, 0.35, -26), (3, 0.28, -28)]},
    "driving": {"swish": -28, "slap": (0.8, -17), "taps": [(0, 0.3, -27), (2, 0.35, -26)], "kick": (0.5, -25),
                "ride": (0.45, -29)},
    "resolving": {"swish": -31, "slap": (0.55, -21), "taps": []},
}
# Comping rhythms, (onset, hold) in beats from the bar line; 0.6 is the swung "and" of 1, -0.4 anticipates the bar.
VIB_PAT = [((0.0, 2.0), (2.6, 1.3)), ((1.6, 2.3),), ((0.0, 1.5), (1.6, 2.3)), ((0.0, 3.8),), ((-0.4, 4.2),)]
PIANO_PAT = [((0.0, 0.5), (1.6, 0.4)), ((1.6, 0.4), (3.6, 0.35)), ((0.0, 0.5), (2.6, 0.4)), ((0.6, 0.4), (2.0, 0.5))]
LO, HI = 28, 50  # the walking bass's range, E1-D3


class Film:
    """The score and the effects for the selected chapters, on one bus. Music follows the timeline's grid; effects
    follow the scenes' cues. `log` keeps every note and effect placed, for the analysis."""

    def __init__(self, tl, cues, chapters, bus, music="bed"):
        self.tl, self.bus = tl, bus
        self.music_mode = music
        self.bed_beats = json.loads(BED.with_suffix(".json").read_text())["beats"] if music == "bed" else None
        self.beat = tl["beat"]
        self.chs = {c["id"]: c for c in tl["chapters"]}
        self.order = [c["id"] for c in tl["chapters"]]
        self.sel = [c for c in self.order if c in chapters]
        self.t0 = min(self.chs[c]["start"] for c in self.sel)
        self.by = {}
        for q in cues:
            self.by.setdefault((q["ch"], q["name"]), []).append(q)
        self.log = []

    # ---- helpers
    def on(self, ch):
        return ch in self.sel

    def add(self, sig, at, gain, pan=0.0, stem="sfx"):
        self.bus.add(sig, at - self.t0, gain, pan=pan, stem=stem)

    def note(self, inst, ch, at, dur, pitches, **kw):
        self.log.append({"inst": inst, "ch": ch, "t": round(at, 4), "dur": round(dur, 4),
                         "midi": [midi(p) if isinstance(p, str) else p for p in pitches], **kw})

    def cue(self, ch, name):
        return self.by.get((ch, name), [])

    def slots(self, ch):
        c = self.chs[ch]
        out = []
        for b, bar in enumerate(CHORDS[ch].split("|")):
            items = bar.split()
            at = c["start"] + 4 * b * self.beat
            for x in items:
                sym, nb = (x.split(":")[0], int(x.split(":")[1])) if ":" in x else (x, 4 // len(items))
                out.append({"ch": ch, "t": at, "beats": nb, "sym": sym, "bar": b})
                at += nb * self.beat
        return out

    def chord_at(self, t):
        for ch in self.order:
            c = self.chs[ch]
            if c["start"] - 1e-6 <= t < c["end"] - 1e-6:
                for s in self.slots(ch):
                    if s["t"] - 1e-6 <= t < s["t"] + s["beats"] * self.beat - 1e-6:
                        return s["sym"], KEY[ch]
        return "D69", "D"

    def bar_at_least(self, t):
        """The first bar line at or after t."""
        n = math.ceil(t / (4 * self.beat) - 1e-9)
        return n * 4 * self.beat

    def alarm_second(self, t):
        """The alarm's second hit: the first beat at least half a beat after the first."""
        return math.ceil((t + 0.5 * self.beat) / self.beat - 1e-9) * self.beat

    def rests(self, ch):
        """Where the band holds off (the stab rings, the alarm hits, the push, the final chord): (from, to) pairs."""
        c = self.chs[ch]
        r = []
        for q in self.cue(ch, "stab"):
            if not q.get("soft"):
                r.append((q["t"] - 0.06, self.bar_at_least(q["t"] + 1.5 * self.beat) - 1e-6))
        for q in self.cue(ch, "alarm"):
            r.append((q["t"] - 0.06, self.alarm_second(q["t"]) + 0.06))
        for q in self.cue(ch, "push"):
            r.append((q["t"] - 0.06, c["end"] + 0.5))
        for q in self.cue(ch, "chord"):
            r.append((q["t"] - 0.06, self.tl["end"] + 10))
        return r

    def takeovers(self):
        """Times where a held note takes the bass: the stabs, both alarm hits, the push, the final chord."""
        out = []
        for ch in self.order:
            out += [q["t"] for q in self.cue(ch, "stab") if not q.get("soft")]
            out += [x for q in self.cue(ch, "alarm") for x in (q["t"], self.alarm_second(q["t"]))]
            out += [q["t"] for q in self.cue(ch, "push") + self.cue(ch, "chord")]
        return out

    def resting(self, ch, t):
        return any(a <= t < b for a, b in self.rests(ch))

    def seed(self, q, k, part=0):
        """ch01 keeps the approved sketch's seeds; every other cue gets its own."""
        if q["ch"] == "ch01" and q["name"] in SEED01:
            s = SEED01[q["name"]]
            return k if s is None else s[part]
        return zlib.crc32(f"{q['ch']}/{q['name']}/{k}/{part}".encode()) % 1000003

    # ---- music
    def music(self):
        if self.music_mode == "bed":
            self.bed_music()
            return
        if self.on("ch01"):
            self.ch01_music()
        walk = self.walk()
        takes = sorted(self.takeovers())
        for n in walk:
            if self.on(n["ch"]) and not self.resting(n["ch"], n["t"]):
                # one bass: a stab's or an alarm's note (or ch07's bow) damps the walking note under it
                dur = min([n["dur"]] + [c - n["t"] for c in takes if n["t"] + 1e-6 < c < n["t"] + n["dur"]])
                self.add(pluck_bass(hz(name_of(n["m"])), dur, n["vel"], seed=n["seed"]), n["t"], -9, pan=-0.05, stem="bass")
                self.note("bass", n["ch"], n["t"], dur, [n["m"]])
        self.walked = walk
        for ch in self.order[1:]:
            if self.on(ch):
                self.drums(ch)
                self.comping(ch)
        self.moments()

    def bed_music(self):
        """The Mixkit bed (tools/bed.py) under the selected chapters. It dips where the score breaks: nearly out from
        ch01's drop until ch02 (the bass note falls, the hole tears, the question lands alone); and from ch07's push
        until ch08 it thins to a dark, low trace under one bowed note on its bass."""
        bed = wavfile.read(BED)[1].astype(np.float64)
        t1 = max(self.chs[c]["end"] for c in self.sel)
        i0, i1 = int(round(self.t0 * SR)), int(round(t1 * SR))
        seg = np.zeros((i1 - i0, 2))
        seg[: max(0, min(len(bed), i1) - i0)] = bed[i0: min(len(bed), i1)]
        t = self.t0 + np.arange(len(seg)) / SR
        g = np.ones(len(seg))  # the bed's gain
        dark = np.zeros(len(seg))  # the low-passed trace's gain
        t5 = self.chs["ch05"]["start"]  # the intro's lift: its extra level ends in a 20 ms ramp onto this downbeat
        g *= 10 ** (BED_INTRO_DB * np.clip((t5 - t) / 0.02, 0, 1) / 20)
        t10 = self.chs["ch10"]["start"]
        g *= 10 ** (BED_RESOLVE_DB * np.clip((t - t10) / (8 * self.beat), 0, 1) / 20)

        def dip(a, b, depth_db, fade_in, fade_out):
            d = 10 ** (depth_db / 20)
            down = np.clip((t - a) / fade_in, 0, 1)  # into the dip
            up = np.clip((t - b) / fade_out, 0, 1)  # out of it, from the next section's first sample
            w = np.sin(0.5 * math.pi * down) ** 2 * (1 - np.sin(0.5 * math.pi * up) ** 2)
            return 1 - (1 - d) * w, w

        for q in self.cue("ch01", "drop"):
            gg, _ = dip(q["t"], self.chs["ch02"]["start"], -32, 0.15, 0.02)
            g *= gg
            self.note("bed", "ch01", q["t"], self.chs["ch02"]["start"] - q["t"], [], what="dips out")
        for q in self.cue("ch07", "push"):
            end = self.chs["ch08"]["start"]
            gg, w = dip(q["t"], end, -26, 0.35, 0.02)
            g *= gg
            dark += 10 ** (-9 / 20) * w
            if self.on("ch07"):
                _, root = self.bed_pcs(q["t"])
                m = min(m for m in range(28, 41) if m % 12 == root)
                self.add(arco(hz(name_of(m)), end - q["t"] + 0.02, 0.8, seed=7001), q["t"], -6, stem="bass")
                self.note("arco", "ch07", q["t"], end - q["t"], [m], what="low sustained note")
            self.note("bed", "ch07", q["t"], end - q["t"], [], what="thins")
        lp = band(seg, hi=320, order=4)
        self.add(seg * g[:, None] + lp * dark[:, None], self.t0, BED_GAIN, stem="bed")

    def bed_pcs(self, t, n=4):
        """What the bed is sounding at film time t (this beat and the next): its strongest pitch classes, strongest
        first (at least 45 % of the strongest), and its bass note's pitch class."""
        k = int(math.floor(t / self.beat + 1e-3))  # a hit on a beat line belongs to the beat it starts
        bs = self.bed_beats
        a, b = bs[min(k, len(bs) - 1)], bs[min(k + 1, len(bs) - 1)]
        c = 0.6 * np.array(a["chroma"]) + 0.4 * np.array(b["chroma"])
        lo = 0.6 * np.array(a["bass"]) + 0.4 * np.array(b["bass"])
        order = [int(i) for i in np.argsort(-c) if c[i] >= 0.45 * c.max()][:n]
        return order, int(np.argmax(lo))

    def ch01_music(self):
        """The approved sketch: walking bass from bar 1, brushes from bar 2 until the drop."""
        c = self.chs["ch01"]
        beat = self.beat
        bars = int(round((c["end"] - c["start"]) / (4 * beat)))
        for b in range(bars):
            name, notes = CHARTS["ch01"][b % len(CHARTS["ch01"])]
            for k, nm in enumerate(notes):
                if not nm:
                    continue
                at = c["start"] + (4 * b + k) * beat
                vel = 0.55 + 0.1 * min(b, 3) + (0.08 if k == 0 else 0)
                self.add(pluck_bass(hz(nm), beat * 1.02, vel, seed=b * 4 + k), at, -9, pan=-0.05, stem="bass")
                self.note("bass", "ch01", at, beat * 1.02, [nm])
        drop = (self.cue("ch01", "drop") or [{"t": c["end"]}])[0]["t"]
        s0 = c["start"] + 4 * beat
        if drop > s0:
            sw = brush_swish(drop - s0, beat, seed=1)
            sw *= np.clip((len(sw) - np.arange(len(sw))) / (0.25 * SR), 0, 1)  # eases out into the drop
            self.add(sw, s0, -30, pan=0.25, stem="drums")
            k = 0
            while s0 + k * beat < drop:
                at = s0 + k * beat
                if k % 2 == 1:
                    self.add(brush_slap(0.7, seed=k), at, -19, pan=0.2, stem="drums")
                if k % 4 == 2:  # a light swung tap on the "and" of 3
                    self.add(brush_slap(0.35, seed=100 + k), at + SWING * beat, -26, pan=0.3, stem="drums")
                k += 1

    def walk(self):
        """The walking bass for ch02-ch11: the chord's root on its first beat, chord and scale tones on the way, and
        the chord's last beat approaching the next root by a semitone or from its fifth. Seeded per chord."""
        beat = self.beat
        slots = [s for ch in self.order[1:] for s in self.slots(ch)]
        prev = midi("D2")
        out = []
        for i, s in enumerate(slots):
            ch, feel = s["ch"], FEEL[s["ch"]]
            rng = rng_for("walk", ch, i)
            nxt = slots[i + 1]["sym"] if i + 1 < len(slots) else s["sym"]
            r, q = chord(s["sym"])
            tn = tones(s["sym"])
            bad = set()
            ivs = QUAL[q]
            if 4 in ivs:
                bad.add((r + 3) % 12)
            if 3 in ivs:
                bad.add((r + 4) % 12)
            if 10 in ivs:
                bad.add((r + 11) % 12)
            if 11 in ivs:
                bad.add((r + 10) % 12)
            if 6 in ivs:
                bad.add((r + 7) % 12)
            allowed = (set(SCALE[KEY[ch]]) - bad) | tn
            root = min((m for m in range(LO, HI + 1) if m % 12 == r), key=lambda m: (abs(m - prev), m))
            nr = min((m for m in range(LO, HI + 1) if m % 12 == chord(nxt)[0]), key=lambda m: (abs(m - root), m))
            apps = [(nr - 1, 0.4), (nr + 1, 0.3), (nr + 7 if nr + 7 <= HI else nr - 5, 0.3)]
            apps = [(m, w) for m, w in apps if LO <= m <= HI and m != root]
            app = apps[int(rng.choice(len(apps), p=np.array([w for _, w in apps]) / sum(w for _, w in apps)))][0]
            nb = s["beats"]
            if feel == "resolving" and nb >= 2:
                # two-feel: the second half note is held, so it is the fifth, or a scale step into the next root
                fifth = min((m for m in range(LO, HI + 1) if m % 12 == (r + 7) % 12), key=lambda m: abs(m - root))
                steps = [m for m in (nr - 2, nr - 1, nr + 1, nr + 2) if LO <= m <= HI and m != root and m % 12 in allowed]
                second = steps[0] if steps and rng.random() < 0.5 else fifth
                line = [(0, root, 2)] + ([(2, second, 2)] if nb == 4 else [])
            else:
                pool = [m for m in range(max(LO, root - 9), min(HI, root + 12) + 1) if m % 12 in allowed]
                if nb == 1:
                    mids = []
                elif nb == 2:
                    mids = []
                else:
                    best = None
                    for x in pool:
                        for y in (pool if nb == 4 else [None]):
                            path = [root, x] + ([y] if y is not None else []) + [app]
                            cost = sum(abs(b - a) for a, b in zip(path, path[1:]))
                            cost += sum(7 for a, b in zip(path, path[1:]) if a == b)  # no repeated notes
                            cost += sum(2.5 for a, b in zip(path, path[2:]) if a == b)  # no back-and-forth
                            cost += sum(2 for a, b in zip(path, path[1:]) if abs(b - a) > 7)
                            cost += sum(0.6 for a, b, c in zip(path, path[1:], path[2:]) if (b - a) * (c - b) < 0)
                            cost += 0.8 * (x % 12 not in tn) + (1.5 * (y % 12 not in tn) if y is not None else 0)
                            cost += rng.random() * 1.5
                            if best is None or cost < best[0]:
                                best = (cost, [m for m in (x, y) if m is not None])
                    mids = best[1]
                ms = [root] + mids + ([app] if nb >= 2 else [])
                line = [(k, m, 1) for k, m in enumerate(ms)]
            for k, m, length in line:
                at = s["t"] + k * beat
                vel = {"sparse": 0.84, "open": 0.84, "driving": 0.9, "resolving": 0.8}[feel]
                vel += (0.06 if at == s["t"] and s["t"] == self.bar_at_least(s["t"] - 1e-6) else 0) + rng.uniform(-0.03, 0.03)
                gi = int(round(at / beat))
                if feel == "driving" and k == len(line) - 1 and nb >= 2 and rng.random() < 0.4:
                    # a skip: the last beat split into a swung pair, the second a ghost of the first
                    out.append({"ch": ch, "t": at, "m": m, "dur": SWING * beat, "vel": vel, "seed": 1000 + gi})
                    out.append({"ch": ch, "t": at + SWING * beat, "m": m, "dur": (1 - SWING) * beat * 1.02,
                                "vel": 0.55 * vel, "seed": 5000 + gi})
                else:
                    out.append({"ch": ch, "t": at, "m": m, "dur": length * beat * 1.02, "vel": vel, "seed": 1000 + gi})
            prev = line[-1][1]
        return out

    def next_bass(self, ch, t):
        """Onset of the first walking note after t that plays (for a held note to stop on)."""
        for n in self.walked:
            if n["t"] > t + 1e-6 and not self.resting(n["ch"], n["t"]):
                return n["t"]
        return self.tl["end"] + 3

    def drums(self, ch):
        """Brushes all through, in the chapter's feel: the swish, slaps on 2 and 4, swung taps; the driving half adds a
        feathered kick and a ride. They stop for the chapter's break (ch07's push, ch11's final chord)."""
        c = self.chs[ch]
        beat = self.beat
        kit = KIT[FEEL[ch]]
        stop = min([c["end"]] + [q["t"] for q in self.cue(ch, "push") + self.cue(ch, "chord")])
        n = int(round((stop - c["start"]) / beat + 1e-6)) if stop < c["end"] else int(round((c["end"] - c["start"]) / beat))
        sw = brush_swish(stop - c["start"], beat, seed=zlib.crc32(f"swish/{ch}".encode()))
        if stop < c["end"]:
            sw *= np.clip((len(sw) - np.arange(len(sw))) / (0.25 * SR), 0, 1)
        self.add(sw, c["start"], kit["swish"], pan=0.25, stem="drums")
        for k in range(n + 1):
            at = c["start"] + k * beat
            if at >= stop - 1e-6:
                break
            gb = int(round(at / beat))
            b = k % 4
            if b % 2 == 1:
                self.add(brush_slap(kit["slap"][0], seed=gb), at, kit["slap"][1], pan=0.2, stem="drums")
            for tb, v, g in kit["taps"]:
                if b == tb and at + SWING * beat < stop:
                    self.add(brush_slap(v, seed=20000 + gb), at + SWING * beat, g, pan=0.3, stem="drums")
            if "kick" in kit:
                v, g = kit["kick"]
                self.add(kick(v if b % 2 == 0 else 0.8 * v, seed=gb), at, g, stem="drums")
            if "ride" in kit:
                v, g = kit["ride"]
                self.add(ride(v * (1.15 if b % 2 else 1.0), seed=gb), at, g, pan=-0.3, stem="drums")
                if b % 2 == 1 and at + SWING * beat < stop:
                    self.add(ride(0.7 * v, seed=40000 + gb, dur=0.8), at + SWING * beat, g, pan=-0.3, stem="drums")
        if ch in ("ch05", "ch08"):  # a soft brush crash where the feel changes
            self.add(crash(2.4, 0.5, seed=zlib.crc32(f"crash/{ch}".encode())), c["start"], -21, pan=0.3, stem="drums")

    def comping(self, ch):
        """Vibraphone chords in the open and resolving feels, short piano chords in the driving one."""
        feel = FEEL[ch]
        if feel == "sparse":
            return
        beat = self.beat
        c = self.chs[ch]
        prev = None
        bars = {}
        for s in self.slots(ch):
            bars.setdefault(s["bar"], []).append(s)
        for b, ss in bars.items():
            if ch == "ch05" and b == 0:
                continue  # the warm chord holds the first bar
            rng = rng_for("comp", ch, b)
            bar_t = ss[0]["t"]
            if feel == "driving":
                pat = PIANO_PAT[int(rng.integers(len(PIANO_PAT)))]
            elif feel == "resolving":
                pat = ((0.0, 3.8),) if len(ss) == 1 else ((0.0, 1.8), (2.0, 1.8))
            else:
                pat = VIB_PAT[int(rng.integers(len(VIB_PAT)))] if len(ss) == 1 else ((0.0, 1.8), (1.6, 2.3))
                if b == 0 and pat[0][0] < 0:
                    pat = VIB_PAT[0]
            for on, hold in pat:
                at = bar_t + on * beat
                if at < c["start"] - 1e-6 or self.resting(ch, at) or self.resting(ch, at + 0.5 * beat):
                    continue
                sym, key = self.chord_at(at + 0.45 * beat)
                if feel == "driving":
                    v = voicing(sym, key, prev, lo=50, hi=72)
                    self.add(piano_comp([name_of(m) for m in v], hold * beat, 0.5, seed=zlib.crc32(f"pc/{ch}/{at:.3f}".encode())),
                             at, -25, stem="piano")
                    self.note("piano", ch, at, hold * beat, v, what="comp")
                else:
                    v = voicing(sym, key, prev)
                    vel = 0.5 if feel == "open" else 0.42
                    dur = hold * beat + 0.6
                    self.add(vibes([name_of(m) for m in v], dur, vel, seed=zlib.crc32(f"vb/{ch}/{at:.3f}".encode()),
                                   at=at, damp=hold * beat), at, -23 if feel == "open" else -24, stem="vibes")
                    self.note("vibes", ch, at, hold * beat, v, what="comp")
                prev = v

    def moments(self):
        """The music's own events: the warm chord where ch05 opens to major, the bow under ch07's push."""
        beat = self.beat
        if self.on("ch05"):
            at = self.chs["ch05"]["start"]
            v = ["F#3", "A3", "C#4", "E4"]
            bar = 4 * beat  # it holds the first bar; the pedal lifts as the comping takes over
            self.add(vibes(v, bar + 0.6, 0.7, seed=5001, at=at, damp=bar), at, -14, stem="vibes")
            self.note("vibes", "ch05", at, bar, v, what="warm chord")
        for q in self.cue("ch07", "push"):
            if self.on("ch07"):
                end = self.chs["ch07"]["end"]
                self.add(arco(hz("A1"), end - q["t"] + 0.02, 0.8, seed=7001), q["t"], -6, stem="bass")
                self.note("arco", "ch07", q["t"], end - q["t"], ["A1"], what="low sustained note")


def place(pcs, lo, hi):
    """Pitch classes as MIDI notes in [lo, hi]: each at its lowest place at or above lo (wrapping down an octave if it
    would pass hi), sorted, without doubles."""
    out = []
    for pc in pcs:
        m = lo + (pc - lo) % 12
        if m > hi:
            m -= 12
        out.append(m)
    return sorted(set(out))


SEED01 = {"complaint": [0], "bubble": None, "caption": None, "scissor": [3], "split": [5, 6, 7], "slide": [8, 9],
          "snip": [10, 11], "drop": [12], "tear": [13], "stab": [14, 99, 98, 15]}
PAN01 = {"complaint": -0.35, "caption": 0.25, "scissor": 0.1, "slide": -0.4, "snip": 0.15, "drop": 0.1, "tear": 0.05}


# ---------------------------------------------------------------------------------------------------- the effects
# The cue vocabulary of docs/ANIMATION_GUIDE.md, section 12. Handlers run name by name in this order (ch01's names
# first, in the approved sketch's order), each over its cues chapter by chapter; k is the cue's place in its
# chapter's run of that name.
def fx_complaint(f, q, k, run):
    f.add(pop(0.9, seed=f.seed(q, k)), q["t"], -11, pan=pan_of(q, "complaint"))


def fx_bubble(f, q, k, run):
    if "land" in q:  # the hook's bubble comes back and snaps flush: its tick, then a warm chord
        f.add(tick(1500, seed=f.seed(q, k)), q["t"], -17, pan=q.get("pan", -0.3))
        f.add(snap_fx(0.6, seed=f.seed(q, k, 1)), q["land"], -19, pan=q.get("pan", -0.3))
        if f.music_mode == "bed":
            pcs, _ = f.bed_pcs(q["land"])
            v = place(pcs, 55, 71)
        else:
            sym, key = f.chord_at(q["land"] + 0.01)
            v = voicing(sym, key, lo=52, hi=71)
        f.add(vibes([name_of(m) for m in v], 3.4, 0.7, seed=f.seed(q, k, 2), at=q["land"], damp=2.8), q["land"], -15, stem="vibes")
        f.note("vibes", q["ch"], q["land"], 2.8, v, what="warm chord")
        return
    plain = [x for x in run if "land" not in x]
    i = plain.index(q)
    last = i == len(plain) - 1
    up = 0 if q["ch"] == "ch01" else 4
    f.add(tick(1500 + 180 * ((i * 7) % 5), muffled=last, seed=f.seed(q, i)), q["t"], (-17 if not last else -19) + up,
          pan=0.4 if i % 2 else -0.3)


def fx_caption(f, q, k, run):
    f.add(stamp(0.9, seed=f.seed(q, k)), q["t"] - 0.005, -9, pan=pan_of(q, "caption"))


def fx_scissor(f, q, k, run):
    f.add(cut_rasp(0.42, 0.8, seed=f.seed(q, k)), q["t"], -13, pan=pan_of(q, "scissor"))


def fx_split(f, q, k, run):
    up = 0 if q["ch"] == "ch01" else 2
    f.add(swoosh(0.6, 1600, 450, 0.7, seed=f.seed(q, k, 0)), q["t"], -15 + up, pan=-0.6)
    f.add(swoosh(0.6, 1500, 420, 0.7, seed=f.seed(q, k, 1)), q["t"] + 0.07, -15 + up, pan=0.6)
    if q["ch"] == "ch01":  # the low piano cluster under the hook's cut
        f.add(piano(["C2", "C#2", "D2", "G2"], 2.4, 0.45, seed=f.seed(q, k, 2), spread=0.1), q["t"], -16, stem="piano")
        f.note("piano", "ch01", q["t"], 2.4, ["C2", "C#2", "D2", "G2"], what="cluster")


def fx_slide(f, q, k, run):
    dur = q.get("land", q["t"] + 0.4) - q["t"] + 0.08
    st = 2 ** (SLIDE_STEP.get(q["ch"], 0) * q.get("i", 0) / 12)
    up = 0 if q["ch"] == "ch01" else 1.5
    f.add(swoosh(dur, 700 * st, 1700 * st, 0.6, seed=f.seed(q, k, 0)), q["t"], -17 + up, pan=pan_of(q, "slide"))
    f.add(stamp(0.35, seed=f.seed(q, k, 1)), q.get("land", q["t"]), -21 + up, pan=q.get("pan", 0.0) * 0.5)


def fx_snip(f, q, k, run):
    if q.get("n", 2) == 1:  # one snip, in a run: kept down, as texture
        f.add(snip(0.7, seed=f.seed(q, k)), q["t"], (-14 - 2 * (k % 2)) if len(run) > 1 else -10, pan=q.get("pan", 0.15))
        return
    f.add(snip(0.8, seed=f.seed(q, k, 0)), q["t"], -12, pan=pan_of(q, "snip"))
    f.add(snip(0.75, seed=f.seed(q, k, 1)), q["t"] + 0.11, -13, pan=q.get("pan", 0.2))


def fx_drop(f, q, k, run):
    f.add(swoosh(0.55, 1300, 280, 0.6, seed=f.seed(q, k)), q["t"], -18, pan=pan_of(q, "drop"))
    stab_t = next((s["t"] for s in f.cue(q["ch"], "stab") if s["t"] > q["t"]), None)
    ring = (stab_t if stab_t else q["t"] + 1.4) - q["t"] + 0.25  # it rings on under the tear, no gap
    f.add(pluck_bass(hz("A1"), ring, 0.85, fall=(0.08, 7, 0.7)), q["t"] - 0.08, -9, stem="bass")  # one bass note falls
    f.note("bass", q["ch"], q["t"] - 0.08, ring, ["A1"], what="falls a fifth")


def fx_tear(f, q, k, run):
    if "land" in q:
        end = q["land"]
    else:
        stab_t = next((s["t"] for s in f.cue(q["ch"], "stab") if 0 < s["t"] - q["t"] <= 1.5), None)
        end = stab_t if stab_t else q["t"] + 0.65
    f.add(tear(end - q["t"], 0.85, seed=f.seed(q, k)), q["t"], -12 if q["ch"] == "ch01" else -10, pan=pan_of(q, "tear"))


def fx_stab(f, q, k, run):
    ch = q["ch"]
    at = q["t"]
    if f.music_mode == "bed" and ch != "ch01":  # over the Mixkit bed: the stab plays what the bed is sounding
        pcs, root = f.bed_pcs(at)
        low = min(m for m in range(43, 55) if m % 12 == root)
        v = [low] + [m for m in place([p for p in pcs if p != root] or pcs, 55, 67) if m != low]
        if q.get("soft"):
            f.add(piano([name_of(m) for m in v], 2.4, 0.6, seed=f.seed(q, k)), at, -12, stem="piano")
            f.note("piano", ch, at, 2.4, v, what="soft stab")
            return
        b1 = min(m for m in range(36, 48) if m % 12 == root)
        f.add(piano([name_of(m) for m in v], 2.6, 0.95, seed=f.seed(q, k, 0)), at, -5, stem="piano")
        f.add(pluck_bass(hz(name_of(b1)), 2.0, 1.0, seed=f.seed(q, k, 1)), at, -7, stem="bass")
        f.add(pluck_bass(hz(name_of(b1 - 12)), 2.0, 0.9, seed=f.seed(q, k, 2)), at, -9, stem="bass")
        f.add(crash(2.6, 0.8, seed=f.seed(q, k, 3)), at, -15, pan=0.3, stem="drums")
        f.note("piano", ch, at, 2.6, v, what="stab")
        f.note("bass", ch, at, 2.0, [b1, b1 - 12], what="stab")
        return
    if q.get("soft"):  # a small stab: the piano alone, on the chord of the moment with its root
        sym, key = f.chord_at(at + 0.01)
        r = chord(sym)[0]
        root = min((m for m in range(34, 47) if m % 12 == r))
        v = [root] + voicing(sym, key, lo=53, hi=67)
        f.add(piano([name_of(m) for m in v], 2.4, 0.6, seed=f.seed(q, k)), at, -12, stem="piano")
        f.note("piano", ch, at, 2.4, v, what="soft stab")
        return
    notes, b1, b2 = STABS[ch]
    ring = 2.4 if ch == "ch01" else min(2.4, f.next_bass(ch, at) - at + 0.02)
    f.add(piano(notes, 2.6, 0.95, seed=f.seed(q, k, 0)), at, -5, stem="piano")
    f.add(pluck_bass(hz(b1), ring, 1.0, seed=f.seed(q, k, 1)), at, -7, stem="bass")
    f.add(pluck_bass(hz(b2), ring, 0.9, seed=f.seed(q, k, 2)), at, -9, stem="bass")
    f.add(crash(2.6, 0.8, seed=f.seed(q, k, 3)), at, -15, pan=0.3, stem="drums")
    f.note("piano", ch, at, 2.6, notes, what="stab")
    f.note("bass", ch, at, ring, [b1, b2], what="stab")


def fx_alarm(f, q, k, run):
    ch = q["ch"]
    h1, h2 = q["t"], f.alarm_second(q["t"])
    for j, (at, notes) in enumerate(zip((h1, h2), ALARM)):
        dur = (h2 - h1) if j == 0 else (1.0 if f.music_mode == "bed" else min(1.2, f.next_bass(ch, h2) - h2 + 0.02))
        f.add(brass(notes, min(0.55, dur + 0.1) if j == 0 else 0.7, 0.95, seed=f.seed(q, k, 2 * j)), at, -7, pan=0.05, stem="brass")
        f.add(snare(0.9 if j == 0 else 0.8, seed=f.seed(q, k, 2 * j + 1)), at, -12, pan=0.1, stem="drums")
        f.add(pluck_bass(hz(notes[0]), dur, 0.95, seed=f.seed(q, k, 10 + j)), at, -8, stem="bass")
        f.note("brass", ch, at, dur, notes, what="alarm")


def fx_chord(f, q, k, run):
    if f.music_mode == "bed":
        return  # the bed's own final chord ends the film, on its last bar (tools/bed.py)
    at = q["t"]
    dur = f.tl["end"] - at + 0.05
    f.add(piano(FINAL["piano"], dur, 0.75, seed=f.seed(q, k, 0)), at, -9, stem="piano")
    f.add(vibes(FINAL["vibes"], dur, 0.65, seed=f.seed(q, k, 1), at=at, depth=0.25), at, -13, stem="vibes")
    f.add(pluck_bass(hz(FINAL["bass"][0]), dur, 0.9, seed=f.seed(q, k, 2)), at, -8, stem="bass")
    f.add(pluck_bass(hz(FINAL["bass"][1]), dur, 0.8, seed=f.seed(q, k, 3)), at, -10, stem="bass")
    f.add(crash(3.6, 0.45, seed=f.seed(q, k, 4)), at, -21, pan=0.3, stem="drums")
    f.note("piano", q["ch"], at, dur, FINAL["piano"], what="final chord")
    f.note("vibes", q["ch"], at, dur, FINAL["vibes"], what="final chord")
    f.note("bass", q["ch"], at, dur, list(FINAL["bass"]), what="final chord")


def fx_push(f, q, k, run):
    pass  # the music thins to the bow's low note (Film.moments; over the bed, Film.bed_music)


def fx_slam(f, q, k, run):
    f.add(stamp(0.9, seed=f.seed(q, k)), q["t"] - 0.005, -10, pan=q.get("pan", 0.0))


def fx_stamp(f, q, k, run):
    f.add(stamp_deep(0.9, seed=f.seed(q, k)), q.get("land", q["t"]) - 0.005, -9, pan=q.get("pan", 0.0))


def fx_rise(f, q, k, run):
    dur = q.get("land", q["t"] + 0.35) - q["t"] + 0.05
    f.add(swoosh(dur, 650, 2100, 0.5, seed=f.seed(q, k)), q["t"], -15, pan=q.get("pan", 0.0))


def fx_bar(f, q, k, run):
    dur = q.get("land", q["t"] + 0.3) - q["t"] + 0.05
    f.add(swoosh(dur, 900, 2600, 0.6, seed=f.seed(q, k, 0)), q["t"], -14, pan=q.get("pan", 0.0))
    f.add(thud_fx(0.6, seed=f.seed(q, k, 1)), q.get("land", q["t"] + 0.3), -16, pan=q.get("pan", 0.0))


def fx_wipe(f, q, k, run):
    dur = max(0.35, q.get("land", q["t"] + 0.6) - q["t"] + 0.1)
    f.add(swoosh(dur, 450, 1500, 0.7, seed=f.seed(q, k)), q["t"], -13, pan=q.get("pan", 0.0))


def fx_pan(f, q, k, run):
    dur = max(0.3, q.get("land", q["t"] + 0.6) - q["t"] + 0.1)
    f.add(swoosh(dur, 350, 900, 0.6, seed=f.seed(q, k)), q["t"], -18, pan=q.get("pan", -0.2))


def fx_doors(f, q, k, run):
    f.add(swoosh(0.7, 1100, 380, 0.7, seed=f.seed(q, k, 0)), q["t"], -12, pan=-0.6)
    f.add(swoosh(0.7, 1000, 350, 0.7, seed=f.seed(q, k, 1)), q["t"] + 0.05, -12, pan=0.6)


def fx_lift(f, q, k, run):
    f.add(swoosh(0.28, 500, 1800, 0.6, seed=f.seed(q, k, 0)), q["t"], -15, pan=q.get("pan", 0.0))
    f.add(snap_fx(0.5, seed=f.seed(q, k, 1)), q["t"] + 0.26, -17, pan=q.get("pan", 0.0))


def fx_scroll(f, q, k, run):
    f.add(swoosh(0.4, 1400, 800, 0.5, seed=f.seed(q, k)), q["t"], -19, pan=q.get("pan", 0.0))


def fx_flip(f, q, k, run):
    f.add(flip_fx(0.7, seed=f.seed(q, k)), q["t"], -15, pan=q.get("pan", 0.0))


def fx_chime(f, q, k, run):
    # synth: an open fifth on A, a chord tone or a tension over every chord under ch04's flips; bed: two of its notes
    notes = ["A4", "E5"]
    if f.music_mode == "bed":
        pcs, _ = f.bed_pcs(q["t"])
        notes = [name_of(m) for m in place(pcs[:2], 67, 79)]
    f.add(vibes(notes, 2.2, 0.6, seed=f.seed(q, k), at=q["t"], depth=0.15), q["t"], -12, pan=q.get("pan", 0.0), stem="vibes")
    f.note("vibes", q["ch"], q["t"], 2.2, notes, what="chime")


def fx_cell(f, q, k, run):
    f.add(cell_fx(0.4, seed=f.seed(q, k)), q["t"], -20 - 3 * ((k * 5) % 3) / 2, pan=q.get("pan", 0.0))


def fx_sweep(f, q, k, run):
    dur = max(0.2, q.get("land", q["t"] + 0.6) - q["t"])
    f.add(sweep_fx(dur, 0.5, seed=f.seed(q, k)), q["t"], -19, pan=q.get("pan", 0.0))


def fx_count(f, q, k, run):
    land = q.get("land", q["t"] + 0.6)
    if land - q["t"] > 0.08:
        f.add(rattle(land - q["t"], 0.5, seed=f.seed(q, k, 0)), q["t"], -22, pan=q.get("pan", 0.0))
    f.add(lock_fx(0.7, seed=f.seed(q, k, 1)), land, -14, pan=q.get("pan", 0.0))


def fx_tick(f, q, k, run):
    f.add(tick(2600, seed=f.seed(q, k)), q.get("land", q["t"]), -15, pan=q.get("pan", 0.0))


def fx_climb(f, q, k, run):
    steps = ["D6", "F#6", "A6", "D7"]
    note = steps[min(q.get("i", k), len(steps) - 1)]
    if f.music_mode == "bed":  # each step a note the bed is sounding on its beat, above the step before it
        prev = 85
        for x in run[: run.index(q) + 1]:
            pcs, _ = f.bed_pcs(x["t"])
            cand = [m + 12 * o for m in place(pcs[:3], 86, 97) for o in (0, 1)]
            prev = min((m for m in cand if m > prev), default=prev + 12)
        note = name_of(prev)
    f.add(tick(hz(note), seed=f.seed(q, k)), q["t"], -13, pan=q.get("pan", 0.0))
    f.note("tick", q["ch"], q["t"], 0.1, [note], what="climb")


def fx_pin(f, q, k, run):
    f.add(pin_fx(0.7, seed=f.seed(q, k)), q.get("land", q["t"]), -11, pan=q.get("pan", 0.0))


def fx_snap(f, q, k, run):
    f.add(snap_fx(0.7, seed=f.seed(q, k)), q.get("land", q["t"]), -9, pan=q.get("pan", 0.0))


def fx_click(f, q, k, run):
    f.add(click_fx(0.6, seed=f.seed(q, k)), q.get("land", q["t"]), -11, pan=q.get("pan", 0.0))


def fx_bell(f, q, k, run):
    note = "D6"
    if f.music_mode == "bed":
        pcs, _ = f.bed_pcs(q["t"])
        note = name_of(place(pcs[:1], 84, 95)[0])
    f.add(bell_fx(note, 0.6, seed=f.seed(q, k)), q["t"], -17, pan=q.get("pan", 0.0))
    f.note("bell", q["ch"], q["t"], 1.8, [note], what="bell")


def fx_open(f, q, k, run):
    f.add(creak_fx(0.45, 0.6, seed=f.seed(q, k)), q["t"], -13, pan=q.get("pan", 0.0))


def fx_band(f, q, k, run):
    dur = max(0.2, q.get("land", q["t"] + 0.8) - q["t"])
    a, b = "D4", "A4"
    if f.music_mode == "bed":  # from the bed's lowest sounding note to its highest, in one octave
        pcs, _ = f.bed_pcs(q.get("land", q["t"]))
        ms = place(pcs, 62, 73)
        a, b = name_of(ms[0]), name_of(ms[-1] if ms[-1] > ms[0] else ms[0] + 7)
    f.add(rising_tone(dur, hz(a), hz(b), 0.5), q["t"], -24, pan=q.get("pan", 0.0))
    f.note("tone", q["ch"], q["t"], dur, [a, b], what="rising tone")


def fx_friction(f, q, k, run):
    land = q.get("land", q["t"] + 0.6)
    f.add(friction_fx(land - q["t"], 0.6, seed=f.seed(q, k, 0)), q["t"], -12, pan=q.get("pan", 0.0))
    f.add(thud_fx(0.8, seed=f.seed(q, k, 1)), land, -12, pan=q.get("pan", 0.0))


def fx_thud(f, q, k, run):
    f.add(thud_fx(0.8, seed=f.seed(q, k)), q.get("land", q["t"]), -13, pan=q.get("pan", 0.0))


def fx_slab(f, q, k, run):
    notes = SLABS.get(q["ch"], ["D2"])
    if f.music_mode == "bed":  # the bed's notes, rising across the run (ch02's skyline: over two octaves)
        pcs, root = f.bed_pcs(run[len(run) // 2]["t"])
        scale = sorted(set(pcs[:4] + [root]))
        span = 3 if len(run) > 8 else 1
        base = {"ch02": 50, "ch09": 50}.get(q["ch"], 41)  # ch02's skyline above the bed's bass (it re-enters there)
        notes = [name_of(m) for m in sorted(set(base + (pc - base) % 12 + 12 * o for o in range(span) for pc in scale))]
    i = q.get("i", k)
    n = len(run)
    name = notes[min(len(notes) - 1, i * len(notes) // max(n, len(notes)))] if n > len(notes) else notes[i % len(notes)]
    f.add(slab_fx(name, 0.7, seed=f.seed(q, k)), q.get("land", q["t"]), -13 - (8 if n > 8 else 0), pan=q.get("pan", 0.0))


def fx_punch(f, q, k, run):
    f.add(punch_fx(0.8, seed=f.seed(q, k)), q["t"], -9, pan=q.get("pan", 0.0))


def fx_flutter(f, q, k, run):
    f.add(flutter_fx(1.1, 0.6, seed=f.seed(q, k), strips=1 if q.get("i") is not None else 5), q["t"], -11, pan=q.get("pan", 0.0))


def fx_sly(f, q, k, run):
    land = q.get("land", q["t"] + 0.5)
    f.add(swoosh(land - q["t"] + 0.05, 900, 500, 0.6, seed=f.seed(q, k, 0)), q["t"], -15, pan=q.get("pan", -0.2))
    f.add(scratch_fx(0.22, 0.6, seed=f.seed(q, k, 1)), land, -15, pan=q.get("pan", -0.2))


def fx_cut(f, q, k, run):
    f.add(paper_tick(0.5, seed=f.seed(q, k)), q["t"], -19, pan=q.get("pan", 0.0))


def pan_of(q, name):
    return q.get("pan", PAN01.get(name, 0.0) if q["ch"] == "ch01" else 0.0)


EFFECTS = {
    # ch01's names first, in the approved sketch's order
    "complaint": fx_complaint, "bubble": fx_bubble, "caption": fx_caption, "scissor": fx_scissor, "split": fx_split,
    "slide": fx_slide, "snip": fx_snip, "drop": fx_drop, "tear": fx_tear, "stab": fx_stab,
    # the rest of the vocabulary
    "alarm": fx_alarm, "chord": fx_chord, "push": fx_push, "slam": fx_slam, "stamp": fx_stamp, "rise": fx_rise,
    "bar": fx_bar, "wipe": fx_wipe, "pan": fx_pan, "doors": fx_doors, "lift": fx_lift, "scroll": fx_scroll,
    "flip": fx_flip, "chime": fx_chime, "cell": fx_cell, "sweep": fx_sweep, "count": fx_count, "tick": fx_tick,
    "climb": fx_climb, "pin": fx_pin, "snap": fx_snap, "click": fx_click, "bell": fx_bell, "open": fx_open,
    "band": fx_band, "friction": fx_friction, "thud": fx_thud, "slab": fx_slab, "punch": fx_punch,
    "flutter": fx_flutter, "sly": fx_sly, "cut": fx_cut,
}


def effects(f):
    for name, h in EFFECTS.items():
        for ch in f.sel:
            run = f.cue(ch, name)
            for k, q in enumerate(run):
                h(f, q, k, run)
                f.log.append({"fx": name, "ch": ch, "t": round(q["t"], 4), **({"land": round(q["land"], 4)} if "land" in q else {})})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chapters", default=None, help="comma-separated chapter ids (default: the whole film)")
    ap.add_argument("--cues", default="out/sound/cues.json")
    ap.add_argument("--out", default="out/sound/film.wav")
    ap.add_argument("--stems", action="store_true", help="print each stem's level before mastering")
    ap.add_argument("--score", default=None, help="write every note and effect placed (JSON), for the analysis")
    ap.add_argument("--stem-dir", default=None, help="also write each stem (at its level in the master) to this directory")
    ap.add_argument("--no-aac-check", action="store_true", help="skip the AAC encode check (the approved sketch had none)")
    ap.add_argument("--music", choices=["bed", "synth"], default="bed", help="the Mixkit bed (tools/bed.py) or the synthesized score")
    a = ap.parse_args()
    tl = json.loads((ROOT / "docs" / "timeline.json").read_text())
    cues = json.loads((ROOT / a.cues).read_text())["cues"]
    unknown = sorted({q["name"] for q in cues} - set(EFFECTS))
    if unknown:
        raise SystemExit(f"cue names outside the vocabulary (docs/ANIMATION_GUIDE.md, section 12): {', '.join(unknown)}")
    chapters = a.chapters.split(",") if a.chapters else [c["id"] for c in tl["chapters"]]
    chs = {c["id"]: c for c in tl["chapters"]}
    t0 = min(chs[c]["start"] for c in chapters)
    t1 = max(chs[c]["end"] for c in chapters)
    bus = Bus(t1 - t0)
    film = Film(tl, cues, chapters, bus, music=a.music)
    film.music()
    effects(film)
    x = bus.mix()[: int(round((t1 - t0) * SR))]
    if a.stems:
        for k, st in bus.stems.items():
            y = st[: len(x)] * 10 ** (STEMS[k] / 20)
            pk = 20 * np.log10(np.max(np.abs(y)) + 1e-12)
            rms = 20 * np.log10(np.sqrt(np.mean(y[np.max(np.abs(y), axis=1) > 1e-4] ** 2)) + 1e-12) if np.any(np.abs(y) > 1e-4) else -120
            print(f"  stem {k:6s} peak {pk:6.1f} dBFS, active rms {rms:6.1f} dBFS (before mastering)")
    x[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]  # no click at the cut-off
    if a.stem_dir:  # each stem at the level it has in the master (the master's gain, before the limiter)
        g0 = 10 ** ((TARGET_LUFS - lufs(x)) / 20)
        d = ROOT / a.stem_dir
        d.mkdir(parents=True, exist_ok=True)
        for k, st in bus.stems.items():
            wavfile.write(d / f"{k}.wav", SR, (st[: len(x)] * 10 ** (STEMS[k] / 20) * g0).astype(np.float32))
    x = master(x)
    aac = ""
    if not a.no_aac_check:
        x, tp_aac = aac_safe(x)
        aac = f"; as AAC 320k {tp_aac:.2f} dBTP"
    out = ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, x.astype(np.float32))
    print(f"{out.relative_to(ROOT)}: {len(x) / SR:.3f} s, {lufs(x):.2f} LUFS, true peak {true_peak_db(x):.2f} dBTP{aac}")
    if a.score:
        p = ROOT / a.score
        rec = {"t0": t0, "t1": t1, "music": a.music, "events": film.log}
        rec.update({"bed": json.loads(BED.with_suffix(".json").read_text())} if a.music == "bed" else {"chords": {c: CHORDS[c] for c in chapters}})
        p.write_text(json.dumps(rec, indent=0))
        print(f"{p.relative_to(ROOT)}: {len(film.log)} notes and effects")


if __name__ == "__main__":
    main()
