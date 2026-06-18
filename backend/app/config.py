import logging
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    aws_region: str = 'ap-south-1'
    s3_bucket_name: str = 'locara-egocentric-videos-dev'
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    presign_ttl_seconds: int = Field(default=900, ge=60, le=3600)
    host: str = '0.0.0.0'
    port: int = 8000

    @field_validator('aws_access_key_id', 'aws_secret_access_key', mode='before')
    @classmethod
    def empty_string_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


settings = Settings()
