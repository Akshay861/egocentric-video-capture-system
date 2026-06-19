# AWS S3 Infrastructure Design

This document covers the production AWS architecture optimized for scaling a high-volume mobile ego-centric recording workforce.

---

## Q1 — S3 Bucket and Key Structure

### How would you organize storage for 10,000 workers uploading ~20 videos per day?

At this scale, you are looking at 2,00,000 new videos per day (~10 TB/day assuming ~50 MB per video). The prefix strategy must separate worker data, ensure blazing-fast S3 searches, and partition data evenly.

### Clean Key Format (Hive-Style)

Instead of flat listings, use folder-like directories grouping data by worker and date:

```text
uploads/worker_id=wrk_a1b2c3d4/date=2026-06-18/video_id=550e8400-e29b-41d4-a716-446655440000.mp4
```

* `uploads/` — Keeps your bucket clean of any other operational files.
* `worker_id=...` — Completely isolates worker uploads. Makes it trivial to delete, query, or audit one worker's data.
* `date=YYYY-MM-DD` — Spreads S3 index partition keys daily to keep object lifecycle transitions and S3 API listings lightning-fast.
* `video_id=...` — A UUID v4 generated on the device as a unique fingerprint. If an upload retries, it targets the same key, preventing duplicates.

### One Bucket vs. Several?

**Recommendation:** Use a single bucket per environment (e.g., `locara-videos-prod` and `locara-videos-staging`).

**Why?** One set of security policies, one master lifecycle scheme, and minimal operational overhead. S3 scales a single bucket up to thousands of write operations seamlessly—worker separation is handled cleanly through prefixes rather than introducing multiple buckets.

---

## Q2 — IAM, Security, and Presigned URLs

### What permissions does the presign service need?

To keep things secure, follow the Principle of Least Privilege. The backend generator server does not need to read, write, or list objects directly—it only needs permission to sign URLs that authorize the client to upload.

**Core Permission:**

* `s3:PutObject` (allows clients to upload their video)

**Optional Permissions:**

* `s3:GetObject` if workers need to review/stream their videos in the app.
* `s3:ListBucket` if the backend needs to confirm if a file truly exists.

### Minimal IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PresignerWorkforceUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::locara-videos-prod/uploads/worker_id=*/*"
    }
  ]
}
```

### Stopping Worker A from overwriting Worker B’s videos

We handle this with a 3-layer security system:

#### 1. Token Authentication

The worker must log in. The service automatically retrieves their authenticated `worker_id` server-side instead of relying on the client's self-reported ID.

#### 2. Deterministic Keys

The backend constructs the S3 target path itself (`uploads/worker_id=...`). The client is handed a presigned URL bound strictly to that unique path. Any attempt to write to another worker's folder is blocked by S3.

#### 3. Strict Path Validation

The backend API rejects anomalous requests before even requesting AWS to mint a URL.

### What TTL (Expiration) should the presigned URL have?

Use 15 Minutes (900 Seconds).

**Why?** It's the sweet spot. It gives mobile clients plenty of buffer for network handovers or slow cellular connections to upload a 50MB video, but expires fast enough to prevent misuse if a link gets intercepted.

---

## Q3 — Storage Cost & Lifecycle Savings

### Rough Monthly Cost (Day 90 of operation)

Assumptions: 10,000 workers × 20 videos/day = 200,000 videos/day. Averaging 50 MB each, that's 10 TB of new data daily.

### By Day 90

You are hosting:

* 18 million videos
* 900 TB of storage

### Without a Lifecycle Policy (Keeping everything in S3 Standard)

* S3 Standard Storage Cost: 900,000 GB × $0.023 ≈ **$20,700 / month**
* API PUT Charge (200k daily): 6,000,000 requests × pricing ≈ **$30 / month**

Total without cleanup: ~ $20,730/month

Storage becomes the dominant cost driver.

### Dynamic Storage Lifecycle Policy (Saves 70%+)

Egocentric field footage is usually only "hot" for immediate review or model training in the first few weeks, after which it is rarely touched.

| Age of Video  | AWS Storage Class             | Purpose                                        | Cost per GB |
| ------------- | ----------------------------- | ---------------------------------------------- | ----------- |
| 0 to 30 Days  | S3 Standard                   | Fast, latency-free access for active pipelines | $0.023      |
| 31 to 90 Days | S3 Glacier Flexible Retrieval | Archive storage for quiet indexing             | $0.0036     |
| 91+ Days      | S3 Glacier Deep Archive       | Long-term backup                               | $0.00099 |

By moving videos older than 30 and 90 days to their respective Glacier tiers, your monthly holding costs for older files plummet by up to 95%, reducing your overall steady-state storage bill drastically.

---

## Q4 — Knowing the Upload Succeeded

To track and prove a file arrived safely in S3, use a **Double Health-Check Flow**.

### 1. Client-Side Proof (Immediate Feedback)

* The phone uploads the video file directly to the S3 URL using a standard PUT.
* S3 responds with a `200 OK` and an `ETag` (the MD5 checksum fingerprint of the uploaded file).
* Upon seeing the ETag, the app instantly updates the offline database (SQLite) from pending to uploaded and records the ETag value.

### 2. Server-Side Proof (Source of Truth)

* **S3 Event Notification:** As soon as the upload completes, S3 triggers an AWS Lambda function automatically.
* **Database Sync:** The Lambda publishes the record to your master server DB.

This avoids forcing the phone to perform costly API callback round-trips over flaky mobile networks. S3 notifies your system on its own background pipeline.

---

## Q5 — Interactive URL Generator CLI

Here is a working, production-ready CLI command to sign upload paths manually without calling the API:

```bash
# 1. Install AWS SDK CLI
pip install boto3

# 2. Run the secure signer script
python generate_upload_url.py \
  --bucket "locara-videos-prod" \
  --worker "worker_88af12" \
  --video "550e8400-e29b-41d4-a716-446655440000" \
  --ttl 900
```

The script verifies parameters and outputs a ready-to-use curl target line:

```bash
curl -X PUT -T "video.mp4" "https://locara-videos-prod.s3.amazonaws.com/uploads/worker_id=...&Signature=..."
```

---