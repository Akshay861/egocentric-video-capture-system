import { getDatabase } from './client';
import type { NewVideoRecordInput, UploadState, VideoRecord } from '../types/video';

type VideoRow = {
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

function mapVideoRow(row: VideoRow): VideoRecord {
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

export async function insertVideo(input: NewVideoRecordInput): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO videos (
        video_id,
        worker_id,
        started_at,
        ended_at,
        duration_ms,
        file_size_bytes,
        fps,
        fps_tier,
        device_model,
        os_version,
        resolution,
        local_path,
        upload_state,
        attempt_count,
        last_error,
        last_attempted_at,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.videoId,
    input.workerId,
    input.startedAt,
    input.endedAt,
    input.durationMs,
    input.fileSizeBytes,
    input.fps,
    input.fpsTier,
    input.deviceModel,
    input.osVersion,
    input.resolution,
    input.localPath,
    input.uploadState ?? 'pending',
    input.attemptCount ?? 0,
    input.lastError ?? null,
    input.lastAttemptedAt ?? null,
    input.metadataJson ?? null
  );
}

export async function countVideosByWorker(workerId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM videos WHERE worker_id = ?',
    workerId
  );

  return row?.total ?? 0;
}

export async function getLatestVideosByWorker(
  workerId: string,
  limit: number,
  offset: number
): Promise<VideoRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<VideoRow>(
    `
      SELECT *
      FROM videos
      WHERE worker_id = ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `,
    workerId,
    limit,
    offset
  );

  return rows.map(mapVideoRow);
}
