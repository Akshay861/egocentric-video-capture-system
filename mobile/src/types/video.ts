export type UploadState = 'pending' | 'uploading' | 'uploaded' | 'failed';

export type FpsTier = 'low' | 'standard' | 'high';

export interface VideoRecord {
  videoId: string;
  workerId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  fileSizeBytes: number;
  fps: number;
  fpsTier: FpsTier;
  deviceModel: string;
  osVersion: string;
  resolution: string;
  localPath: string;
  uploadState: UploadState;
  attemptCount: number;
  lastError: string | null;
  lastAttemptedAt: string | null;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewVideoRecordInput
  extends Omit<
    VideoRecord,
    'uploadState' | 'attemptCount' | 'lastError' | 'lastAttemptedAt' | 'createdAt' | 'updatedAt'
  > {
  uploadState?: UploadState;
  attemptCount?: number;
  lastError?: string | null;
  lastAttemptedAt?: string | null;
  metadataJson?: string | null;
}
