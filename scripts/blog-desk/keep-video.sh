#!/usr/bin/env bash
# Keep a finished video: push <dir>/<slug>.mp4, .srt, -poster.jpg, youtube.md and any <slug>-thumb*.png to the `blog-videos` branch under videos/<slug>/.
# (Aashish asked for every post's video to be kept; the branch keeps ~15 MB files out of main. Raw links:
#  https://raw.githubusercontent.com/aashisharyan2595/aashishpandey-FE/blog-videos/videos/<slug>/<slug>.mp4 )
# usage: keep-video.sh <slug> <dir>      env TRAILER="extra commit message lines" (optional)
set -euo pipefail
slug="$1"; dir="$2"; origin="$(git remote get-url origin)"; T="$(mktemp -d)"
for f in "$slug.mp4" "$slug.srt" "$slug-poster.jpg" youtube.md; do [ -s "$dir/$f" ] || { echo "missing $dir/$f"; exit 1; }; done
if git ls-remote --exit-code --heads "$origin" blog-videos >/dev/null 2>&1; then git clone -q --depth 1 --branch blog-videos "$origin" "$T/r"
else git clone -q --depth 1 "$origin" "$T/r"; (cd "$T/r" && git checkout -q --orphan blog-videos && git rm -rfq . && printf '# Blog videos\n\nOne folder per post: videos/<slug>/<slug>.mp4, .srt, -poster.jpg and youtube.md (the upload fields).\n' > README.md); fi
# The branch holds only files, never a site: a vercel.json there tells Vercel not to build it (it failed with NEXT_NO_VERSION before).
[ -f "$T/r/vercel.json" ] || printf '{ "git": { "deploymentEnabled": false } }\n' > "$T/r/vercel.json"
mkdir -p "$T/r/videos/$slug"; cp "$dir/$slug.mp4" "$dir/$slug.srt" "$dir/$slug-poster.jpg" "$dir/youtube.md" "$T/r/videos/$slug/"
for f in "$dir/$slug"-thumb*.png; do [ -s "$f" ] && cp "$f" "$T/r/videos/$slug/"; done  # 2-3 thumbnails per video (Shorts 9:16 and YouTube 16:9)
cd "$T/r"; git add -A; git commit -q -m "Video for $slug${TRAILER:+

$TRAILER}"; git push -q origin blog-videos
echo "kept: https://raw.githubusercontent.com/aashisharyan2595/aashishpandey-FE/blog-videos/videos/$slug/$slug.mp4"
