# app/core/config.py

from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    # API metadata
    PROJECT_NAME: str = "Nature Photography Competition Judge API"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Image storage
    IMAGE_DIR: Path = Path("uploaded_photos")

    # API Keys 
    TAVILY_API_KEY: str | None = os.getenv("TAVILY_API_KEY")
    GOOGLE_API_KEY: str | None = os.getenv("GOOGLE_API_KEY")

    # Model spec
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-lite-preview-06-17"
    MODEL_TEMPERATURE: float = 0.1

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure the image directory exists
settings.IMAGE_DIR.mkdir(exist_ok=True)