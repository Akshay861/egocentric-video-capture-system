import { getDatabase } from './client';
import type { NewVideoRecordInput, VideoRecord } from '../types/video';
import { mapVideoRow, type VideoRow } from './videoRowMapper';

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

export async function getVideoById(videoId: string): Promise<VideoRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<VideoRow>(
    'SELECT * FROM videos WHERE video_id = ?',
    videoId
  );

  return row ? mapVideoRow(row) : null;
}

export async function deleteVideoById(videoId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM videos WHERE video_id = ?', videoId);
  return (result.changes ?? 0) > 0;
}
