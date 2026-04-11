#!/usr/bin/env bash
# Extract exactly 240 evenly-spaced frames from a source video into
# apps/web/public/hero-frames/, sized and compressed for web delivery.
#
# Usage:
#   ./scripts/extract-frames.sh path/to/video.mp4
#
# Requires ffmpeg. Writes frame_0001.webp … frame_0240.webp at 1600px wide.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <video.mp4>" >&2
  exit 1
fi

SRC="$1"
if [[ ! -f "$SRC" ]]; then
  echo "error: file not found: $SRC" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/apps/web/public/hero-frames"
TARGET_FRAMES=64
MAX_WIDTH=1280

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/frame_*.webp "$OUT_DIR"/frame_*.png "$OUT_DIR"/frame_*.jpg 2>/dev/null || true

# Detect supported encoder. Prefer WebP for smaller files; fall back to JPG.
EXT="webp"
QUALITY_FLAG="-q:v 80"
if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "libwebp"; then
  if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "webp_native\|^ V..... webp"; then
    EXT="webp"
  else
    EXT="jpg"
    QUALITY_FLAG="-q:v 3"  # mjpeg q-scale: 2-5 = high quality
  fi
fi

# Read total frames from source
TOTAL_FRAMES=$(ffprobe -v error -select_streams v:0 -count_packets \
  -show_entries stream=nb_read_packets -of csv=p=0 "$SRC")

if [[ -z "$TOTAL_FRAMES" || "$TOTAL_FRAMES" -lt "$TARGET_FRAMES" ]]; then
  echo "warning: source has $TOTAL_FRAMES frames, extracting all as target" >&2
  STEP=1
else
  STEP=$(( TOTAL_FRAMES / TARGET_FRAMES ))
fi

echo "source frames: $TOTAL_FRAMES  →  extracting every ${STEP}th frame"
echo "output: $OUT_DIR"

# Extract: pick every STEPth frame, scale to max width, encode
ffmpeg -y -i "$SRC" \
  -vf "select=not(mod(n\,${STEP})),scale='min($MAX_WIDTH,iw)':-2" \
  -fps_mode vfr \
  $QUALITY_FLAG \
  -frames:v "$TARGET_FRAMES" \
  "$OUT_DIR/frame_%04d.$EXT" \
  -hide_banner -loglevel warning

ACTUAL=$(ls "$OUT_DIR"/frame_*.$EXT 2>/dev/null | wc -l | tr -d ' ')
echo "format: .$EXT"
echo "done. extracted $ACTUAL frames."

# Report total size
TOTAL_SIZE=$(du -sh "$OUT_DIR" | cut -f1)
echo "total size: $TOTAL_SIZE"
