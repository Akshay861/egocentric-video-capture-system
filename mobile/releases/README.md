# Debug APK

**File:** `EgoCapture-debug.apk` (~166 MB)  
**Package:** `com.locara.egocentric.capture`  
**Min Android:** API 24 (Android 7.0) · **Target:** API 36  

## One APK — emulator and physical phone

The app **automatically** picks the backend URL:

| Where you run the app | Backend URL used |
|-----------------------|------------------|
| **Android emulator** | `http://10.0.2.2:8000` (your PC from the emulator) |
| **Physical phone** | Your PC’s LAN IP (set when the APK was built) |

Rebuild before sharing so the phone URL matches your Wi‑Fi:

```bash
cd mobile
npm run android:apk
```

The build script detects your LAN IP and embeds it for physical devices.

## Tested on

- **Physical device:** Android phone on same Wi‑Fi as backend  
- **Emulator:** Pixel 6 AVD (Android 14, API 34)  

## Install

```bash
adb install -r EgoCapture-debug.apk
```

Or copy the APK to the phone and open it (enable “Install unknown apps” if prompted).

## Before testing

1. Start backend on your PC:
   ```bash
   cd backend && source .venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Emulator:** no extra config — uses `10.0.2.2:8000`.
3. **Physical phone:** same Wi‑Fi as PC; APK must be built on that PC (`npm run android:apk`).
4. Allow camera, microphone, and location when asked.

**Login:** `worker@locara.com` or `+919876543210`

## Rebuild

```bash
cd mobile
npm run android:apk
```

Override LAN IP manually if needed:

```bash
DEVICE_API_HOST=192.168.1.50 npm run android:apk
```

The JS bundle is embedded — **no Metro / Expo dev server** required after install.
