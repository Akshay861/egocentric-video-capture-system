import axios from 'axios';

import { env } from '../../config/env';
import { uploadConfig } from '../../config/upload';
import type { PresignUploadRequest, PresignUploadResponse } from '../../types/upload';

type PresignApiResponse = {
  upload_url: string;
  s3_key: string;
  bucket: string;
  expires_in: number;
  video_id: string;
  worker_id: string;
};

export async function requestPresignedUploadUrl(
  input: PresignUploadRequest
): Promise<PresignUploadResponse> {
  const response = await axios.post<PresignApiResponse>(
    `${env.apiBaseUrl}/presign-upload`,
    {
      worker_id: input.workerId,
      video_id: input.videoId,
      content_type: input.contentType ?? uploadConfig.videoContentType,
      started_at: input.startedAt,
    },
    {
      timeout: 15_000,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    uploadUrl: response.data.upload_url,
    s3Key: response.data.s3_key,
    bucket: response.data.bucket,
    expiresIn: response.data.expires_in,
    videoId: response.data.video_id,
    workerId: response.data.worker_id,
  };
}
