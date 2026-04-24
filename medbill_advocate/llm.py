from openai import OpenAI

from medbill_advocate.config import ModelSettings
from medbill_advocate.prompts import (
    BILL_IMAGE_TRANSCRIPTION_SYSTEM_PROMPT,
    BILL_IMAGE_TRANSCRIPTION_USER_PROMPT,
    BILLING_ANALYST_SYSTEM_PROMPT,
    PATIENT_ADVOCATE_SYSTEM_PROMPT,
    build_analyst_prompt,
    build_patient_advocate_prompt,
)


def build_client(settings: ModelSettings) -> OpenAI:
    return OpenAI(api_key=settings.api_key.strip(), base_url=settings.base_url.strip())


def transcribe_bill_image(
    client: OpenAI,
    image_data_url: str,
    vision_model: str,
) -> str:
    response = client.chat.completions.create(
        model=vision_model,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": BILL_IMAGE_TRANSCRIPTION_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": BILL_IMAGE_TRANSCRIPTION_USER_PROMPT,
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url},
                    },
                ],
            },
        ],
    )
    return response.choices[0].message.content or ""


def analyze_bill(client: OpenAI, bill_text: str, text_model: str) -> str:
    response = client.chat.completions.create(
        model=text_model,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": BILLING_ANALYST_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": build_analyst_prompt(bill_text),
            },
        ],
    )
    return response.choices[0].message.content or ""


def create_patient_action_plan(
    client: OpenAI,
    analyst_findings: str,
    text_model: str,
) -> str:
    response = client.chat.completions.create(
        model=text_model,
        temperature=0.35,
        messages=[
            {
                "role": "system",
                "content": PATIENT_ADVOCATE_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": build_patient_advocate_prompt(analyst_findings),
            },
        ],
    )
    return response.choices[0].message.content or ""
