#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${EXPO_PORT:-8081}"
AVD_NAME="${ANDROID_AVD:-Pixel_6}"
SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
ADB="${SDK_ROOT}/platform-tools/adb"
EMULATOR="${SDK_ROOT}/emulator/emulator"
EXPO_GO_APK="${EXPO_GO_APK:-$HOME/.expo/android-apk-cache/Expo-Go-56.0.1.apk}"
BOOT_TIMEOUT_SECONDS="${ANDROID_BOOT_TIMEOUT_SECONDS:-180}"

has_device() {
  "$ADB" devices | awk 'NR>1 && $2=="device" { found=1 } END { exit !found }'
}

is_boot_completed() {
  [[ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]
}

wait_for_device() {
  local elapsed=0
  echo "==> Waiting for emulator to boot (up to ${BOOT_TIMEOUT_SECONDS}s)..."
  while ! has_device || ! is_boot_completed; do
    if (( elapsed >= BOOT_TIMEOUT_SECONDS )); then
      echo ""
      echo "Timed out waiting for an Android device."
      echo "Start the emulator manually, then rerun:"
      echo "  npm run android"
      echo ""
      echo "Manual start:"
      echo "  \$HOME/Android/Sdk/emulator/emulator -avd ${AVD_NAME} &"
      exit 1
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  echo "==> Emulator ready."
}

start_emulator_if_needed() {
  if has_device; then
    return
  fi

  if [[ ! -x "$EMULATOR" ]]; then
    echo "Android emulator binary not found at: $EMULATOR"
    exit 1
  fi

  if ! "$EMULATOR" -list-avds | grep -qx "$AVD_NAME"; then
    echo "No running device and AVD '${AVD_NAME}' was not found."
    echo "Create an AVD in Android Studio, or set ANDROID_AVD to an existing name."
    exit 1
  fi

  echo "==> No emulator detected. Starting '${AVD_NAME}'..."
  "$EMULATOR" -avd "$AVD_NAME" -no-snapshot-load -gpu swiftshader_indirect >/tmp/egocapture-emulator.log 2>&1 &
  wait_for_device
}

ensure_expo_go() {
  if "$ADB" shell pm list packages 2>/dev/null | grep -q 'host.exp.exponent'; then
    return
  fi

  if [[ ! -f "$EXPO_GO_APK" ]]; then
    echo ""
    echo "Expo Go is not installed and no APK was found at:"
    echo "  $EXPO_GO_APK"
    echo "Install Expo Go from the Play Store on the emulator, then rerun."
    exit 1
  fi

  echo "==> Installing Expo Go..."
  if ! "$ADB" install -r "$EXPO_GO_APK"; then
    echo ""
    echo "Expo Go install failed. Wait for the emulator home screen, then run:"
    echo "  npm run android:open"
    exit 1
  fi
  echo "==> Expo Go installed."
}

stop_stale_metro() {
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -t -i:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid="$(fuser "${PORT}/tcp" 2>/dev/null || true)"
  fi

  if [[ -n "$pid" ]]; then
    echo "==> Stopping stale Metro process on port ${PORT}..."
    kill $pid 2>/dev/null || true
    sleep 1
  fi
}

setup_port_forwarding() {
  echo "==> Forwarding Metro port ${PORT}..."
  "$ADB" reverse --remove-all >/dev/null 2>&1 || true
  "$ADB" reverse "tcp:${PORT}" "tcp:${PORT}"
}

echo "==> Checking Android device/emulator..."
start_emulator_if_needed
ensure_expo_go
setup_port_forwarding
stop_stale_metro

echo "==> Starting Expo and opening on Android..."
export REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1
exec npx expo start --localhost --go --clear --android "$@"
