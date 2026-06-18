import { File } from 'expo-file-system';

import { uploadConfig } from '../../config/upload';

export interface S3UploadResult {
  etag: string | null;
  status: number;
}

export async function uploadFileToPresignedUrl(
  localPath: string,
  uploadUrl: string,
  contentType: string = uploadConfig.videoContentType
): Promise<S3UploadResult> {
  const file = new File(localPath);

  if (!file.exists) {
    throw new Error(`Local video file not found: ${localPath}`);
  }

  const result = await file.upload(uploadUrl, {
    httpMethod: 'PUT',
    mimeType: contentType,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `S3 upload failed (${result.status}): ${result.body || 'No response body'}`
    );
  }

  const etag = result.headers.etag ?? result.headers.ETag ?? null;
  return { etag, status: result.status };
}
