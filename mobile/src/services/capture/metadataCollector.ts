import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

const GPS_TIMEOUT_MS = 2000;

export interface RecordingStartMetadata {
  batteryLevelStart: number | null;
  gpsStart: { lat: number; lng: number } | null;
}

export interface DeviceMetadata {
  deviceModel: string;
  osVersion: string;
}

export async function collectDeviceMetadata(): Promise<DeviceMetadata> {
  return {
    deviceModel: Device.modelName ?? 'unknown',
    osVersion: Device.osVersion ?? 'unknown',
  };
}

async function collectGpsStart(): Promise<RecordingStartMetadata['gpsStart']> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), GPS_TIMEOUT_MS);
      }),
    ]);

    if (!position) {
      return null;
    }

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function warmUpLocationPermission(): Promise<void> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.granted || existing.canAskAgain === false) {
      return;
    }

    await Location.requestForegroundPermissionsAsync();
  } catch {
    // GPS is optional metadata.
  }
}

export async function collectRecordingStartMetadata(): Promise<RecordingStartMetadata> {
  const [batteryLevelStart, gpsStart] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    collectGpsStart(),
  ]);

  return {
    batteryLevelStart: normalizeBatteryLevel(batteryLevelStart),
    gpsStart,
  };
}

export function normalizeBatteryLevel(value: number): number | null {
  if (value < 0 || value > 1) {
    return null;
  }

  return value;
}

export async function collectBatteryLevelEnd(): Promise<number> {
  return Battery.getBatteryLevelAsync();
}
