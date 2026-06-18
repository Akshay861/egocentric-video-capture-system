import type { UploadState } from '../types/video';

export type CloudDisplayState = UploadState | 'preparing' | 'queued';

export type LocalStorageState = 'saved' | 'missing';

export const UPLOAD_STATE_LABELS: Record<UploadState, string> = {
  pending: 'Waiting',
  uploading: 'Uploading',
  uploaded: 'On cloud',
  failed: 'Failed',
};

export const CLOUD_DISPLAY_LABELS: Record<CloudDisplayState, string> = {
  pending: 'Pending',
  queued: 'In queue',
  preparing: 'Preparing',
  uploading: 'Uploading',
  uploaded: 'On cloud',
  failed: 'Upload failed',
};

export const LOCAL_STORAGE_LABELS: Record<LocalStorageState, string> = {
  saved: 'Saved on device',
  missing: 'File missing',
};

export const UPLOAD_STATE_COLORS: Record<UploadState, { background: string; text: string }> = {
  pending: { background: '#78350F', text: '#FDE68A' },
  uploading: { background: '#1E3A8A', text: '#BFDBFE' },
  uploaded: { background: '#14532D', text: '#BBF7D0' },
  failed: { background: '#7F1D1D', text: '#FECACA' },
};

export const CLOUD_DISPLAY_COLORS: Record<CloudDisplayState, { background: string; text: string }> = {
  pending: { background: '#78350F', text: '#FDE68A' },
  queued: { background: '#4B5563', text: '#E5E7EB' },
  preparing: { background: '#5B21B6', text: '#EDE9FE' },
  uploading: { background: '#1E3A8A', text: '#BFDBFE' },
  uploaded: { background: '#14532D', text: '#BBF7D0' },
  failed: { background: '#7F1D1D', text: '#FECACA' },
};

export const LOCAL_STORAGE_COLORS: Record<LocalStorageState, { background: string; text: string }> = {
  saved: { background: '#1F2937', text: '#A7F3D0' },
  missing: { background: '#7F1D1D', text: '#FECACA' },
};

export function resolveCloudDisplayState(
  uploadState: UploadState,
  videoId: string,
  preparingVideoId: string | null,
  uploadingVideoId: string | null,
  queueIsBusy: boolean
): CloudDisplayState {
  if (preparingVideoId === videoId) {
    return 'preparing';
  }

  if (uploadingVideoId === videoId || uploadState === 'uploading') {
    return 'uploading';
  }

  if (uploadState === 'pending' && queueIsBusy) {
    return 'queued';
  }

  return uploadState;
}

export function isQueueBusy(
  videos: Array<{ videoId: string; uploadState: UploadState }>,
  preparingVideoId: string | null,
  uploadingVideoId: string | null
): boolean {
  if (preparingVideoId || uploadingVideoId) {
    return true;
  }

  return videos.some((video) => video.uploadState === 'uploading');
}

export function canRetryUpload(uploadState: UploadState): boolean {
  return uploadState === 'failed' || uploadState === 'pending';
}
