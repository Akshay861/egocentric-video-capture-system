import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import PresignUploadRequest, PresignUploadResponse
from app.presign import create_presigned_put_url

logger = logging.getLogger(__name__)

app = FastAPI(title='Egocentric Upload API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/presign-upload', response_model=PresignUploadResponse)
def presign_upload(payload: PresignUploadRequest):
    try:
        upload_url, s3_key, expires_in = create_presigned_put_url(
            worker_id=payload.worker_id,
            video_id=str(payload.video_id),
            content_type=payload.content_type,
            recorded_at=payload.started_at,
        )
    except Exception as error:  # noqa: BLE001 - mapped to safe API error
        logger.exception('Failed to create presigned URL for video_id=%s', payload.video_id)
        raise HTTPException(
            status_code=500,
            detail='Unable to generate upload URL. Check backend AWS configuration.',
        ) from error

    return PresignUploadResponse(
        upload_url=upload_url,
        s3_key=s3_key,
        bucket=settings.s3_bucket_name,
        expires_in=expires_in,
        video_id=str(payload.video_id),
        worker_id=payload.worker_id,
    )
