import type { UploadState, VideoRecord } from '../types/video';

export type VideoRow = {
  video_id: string;
  worker_id: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  file_size_bytes: number;
  fps: number;
  fps_tier: VideoRecord['fpsTier'];
  device_model: string;
  os_version: string;
  resolution: string;
  local_path: string;
  upload_state: UploadState;
  attempt_count: number;
  last_error: string | null;
  last_attempted_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

export function mapVideoRow(row: VideoRow): VideoRecord {
  return {
    videoId: row.video_id,
    workerId: row.worker_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMs: row.duration_ms,
    fileSizeBytes: row.file_size_bytes,
    fps: row.fps,
    fpsTier: row.fps_tier,
    deviceModel: row.device_model,
    osVersion: row.os_version,
    resolution: row.resolution,
    localPath: row.local_path,
    uploadState: row.upload_state,
    attemptCount: row.attempt_count,
    lastError: row.last_error,
    lastAttemptedAt: row.last_attempted_at,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
