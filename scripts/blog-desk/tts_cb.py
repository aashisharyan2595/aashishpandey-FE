#!/usr/bin/env python3
"""Expressive narration with Chatterbox (Resemble AI, MIT licence), run on this machine: no account, no key.
Same interface and output as tts.py: tts_cb.py <video.json> <outdir> writes <outdir>/voice.wav and <outdir>/timeline.json.
Why: Aashish found the Kokoro narration robotic (2026-11-13) and wants a human voice with emotion and pitch movement.
Setup once (CPU is fine, about 3x faster than real time on 4 cores):
  python3 -m venv ~/vt/venv && . ~/vt/venv/bin/activate
  pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
  pip install chatterbox-tts==0.1.7 faster-whisper kokoro-onnx soundfile
Models come from Hugging Face (ResembleAI/chatterbox-turbo, ResembleAI/chatterbox) on first use. Chatterbox adds an inaudible
watermark marking the audio as AI-made, which matches the YouTube "altered or synthetic" setting we already tick.
Video JSON keys used:
  narrator: {"engine": "turbo"|"studio", "base": "A"|"B"|"none"}   default turbo on Voice A
     turbo  = Chatterbox Turbo; understands cues in the text such as [chuckle] [laugh] [sigh] [gasp]
     studio = Chatterbox; each sentence gets an emotion level (higher for ! lines and scenes with "mood": "cheerful")
     base   = which Kokoro voice the narrator's timbre is copied from (A = the tech blend, B = af_heart, none = Chatterbox's own voice)
  scenes[].say may hold cues in square brackets; captions and the .srt drop them.
Every sentence is checked with speech-to-text (faster-whisper small.en) and re-made up to 3 times if words go missing."""
import difflib, json, os, re, sys
import numpy as np, soundfile as sf, torch
torch.set_num_threads(os.cpu_count() or 4)
video, out = sys.argv[1], sys.argv[2]
V = json.load(open(video)); os.makedirs(out, exist_ok=True)
N = V.get('narrator', {}); ENGINE = N.get('engine', 'turbo'); BASE = N.get('base', 'A')
PRON = V.get('pronounce', {})
def say(x):
    for a, b in PRON.items(): x = re.sub(re.escape(a), b, x, flags=re.I)
    return x
CUE = re.compile(r'\[[a-z ]+\]\s*', re.I)
def plain(x): return CUE.sub('', x).strip()

# the narrator's timbre: 12 s of the chosen Kokoro voice, made fresh so no audio file has to live in the repo
ref = None
if BASE != 'none':
    from kokoro_onnx import Kokoro
    d = os.environ.get('KOKORO_DIR', os.path.expanduser('~/.cache/kokoro'))
    k = Kokoro(os.path.join(d, 'model.onnx'), os.path.join(d, 'voices.npz'))
    mix = {'A': {'am_michael': 0.6, 'am_adam': 0.4}, 'B': {'af_heart': 1.0}}[BASE]
    st = sum(np.asarray(k.get_voice_style(n)) * w for n, w in mix.items())
    a, sr = k.create("Here is what happened this week. A small bug in a popular web server let attackers slip past the front door. "
                     "The fix is already out, and it only takes a few minutes to apply.", voice=st, speed=0.96, lang='en-us')
    ref = os.path.join(out, 'narrator-ref.wav'); sf.write(ref, np.asarray(a, dtype=np.float32), sr, subtype='PCM_16')

if ENGINE == 'turbo':
    from chatterbox.tts_turbo import ChatterboxTurboTTS as M
else:
    from chatterbox.tts import ChatterboxTTS as M
m = M.from_pretrained(device='cpu'); SR = m.sr
if ref: m.prepare_conditionals(ref, norm_loudness=False)  # norm_loudness=True hits a float64 bug in 0.1.7

from faster_whisper import WhisperModel
asr = WhisperModel('small.en', device='cpu', compute_type='int8')
def letters(x): return re.sub(r'[^a-z0-9]', '', x.lower())
def heard(wav):
    import librosa
    y = librosa.resample(wav, orig_sr=SR, target_sr=16000)
    segs = list(asr.transcribe(y, beam_size=1, word_timestamps=True)[0])
    return ' '.join(s.text for s in segs), [(x.start, x.end) for s in segs for x in (s.words or [])]

def make(text, mood):
    spoken = say(text); want = [letters(say(plain(text))), letters(plain(text))]  # speech-to-text may write numbers as digits
    best, score, wt = None, -1, []
    for tries in range(3):
        torch.manual_seed(1234 + tries)
        if ENGINE == 'turbo':
            w = m.generate(spoken, temperature=0.8)
        else:
            ex = 0.8 if (mood == 'cheerful' or text.rstrip().endswith('!')) else 0.55 if text.rstrip().endswith('?') else 0.45
            w = m.generate(plain(spoken), exaggeration=ex, cfg_weight=0.4)
        w = w.squeeze(0).numpy().astype(np.float32)
        txt, words = heard(w); s = max(difflib.SequenceMatcher(None, x, letters(txt)).ratio() for x in want)
        if s > score: best, score, wt = w, s, words
        if s >= 0.85: break
    # trim the model's leading/trailing silence so our own pauses set the rhythm
    nz = np.where(np.abs(best) > 0.01)[0]
    cut = 0
    if len(nz): cut = max(0, nz[0] - int(SR * 0.03)); best = best[cut: nz[-1] + int(SR * 0.08)]
    return best, score, [(a - cut / SR, b - cut / SR) for a, b in wt]

audio, t, scenes, worst = [], 0.0, [], 1.0
def add(x): global t; audio.append(x); t += len(x) / SR
for si, s in enumerate(V['scenes']):
    sents = [x for x in re.split(r'(?<=[.!?])\s+', s['say'].strip()) if x]; rows = []
    for i, text in enumerate(sents):
        a, sc, wt = make(text, s.get('mood')); worst = min(worst, sc); start = t; add(a); vend = t
        gap = (0.42 if i == len(sents) - 1 else 0.24) + (0.08 if text[-1] in '?!' else 0) + (0.25 if text.rstrip().endswith('...') else 0)
        add(np.zeros(int(SR * gap), dtype=np.float32)); row = {'text': plain(text), 'start': start, 'vend': vend, 'end': t, 'match': round(sc, 2)}
        # real word times from speech-to-text, used for the captions when the word count matches the script
        if len(wt) == len(plain(text).split()): row['words'] = [[round(start + max(0, a), 3), round(start + b, 3)] for a, b in wt]
        rows.append(row)
    scenes.append({'sentences': rows})
sf.write(os.path.join(out, 'voice.wav'), np.concatenate(audio), SR)
json.dump({'total': t, 'scenes': scenes}, open(os.path.join(out, 'timeline.json'), 'w'))
print(json.dumps({'seconds': round(t, 1), 'engine': ENGINE, 'base': BASE, 'worst_match': round(worst, 2)}))
