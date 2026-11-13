#!/usr/bin/env bash
# Flat cartoon explainer Shorts (Aashish's chosen style, 2026-11-13): Kokoro voice + original music bed + Remotion render + 2-3 thumbnails.
# usage: make.sh <content/blog/videos/<slug>-ig.json> <outdir> [--stills "f1,f2,..."] [--thumbs-only]
# writes <outdir>/<slug>.mp4, <slug>.srt, <slug>-poster.jpg and <slug>-thumbN-shorts.png / -youtube.png. No keys, no accounts.
set -euo pipefail
J="$1"; OUT="$2"; MODE="${3:-}"; ARG="${4:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"; DESK="$(cd "$HERE/.." && pwd)"; ROOT="$(cd "$DESK/../.." && pwd)"; mkdir -p "$HERE/public"; cp -n "$ROOT/assets/vendor/fonts/geist-normal-latin.woff2" "$HERE/public/geist.woff2" 2>/dev/null || true; [ -d "$HERE/node_modules/remotion" ] || (cd "$HERE" && npm ci --ignore-scripts --no-audit --no-fund >/dev/null)
SLUG=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['slug'])" "$J"); W="$HERE/build/$SLUG"; mkdir -p "$W" "$OUT" "$HERE/public"
if [ ! -s "$W/timeline.json" ] || [ "$J" -nt "$W/timeline.json" ]; then
  # Chatterbox (expressive, human-sounding) when the script names a narrator and its venv exists; Kokoro tts.py otherwise
  TPY="${TTS_PY:-$HOME/vt/venv/bin/python}"
  OPY="${ORPHEUS_PY:-$HOME/ov/v/bin/python}"
  if grep -q '"engine": *"orpheus"' "$J" && [ -x "$OPY" ]; then "$OPY" -I "$DESK/tts_orpheus.py" "$J" "$W" 2>/dev/null | tail -1
  elif grep -q '"narrator"' "$J" && [ -x "$TPY" ]; then "$TPY" -I "$DESK/tts_cb.py" "$J" "$W" 2>/dev/null | tail -1; else python3 "$DESK/tts.py" "$J" "$W" >/dev/null; fi
  ffmpeg -loglevel error -y -i "$W/voice.wav" -af "highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=12:release=180:makeup=3,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 44100 -ac 1 "$HERE/public/$SLUG-voice.wav"
  python3 - "$J" "$W/timeline.json" "$W/sfx.json" <<'PY'
import json,sys
v=json.load(open(sys.argv[1])); tl=json.load(open(sys.argv[2])); st=[s['sentences'][0]['start'] for s in tl['scenes']]
sfx=[{"t":0.07,"type":"pop","v":0.45},{"t":0.6,"type":"ding","v":0.35}]+[{"t":s-0.25,"type":"whoosh","v":0.5} for s in st[1:]]
for i,sc in enumerate(v['scenes']):
  if sc['type'] in ('stat','versions'): sfx.append({"t":st[i]+0.3,"type":"thump","v":0.45})
  if sc['type'] in ('steps','chips','compare'): sfx.append({"t":st[i]+0.5,"type":"pop","v":0.35})
sfx.append({"t":st[-1]+0.6,"type":"sparkle","v":0.45})
json.dump({"total":tl['total']+0.6,"sfx":sorted(sfx,key=lambda x:x['t'])},open(sys.argv[3],'w'))
PY
  python3 "$DESK/music.py" "$W/sfx.json" "$HERE/public/$SLUG-voice.wav" "$HERE/public/$SLUG-bed.wav" >/dev/null
fi
python3 -c "import json,sys;json.dump({'v':json.load(open(sys.argv[1])),'tl':json.load(open(sys.argv[2])),'voice':sys.argv[3]+'-voice.wav','bed':sys.argv[3]+'-bed.wav'},open(sys.argv[4],'w'))" "$J" "$W/timeline.json" "$SLUG" "$W/props.json"
cd "$HERE"
if [ "$MODE" = "--stills" ]; then for fr in ${ARG//,/ }; do npx remotion still src/index.ts Video "$OUT/$SLUG-f$fr.png" --frame=$fr --props="$W/props.json" >/dev/null 2>&1 || echo "still $fr failed"; done; exit 0; fi
if [ "$MODE" != "--thumbs-only" ]; then npx remotion render src/index.ts Video "$OUT/$SLUG.mp4" --props="$W/props.json" --crf=20 --concurrency=4 2>&1 | tail -1; fi
N=$(python3 -c "import json,sys;print(len(json.load(open(sys.argv[1])).get('thumbs',[])))" "$J")
for k in $(seq 0 $((N-1))); do
  python3 -c "import json,sys;d=json.load(open(sys.argv[1]));d['k']=int(sys.argv[2]);json.dump(d,open(sys.argv[3],'w'))" "$W/props.json" $k "$W/tp.json"
  npx remotion still src/index.ts Thumb "$OUT/$SLUG-thumb$((k+1))-shorts.png" --props="$W/tp.json" >/dev/null 2>&1 || echo "thumb $k failed"
  python3 -c "import json,sys;d=json.load(open(sys.argv[1]));d['wide']=True;json.dump(d,open(sys.argv[1],'w'))" "$W/tp.json"
  npx remotion still src/index.ts ThumbWide "$OUT/$SLUG-thumb$((k+1))-youtube.png" --props="$W/tp.json" >/dev/null 2>&1 || echo "wide $k failed"
done
python3 - "$J" "$W/timeline.json" "$OUT/$SLUG.srt" <<'PY'
import json,re,sys
v=json.load(open(sys.argv[1])); tl=json.load(open(sys.argv[2]))
ts=lambda x:'%02d:%02d:%02d,%03d'%(x//3600,(x%3600)//60,x%60,round((x-int(x))*1000)%1000)
n=0;o=[]
for sc,sv in zip(tl['scenes'],v['scenes']):
  for sn,tx in zip(sc['sentences'],[re.sub(r'\[[a-z ]+\]\s*','',x,flags=re.I).strip() for x in re.split(r'(?<=[.!?])\s+',sv['say'].strip()) if x]): n+=1;o.append(f"{n}\n{ts(sn['start'])} --> {ts(sn['end']-0.05)}\n{tx}\n")
open(sys.argv[3],'w').write('\n'.join(o))
PY
[ -s "$OUT/$SLUG-thumb1-shorts.png" ] && ffmpeg -loglevel error -y -i "$OUT/$SLUG-thumb1-shorts.png" -q:v 3 "$OUT/$SLUG-poster.jpg"
echo "done $SLUG"
