from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routes import exams, jobs
from app.services.storage import storage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    settings.uploads_path.mkdir(parents=True, exist_ok=True)
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    await storage.init()
    logger.info(
        "Exam Checker API ready (OCR_PROVIDER=%s, mock_ocr=%s)",
        settings.ocr_provider,
        settings.mock_ocr,
    )
    yield


app = FastAPI(title="Exam Checker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exams.router)
app.include_router(jobs.router)

settings = get_settings()
settings.uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.uploads_path)), name="uploads")


@app.get("/health")
async def health():
    s = get_settings()
    return {
        "ok": True,
        "ocr_provider": s.ocr_provider,
        "mock_ocr": s.mock_ocr,
        "mock_grade": s.mock_grade,
        "has_groq_key": bool(s.groq_api_key),
        "groq_model": s.groq_model,
        "has_hf_token": bool(s.hf_token),
    }
