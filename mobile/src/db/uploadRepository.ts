import { getDatabase } from './client';
import type { UploadState, VideoRecord } from '../types/video';
import { uploadConfig } from '../config/upload';
import { getRetryDelayMs, isReadyForRetry } from '../services/upload/backoff';

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

export async function recoverInterruptedUploads(): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      UPDATE videos
      SET upload_state = 'pending', updated_at = datetime('now')
      WHERE upload_state = 'uploading'
    `
  );

  return result.changes ?? 0;
}

export async function logUploadEvent(
  videoId: string,
  fromState: UploadState,
  toState: UploadState,
  errorMessage: string | null = null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO upload_events (video_id, from_state, to_state, error_message)
      VALUES (?, ?, ?, ?)
    `,
    videoId,
    fromState,
    toState,
    errorMessage
  );
}

export async function selectNextUploadCandidate(): Promise<VideoRecord | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<VideoRow>(
    `
      SELECT *
      FROM videos
      WHERE upload_state IN ('pending', 'failed')
      ORDER BY created_at ASC
    `
  );

  for (const row of rows) {
    const video = mapVideoRow(row);
    if (
      isReadyForRetry(
        video.uploadState as 'pending' | 'failed',
        video.attemptCount,
        video.lastAttemptedAt,
        uploadConfig.maxAttempts
      )
    ) {
      return video;
    }
  }

  return null;
}

export async function markUploading(videoId: string): Promise<boolean> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<{ upload_state: UploadState }>(
    'SELECT upload_state FROM videos WHERE video_id = ?',
    videoId
  );

  if (!current || !['pending', 'failed'].includes(current.upload_state)) {
    return false;
  }

  const fromState = current.upload_state;
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      UPDATE videos
      SET upload_state = 'uploading',
          last_attempted_at = ?,
          updated_at = datetime('now')
      WHERE video_id = ?
        AND upload_state IN ('pending', 'failed')
    `,
    now,
    videoId
  );

  if ((result.changes ?? 0) > 0) {
    await logUploadEvent(videoId, fromState, 'uploading');
    return true;
  }

  return false;
}

export async function markUploaded(videoId: string, metadataJson: string | null): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      UPDATE videos
      SET upload_state = 'uploaded',
          last_error = NULL,
          metadata_json = COALESCE(?, metadata_json),
          updated_at = datetime('now')
      WHERE video_id = ?
        AND upload_state = 'uploading'
    `,
    metadataJson,
    videoId
  );

  if ((result.changes ?? 0) > 0) {
    await logUploadEvent(videoId, 'uploading', 'uploaded');
    return true;
  }

  return false;
}

export async function markUploadFailed(videoId: string, errorMessage: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      UPDATE videos
      SET upload_state = 'failed',
          attempt_count = attempt_count + 1,
          last_error = ?,
          last_attempted_at = ?,
          updated_at = datetime('now')
      WHERE video_id = ?
        AND upload_state = 'uploading'
    `,
    errorMessage,
    new Date().toISOString(),
    videoId
  );

  if ((result.changes ?? 0) > 0) {
    await logUploadEvent(videoId, 'uploading', 'failed', errorMessage);
    return true;
  }

  return false;
}

export async function resetFailedUploadForManualRetry(videoId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      UPDATE videos
      SET upload_state = 'pending',
          last_error = NULL,
          updated_at = datetime('now')
      WHERE video_id = ?
        AND upload_state = 'failed'
    `,
    videoId
  );

  if ((result.changes ?? 0) > 0) {
    await logUploadEvent(videoId, 'failed', 'pending');
    return true;
  }

  return false;
}

export async function countUploadStates(workerId: string): Promise<Record<UploadState, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ upload_state: UploadState; total: number }>(
    `
      SELECT upload_state, COUNT(*) AS total
      FROM videos
      WHERE worker_id = ?
      GROUP BY upload_state
    `,
    workerId
  );

  return {
    pending: 0,
    uploading: 0,
    uploaded: 0,
    failed: 0,
    ...Object.fromEntries(rows.map((row) => [row.upload_state, row.total])),
  } as Record<UploadState, number>;
}

export async function getNextRetryDelayMs(): Promise<number | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<VideoRow>(
    `
      SELECT *
      FROM videos
      WHERE upload_state = 'failed'
      ORDER BY last_attempted_at ASC
    `
  );

  let minDelay: number | null = null;

  for (const row of rows) {
    const video = mapVideoRow(row);
    if (video.attemptCount >= uploadConfig.maxAttempts) {
      continue;
    }

    if (!video.lastAttemptedAt) {
      return 0;
    }

    const delay = Math.max(
      0,
      new Date(video.lastAttemptedAt).getTime() + getRetryDelayMs(video.attemptCount) - Date.now()
    );
    if (minDelay === null || delay < minDelay) {
      minDelay = delay;
    }
  }

  return minDelay;
}
