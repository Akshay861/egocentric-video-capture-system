import NetInfo from '@react-native-community/netinfo';

import type { NetworkType } from '../../types/upload';

export async function getCurrentNetworkType(): Promise<NetworkType> {
  try {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      return 'none';
    }

    switch (state.type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      default:
        return 'unknown';
    }
  } catch {
    return 'unknown';
  }
}
