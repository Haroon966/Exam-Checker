from __future__ import annotations

import base64
import mimetypes
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

GROQ_BASE = "https://api.groq.com/openai/v1"


def _mime_for(path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "image/jpeg"


def image_to_data_url(path: Path) -> str:
    mime = _mime_for(path)
    data = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{data}"


async def groq_chat(
    messages: list[dict[str, Any]],
    *,
    model: str,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as client:
        resp = await client.post(
            f"{GROQ_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"Groq API {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        return (data["choices"][0]["message"]["content"] or "").strip()
