#!/usr/bin/env bash
# Procedural paper textures (fixed seeds, so every run is byte-identical). Used with mix-blend-mode: multiply.
set -euo pipefail
cd "$(dirname "$0")/.."
out=assets/textures
mkdir -p "$out"
# Fine grain + low-frequency mottling, compressed into the 86..100% range so multiply only darkens slightly.
magick -size 1920x1080 xc:gray50 -seed 1301 +noise Random -colorspace gray -blur 0x0.6 -level 25%,75% \
  \( -size 480x270 xc:gray50 -seed 1302 +noise Random -colorspace gray -blur 0x3 -resize 1920x1080\! -level 35%,65% \) \
  -compose multiply -composite -auto-level +level 91%,100% -depth 8 -strip -define png:exclude-chunks=date,time "$out/paper-grain.png"
# Paper fibres: sparse streaks at mixed angles.
magick -size 1920x1080 xc:white -seed 1303 +noise Random -colorspace gray -threshold 99.4% -negate \
  -motion-blur 0x9+35 \( +clone -seed 1304 +noise Random -colorspace gray -threshold 99.6% -negate -motion-blur 0x11+122 \) \
  -compose multiply -composite -auto-level +level 90%,100% -depth 8 -strip -define png:exclude-chunks=date,time "$out/paper-fibres.png"
# Dark paper for black fields (screen blend): near-black base with faint speckle and a few lighter fibres.
magick -size 1920x1080 xc:gray50 -seed 1305 +noise Random -colorspace gray -blur 0x0.8 -auto-level +level 0%,4% \
  \( -size 1920x1080 xc:white -seed 1306 +noise Random -colorspace gray -threshold 99.5% -negate -motion-blur 0x10+60 -negate -auto-level +level 0%,7% \) \
  -compose lighten -composite -depth 8 -strip -define png:exclude-chunks=date,time "$out/paper-dark.png"
