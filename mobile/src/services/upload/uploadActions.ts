import { getVideoById } from '../../db/videoRepository';
import { resetFailedUploadForManualRetry } from '../../db/uploadRepository';
import { uploadQueueWorker } from './uploadQueueWorker';

export async function retryUpload(videoId: string): Promise<boolean> {
  const video = await getVideoById(videoId);
  if (!video) {
    return false;
  }

  if (video.uploadState === 'failed') {
    const reset = await resetFailedUploadForManualRetry(videoId);
    if (!reset) {
      return false;
    }
  } else if (video.uploadState !== 'pending') {
    return false;
  }

  uploadQueueWorker.wake();
  return true;
}
