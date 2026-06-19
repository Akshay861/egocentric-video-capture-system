import Constants from 'expo-constants';
import * as Device from 'expo-device';

type ExtraConfig = {
  apiBaseUrl?: string;
  apiBaseUrlEmulator?: string;
  apiBaseUrlDevice?: string;
  maxRecordingDurationSeconds?: number;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

const DEFAULT_EMULATOR_API = 'http://10.0.2.2:8000';

function readMaxRecordingDuration(): number {
  const fromEnv = process.env.EXPO_PUBLIC_MAX_RECORDING_DURATION_SECONDS;
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return extra.maxRecordingDurationSeconds ?? 60;
}

function resolveApiBaseUrl(): string {
  const onPhysicalDevice = Device.isDevice === true;

  if (!onPhysicalDevice) {
    return (
      extra.apiBaseUrlEmulator ??
      process.env.EXPO_PUBLIC_EMULATOR_API_BASE_URL ??
      DEFAULT_EMULATOR_API
    );
  }

  return (
    process.env.EXPO_PUBLIC_DEVICE_API_BASE_URL ??
    extra.apiBaseUrlDevice ??
    extra.apiBaseUrl ??
    DEFAULT_EMULATOR_API
  );
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  maxRecordingDurationSeconds: readMaxRecordingDuration(),
};
