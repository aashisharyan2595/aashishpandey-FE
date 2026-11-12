#!/usr/bin/env bash
# One-time setup for the video maker in a fresh cloud session (no keys, no accounts): the Kokoro voice, its model, and the Python packages.
# Safe to run again; it skips what is already there. Needs about 330 MB of downloads from huggingface.co (GitHub is blocked in the container).
set -euo pipefail
D="${KOKORO_DIR:-$HOME/.cache/kokoro}"; mkdir -p "$D"
python3 -c "import kokoro_onnx, soundfile, numpy" 2>/dev/null || pip install -q kokoro-onnx soundfile numpy
HF="https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
[ -s "$D/model.onnx" ] || curl -fsSL --retry 4 -o "$D/model.onnx" "$HF/onnx/model.onnx"
if [ ! -s "$D/voices.npz" ]; then
  T="$(mktemp -d)"
  for v in am_michael am_adam af_heart; do curl -fsSL --retry 4 -o "$T/$v.bin" "$HF/voices/$v.bin"; done
  python3 - "$T" "$D/voices.npz" <<'PY'
import sys, numpy as np, glob, os
t, out = sys.argv[1], sys.argv[2]
np.savez(out, **{os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in glob.glob(t + '/*.bin')})
PY
  rm -rf "$T"
fi
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing"; exit 1; }
echo "video maker ready: voice in $D"
