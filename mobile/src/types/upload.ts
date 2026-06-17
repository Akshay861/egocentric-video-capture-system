export interface PresignUploadRequest {
  workerId: string;
  videoId: string;
  contentType: string;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  s3Key: string;
  bucket: string;
  expiresIn: number;
  videoId: string;
  workerId: string;
}

export type NetworkType = 'wifi' | 'cellular' | 'none' | 'unknown';
