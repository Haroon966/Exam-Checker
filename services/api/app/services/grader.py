from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from app.config import get_settings
from app.models.schemas import GradeResult
from app.services.groq_client import groq_chat

logger = logging.getLogger(__name__)

HANDWRITING_SHARE = 0.1  # 10% of max score reserved for teacher handwriting check


def handwriting_max_for(max_score: float) -> float:
    return round(max(5.0, max_score * HANDWRITING_SHARE), 1)


GRADE_SCHEMA_HINT = """
Return ONLY valid JSON matching this shape:
{
  "spelling_errors": [{"word": "", "suggestion": "", "context": ""}],
  "grammar_issues": [{"text": "", "suggestion": "", "context": ""}],
  "answer_feedback": [{
    "question_ref": "",
    "expected": "",
    "student": "",
    "verdict": "correct|partial|wrong",
    "comment": ""
  }],
  "summary": "",
  "auto_score": 0,
  "suggested_score": 0,
  "max_score": 100,
  "handwriting_max": 10
}
Rules:
- You fully auto-check spelling, grammar, and answer-key correctness.
- Do NOT score handwriting quality — the teacher will score that separately.
- auto_score / suggested_score must be between 0 and (max_score - handwriting_max) inclusive.
- handwriting_max is given in the prompt; copy it into the JSON.
- If an answer key is provided, compare student answers to it; never invent key answers.
- If no answer key, leave answer_feedback empty and score language quality only (still within auto max).
- Flag uncertain OCR in the summary when text looks garbled.
""".strip()


async def _mock_grade(ocr_text: str, answer_key: str, max_score: float) -> GradeResult:
    await asyncio.sleep(0.3)
    hw_max = handwriting_max_for(max_score)
    auto_max = max_score - hw_max
    has_key = bool(answer_key.strip())
    auto = round(auto_max * 0.75, 1)
    return GradeResult(
        spelling_errors=[
            {
                "word": "Photosinthesis",
                "suggestion": "Photosynthesis",
                "context": "sample mock error",
            }
        ],
        grammar_issues=[],
        answer_feedback=(
            [
                {
                    "question_ref": "Q1",
                    "expected": "light to chemical energy",
                    "student": ocr_text[:120],
                    "verdict": "partial",
                    "comment": "Mock partial match against key.",
                }
            ]
            if has_key
            else []
        ),
        summary="Auto-checked spelling, grammar, and answers. Teacher should rate handwriting only.",
        auto_score=auto,
        suggested_score=auto,
        max_score=max_score,
        handwriting_max=hw_max,
    )


def _parse_json_payload(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _normalize_grade(data: dict[str, Any], max_score: float) -> GradeResult:
    hw_max = handwriting_max_for(max_score)
    auto_max = max_score - hw_max
    result = GradeResult.model_validate(data)
    result.max_score = max_score
    result.handwriting_max = hw_max

    auto = result.auto_score
    if auto is None:
        auto = result.suggested_score
    if auto is None:
        auto = auto_max * 0.7
    auto = float(auto)
    auto = max(0.0, min(auto, auto_max))
    result.auto_score = round(auto, 1)
    result.suggested_score = result.auto_score
    return result


async def grade_paper(
    ocr_text: str,
    answer_key_text: str = "",
    max_score: float = 100.0,
    ocr_provider_used: str | None = None,
) -> GradeResult:
    settings = get_settings()
    hw_max = handwriting_max_for(max_score)
    auto_max = max_score - hw_max

    if settings.mock_grade or not settings.groq_api_key:
        if not settings.groq_api_key and not settings.mock_grade:
            logger.warning("No GROQ_API_KEY — using mock grader")
        result = await _mock_grade(ocr_text, answer_key_text, max_score)
        result.ocr_provider_used = ocr_provider_used
        return result

    user_prompt = (
        f"Total max score: {max_score}\n"
        f"Handwriting reserved for teacher: {hw_max}\n"
        f"Your auto_score max (content + language only): {auto_max}\n\n"
        f"ANSWER KEY (may be empty):\n{answer_key_text or '(none)'}\n\n"
        f"STUDENT PAPER (OCR):\n{ocr_text}\n\n"
        f"{GRADE_SCHEMA_HINT}"
    )

    try:
        raw = await groq_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are an exam grading assistant. Auto-check spelling, grammar, "
                        "and answers only. Never score handwriting. Respond with JSON only."
                    ),
                },
                {"role": "user", "content": user_prompt},
            ],
            model=settings.groq_model,
            temperature=0.2,
            max_tokens=4096,
            json_mode=True,
        )
        data = _parse_json_payload(raw or "{}")
        result = _normalize_grade(data, max_score)
        result.ocr_provider_used = ocr_provider_used
        return result
    except Exception as exc:  # noqa: BLE001
        logger.exception("Groq grading failed: %s", exc)
        return GradeResult(
            summary=f"AI grading failed ({exc}). You can still rate handwriting and save marks.",
            auto_score=None,
            suggested_score=None,
            max_score=max_score,
            handwriting_max=hw_max,
            ocr_provider_used=ocr_provider_used,
        )


HANDWRITING_RATINGS = {
    "excellent": 1.0,
    "good": 0.8,
    "fair": 0.5,
    "poor": 0.2,
}


def compute_final_marks(
    auto_score: float | None,
    handwriting_rating: str,
    max_score: float,
    handwriting_max: float | None = None,
) -> float:
    hw_max = handwriting_max if handwriting_max is not None else handwriting_max_for(max_score)
    auto_max = max_score - hw_max
    auto = 0.0 if auto_score is None else max(0.0, min(float(auto_score), auto_max))
    factor = HANDWRITING_RATINGS.get(handwriting_rating.lower().strip(), 0.5)
    hw_points = round(hw_max * factor, 1)
    return round(min(max_score, auto + hw_points), 1)
