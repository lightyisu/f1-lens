#!/bin/bash
# 仅下载 2025 / 2026 车队侧视赛车图到 public/cars/{season}/{slug}.webp
set -u

BASE="https://media.formula1.com/image/upload/c_lfill,w_1000/q_auto/v1/common/f1"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/cars"

download() {
  local season="$1" key="$2" slug="$3"
  mkdir -p "$OUT/$season"
  local url="$BASE/$season/$key/${season}${key}carright.webp"
  local dest="$OUT/$season/$slug.webp"
  if curl -sfL "$url" -o "$dest" && [ -s "$dest" ]; then
    echo "OK   $season/$slug.webp"
  else
    rm -f "$dest"
    echo "FAIL $season/$slug"
  fi
}

# 2025
for pair in \
  "redbullracing|red-bull-racing" \
  "ferrari|ferrari" \
  "mercedes|mercedes" \
  "mclaren|mclaren" \
  "astonmartin|aston-martin" \
  "alpine|alpine" \
  "williams|williams" \
  "racingbulls|racing-bulls" \
  "kicksauber|kick-sauber" \
  "haas|haas"
do
  download 2025 "${pair%%|*}" "${pair##*|}"
done

# 2026（Audi 接替 Kick Sauber，Cadillac 入列）
for pair in \
  "redbullracing|red-bull-racing" \
  "ferrari|ferrari" \
  "mercedes|mercedes" \
  "mclaren|mclaren" \
  "astonmartin|aston-martin" \
  "alpine|alpine" \
  "williams|williams" \
  "racingbulls|racing-bulls" \
  "haas|haas" \
  "audi|audi" \
  "cadillac|cadillac"
do
  download 2026 "${pair%%|*}" "${pair##*|}"
done

echo "done:"
find "$OUT" -name '*.webp' | sort
