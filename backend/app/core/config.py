from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "medbill_pro"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    TOGETHER_API_KEY: str = ""
    TOGETHER_BASE_URL: str = "https://api.together.xyz/v1"
    EXTRACTION_MODEL: str = "meta-llama/Llama-Vision-Free"
    ANALYSIS_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    ADVOCACY_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"

    DEMO_MODE: bool = False

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost"]'

    def get_cors_origins(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
