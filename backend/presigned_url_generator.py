#!/usr/bin/env python3
"""
Standalone presigned URL generator for assignment bonus requirement.

Usage:
  python presigned_url_generator.py --worker-id worker_123 --video-id 550e8400-e29b-41d4-a716-446655440000
"""

from __future__ import annotations

import argparse

from app.config import settings
from app.presign import create_presigned_put_url


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate scoped S3 PUT presigned URL")
    parser.add_argument("--worker-id", required=True)
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--content-type", default="video/mp4")
    args = parser.parse_args()

    upload_url, s3_key, expires_in = create_presigned_put_url(
        worker_id=args.worker_id,
        video_id=args.video_id,
        content_type=args.content_type,
    )

    print(f"bucket={settings.s3_bucket_name}")
    print(f"s3_key={s3_key}")
    print(f"expires_in={expires_in}")
    print(f"upload_url={upload_url}")


if __name__ == "__main__":
    main()
