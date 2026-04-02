#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "sudo not found. Run this script as root."
    exit 1
  fi
else
  SUDO=""
fi

if [[ "${ERDB_FONT_DOWNLOAD:-1}" == "0" ]]; then
  echo "Font download disabled (ERDB_FONT_DOWNLOAD=0)."
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update
  $SUDO apt-get install -y fontconfig fonts-dejavu fonts-freefont-ttf fonts-noto-core curl
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y fontconfig dejavu-fonts-all gnu-free-fonts google-noto-sans-fonts google-noto-serif-fonts curl
elif command -v pacman >/dev/null 2>&1; then
  $SUDO pacman -Sy --needed fontconfig ttf-dejavu gnu-free-fonts noto-fonts curl
elif command -v apk >/dev/null 2>&1; then
  $SUDO apk add --no-cache fontconfig ttf-dejavu ttf-freefont font-noto curl
else
  echo "Unsupported distro. Install fontconfig + DejaVu + FreeFont + Noto manually."
  exit 1
fi

FONT_DIR="/usr/local/share/fonts/erdb"
$SUDO mkdir -p "$FONT_DIR"

download_font() {
  local url="$1"
  local out="$2"
  if $SUDO curl -fsSL "$url" -o "$out"; then
    if [[ -s "$out" ]] && [[ $(stat -c%s "$out") -ge 10240 ]]; then
      return 0
    fi
    $SUDO rm -f "$out"
  fi
  return 1
}

download_first_available() {
  local out="$1"
  shift
  local url
  for url in "$@"; do
    if download_font "$url" "$out"; then
      echo "$url"
      return 0
    fi
  done
  return 1
}

install_target() {
  local label="$1"
  local filename="$2"
  shift 2
  local destination="$FONT_DIR/$filename"
  echo "Downloading $label..."
  if used_url="$(download_first_available "$destination" "$@")"; then
    echo "Downloaded $filename from $used_url"
    return 0
  fi
  echo "Download failed for $filename" >&2
  return 1
}

install_target "Spicy Sale" "spicy-sale.regular.ttf" \
  "https://st.1001fonts.net/download/font/spicy-sale.regular.ttf"

install_target "Somelist" "somelist.regular.ttf" \
  "https://st.1001fonts.net/download/font/somelist.regular.ttf"

install_target "Rubik Spray Paint" "RubikSprayPaint-Regular.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/rubikspraypaint/RubikSprayPaint-Regular.ttf"

install_target "Noto Sans" "NotoSans-Regular.ttf" \
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"

install_target "Noto Sans" "NotoSans-Bold.ttf" \
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf"

install_target "Noto Serif" "NotoSerif-Regular.ttf" \
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSerif/NotoSerif-Regular.ttf"

install_target "Noto Serif" "NotoSerif-Bold.ttf" \
  "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSerif/NotoSerif-Bold.ttf"

install_target "Nabla" "nabla.regular.ttf" \
  "https://st.1001fonts.net/download/font/nabla.regular.ttf"

install_target "Honk" "honk.regular.ttf" \
  "https://st.1001fonts.net/download/font/honk.regular.ttf"

install_target "Paper Scratch" "paper-scratch.regular.otf" \
  "https://st.1001fonts.net/download/font/paper-scratch.regular.otf"

install_target "Sludgeborn" "sludgeborn.regular.ttf" \
  "https://st.1001fonts.net/download/font/sludgeborn.regular.ttf"

install_target "Playgum" "playgum.regular.ttf" \
  "https://st.1001fonts.net/download/font/playgum.regular.ttf"

install_target "Atlas Memo" "atlasmemo.atlas-memo.ttf" \
  "https://st.1001fonts.net/download/font/atlasmemo.atlas-memo.ttf"

install_target "Dracutaz" "dracutaz.regular.ttf" \
  "https://st.1001fonts.net/download/font/dracutaz.regular.ttf"

install_target "Banana Chips" "banana-chips.regular.otf" \
  "https://st.1001fonts.net/download/font/banana-chips.regular.otf"

install_target "Holy Star" "holy-star.holy-star.ttf" \
  "https://st.1001fonts.net/download/font/holy-star.holy-star.ttf"

install_target "Rocks Serif" "rocks-serif.regular.ttf" \
  "https://st.1001fonts.net/download/font/rocks-serif.regular.ttf"

$SUDO fc-cache -f
echo "Fonts installed and cache refreshed."
