"""Level measurements shared by the mix (tools/sound.py) and its checks (tools/soundcheck.py, tools/sfxcheck.py).

"Poking out" is one definition everywhere. An effect's level in a 100 ms window (its loudest window) is compared with
the music's level around it (the mean power over a second and a half on each side), in dB, in two ways:
- **loudness:** the whole signal, K-weighted (BS.1770), channels summed;
- **mids:** the 250 Hz - 4 kHz band (the eleven 1/3-octave bands from 250 Hz to 4 kHz), channels summed.
An effect pokes out by the larger of the two. The film's rule for paper and UI sounds is at most +3 dB.
The 1/3-octave bands from 125 Hz to 12.7 kHz are measured too: a guard keeps any single band from 500 Hz up from
standing more than 14 dB over the music (the bed is 30 dB down at 8 kHz, so crisp noise would splash there).

Everything here is a pure function of its arrays. Levels are in dB re full scale (mean square).
"""
import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
CENTRES = np.array([1000.0 * 2 ** (k / 3) for k in range(-9, 12)])  # 125 Hz ... 12.7 kHz, 21 bands
MIDS = [i for i, f in enumerate(CENTRES) if 245 <= f <= 4100]  # 250 Hz ... 4 kHz
WIN = 0.1  # s: the level window
HALF = 1.5  # s: the music's level is its mean power over this far each side
FLOOR = -120.0  # dB: silence


def _sos(fc):
    lo, hi = fc / 2 ** (1 / 6), min(fc * 2 ** (1 / 6), 0.98 * SR / 2)
    return butter(4, [lo, hi], btype="bandpass", fs=SR, output="sos")


_SOS = [_sos(f) for f in CENTRES]


def db(p):
    return 10 * np.log10(np.maximum(p, 1e-12))


def _window(y, hop, win):
    """Mean of y (n, ch) over windows of `win` s every `hop` s: (frames, ch)."""
    n, nch = y.shape
    w, h = int(round(win * SR)), int(round(hop * SR))
    frames = max(0, (n - w) // h + 1)
    c = np.concatenate([np.zeros((1, nch)), np.cumsum(y, axis=0)])
    idx = np.arange(frames) * h
    return (c[idx + w] - c[idx]) / w


def k_weight(x):
    """BS.1770 K-weighting (48 kHz) of x: (n,) or (n, ch)."""
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def levels(x, hop=0.025, win=WIN):
    """The signal's power per 100 ms window (frame j covers [j*hop, j*hop+win)): a dict of
    'loud' (frames,): K-weighted, channels summed; 'mids' (frames,): 250 Hz - 4 kHz, channels summed;
    'bands' (bands, frames): each 1/3-octave band, channels summed. Linear power."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    loud = _window(k_weight(x) ** 2, hop, win).sum(axis=1)
    bands = np.stack([_window(sosfilt(s, x, axis=0) ** 2, hop, win).sum(axis=1) for s in _SOS])
    return {"loud": loud, "mids": bands[MIDS].sum(axis=0), "bands": bands}


def smooth(p, hop=0.025, half=HALF):
    """The music's level around each frame: the mean of p over +-`half` s (last axis). Works on 1-D and 2-D arrays."""
    k = int(round(2 * half / hop)) | 1
    p = np.atleast_2d(p)
    c = np.concatenate([np.zeros((p.shape[0], 1)), np.cumsum(p, axis=1)], axis=1)
    n = p.shape[1]
    j = np.arange(n)
    a, z = np.clip(j - k // 2, 0, n), np.clip(j + k // 2 + 1, 0, n)
    return (c[:, z] - c[:, a]) / np.maximum(z - a, 1)[None, :]


def reference(x, hop=0.025, half=HALF):
    """The music's smoothed levels, in the shape levels() returns."""
    lv = levels(x, hop)
    return {k: (smooth(v, hop, half)[0] if k != "bands" else smooth(v, hop, half)) for k, v in lv.items()}


def poke(ev, ref, frame0, span=45.0, guard_from=500.0):
    """How far an event pokes out of the music. `ev`: levels() of the event's signal (its first frame is reference
    frame `frame0`); `ref`: reference() of the music. Returns a dict:
    - 'loud' and 'mids': dB over the music, the event's loudest window against the music around it (the film's rule:
      the larger of the two, 'poke', is at most +3 dB for paper and UI sounds);
    - 'guard': the largest excess in any single 1/3-octave band from `guard_from` Hz up, over the bands the event
      sounds in (within `span` dB of its loudest band): it keeps a crisp sound from splashing into a band where
      the music is thin (the bed is 30 dB down at 8 kHz);
    - 'bands': the excess in every band (NaN where the event is more than `span` dB under its own loudest band)."""
    nf = len(ev["loud"])
    j = np.clip(np.arange(nf) + frame0, 0, len(ref["loud"]) - 1)
    out = {}
    for k in ("loud", "mids"):
        out[k] = float(db(ev[k].max()) - db(ref[k][j].mean()))
    e = db(ev["bands"].max(axis=1))
    m = db(ref["bands"][:, j].mean(axis=1))
    out["bands"] = np.where(e >= e.max() - span, e - m, np.nan)
    hi = CENTRES >= guard_from
    g = out["bands"][hi]
    out["guard"] = float(np.nanmax(g)) if not np.all(np.isnan(g)) else FLOOR
    out["poke"] = max(out["loud"], out["mids"])
    return out


def tonality(x, fs=SR):
    """How pitched a sound is: the share of its energy in narrow spectral peaks that stand out. The short-time
    spectrum (43 ms frames) is compared with its own median over 1/3 octave; a bin more than 12 dB over that is
    'tonal', and the result is the tonal share of the energy, weighted over the frames within 30 dB of the loudest.
    0 = noise, 1 = a pure tone."""
    from scipy.signal import stft
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 2:
        x = x.mean(axis=1)
    if len(x) < 2048:
        x = np.pad(x, (0, 2048 - len(x)))
    f, t, Z = stft(x, fs=fs, nperseg=2048, noverlap=1536, boundary=None, padded=False)
    P = np.abs(Z) ** 2 + 1e-18
    keep = (f >= 100) & (f <= 12000)
    f, P = f[keep], P[keep]
    sm = np.empty_like(P)
    df = f[1] - f[0]
    for i, fc in enumerate(f):
        w = max(2, int(round(fc * (2 ** (1 / 6) - 2 ** (-1 / 6)) / df / 2)))
        sm[i] = np.median(P[max(0, i - w): i + w + 1], axis=0)
    tonal = np.where(P > sm * 10 ** (12 / 10), P - sm, 0.0)
    tot = P.sum(axis=0)
    keepf = tot >= tot.max() * 1e-3
    return float(np.sum((tonal.sum(axis=0) / tot)[keepf] * tot[keepf]) / np.sum(tot[keepf]))


def event_frames(at, dur, n_frames, hop=0.025, pre=0.03):
    """The frames an event at `at` s lasting `dur` s covers in a stem's levels(): from `pre` s before it to its end."""
    f0 = max(0, int(round((at - pre) / hop)))
    f1 = min(n_frames, int(round((at + dur) / hop)) + 1)
    return f0, f1


def fine_structure(x, lo=150.0, hi=5000.0):
    """The music's spectral fine structure, for placing effects in its gaps: the long-term spectrum of `x` in 1/6-octave
    bands from `lo` to `hi` Hz, each minus the mean of the bands within half an octave of it. Returns (centres in Hz,
    deviation in dB): negative where the music is thin (a gap), positive where it is dense."""
    from scipy.signal import welch
    x = np.asarray(x, dtype=np.float64)
    m = x.mean(axis=1) if x.ndim == 2 else x
    f, P = welch(m, fs=SR, nperseg=1 << 15, noverlap=1 << 14, window="hann")
    fc = np.array([lo * 2 ** (k / 6) for k in range(int(np.floor(6 * np.log2(hi / lo))) + 1)])
    lvl = np.array([db(P[(f >= c / 2 ** (1 / 12)) & (f < c * 2 ** (1 / 12))].mean()) for c in fc])
    dev = np.array([lvl[i] - lvl[max(0, i - 3): i + 4].mean() for i in range(len(fc))])
    return fc, dev
