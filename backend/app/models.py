from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


WORKER_ID_PATTERN = r'^[a-zA-Z0-9_-]{1,64}$'


class PresignUploadRequest(BaseModel):
    worker_id: str = Field(min_length=1, max_length=64)
    video_id: UUID
    content_type: Literal['video/mp4'] = 'video/mp4'
    started_at: datetime | None = None

    @field_validator('worker_id')
    @classmethod
    def validate_worker_id(cls, value: str) -> str:
        import re

        if not re.fullmatch(WORKER_ID_PATTERN, value):
            raise ValueError('worker_id contains invalid characters')
        return value


class PresignUploadResponse(BaseModel):
    upload_url: str
    s3_key: str
    bucket: str
    expires_in: int
    video_id: str
    worker_id: str
