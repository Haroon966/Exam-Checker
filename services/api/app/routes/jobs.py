from __future__ import annotations

import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.config import get_settings
from app.models.schemas import JobOut, MarksUpdate, RegradeRequest
from app.services import pipeline
from app.services.storage import storage

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_to_out(job: dict, request_base: str = "") -> JobOut:
    settings = get_settings()
    image_urls: list[str] = []
    for p in job.get("image_paths") or []:
        name = Path(p).name
        image_urls.append(f"/uploads/{name}")
    return JobOut(
        id=job["id"],
        exam_id=job["exam_id"],
        status=job["status"],
        status_message=job.get("status_message") or "",
        ocr_text=job.get("ocr_text") or "",
        grade_json=job.get("grade_json"),
        suggested_score=job.get("suggested_score"),
        teacher_marks=job.get("teacher_marks"),
        teacher_note=job.get("teacher_note") or "",
        ocr_provider_used=job.get("ocr_provider_used") or "",
        error=job.get("error"),
        created_at=job["created_at"],
        updated_at=job["updated_at"],
        image_urls=image_urls,
        exam_title=job.get("exam_title"),
    )


@router.post("", response_model=JobOut)
async def create_job(
    background_tasks: BackgroundTasks,
    exam_id: str = Form(...),
    images: list[UploadFile] = File(...),
) -> JobOut:
    exam = await storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(404, "Exam not found")
    if not images:
        raise HTTPException(400, "At least one image is required")

    settings = get_settings()
    settings.uploads_path.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    for upload in images:
        ext = Path(upload.filename or "photo.jpg").suffix or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        dest = settings.uploads_path / filename
        async with aiofiles.open(dest, "wb") as f:
            while chunk := await upload.read(1024 * 1024):
                await f.write(chunk)
        saved.append(str(dest))

    job = await storage.create_job(exam_id, saved)
    background_tasks.add_task(pipeline.process_job, job["id"])
    return _job_to_out(job)


@router.get("", response_model=list[JobOut])
async def list_jobs(exam_id: str | None = None) -> list[JobOut]:
    jobs = await storage.list_jobs(exam_id=exam_id)
    return [_job_to_out(j) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str) -> JobOut:
    job = await storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return _job_to_out(job)


@router.patch("/{job_id}/marks", response_model=JobOut)
async def set_marks(job_id: str, body: MarksUpdate) -> JobOut:
    from app.services.grader import compute_final_marks

    job = await storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] not in ("ready", "marked"):
        raise HTTPException(400, "Job is not ready for marks yet")

    grade = job.get("grade_json") or {}
    if isinstance(grade, str):
        import json

        try:
            grade = json.loads(grade)
        except json.JSONDecodeError:
            grade = {}

    max_score = float(grade.get("max_score") or 100)
    hw_max = grade.get("handwriting_max")
    auto_score = grade.get("auto_score")
    if auto_score is None:
        auto_score = grade.get("suggested_score")
    if auto_score is None:
        auto_score = job.get("suggested_score")

    note = body.teacher_note or ""
    if body.handwriting_rating:
        marks = compute_final_marks(
            auto_score=float(auto_score) if auto_score is not None else None,
            handwriting_rating=body.handwriting_rating,
            max_score=max_score,
            handwriting_max=float(hw_max) if hw_max is not None else None,
        )
        note = (note + f" | handwriting={body.handwriting_rating}").strip(" |")
    elif body.teacher_marks is not None:
        marks = float(body.teacher_marks)
    else:
        raise HTTPException(400, "Provide handwriting_rating or teacher_marks")

    updated = await storage.update_job(
        job_id,
        teacher_marks=marks,
        teacher_note=note,
        status="marked",
        status_message="Marks saved (auto checks + handwriting)",
    )
    return _job_to_out(updated)  # type: ignore[arg-type]


@router.post("/{job_id}/regrade", response_model=JobOut)
async def regrade(job_id: str, body: RegradeRequest, background_tasks: BackgroundTasks) -> JobOut:
    job = await storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if not body.ocr_text.strip():
        raise HTTPException(400, "ocr_text is required")

    await storage.update_job(
        job_id,
        ocr_text=body.ocr_text,
        status="grading",
        status_message="Re-grading with edited OCR text…",
    )
    background_tasks.add_task(pipeline.regrade_job, job_id, body.ocr_text)
    job = await storage.get_job(job_id)
    return _job_to_out(job)  # type: ignore[arg-type]
