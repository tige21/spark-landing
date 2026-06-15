#!/usr/bin/env bash
# Extract a scroll-scrub frame sequence (WebP) + manifest from a source video.
#
# Usage: scripts/extract-frames.sh <source-video> [name] [width] [fps]
#   name  : output folder under public/hero-frames/ (default: hero)
#   width : frame width in px, height auto/even (default: 1100)
#   fps   : sampled frames per second (default: 24)
#
# Output: public/hero-frames/<name>/0001.webp … + manifest.json
# Consumed by src/components/hero/CanvasSequence.tsx.
set -euo pipefail

SRC="${1:?source video required — usage: extract-frames.sh <video> [name] [width] [fps]}"
NAME="${2:-hero}"
WIDTH="${3:-1100}"
FPS="${4:-24}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero-frames/$NAME"
mkdir -p "$OUT"
rm -f "$OUT"/*.webp "$OUT"/manifest.json

ffmpeg -y -i "$SRC" \
  -vf "fps=$FPS,scale=$WIDTH:-2:flags=lanczos" \
  -vcodec libwebp -lossless 0 -quality 78 -compression_level 6 \
  "$OUT/%04d.webp"

COUNT=$(find "$OUT" -name '*.webp' | wc -l | tr -d ' ')
cat > "$OUT/manifest.json" <<JSON
{ "name": "$NAME", "count": $COUNT, "width": $WIDTH, "ext": "webp", "pad": 4 }
JSON

BYTES=$(du -sh "$OUT" | cut -f1)
echo "Wrote $COUNT frames ($BYTES) to $OUT"
echo "Hero will pick them up automatically via the manifest."
