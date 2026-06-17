import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  maxRecordingDurationSeconds?: number;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

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

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? 'http://10.0.2.2:8000',
  maxRecordingDurationSeconds: readMaxRecordingDuration(),
};
