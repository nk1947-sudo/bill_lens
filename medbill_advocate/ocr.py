import importlib
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pdfplumber

from medbill_advocate.config import SUPPORTED_IMAGE_TYPES
from medbill_advocate.extraction import UploadedFileLike
from medbill_advocate.extraction import get_file_extension


@dataclass(frozen=True)
class OcrLine:
    text: str
    confidence: float | None = None
    bbox: list[list[float]] | None = None


@dataclass(frozen=True)
class OcrResult:
    text: str
    lines: list[OcrLine]
    engine: str


def extract_pdf_ocr(uploaded_file: UploadedFileLike) -> OcrResult:
    try:
        with pdfplumber.open(uploaded_file) as pdf:
            lines = []
            page_text = []
            for page_number, page in enumerate(pdf.pages, start=1):
                text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
                if text.strip():
                    page_text.append(f"--- Page {page_number} ---\n{text.strip()}")
                    for line in text.splitlines():
                        if line.strip():
                            lines.append(OcrLine(text=line.strip()))
        return OcrResult(
            text="\n\n".join(page_text).strip(),
            lines=lines,
            engine="pdfplumber",
        )
    except Exception as exc:
        raise RuntimeError(f"Could not read this PDF: {exc}") from exc


def extract_image_ocr(uploaded_file: UploadedFileLike) -> OcrResult:
    paddleocr_module = importlib.import_module("paddleocr")
    paddle_ocr = paddleocr_module.PaddleOCR
    suffix = Path(uploaded_file.name).suffix or ".png"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(uploaded_file.getvalue())
        temp_path = temp_file.name

    try:
        ocr = paddle_ocr(use_angle_cls=True, lang="en")
        raw_result = _run_paddle_ocr(ocr, temp_path)
        lines = _parse_paddle_result(raw_result)
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "PaddleOCR is not installed. Run `uv add paddleocr paddlepaddle` "
            "or use a text-based PDF."
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"PaddleOCR could not read this image: {exc}") from exc
    finally:
        Path(temp_path).unlink(missing_ok=True)

    return OcrResult(
        text="\n".join(line.text for line in lines).strip(),
        lines=lines,
        engine="PaddleOCR",
    )


def extract_uploaded_ocr(uploaded_file: UploadedFileLike) -> OcrResult:
    extension = get_file_extension(uploaded_file.name)
    if extension == "pdf":
        return extract_pdf_ocr(uploaded_file)
    if extension in SUPPORTED_IMAGE_TYPES:
        return extract_image_ocr(uploaded_file)
    raise RuntimeError("Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.")


def _run_paddle_ocr(ocr: Any, image_path: str) -> Any:
    if hasattr(ocr, "ocr"):
        return ocr.ocr(image_path, cls=True)
    if hasattr(ocr, "predict"):
        return ocr.predict(image_path)
    raise RuntimeError("Unsupported PaddleOCR API. Try updating the paddleocr package.")


def _parse_paddle_result(raw_result: Any) -> list[OcrLine]:
    lines = []
    for page_result in raw_result or []:
        if isinstance(page_result, dict):
            lines.extend(_parse_paddle_dict(page_result))
            continue
        if not page_result:
            continue
        for item in page_result:
            parsed_line = _parse_paddle_line(item)
            if parsed_line:
                lines.append(parsed_line)
    return lines


def _parse_paddle_dict(page_result: dict[str, Any]) -> list[OcrLine]:
    texts = page_result.get("rec_texts") or []
    scores = page_result.get("rec_scores") or []
    boxes = page_result.get("rec_polys") or page_result.get("dt_polys") or []
    lines = []
    for index, text in enumerate(texts):
        if not str(text).strip():
            continue
        confidence = float(scores[index]) if index < len(scores) else None
        bbox = boxes[index].tolist() if index < len(boxes) and hasattr(boxes[index], "tolist") else None
        lines.append(OcrLine(text=str(text).strip(), confidence=confidence, bbox=bbox))
    return lines


def _parse_paddle_line(item: Any) -> OcrLine | None:
    if not isinstance(item, (list, tuple)) or len(item) < 2:
        return None

    bbox = item[0]
    text_info = item[1]
    if not isinstance(text_info, (list, tuple)) or not text_info:
        return None

    text = str(text_info[0]).strip()
    if not text:
        return None

    confidence = None
    if len(text_info) > 1:
        confidence = float(text_info[1])

    return OcrLine(text=text, confidence=confidence, bbox=bbox)
