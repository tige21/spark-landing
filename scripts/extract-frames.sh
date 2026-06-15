#!/usr/bin/env bash
# Extract a scroll-scrub frame sequence (WebP) + manifest from a source video.
#
# Usage: scripts/extract-frames.sh <source-video> [name] [width] [fps]
#   name  : output folder under public/hero-frames/ (default: hero)
#           use "hero" for the desktop (16:9) source and "hero-mobile" for the
#           vertical mobile source.
#   width : frame width in px, height auto/even (default: 1280)
#   fps   : sampled frames per second (default: 24)
#
# Output: public/hero-frames/<name>/0001.webp … + manifest.json
# Consumed by src/components/hero/CanvasSequence.tsx.
#
# Note: this machine's ffmpeg has no libwebp encoder, so we extract PNG frames
# with ffmpeg and convert them to WebP with cwebp (both are installed).
set -euo pipefail

SRC="${1:?source video required — usage: extract-frames.sh <video> [name] [width] [fps]}"
NAME="${2:-hero}"
WIDTH="${3:-1280}"
FPS="${4:-24}"

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found" >&2; exit 1; }
command -v cwebp  >/dev/null 2>&1 || { echo "cwebp not found (brew install webp)" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero-frames/$NAME"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
rm -f "$OUT"/*.webp "$OUT"/manifest.json

ffmpeg -y -v error -i "$SRC" \
  -vf "fps=$FPS,scale=$WIDTH:-2:flags=lanczos" \
  "$TMP/%04d.png"

n=0
for png in "$TMP"/*.png; do
  n=$((n + 1))
  cwebp -quiet -q 78 -m 6 "$png" -o "$OUT/$(printf '%04d' "$n").webp"
done

cat > "$OUT/manifest.json" <<JSON
{ "name": "$NAME", "count": $n, "width": $WIDTH, "ext": "webp", "pad": 4 }
JSON

echo "Wrote $n frames ($(du -sh "$OUT" | cut -f1)) to $OUT"
echo "Hero picks them up automatically on next build (manifest detected)."
