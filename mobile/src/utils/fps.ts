import type { FpsTier } from '../types/video';

export const DEFAULT_RECORDING_FPS = 30;

export function deriveFpsTier(fps: number): FpsTier {
  if (fps < 20) {
    return 'low';
  }

  if (fps > 30) {
    return 'high';
  }

  return 'standard';
}
