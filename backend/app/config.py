from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    aws_region: str = "ap-south-1"
    s3_bucket_name: str = "locara-egocentric-videos-dev"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    presign_ttl_seconds: int = 900
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
