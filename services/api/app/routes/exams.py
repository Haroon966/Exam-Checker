from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ExamCreate, ExamOut, ExamUpdate
from app.services.storage import storage

router = APIRouter(prefix="/exams", tags=["exams"])


@router.post("", response_model=ExamOut)
async def create_exam(body: ExamCreate) -> ExamOut:
    exam = await storage.create_exam(
        title=body.title,
        subject=body.subject,
        answer_key_text=body.answer_key_text,
        max_score=body.max_score,
    )
    return ExamOut(**exam)


@router.get("", response_model=list[ExamOut])
async def list_exams() -> list[ExamOut]:
    exams = await storage.list_exams()
    return [ExamOut(**e) for e in exams]


@router.get("/{exam_id}", response_model=ExamOut)
async def get_exam(exam_id: str) -> ExamOut:
    exam = await storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(404, "Exam not found")
    return ExamOut(**exam)


@router.patch("/{exam_id}", response_model=ExamOut)
async def update_exam(exam_id: str, body: ExamUpdate) -> ExamOut:
    exam = await storage.update_exam(exam_id, **body.model_dump(exclude_unset=True))
    if not exam:
        raise HTTPException(404, "Exam not found")
    return ExamOut(**exam)
