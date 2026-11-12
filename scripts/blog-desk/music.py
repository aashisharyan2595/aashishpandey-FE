#!/usr/bin/env python3
"""Original gentle background music and sound effects for the story videos, made from scratch with numpy (no samples, no licences, no keys).
Usage: music.py <sfx.json> <voice.wav> <out.wav>
  sfx.json: { "total": seconds, "sfx": [ { "t": seconds, "type": "pop|whoosh|thump|ding|tick|sparkle|swell", "v": 0..1 } ] }
The music is an ambient bed (warm pad, soft plucked arpeggio, low bass) at 76 BPM in A minor, which sits at the 70-90 BPM that suits educational explainers.
It ducks under the voice (research on explainer mixes: music about 20 dB under the narration while it speaks) and fades in and out."""
import json, sys
import numpy as np
import soundfile as sf
SR = 44100
cfg = json.load(open(sys.argv[1])); total = float(cfg['total']) + 1.2
voice, vsr = sf.read(sys.argv[2]); voice = voice if voice.ndim == 1 else voice.mean(1)
n = int(total * SR); t = np.arange(n) / SR
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def env(length, a, r):
    e = np.ones(length); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
bpm = 76.0; beat = 60 / bpm; bar = beat * 4
CH = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]  # Am F C G
mus = np.zeros(n)
bars = int(total / bar) + 2
for b in range(bars):
    root, tones = CH[b % 4]; s = int(b * bar * SR); L = int((bar + 0.9) * SR)
    if s >= n: break
    seg = np.arange(L) / SR; e = env(L, 0.7, 0.9)
    pad = sum(np.sin(2 * np.pi * hz(m) * (1 + d) * seg) for m in tones for d in (-0.0025, 0.0025)) * 0.05 + sum(np.sin(2 * np.pi * hz(m + 12) * seg) for m in tones) * 0.012
    bass = np.sin(2 * np.pi * hz(root) * seg) * 0.16 + np.sin(2 * np.pi * hz(root + 12) * seg) * 0.03
    e2 = min(len(seg), n - s); mus[s:s + e2] += ((pad + bass) * e)[:e2]
    # soft plucked arpeggio, eighth notes, a different shape every other bar
    pat = [0, 1, 2, 1, 0, 2, 1, 2] if b % 2 == 0 else [2, 1, 0, 1, 2, 1, 0, 1]
    for k, idx in enumerate(pat):
        ts = s + int(k * beat / 2 * SR); note = hz(tones[idx] + 12); ln = int(0.9 * SR); tt = np.arange(ln) / SR
        pl = (np.sin(2 * np.pi * note * tt) + 0.35 * np.sin(2 * np.pi * note * 2 * tt) * np.exp(-tt * 9)) * np.exp(-tt * 4.2) * 0.075
        pl *= np.minimum(1, tt / 0.006)
        if ts < n: seg_n = min(ln, n - ts); mus[ts:ts + seg_n] += pl[:seg_n]
# a quiet echo gives the pluck some air
d1 = int(beat * 0.75 * SR); echo = np.zeros(n); echo[d1:] = mus[:-d1] * 0.32; d2 = int(beat * 1.5 * SR); echo[d2:] += mus[:-d2] * 0.16; mus = mus + echo
mus /= np.max(np.abs(mus)) + 1e-9
rms = np.sqrt(np.mean(mus ** 2)); mus *= 10 ** (-33 / 20) / rms
# ducking from the voice envelope
vv = np.zeros(n); m = min(n, len(voice)) if vsr == SR else 0
if vsr != SR:
    idx = np.linspace(0, len(voice) - 1, int(len(voice) * SR / vsr)); voice = np.interp(idx, np.arange(len(voice)), voice); m = min(n, len(voice))
vv[:m] = np.abs(voice[:m]); w = int(0.05 * SR)
envv = np.convolve(vv, np.ones(w) / w, mode='same'); envv = envv / (np.percentile(envv, 95) + 1e-9); envv = np.clip(envv * 2.2, 0, 1)
sm = np.zeros(n); att, rel = np.exp(-1 / (0.12 * SR)), np.exp(-1 / (0.6 * SR)); acc = 0.0
for i in range(n):
    x = envv[i]; k = rel if x < acc else att; acc = acc * k + x * (1 - k); sm[i] = acc
mus *= 1 - 0.62 * sm
mus *= np.minimum(1, t / 1.5) * np.minimum(1, (total - t) / 2.6)
# sound effects
def pop(v):
    L = int(0.14 * SR); x = np.arange(L) / SR; f = 520 + 520 * (1 - np.exp(-x * 40)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 30) * v
def whoosh(v):
    L = int(0.45 * SR); x = np.arange(L) / SR; nz = np.random.RandomState(3).randn(L); out = np.zeros(L); a = 0.0
    for i in range(L): c = 0.02 + 0.5 * (i / L) ** 1.5 * (1 - i / L) * 3; a += c * (nz[i] - a); out[i] = a
    return out * np.sin(np.pi * x / 0.45) * v * 3
def thump(v):
    L = int(0.3 * SR); x = np.arange(L) / SR; f = 45 + 60 * np.exp(-x * 25); click = np.random.RandomState(5).randn(L) * np.exp(-x * 120) * 0.25; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 11) + click) * v
def ding(v):
    L = int(0.9 * SR); x = np.arange(L) / SR; return (np.sin(2 * np.pi * 1318 * x) + 0.5 * np.sin(2 * np.pi * 1976 * x)) * np.exp(-x * 6) * v * 0.5
def tick(v):
    L = int(0.05 * SR); x = np.arange(L) / SR; return np.sin(2 * np.pi * 1900 * x) * np.exp(-x * 90) * v * 0.6
def sparkle(v):
    out = np.zeros(int(0.9 * SR))
    for k, f in enumerate([1568, 1976, 2349, 3136]):
        L = int(0.35 * SR); x = np.arange(L) / SR; o = int(k * 0.07 * SR); out[o:o + L] += np.sin(2 * np.pi * f * x) * np.exp(-x * 9) * v * 0.35
    return out
def swell(v):
    L = int(1.6 * SR); x = np.arange(L) / SR; nz = np.random.RandomState(7).randn(L); a = 0.0; out = np.zeros(L)
    for i in range(L): a += 0.03 * (nz[i] - a); out[i] = a
    return out * np.sin(np.pi * x / 1.6) ** 2 * v * 4
SF = {'pop': pop, 'whoosh': whoosh, 'thump': thump, 'ding': ding, 'tick': tick, 'sparkle': sparkle, 'swell': swell}
fx = np.zeros(n)
for e in cfg.get('sfx', []):
    f = SF.get(e['type']);
    if not f: continue
    s = int(float(e['t']) * SR); w = f(float(e.get('v', 0.5)))
    if 0 <= s < n: k = min(len(w), n - s); fx[s:s + k] += w[:k]
fx *= 10 ** (-17 / 20) / (np.max(np.abs(fx)) + 1e-9)
out = np.clip(mus + fx, -1, 1)
sf.write(sys.argv[3], out, SR)
print(json.dumps({'seconds': round(total, 1)}))
