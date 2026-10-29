import os

class Settings:
    PROJECT_NAME: str = "APAAR-Verify: Student Data Management & Verification Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "apaar-verify-super-secure-secret-key-aicte-sih-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./apaar_verify.db")
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    CORS_ORIGINS: list[str] = ["*"]
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DIST_DIR: str = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")

settings = Settings()
