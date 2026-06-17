import { File } from 'expo-file-system';

import { uploadConfig } from '../../config/upload';

export async function uploadFileToPresignedUrl(
  localPath: string,
  uploadUrl: string,
  contentType: string = uploadConfig.videoContentType
): Promise<void> {
  const file = new File(localPath);

  if (!file.exists) {
    throw new Error(`Local video file not found: ${localPath}`);
  }

  const body = await file.arrayBuffer();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body,
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(
      `S3 upload failed (${response.status}): ${responseText || response.statusText}`
    );
  }
}
