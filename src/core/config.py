from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "YouTube Project"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    # YouTube Data API
    YOUTUBE_API_KEY: Optional[str] = None
    YOUTUBE_API_SERVICE_NAME: str = "youtube"
    YOUTUBE_API_VERSION: str = "v3"
    
    # OAuth 2.0
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    OAUTH_REDIRECT_URI: Optional[str] = None  # OAuth 서비스에서 사용
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()