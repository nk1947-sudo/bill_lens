import base64
import io
from typing import Optional
from typing import Protocol

import pdfplumber
from openai import OpenAI
from PIL import Image

from medbill_advocate.config import SUPPORTED_IMAGE_TYPES
from medbill_advocate.llm import transcribe_bill_image


class UploadedFileLike(Protocol):
    name: str
    type: Optional[str]

    def getvalue(self) -> bytes:
        ...


def get_file_extension(filename: Optional[str]) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def extract_pdf_text(uploaded_file: UploadedFileLike) -> str:
    try:
        with pdfplumber.open(uploaded_file) as pdf:
            page_text = []
            for page_number, page in enumerate(pdf.pages, start=1):
                text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
                if text.strip():
                    page_text.append(f"--- Page {page_number} ---\n{text.strip()}")
        return "\n\n".join(page_text).strip()
    except Exception as exc:
        raise RuntimeError(f"Could not read this PDF: {exc}") from exc


def image_to_data_url(uploaded_file: UploadedFileLike) -> str:
    try:
        image_bytes = uploaded_file.getvalue()
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        file_type = (uploaded_file.type or "image/png").lower()
        return f"data:{file_type};base64,{base64.b64encode(image_bytes).decode('utf-8')}"
    except Exception as exc:
        raise RuntimeError(f"Could not read this image: {exc}") from exc


def extract_uploaded_bill_text(
    uploaded_file: UploadedFileLike,
    client: OpenAI,
    vision_model: str,
) -> str:
    extension = get_file_extension(uploaded_file.name)
    if extension == "pdf":
        return extract_pdf_text(uploaded_file)
    if extension in SUPPORTED_IMAGE_TYPES:
        image_data_url = image_to_data_url(uploaded_file)
        return transcribe_bill_image(client, image_data_url, vision_model)
    raise RuntimeError("Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.")
