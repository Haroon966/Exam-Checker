from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ExamCreate(BaseModel):
    title: str
    subject: str = ""
    answer_key_text: str = ""
    max_score: float = 100.0


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    answer_key_text: Optional[str] = None
    max_score: Optional[float] = None


class ExamOut(BaseModel):
    id: str
    title: str
    subject: str
    answer_key_text: str
    max_score: float
    created_at: str


class MarksUpdate(BaseModel):
    teacher_marks: float | None = None
    teacher_note: str = ""
    handwriting_rating: str | None = None  # excellent | good | fair | poor


class RegradeRequest(BaseModel):
    ocr_text: str


class SpellingError(BaseModel):
    word: str
    suggestion: str
    context: str = ""


class GrammarIssue(BaseModel):
    text: str
    suggestion: str
    context: str = ""


class AnswerFeedback(BaseModel):
    question_ref: str
    expected: str = ""
    student: str = ""
    verdict: str = Field(description="correct | partial | wrong")
    comment: str = ""


class GradeResult(BaseModel):
    spelling_errors: list[SpellingError] = Field(default_factory=list)
    grammar_issues: list[GrammarIssue] = Field(default_factory=list)
    answer_feedback: list[AnswerFeedback] = Field(default_factory=list)
    summary: str = ""
    auto_score: float | None = None
    suggested_score: float | None = None
    max_score: float | None = None
    handwriting_max: float | None = None
    ocr_provider_used: str | None = None


class JobOut(BaseModel):
    id: str
    exam_id: str
    status: str
    status_message: str = ""
    ocr_text: str = ""
    grade_json: dict[str, Any] | None = None
    suggested_score: float | None = None
    teacher_marks: float | None = None
    teacher_note: str = ""
    ocr_provider_used: str = ""
    error: str | None = None
    created_at: str
    updated_at: str
    image_urls: list[str] = Field(default_factory=list)
    exam_title: str | None = None
