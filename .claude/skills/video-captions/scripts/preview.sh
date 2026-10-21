#!/usr/bin/env bash
# Tayyor videodan bir nechta kadr oladi (subtitr joyi/o'lchamini ko'z bilan tekshirish uchun).
# Foydalanish: preview.sh video.mp4 out_dir [kadrlar_soni=4]
set -euo pipefail
in="$1"; dir="$2"; n="${3:-4}"; mkdir -p "$dir"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
for i in $(seq 1 "$n"); do
  t=$(python3 -c "print(round($dur*$i/($n+1),2))")
  ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$in" -frames:v 1 -vf "scale='min(720,iw)':-2" "$dir/frame_$i.jpg"
done
ls "$dir"
