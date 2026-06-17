import type { NetworkType } from '../../types/upload';

export async function getCurrentNetworkType(): Promise<NetworkType> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2_000);

    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return 'unknown';
    }

    // React Native fetch cannot reliably distinguish wifi vs cellular without NetInfo.
    // We return unknown here and can upgrade with @react-native-community/netinfo later.
    return 'unknown';
  } catch {
    return 'none';
  }
}
