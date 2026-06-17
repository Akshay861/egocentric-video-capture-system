import {
  markUploadFailed,
  markUploaded,
  markUploading,
} from '../../db/uploadRepository';
import { uploadConfig } from '../../config/upload';
import type { VideoRecord } from '../../types/video';
import { mergeUploadMetadata } from './metadata';
import { getCurrentNetworkType } from './networkInfo';
import { requestPresignedUploadUrl } from './presignClient';
import { uploadFileToPresignedUrl } from './s3Uploader';

export async function uploadSingleVideo(video: VideoRecord): Promise<'uploaded' | 'skipped' | 'failed'> {
  const claimed = await markUploading(video.videoId);
  if (!claimed) {
    return 'skipped';
  }

  try {
    const presign = await requestPresignedUploadUrl({
      workerId: video.workerId,
      videoId: video.videoId,
      contentType: uploadConfig.videoContentType,
    });

    if (presign.videoId !== video.videoId || presign.workerId !== video.workerId) {
      throw new Error('Presign response does not match requested video identity.');
    }

    await uploadFileToPresignedUrl(video.localPath, presign.uploadUrl, uploadConfig.videoContentType);

    const networkType = await getCurrentNetworkType();
    const metadataJson = mergeUploadMetadata(video.metadataJson, networkType);
    const uploaded = await markUploaded(video.videoId, metadataJson);

    if (!uploaded) {
      throw new Error('Upload completed but database state transition was rejected.');
    }

    return 'uploaded';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    await markUploadFailed(video.videoId, message);
    return 'failed';
  }
}
