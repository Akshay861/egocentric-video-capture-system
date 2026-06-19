# Debug APK

**File:** `EgoCapture-debug.apk` (~162 MB)  
**Package:** `com.locara.egocentric.capture`  
**Min Android:** API 24 (Android 7.0) · **Target:** API 36  

## Tested on

- **Physical device:** Android phone over Wi‑Fi (same network as backend), standalone APK install  
- **Emulator:** Pixel 6 AVD (Android 14, API 34)  
- **Build machine:** Ubuntu, OpenJDK 17, Expo SDK 56  

## Install

```bash
adb install -r EgoCapture-debug.apk
```

Or copy the APK to a physical Android 10+ device and open it (enable “Install unknown apps” if prompted).

## Before using the app

1. Start the backend on your machine (`uvicorn` on port 8000).
2. **Emulator:** API URL is preconfigured as `http://10.0.2.2:8000`.
3. **Physical device:** set your computer’s LAN IP in `app.json` / rebuild, or use the same network and update `apiBaseUrl`.

**Login:** `worker@locara.com` or `+919876543210`

## Rebuild

```bash
cd mobile
npm run android:apk
```

Output is written to this folder.

**Important:** The build embeds the JavaScript bundle inside the APK so the app runs **without Metro / Expo dev server**. If the app shows a blank screen or “Unable to load script”, rebuild with `npm run android:apk` — do not use a debug build that expects port 8081.
