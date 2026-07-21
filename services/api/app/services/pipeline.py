from __future__ import annotations

import logging
from pathlib import Path

from app.services import grader, ocr
from app.services.storage import storage

logger = logging.getLogger(__name__)


async def process_job(job_id: str) -> None:
    job = await storage.get_job(job_id)
    if not job:
        logger.error("Job %s not found", job_id)
        return

    try:
        await storage.update_job(
            job_id,
            status="ocr",
            status_message="Running OCR (may take 1–2 min if the free Space is waking up)…",
            error=None,
        )
        image_paths = [Path(p) for p in job["image_paths"]]
        ocr_text, provider = await ocr.run_ocr(image_paths)
        await storage.update_job(
            job_id,
            status="grading",
            status_message="OCR done. Grading with AI…",
            ocr_text=ocr_text,
            ocr_provider_used=provider,
        )

        exam = await storage.get_exam(job["exam_id"])
        answer_key = (exam or {}).get("answer_key_text", "")
        max_score = float((exam or {}).get("max_score", 100))

        grade = await grader.grade_paper(
            ocr_text=ocr_text,
            answer_key_text=answer_key,
            max_score=max_score,
            ocr_provider_used=provider,
        )
        await storage.update_job(
            job_id,
            status="ready",
            status_message="Auto checks done — rate handwriting only",
            grade_json=grade.model_dump(),
            suggested_score=grade.suggested_score,
            ocr_provider_used=provider,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Job %s failed: %s", job_id, exc)
        await storage.update_job(
            job_id,
            status="error",
            status_message="Processing failed",
            error=str(exc),
        )


async def regrade_job(job_id: str, ocr_text: str) -> None:
    job = await storage.get_job(job_id)
    if not job:
        raise ValueError("Job not found")

    await storage.update_job(
        job_id,
        status="grading",
        status_message="Re-grading with edited OCR text…",
        ocr_text=ocr_text,
        error=None,
    )
    try:
        exam = await storage.get_exam(job["exam_id"])
        answer_key = (exam or {}).get("answer_key_text", "")
        max_score = float((exam or {}).get("max_score", 100))
        grade = await grader.grade_paper(
            ocr_text=ocr_text,
            answer_key_text=answer_key,
            max_score=max_score,
            ocr_provider_used=job.get("ocr_provider_used") or "edited",
        )
        await storage.update_job(
            job_id,
            status="ready",
            status_message="Auto checks done — rate handwriting only",
            grade_json=grade.model_dump(),
            suggested_score=grade.suggested_score,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Regrade %s failed: %s", job_id, exc)
        await storage.update_job(
            job_id,
            status="error",
            status_message="Re-grade failed",
            error=str(exc),
        )
        raise
