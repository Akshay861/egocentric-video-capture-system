#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${EXPO_PORT:-8081}"

if ! adb devices | awk 'NR>1 && $2=="device" { found=1 } END { exit !found }'; then
  echo "No emulator connected."
  exit 1
fi

adb reverse "tcp:${PORT}" "tcp:${PORT}"
URL="exp://127.0.0.1:${PORT}"

echo "Opening ${URL} in Expo Go..."
adb shell am start -a android.intent.action.VIEW -d "$URL" host.exp.exponent
