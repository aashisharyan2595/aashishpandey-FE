#!/usr/bin/env python3
"""Life-like narration with Orpheus 3B (Apache 2.0), run on this machine: no account, no key.
Same interface and output as tts.py / tts_cb.py: tts_orpheus.py <video.json> <outdir> writes <outdir>/voice.wav and <outdir>/timeline.json.
Why: Aashish (2026-11-13) still found the Chatterbox/Kokoro narrator flat. Orpheus had the widest pitch movement in our tests.
Voice rule (Aashish, 2026-11-13): serious topics use "tara" (warm, steady); funny or natural topics use "leo" (lively, expressive).
Video JSON keys used:
  narrator: {"engine": "orpheus", "voice": "auto"|"tara"|"leo"|...}   "auto" reads the top-level "tone": "serious" -> tara, anything else -> leo
  scenes[].say may hold cues in square brackets such as [chuckle] [laugh] [sigh] [gasp]; they are sent to Orpheus as <chuckle> etc. and
  captions / .srt drop them.
Setup once (CPU is fine; about 7x slower than real time on 4 cores, so a 40 s video takes ~5 min):
  uv venv ~/ov/v && VIRTUAL_ENV=~/ov/v uv pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu
  VIRTUAL_ENV=~/ov/v uv pip install llama-cpp-python snac soundfile numpy huggingface_hub faster-whisper librosa
Models download from Hugging Face on first use: isaiahbjork/orpheus-3b-0.1-ft-Q4_K_M-GGUF and hubertsiuzdak/snac_24khz.
Every sentence is checked with speech-to-text (faster-whisper small.en) and re-made up to 3 times if words go missing."""
import difflib, json, os, re, sys, time
import numpy as np, soundfile as sf, torch
torch.set_num_threads(os.cpu_count() or 4)
video, out = sys.argv[1], sys.argv[2]
V = json.load(open(video)); os.makedirs(out, exist_ok=True)
N = V.get('narrator', {}); VOICE = N.get('voice', 'auto')
if VOICE == 'auto': VOICE = 'tara' if str(V.get('tone', '')).lower() == 'serious' else 'leo'
PRON = V.get('pronounce', {})
TAGS = {'laugh', 'chuckle', 'sigh', 'cough', 'sniffle', 'groan', 'yawn', 'gasp'}
def say(x):
    for a, b in PRON.items(): x = re.sub(re.escape(a), b, x, flags=re.I)
    return re.sub(r'\[([a-z]+)\]', lambda m: '<%s>' % m.group(1).lower() if m.group(1).lower() in TAGS else '', x)
CUE = re.compile(r'\[[a-z ]+\]\s*', re.I)
def plain(x): return CUE.sub('', x).strip()

from llama_cpp import Llama
from huggingface_hub import hf_hub_download
from snac import SNAC
SR = 24000
gguf = hf_hub_download('isaiahbjork/orpheus-3b-0.1-ft-Q4_K_M-GGUF', 'orpheus-3b-0.1-ft-q4_k_m.gguf')
llm = Llama(model_path=gguf, n_ctx=4096, n_threads=os.cpu_count() or 4, verbose=False)
snac = SNAC.from_pretrained('hubertsiuzdak/snac_24khz').eval()
from faster_whisper import WhisperModel
asr = WhisperModel('small.en', device='cpu', compute_type='int8')

def synth(text, seed, temp):
    llm.reset()
    toks = []
    for ch in llm.create_completion(f'<|audio|>{VOICE}: {text}<|eot_id|>', max_tokens=2400, temperature=temp, top_p=0.9,
                                    repeat_penalty=1.1, seed=seed, stream=True):
        for m in re.finditer(r'<custom_token_(\d+)>', ch['choices'][0]['text']): toks.append(int(m.group(1)))
    toks = [t for t in toks if t >= 10]  # custom_token_1..9 are start/end markers, not audio
    ids = [t - 10 - ((i % 7) * 4096) for i, t in enumerate(toks)]
    ids = [max(0, min(4095, x)) for x in ids[: len(ids) // 7 * 7]]
    if not ids: return np.zeros(int(SR * 0.5), dtype=np.float32)
    c0, c1, c2 = [], [], []
    for j in range(len(ids) // 7):
        f = ids[7 * j: 7 * j + 7]; c0.append(f[0]); c1 += [f[1], f[4]]; c2 += [f[2], f[3], f[5], f[6]]
    with torch.inference_mode():
        a = snac.decode([torch.tensor(c).unsqueeze(0) for c in (c0, c1, c2)])
    return a.squeeze().numpy().astype(np.float32)

def letters(x): return re.sub(r'[^a-z0-9]', '', x.lower())
def heard(wav):
    import librosa
    y = librosa.resample(wav, orig_sr=SR, target_sr=16000)
    segs = list(asr.transcribe(y, beam_size=1, word_timestamps=True)[0])
    return ' '.join(s.text for s in segs), [(x.start, x.end) for s in segs for x in (s.words or [])]

def make(text):
    spoken = say(text); want = [letters(say(plain(text)).replace('<', '').replace('>', '')), letters(plain(text))]
    best, score, wt = None, -1, []
    for tries in range(3):
        w = synth(spoken, 1234 + tries, 0.6 + 0.1 * tries)
        txt, words = heard(w)
        s = max(difflib.SequenceMatcher(None, x, letters(txt)).ratio() for x in want)
        if s > score: best, score, wt = w, s, words
        if s >= 0.85: break
    nz = np.where(np.abs(best) > 0.01)[0]; cut = 0  # trim leading/trailing silence so our own pauses set the rhythm
    if len(nz): cut = max(0, nz[0] - int(SR * 0.03)); best = best[cut: nz[-1] + int(SR * 0.08)]
    return best, score, [(a - cut / SR, b - cut / SR) for a, b in wt]

audio, t, scenes, worst = [], 0.0, [], 1.0
def add(x):
    global t; audio.append(x); t += len(x) / SR
t0 = time.time()
for s in V['scenes']:
    sents = [x for x in re.split(r'(?<=[.!?])\s+', s['say'].strip()) if x]; rows = []
    for i, text in enumerate(sents):
        a, sc, wt = make(text); worst = min(worst, sc); start = t; add(a); vend = t
        gap = (0.42 if i == len(sents) - 1 else 0.24) + (0.08 if text[-1] in '?!' else 0) + (0.25 if text.rstrip().endswith('...') else 0)
        add(np.zeros(int(SR * gap), dtype=np.float32)); row = {'text': plain(text), 'start': start, 'vend': vend, 'end': t, 'match': round(sc, 2)}
        if len(wt) == len(plain(text).split()): row['words'] = [[round(start + max(0, a), 3), round(start + b, 3)] for a, b in wt]
        rows.append(row)
    scenes.append({'sentences': rows})
sf.write(os.path.join(out, 'voice.wav'), np.concatenate(audio), SR)
json.dump({'total': t, 'scenes': scenes}, open(os.path.join(out, 'timeline.json'), 'w'))
print(json.dumps({'seconds': round(t, 1), 'engine': 'orpheus', 'voice': VOICE, 'worst_match': round(worst, 2), 'took_s': round(time.time() - t0)}))
