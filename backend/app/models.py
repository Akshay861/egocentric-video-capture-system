from pydantic import BaseModel, Field


class PresignUploadRequest(BaseModel):
    worker_id: str = Field(min_length=1)
    video_id: str = Field(min_length=1)
    content_type: str = Field(default="video/mp4")


class PresignUploadResponse(BaseModel):
    upload_url: str
    s3_key: str
    bucket: str
    expires_in: int
    video_id: str
    worker_id: str
