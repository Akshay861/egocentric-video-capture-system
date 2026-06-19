# Technical Design Document

This document explains the underlying structure of EgoCapture — its architecture, data flows, database design, upload reliability, and scalability considerations. For AWS bucket structure, IAM policy, and costs, refer to INFRA.md.

## 1. System Overview

### EgoCapture is made up of two main components:

Component Role
Mobile application (Expo / React Native, TypeScript) Capture video, store locally, queue uploads, display library
Backend API (FastAPI, Python) Provide short-term S3 upload link — no video data is sent through the server

The phone never stores AWS credentials. All recordings are saved locally both on disk and in SQLite, and synced to the cloud when possible.
Architecture flow chart flowchart TB subgraph phone [Mobile App]
 Login[Login / SecureStore]
 Capture[Camera + Metadata]
 SQLite[(SQLite)]
 Worker[Upload Queue Worker]
 Library[Recording Library UI]

 Login --> Capture

 Capture --> SQLite

 Worker --> SQLite

 Library --> SQLite end

 subgraph server [Backend]
 API["POST /presign-upload"]
 Presign[build_s3_key + boto3]
 API --> Presign end

 S3[(AWS S3)]

 Worker -->|worker_id, video_id, started_at| API

 Worker -->|PUT video/mp4| S3

Mobile code structure mobile/src/ screens/ Login, Home, Capture, Recording Library services/ auth, capture, upload, video delete db/ schema, migrations, repositories components/ video cards, KPI tiles, player hooks/ upload queue stats for UI utils/ backoff, user messages, formatting


Data Flow: capture → database → queue → S3

1. Record
1. User clicks "Record" on the app and app generates a unique video_id (UUID v4).
2. The camera records until a user stops recording or until a maximum time limit of 60 seconds has been reached.
3. App gathers metadata about the video being recorded such as timestamps, device used to record as well as optional GPS and Battery level.

2. Store Locally
1. Video file created within the user's documents/videos folders with the filename {video_id}.mp4
2. An entry is created in an SQLite table with upload_state = "pending".
3. The upload worker is then notified to begin processing the queue of videos awaiting upload.

3. Upload (background)
1. If there is an active Wi-Fi connection, the upload worker will begin processing eligible videos based upon the following criteria: the oldest "Pending" video is given priority. Also if there is any failed attempt(s) for that worker to upload a video, they will be processed first in accordance with the older date/time of when uploaded vs. current date/time. Additionally, the app will show the user that the video is "Preparing" for 500 milliseconds then will show "Uploading."
2. As part processing of the upload queue each eligible video has been selected by the upload worker, the app will call the back-end service to perform a POST /presign-upload with the worker_id, video_id, and the time in which the upload process was started with.
3. The back-end service will return a presigned URL with the S3 bucket created with the unique S3 key path associated with the video being uploaded.
4. Upload the file to S3.
5. The app will receive an S3 ETag which is then used to update the "upload_state" for the corresponding row in the SQLite table to "uploaded" and in the metadata_json field will contain the S3 key path and the corresponding ETag.

State Machine: upload pending -----> uploading ----------> uploaded (terminal)

 |

 - ------> failed --------> manual/backoff retry -----------> pending

Safety Rules:
If the app is terminated prior to the video upload being completed, recoverInterruptedUploads() will be called when the app is restarted. At that time the state of all previously uploading videos will be load into a pending state.

markUploaded() will only be executed when the current state of the video being uploaded is uploading - confirmed.

• markUploading() uses a conditional update so that two processes cannot take the same row.
Each transition is recorded in upload_events for debugging purposes.

## 2. Database design

SQLite database: egocentric_capture.db (WAL mode, foreign keys on).
Table: videos
One row per recording. Main fields:
Field Purpose video_id UUID, unique, S3 idempotency key worker_id Identical to logged-in worker started_at, ended_at, duration_ms Recording window file_size_bytes, fps, fps_tier, resolution Media metadata local_path Local file on device upload_state pending · uploading · uploaded · failed attempt_count, last_error, last_attempted_at Retry counter metadata_json GPS, battery, S3 key, ETag, network type at upload

Table: upload_events
Append-only log: video_id, from_state, to_state, error_message, created_at.
Foreign key to videos(video_id) with ON DELETE CASCADE.

Retry mechanism, backoff and idempotency
Exponential backoff algorithm
Parameter Value
Delays 2s → 4s → 8s → 16s → 32s → 64s (with cap)
Maximum number of retries 6
Post max failures It stays failed until user touches Retry in library

Failed uploads obey last_attempted_at + backoff before being selected again in the queue.

Idempotency (no duplication of objects in S3)
 1. video_id is constant — created at recording time, never changed.
 2. S3 key is deterministic — worker_id={id}/date={YYYY-MM-DD}/video_id={uuid}.mp4 (see INFRA.md).

3. Retry uploads to the same key – retrying doesn't create a second object but writes to/updates the same path.
 4. State transitions are atomic – UPDATE ... WHERE upload_state IN ('pending', 'failed') to avoid processing twice.
Upload confirmation
S3 ETag returned upon successful upload – app trusts upload after that (in a production environment add S3 ObjectCreated → Lambda for ingestion logs, see INFRA.md Q4)

## 3. AWS infrastructure (summary)

Answers: INFRA.md
Decision topic
Storage One single S3 bucket per environment
Key structure worker_id → date → video_id.mp4
Security Pre-signed PUT URLs; 15 min TTL; IAM s3:PutObject permission only
Backend backend/app/presign.py and CLI presigned_url_generator.py

## 4. Scalability – what breaks first at 10,000 workers?

Assuming 10,000 workers*20 videos / day*~50MB ≈ 200,000 uploads/day and ~10TB added data/day.
Most likely bottlenecks (in the order):
Layer What will happen? Mitigation
1. S3 costs ~900TB after 90 days if nothing is archived Set up lifecycle rules → Glacier (INFRA.md Q3)
2. Presign API 200,000 POST requests/day is a modest amount for FastAPI with a small fleet Horizontally scale behind ALB, stateless API
3. SQLite for each device One device stores one worker’s rows – great for tens of thousands of local videos Pagination is already provided in library, optional archive-old-rows task
4. Device upload queue One upload per worker at a time – good for mobile bandwidth Already serial, nothing to be changed
5. Rate of S3 PUT requests 200k PUTs/day per prefix divided among workers – plenty under S3 limits Sharding by worker_id and date
6. Ingestion database assignment Works only with on-device state Needed production assignment requires Lambda and RDS/Dynamo with S3 events

Does not break easily
 • Write throughput to S3 – keys are distributed between workers and days.
 • Idempotence – video_id avoids duplicates.
 • Offline-first – workers record offline; drain upload queue when back online.

Other documentation
 • README.md – general information and how-to
 • INFRA.md – AWS Q1-Q5 (S3 bucket, IAM, costs, confirmation)
