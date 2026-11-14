#!/usr/bin/env python3
"""Generates an original music bed that follows a concept site's scroll.

  python score.py out.wav cues.json

cues.json: {"dur": 15, "bpm": 96, "mood": "warm" | "dark",
            "scrolls": [[t0, t1], ...], "clicks": [t, ...]}

Bar 1 is an intro (pad + keys). Drums drop on the first scroll. Every scroll
gets a whoosh that follows the scroll speed and a rising keys arpeggio, every
pause gets a held chord, and clicks get a soft tick and a two-note chime.
Everything is synthesised here, so the track is royalty free. Needs numpy.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(11)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


CHORDS = {
    # one chord per bar, MIDI notes (root first)
    "warm": [[53, 57, 60, 64, 67], [57, 60, 64, 67, 71], [50, 57, 60, 64, 65], [46, 53, 57, 62, 65]],  # Fmaj9 Am7 Dm9 Bbmaj7
    "dark": [[45, 52, 55, 60, 64], [41, 48, 52, 55, 60], [50, 53, 57, 60, 64], [40, 47, 52, 55, 59]],  # Am9 Fmaj7 Dm7 Em7
}


def ease_v(x):
    """Speed of the cubic ease-in-out the sites use, normalised to peak 1."""
    x = np.clip(x, 0, 1)
    return np.where(x < 0.5, 12 * x * x, 12 * (1 - x) ** 2) / 3


def lowpass(x, cut):
    """One-pole lowpass with a per-sample (or constant) cutoff in Hz."""
    cut = np.broadcast_to(cut, x.shape)
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def reverb(x, secs=2.2, decay=0.55):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / decay)
    ir = lowpass(ir, 5000.0)
    ir /= np.sqrt((ir ** 2).sum())
    L = len(x) + n
    f = 1 << (L - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, f) * np.fft.rfft(ir, f), f)[: len(x)]


def main():
    out, cues = sys.argv[1], json.load(open(sys.argv[2]))
    D, bpm, mood = cues["dur"], cues.get("bpm", 96), cues.get("mood", "warm")
    scrolls, clicks = cues.get("scrolls", []), cues.get("clicks", [])
    beat = 60 / bpm
    bar = beat * 4
    N = int(D * SR)
    t = np.arange(N) / SR
    chords = CHORDS[mood]
    drop = scrolls[0][0] if scrolls else bar
    last = scrolls[-1][1] if scrolls else D - bar
    drums_end = min(D - bar * 0.5, last + bar)

    L = np.zeros(N); R = np.zeros(N)
    keys = np.zeros(N); verb_send = np.zeros(N)

    def add(buf, start, sig):
        i = int(start * SR)
        if i >= N or i + len(sig) <= 0:
            return
        j = min(N, i + len(sig))
        buf[max(0, i):j] += sig[max(0, -i): j - i]

    # Pad: soft detuned saws per bar, crossfaded, with kick sidechain later.
    pad_l = np.zeros(N); pad_r = np.zeros(N)
    nbars = int(np.ceil(D / bar)) + 1
    for b in range(nbars):
        ch = chords[b % 4]
        s0, s1 = b * bar - 0.4, (b + 1) * bar + 0.6
        idx = (t >= s0) & (t < s1)
        tt = t[idx] - s0
        env = np.minimum(1, tt / 0.6) * np.minimum(1, (s1 - s0 - tt) / 0.6)
        for n in ch[1:]:
            for det, buf in ((0.997, pad_l), (1.003, pad_r)):
                f = midi(n) * det
                sig = sum(np.sin(2 * np.pi * f * h * tt + h) / h for h in range(1, 6))
                buf[idx] += 0.018 * env * sig
    pad_l = lowpass(pad_l, 1400.0); pad_r = lowpass(pad_r, 1400.0)

    # Keys: a soft electric-piano tone.
    def ep(f, dur=1.6, vel=1.0):
        n = int(dur * SR)
        tt = np.arange(n) / SR
        mod = 1.6 * np.exp(-tt / 0.18) * np.sin(2 * np.pi * f * tt)
        sig = np.sin(2 * np.pi * f * tt + mod) + 0.25 * np.sin(4 * np.pi * f * tt)
        return vel * 0.09 * sig * np.exp(-tt / 0.55) * np.minimum(1, tt / 0.004)

    def in_scroll(x):
        return any(a - 1e-3 <= x < b - 1e-3 for a, b in scrolls)

    for b in range(nbars):
        s = b * bar
        if s >= D - 0.5:
            break
        ch = chords[b % 4]
        if in_scroll(s):
            # Rising 8th-note arpeggio across the scroll, two octaves up.
            notes = ch[1:] + [n + 12 for n in ch[1:]]
            for k in range(8):
                add(keys, s + k * beat / 2 + (0.02 if k % 2 else 0), ep(midi(notes[min(k, len(notes) - 1)]), 1.2, 0.55 + k * 0.05))
        else:
            # Held, slightly rolled chord on beat 1, a quiet answer on beat 3.
            for j, n in enumerate(ch[1:]):
                add(keys, s + j * 0.035, ep(midi(n), 2.4, 0.8))
            if s + 2 * beat < D - 1:
                add(keys, s + 2 * beat + 0.04, ep(midi(ch[-1] + 12), 1.4, 0.45))
    verb_send += keys * 0.8

    # Drums (from the first scroll until a bar after the last one).
    kick_times = []
    drums = np.zeros(N)
    nb = drop
    k = 0
    while nb < drums_end - 1e-3:
        pos = k % 8  # 8ths in a bar
        if pos in (0, 4) or (pos == 5 and (k // 8) % 2):
            kick_times.append(nb)
            n = int(0.45 * SR); tt = np.arange(n) / SR
            f = 48 + 90 * np.exp(-tt / 0.04)
            add(drums, nb, 0.55 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16))
        if pos in (2, 6):
            n = int(0.3 * SR); tt = np.arange(n) / SR
            sn = lowpass(rng.standard_normal(n), 3500.0) * np.exp(-tt / 0.07) * 0.22
            sn += 0.12 * np.sin(2 * np.pi * 185 * tt) * np.exp(-tt / 0.05)
            add(drums, nb + 0.012, sn); add(verb_send, nb + 0.012, sn * 0.6)
        # Hats: swung 8ths.
        n = int(0.06 * SR); tt = np.arange(n) / SR
        hn = rng.standard_normal(n); hn = hn - lowpass(hn, 7000.0)
        add(drums, nb + (0.045 if k % 2 else 0), hn * np.exp(-tt / 0.018) * (0.07 if k % 2 else 0.1))
        nb += beat / 2
        k += 1
    drums = lowpass(drums, 9000.0)

    # Bass: root on beat 1 and the "and" of 3 while the drums play.
    bass = np.zeros(N)
    for b in range(nbars):
        s = b * bar
        if s < drop - 1e-3 or s >= drums_end:
            continue
        f = midi(chords[b % 4][0] - 12)
        for off, ln in ((0, 1.3), (2.5 * beat, 0.6)):
            n = int(ln * SR); tt = np.arange(n) / SR
            add(bass, s + off, 0.16 * np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.9))

    # Sidechain the pad against the kick for the lo-fi pump.
    duck = np.ones(N)
    for kt in kick_times:
        m = t >= kt
        duck[m] *= 1 - 0.45 * np.exp(-(t[m] - kt) / 0.18)
    pad_l *= duck; pad_r *= duck

    # Whoosh that follows each scroll's speed, panned across.
    wl = np.zeros(N); wr = np.zeros(N)
    for a, b in scrolls:
        s0, s1 = a - 0.25, b + 0.35
        idx = (t >= s0) & (t < s1)
        x = (t[idx] - a) / (b - a)
        v = ease_v(x) * np.minimum(1, (t[idx] - s0) / 0.25)
        noise = rng.standard_normal(idx.sum())
        w = lowpass(noise, 300 + 3200 * v) * v * 0.11
        pan = np.clip(x, 0, 1)
        wl[idx] += w * (1 - 0.6 * pan); wr[idx] += w * (0.4 + 0.6 * pan)
    verb_send += (wl + wr) * 0.25

    # Riser into the drop, and a soft sub hit on it.
    fx = np.zeros(N)
    rs = max(0.0, drop - bar * 0.6)
    idx = (t >= rs) & (t < drop)
    if idx.any():
        x = (t[idx] - rs) / (drop - rs)
        fx[idx] += lowpass(rng.standard_normal(idx.sum()), 500 + 5000 * x) * x ** 2 * 0.06
    n = int(1.2 * SR); tt = np.arange(n) / SR
    add(fx, drop, 0.5 * np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.35))

    # Clicks: tick + success chime.
    for c in clicks:
        n = int(0.03 * SR); tt = np.arange(n) / SR
        tk = rng.standard_normal(n); tk = (tk - lowpass(tk, 1500.0)) * np.exp(-tt / 0.004) * 0.25
        add(fx, c, tk)
        top = chords[int(c // bar) % 4][-1] + 12
        for j, n2 in enumerate((top, top + 7)):
            ch = ep(midi(n2), 1.8, 0.9)
            add(keys, c + 0.6 + j * 0.12, ch); add(verb_send, c + 0.6 + j * 0.12, ch)

    # Vinyl warmth: hiss + sparse crackle.
    hiss = lowpass(rng.standard_normal(N), 4000.0) * 0.004
    crackle = np.zeros(N)
    pops = rng.integers(0, N, int(D * 9))
    crackle[pops] = rng.uniform(-0.25, 0.25, len(pops))
    crackle = lowpass(crackle, 2500.0)

    wet = reverb(verb_send) * 0.5
    L += pad_l + keys + drums + bass + wl + fx + hiss + crackle + wet
    R += pad_r + keys + drums + bass + wr + fx + hiss + crackle + np.roll(wet, 331)

    # Fades, soft clip, normalise.
    fade = np.minimum(1, t / 0.6) * np.clip((D - t) / 2.0, 0, 1)
    st = np.stack([L, R], 1) * fade[:, None]
    st = np.tanh(st * 1.4) / 1.4
    st *= 0.89 / np.abs(st).max()
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print(out)


if __name__ == "__main__":
    main()
