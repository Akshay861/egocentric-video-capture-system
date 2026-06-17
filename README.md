# egocentric-video-capture-system

Production-grade React Native video capture system with offline persistence, SQLite-backed upload queue, AWS S3 synchronization, and resilient retry mechanisms.

## Environment configuration

Each service has its own `.env.example`. **Do not merge them into one root file.**

| Service | Template | Real secrets file | Contains |
|---------|----------|-------------------|----------|
| Mobile (`mobile/`) | `mobile/.env.example` | `mobile/.env` (optional) | API URL, recording duration only |
| Backend (`backend/`) | `backend/.env.example` | `backend/.env` | AWS region, bucket, credentials, server port |

**Rules**

- AWS values (`AWS_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) live **only in the backend**.
- The mobile app never stores AWS secrets; it calls the backend for presigned URLs.
- Copy each template before running locally:
  - `cp backend/.env.example backend/.env`
  - `cp mobile/.env.example mobile/.env` (optional if using `app.json` `expo.extra`)
