from __future__ import annotations

import asyncio
import base64
import logging
import mimetypes
from pathlib import Path
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class OcrError(Exception):
    pass


def _mime_for(path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "image/jpeg"


def _encode_data_url(path: Path) -> str:
    mime = _mime_for(path)
    data = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{data}"


async def _mock_ocr(image_paths: list[Path]) -> tuple[str, str]:
    await asyncio.sleep(0.5)
    pages = "\n\n".join(
        f"[Page {i + 1}] Sample OCR text from {p.name}.\n"
        "The student wrote: Photosynthesis converts light energy into chemical energy."
        for i, p in enumerate(image_paths)
    )
    return pages, "mock"


async def _ocr_hf_space(image_paths: list[Path], token: str, space_id: str) -> str:
    """Call Unlimited-OCR Hugging Face Space via Gradio client (blocking → thread)."""

    def _run() -> str:
        from gradio_client import Client, handle_file

        kwargs = {}
        if token:
            kwargs["hf_token"] = token
        client = Client(space_id, **kwargs)

        # Try common Space API patterns; Spaces may expose different endpoints.
        last_err: Exception | None = None
        for attempt in range(2):
            try:
                if len(image_paths) == 1:
                    result = client.predict(
                        handle_file(str(image_paths[0])),
                        "document parsing.",
                        api_name="/predict",
                    )
                else:
                    # Multi-page: concatenate single-page results if batch API unavailable
                    parts: list[str] = []
                    for i, path in enumerate(image_paths):
                        part = client.predict(
                            handle_file(str(path)),
                            "document parsing.",
                            api_name="/predict",
                        )
                        text = _extract_text(part)
                        parts.append(f"## Page {i + 1}\n\n{text}")
                    return "\n\n".join(parts)

                return _extract_text(result)
            except Exception as exc:  # noqa: BLE001
                last_err = exc
                logger.warning("HF Space OCR attempt %s failed: %s", attempt + 1, exc)
                if attempt == 0:
                    import time

                    time.sleep(8)  # allow cold start
        raise OcrError(f"HF Space OCR failed: {last_err}") from last_err

    return await asyncio.to_thread(_run)


def _extract_text(result: object) -> str:
    if result is None:
        return ""
    if isinstance(result, str):
        return result
    if isinstance(result, (list, tuple)):
        for item in result:
            if isinstance(item, str) and item.strip():
                return item
        return "\n".join(str(x) for x in result if x is not None)
    if isinstance(result, dict):
        for key in ("text", "output", "markdown", "result"):
            if key in result and result[key]:
                return str(result[key])
        return str(result)
    return str(result)


async def _ocr_self_host(image_paths: list[Path], base_url: str) -> str:
    """OpenAI-compatible self-hosted Unlimited-OCR (SGLang/vLLM)."""
    multi = len(image_paths) > 1
    prompt = "Multi page parsing." if multi else "document parsing."
    image_mode = "base" if multi else "gundam"
    ngram_window = 1024 if multi else 128

    content: list[dict] = [{"type": "text", "text": prompt}]
    for path in image_paths:
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": _encode_data_url(path)},
            }
        )

    payload = {
        "model": "Unlimited-OCR",
        "messages": [{"role": "user", "content": content}],
        "temperature": 0,
        "max_tokens": 8192,
        "stream": False,
        "images_config": {"image_mode": image_mode},
        "custom_params": {"ngram_size": 35, "window_size": ngram_window},
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0)) as client:
        # SGLang style
        try:
            resp = await client.post(
                f"{base_url.rstrip('/')}/v1/chat/completions",
                json={
                    **payload,
                    "skip_special_tokens": False,
                },
            )
            if resp.status_code >= 400:
                # vLLM style extra_body
                resp = await client.post(
                    f"{base_url.rstrip('/')}/v1/chat/completions",
                    json={
                        "model": "baidu/Unlimited-OCR",
                        "messages": [{"role": "user", "content": content}],
                        "temperature": 0,
                        "max_tokens": 8192,
                        "extra_body": {
                            "skip_special_tokens": False,
                            "vllm_xargs": {"ngram_size": 35, "window_size": ngram_window},
                        },
                    },
                )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"] or ""
        except Exception as exc:  # noqa: BLE001
            raise OcrError(f"Self-host OCR failed: {exc}") from exc


async def _ocr_groq_vision(image_paths: list[Path]) -> str:
    from app.services.groq_client import groq_chat, image_to_data_url

    settings = get_settings()
    if not settings.groq_api_key:
        raise OcrError("GROQ_API_KEY required for vision OCR fallback")

    content: list[dict] = [
        {
            "type": "text",
            "text": (
                "You are a document OCR engine. Extract all handwritten and printed text "
                "from these exam paper image(s). Preserve layout with markdown. "
                "Do not grade or correct — only transcribe faithfully."
            ),
        }
    ]
    for path in image_paths:
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": image_to_data_url(path)},
            }
        )

    try:
        return await groq_chat(
            [{"role": "user", "content": content}],
            model=settings.groq_vision_model,
            temperature=0,
            max_tokens=8192,
        )
    except Exception as exc:  # noqa: BLE001
        raise OcrError(f"Groq vision OCR failed: {exc}") from exc


async def run_ocr(image_paths: list[str | Path]) -> tuple[str, str]:
    """
    Returns (ocr_text, provider_used).
    Provider chain depends on OCR_PROVIDER; falls back to Groq vision on failure
    (unless mock).
    """
    settings = get_settings()
    paths = [Path(p) for p in image_paths]
    if not paths:
        raise OcrError("No images provided")

    if settings.mock_ocr or settings.ocr_provider == "mock":
        return await _mock_ocr(paths)

    provider = settings.ocr_provider.lower().strip()
    primary_error: Optional[Exception] = None

    try:
        if provider == "self_host":
            text = await _ocr_self_host(paths, settings.ocr_base_url)
            return text, "self_host"
        # default: hf_space
        text = await _ocr_hf_space(paths, settings.hf_token, settings.ocr_space_id)
        return text, "hf_space"
    except Exception as exc:  # noqa: BLE001
        primary_error = exc
        logger.warning("Primary OCR (%s) failed: %s — trying Groq vision fallback", provider, exc)

    try:
        text = await _ocr_groq_vision(paths)
        return text, "groq_vision_fallback"
    except Exception as fallback_exc:  # noqa: BLE001
        raise OcrError(
            f"OCR failed. Primary ({provider}): {primary_error}; "
            f"Fallback: {fallback_exc}"
        ) from fallback_exc
