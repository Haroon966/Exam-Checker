from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    hf_token: str = ""
    ocr_provider: str = "hf_space"  # hf_space | self_host | mock
    ocr_space_id: str = "baidu/Unlimited-OCR"
    ocr_base_url: str = "http://127.0.0.1:10000"
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    database_path: str = "./data/exam_checker.db"
    upload_dir: str = "./uploads"
    mock_ocr: bool = False
    mock_grade: bool = False

    @property
    def db_path(self) -> Path:
        return Path(self.database_path).resolve()

    @property
    def uploads_path(self) -> Path:
        return Path(self.upload_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
