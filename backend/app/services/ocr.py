import base64
import io
import pdfplumber
from PIL import Image
from openai import AsyncOpenAI
from app.core.config import settings


def _make_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.TOGETHER_API_KEY, base_url=settings.TOGETHER_BASE_URL)


async def extract_text_from_pdf(content: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)


async def extract_text_from_image(content: bytes, mime_type: str) -> str:
    b64 = base64.b64encode(content).decode()
    data_url = f"data:{mime_type};base64,{b64}"

    client = _make_client()
    response = await client.chat.completions.create(
        model=settings.EXTRACTION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                    {
                        "type": "text",
                        "text": (
                            "This is a medical bill. Extract ALL text from the image exactly as written, "
                            "preserving line structure, charge codes, amounts, and dates. "
                            "Return only the extracted text, no commentary."
                        ),
                    },
                ],
            }
        ],
        max_tokens=4096,
        temperature=0.0,
    )
    return response.choices[0].message.content or ""


async def extract_bill_text(content: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        text = await extract_text_from_pdf(content)
        if text.strip():
            return text
    return await extract_text_from_image(content, mime_type)
