#!/usr/bin/env python3
"""Narration for the short videos with Kokoro, an open-source voice that runs on the machine (no account, no key).
Setup once:  pip install kokoro-onnx soundfile
             then put model.onnx and voices.npz in $KOKORO_DIR (default ~/.cache/kokoro); see docs/blog-desk-runbook.md for the download commands.
Usage: tts.py <video.json> <outdir>   writes <outdir>/voice.wav and <outdir>/timeline.json
Each sentence is spoken on its own so the pauses between thoughts are real, and two voices are blended so the voice is a unique one."""
import json, os, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
video, out = sys.argv[1], sys.argv[2]
V = json.load(open(video)); os.makedirs(out, exist_ok=True)
d = os.environ.get('KOKORO_DIR', os.path.expanduser('~/.cache/kokoro'))
k = Kokoro(os.path.join(d, 'model.onnx'), os.path.join(d, 'voices.npz'))
voices = V.get('voice') or {'am_michael': 0.6, 'am_adam': 0.4}
style = sum(np.asarray(k.get_voice_style(n)) * w for n, w in voices.items())
speed = float(V.get('speed', 0.96)); SR = 24000
audio, t, scenes = [], 0.0, []
def add(x): global t; audio.append(x); t += len(x) / SR
for si, s in enumerate(V['scenes']):
    sents = [x for x in re.split(r'(?<=[.!?])\s+', s['say'].strip()) if x]; rows = []
    for i, text in enumerate(sents):
        a, sr = k.create(text, voice=style, speed=speed, lang='en-us'); assert sr == SR
        a = np.asarray(a, dtype=np.float32); start = t; add(a)
        # a breath between sentences, longer at the end of a scene; questions and exclamations breathe a little more
        gap = (0.42 if i == len(sents) - 1 else 0.26) + (0.08 if text[-1] in '?!' else 0)
        add(np.zeros(int(SR * gap), dtype=np.float32)); rows.append({'text': text, 'start': start, 'end': t})
    scenes.append({'sentences': rows})
sf.write(os.path.join(out, 'voice.wav'), np.concatenate(audio), SR)
json.dump({'total': t, 'scenes': scenes}, open(os.path.join(out, 'timeline.json'), 'w'))
print(json.dumps({'seconds': round(t, 1)}))
