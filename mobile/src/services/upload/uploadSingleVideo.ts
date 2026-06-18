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

type UploadCallbacks = {
  onUploading?: () => void;
};

export async function uploadSingleVideo(
  video: VideoRecord,
  callbacks: UploadCallbacks = {}
): Promise<'uploaded' | 'skipped' | 'failed'> {
  const claimed = await markUploading(video.videoId);
  if (!claimed) {
    return 'skipped';
  }

  callbacks.onUploading?.();

  try {
    const presign = await requestPresignedUploadUrl({
      workerId: video.workerId,
      videoId: video.videoId,
      startedAt: video.startedAt,
      contentType: uploadConfig.videoContentType,
    });

    if (presign.videoId !== video.videoId || presign.workerId !== video.workerId) {
      throw new Error('Presign response does not match requested video identity.');
    }

    const uploadResult = await uploadFileToPresignedUrl(
      video.localPath,
      presign.uploadUrl,
      uploadConfig.videoContentType
    );

    if (!uploadResult.etag) {
      throw new Error('Upload succeeded but S3 did not return an ETag for confirmation.');
    }

    const networkType = await getCurrentNetworkType();
    const metadataJson = mergeUploadMetadata(video.metadataJson, networkType, {
      s3Key: presign.s3Key,
      etag: uploadResult.etag,
      uploadedAt: new Date().toISOString(),
    });

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
