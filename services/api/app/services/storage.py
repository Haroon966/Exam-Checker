from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Optional

import aiosqlite

from app.config import get_settings
from app.models.schemas import utc_now_iso


SCHEMA = """
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    answer_key_text TEXT NOT NULL DEFAULT '',
    max_score REAL NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    status TEXT NOT NULL,
    status_message TEXT NOT NULL DEFAULT '',
    ocr_text TEXT NOT NULL DEFAULT '',
    grade_json TEXT,
    suggested_score REAL,
    teacher_marks REAL,
    teacher_note TEXT NOT NULL DEFAULT '',
    ocr_provider_used TEXT NOT NULL DEFAULT '',
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS job_images (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
"""


class Storage:
    def __init__(self, db_path: Path | None = None) -> None:
        settings = get_settings()
        self.db_path = db_path or settings.db_path
        self.upload_dir = settings.uploads_path

    async def init(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def create_exam(
        self,
        title: str,
        subject: str = "",
        answer_key_text: str = "",
        max_score: float = 100.0,
    ) -> dict[str, Any]:
        exam_id = str(uuid.uuid4())
        created_at = utc_now_iso()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO exams (id, title, subject, answer_key_text, max_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (exam_id, title, subject, answer_key_text, max_score, created_at),
            )
            await db.commit()
        return {
            "id": exam_id,
            "title": title,
            "subject": subject,
            "answer_key_text": answer_key_text,
            "max_score": max_score,
            "created_at": created_at,
        }

    async def list_exams(self) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM exams ORDER BY created_at DESC"
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def get_exam(self, exam_id: str) -> Optional[dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM exams WHERE id = ?", (exam_id,))
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def update_exam(self, exam_id: str, **fields: Any) -> Optional[dict[str, Any]]:
        allowed = {"title", "subject", "answer_key_text", "max_score"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return await self.get_exam(exam_id)
        cols = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [exam_id]
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(f"UPDATE exams SET {cols} WHERE id = ?", values)
            await db.commit()
        return await self.get_exam(exam_id)

    async def create_job(self, exam_id: str, image_paths: list[str]) -> dict[str, Any]:
        job_id = str(uuid.uuid4())
        now = utc_now_iso()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO jobs (
                    id, exam_id, status, status_message, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (job_id, exam_id, "queued", "Waiting to start…", now, now),
            )
            for i, path in enumerate(image_paths):
                await db.execute(
                    """
                    INSERT INTO job_images (id, job_id, path, sort_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), job_id, path, i),
                )
            await db.commit()
        return await self.get_job(job_id)  # type: ignore[return-value]

    async def update_job(self, job_id: str, **fields: Any) -> Optional[dict[str, Any]]:
        allowed = {
            "status",
            "status_message",
            "ocr_text",
            "grade_json",
            "suggested_score",
            "teacher_marks",
            "teacher_note",
            "ocr_provider_used",
            "error",
        }
        updates = {k: v for k, v in fields.items() if k in allowed}
        if "grade_json" in updates and updates["grade_json"] is not None and not isinstance(
            updates["grade_json"], str
        ):
            updates["grade_json"] = json.dumps(updates["grade_json"])
        updates["updated_at"] = utc_now_iso()
        cols = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [job_id]
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(f"UPDATE jobs SET {cols} WHERE id = ?", values)
            await db.commit()
        return await self.get_job(job_id)

    async def get_job(self, job_id: str) -> Optional[dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """
                SELECT j.*, e.title AS exam_title
                FROM jobs j
                LEFT JOIN exams e ON e.id = j.exam_id
                WHERE j.id = ?
                """,
                (job_id,),
            )
            row = await cursor.fetchone()
            if not row:
                return None
            job = dict(row)
            img_cursor = await db.execute(
                "SELECT path, sort_order FROM job_images WHERE job_id = ? ORDER BY sort_order",
                (job_id,),
            )
            images = await img_cursor.fetchall()
            job["image_paths"] = [r["path"] for r in images]
            if job.get("grade_json") and isinstance(job["grade_json"], str):
                try:
                    job["grade_json"] = json.loads(job["grade_json"])
                except json.JSONDecodeError:
                    pass
            return job

    async def list_jobs(self, exam_id: Optional[str] = None) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            if exam_id:
                cursor = await db.execute(
                    """
                    SELECT j.*, e.title AS exam_title
                    FROM jobs j
                    LEFT JOIN exams e ON e.id = j.exam_id
                    WHERE j.exam_id = ?
                    ORDER BY j.created_at DESC
                    """,
                    (exam_id,),
                )
            else:
                cursor = await db.execute(
                    """
                    SELECT j.*, e.title AS exam_title
                    FROM jobs j
                    LEFT JOIN exams e ON e.id = j.exam_id
                    ORDER BY j.created_at DESC
                    """
                )
            rows = await cursor.fetchall()
            jobs: list[dict[str, Any]] = []
            for row in rows:
                job = dict(row)
                img_cursor = await db.execute(
                    "SELECT path FROM job_images WHERE job_id = ? ORDER BY sort_order",
                    (job["id"],),
                )
                images = await img_cursor.fetchall()
                job["image_paths"] = [r["path"] for r in images]
                if job.get("grade_json") and isinstance(job["grade_json"], str):
                    try:
                        job["grade_json"] = json.loads(job["grade_json"])
                    except json.JSONDecodeError:
                        pass
                jobs.append(job)
            return jobs


storage = Storage()
