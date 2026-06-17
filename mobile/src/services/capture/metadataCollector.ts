import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

export interface RecordingStartMetadata {
  batteryLevelStart: number;
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

export async function collectRecordingStartMetadata(): Promise<RecordingStartMetadata> {
  const batteryLevelStart = await Battery.getBatteryLevelAsync();
  let gpsStart: RecordingStartMetadata['gpsStart'] = null;

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      gpsStart = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }
  } catch {
    gpsStart = null;
  }

  return { batteryLevelStart, gpsStart };
}

export async function collectBatteryLevelEnd(): Promise<number> {
  return Battery.getBatteryLevelAsync();
}
