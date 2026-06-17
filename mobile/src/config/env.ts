import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  maxRecordingDurationSeconds?: number;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const env = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://10.0.2.2:8000',
  maxRecordingDurationSeconds: extra.maxRecordingDurationSeconds ?? 60,
};
