#!/usr/bin/env bash
# Subtitrni videoga "kuydiradi" (har qanday pleer/ijtimoiy tarmoqda ko'rinadi).
# Foydalanish: burn.sh input.mp4 captions.ass output.mp4 [crf=18]
set -euo pipefail
in="$1"; ass="$2"; out="$3"; crf="${4:-18}"
assdir="$(cd "$(dirname "$ass")" && pwd)"; assname="$(basename "$ass")"
ffmpeg -hide_banner -y -i "$in" \
  -vf "ass=${assdir//:/\\:}/${assname}:fontsdir=/usr/share/fonts" \
  -c:v libx264 -preset medium -crf "$crf" -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$out"
echo "Tayyor: $out"
