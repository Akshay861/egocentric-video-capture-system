import { resetFailedUploadForManualRetry } from '../db/uploadRepository';
import { uploadQueueWorker } from './uploadQueueWorker';

export async function retryFailedUpload(videoId: string): Promise<boolean> {
  const reset = await resetFailedUploadForManualRetry(videoId);
  if (reset) {
    uploadQueueWorker.wake();
  }

  return reset;
}
