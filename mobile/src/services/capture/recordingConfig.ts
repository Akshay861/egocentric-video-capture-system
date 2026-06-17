export const RECORDING_VIDEO_QUALITY = '720p' as const;

export const RESOLUTION_BY_QUALITY: Record<typeof RECORDING_VIDEO_QUALITY, string> = {
  '720p': '1280x720',
};
