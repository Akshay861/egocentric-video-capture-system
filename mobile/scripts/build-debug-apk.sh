#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export NODE_ENV=production

echo "==> Generating native Android project (if needed)..."
npx expo prebuild --platform android --no-install

GRADLE_FILE="android/app/build.gradle"
if ! grep -q 'debuggableVariants = \[\]' "$GRADLE_FILE"; then
  echo "==> Configuring Gradle to embed JS bundle in debug APK..."
  sed -i '/bundleCommand = "export:embed"/a\
\
    // Standalone APK: embed JS bundle instead of requiring Metro on :8081\
    debuggableVariants = []' "$GRADLE_FILE"
fi

echo "==> Building standalone debug APK (JS bundled inside)..."
cd android
./gradlew assembleDebug --no-daemon

APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="../releases/EgoCapture-debug.apk"

mkdir -p ../releases
cp "$APK_SRC" "$APK_DEST"

echo ""
echo "==> Standalone debug APK ready (no Metro server required):"
echo "    mobile/releases/EgoCapture-debug.apk"
echo ""
echo "Install:"
echo "    adb install -r releases/EgoCapture-debug.apk"
