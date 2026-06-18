from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings

_s3_client = None


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            's3',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            config=Config(signature_version='s3v4'),
        )
    return _s3_client


def build_s3_key(worker_id: str, video_id: str, recorded_at: datetime | None = None) -> str:
    recorded = recorded_at or datetime.now(timezone.utc)
    if recorded.tzinfo is None:
        recorded = recorded.replace(tzinfo=timezone.utc)
    day = recorded.astimezone(timezone.utc).strftime('%Y-%m-%d')
    return f'worker_id={worker_id}/date={day}/video_id={video_id}.mp4'


def create_presigned_put_url(
    *,
    worker_id: str,
    video_id: str,
    content_type: str = 'video/mp4',
    recorded_at: datetime | None = None,
) -> tuple[str, str, int]:
    s3_key = build_s3_key(worker_id, video_id, recorded_at)
    client = get_s3_client()

    upload_url = client.generate_presigned_url(
        ClientMethod='put_object',
        Params={
            'Bucket': settings.s3_bucket_name,
            'Key': s3_key,
            'ContentType': content_type,
        },
        ExpiresIn=settings.presign_ttl_seconds,
    )

    return upload_url, s3_key, settings.presign_ttl_seconds
