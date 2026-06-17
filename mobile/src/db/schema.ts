export const DATABASE_NAME = 'egocentric_capture.db';

export const CREATE_VIDEOS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL UNIQUE,
  worker_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  fps REAL NOT NULL,
  fps_tier TEXT NOT NULL CHECK (fps_tier IN ('low', 'standard', 'high')),
  device_model TEXT NOT NULL,
  os_version TEXT NOT NULL,
  resolution TEXT NOT NULL,
  local_path TEXT NOT NULL,
  upload_state TEXT NOT NULL CHECK (upload_state IN ('pending', 'uploading', 'uploaded', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempted_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const CREATE_INDEXES_SQL: string[] = [
  // Fast queue scans: fetch pending/failed rows by recency
  'CREATE INDEX IF NOT EXISTS idx_videos_upload_state_created_at ON videos(upload_state, created_at DESC);',
  // Fast dashboard/history views per worker
  'CREATE INDEX IF NOT EXISTS idx_videos_worker_started_at ON videos(worker_id, started_at DESC);',
  // Fast consistency checks / retries by last attempt time
  'CREATE INDEX IF NOT EXISTS idx_videos_last_attempted_at ON videos(last_attempted_at);',
];

export const CREATE_UPLOAD_EVENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS upload_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
);
`;
