import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


TOGETHER_BASE_URL = "https://api.together.xyz/v1"
TOGETHER_TEXT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
TOGETHER_VISION_MODEL = "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_TEXT_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

SUPPORTED_IMAGE_TYPES = {"png", "jpg", "jpeg"}
SUPPORTED_UPLOAD_TYPES = ["pdf", "png", "jpg", "jpeg"]


@dataclass(frozen=True)
class ProviderPreset:
    name: str
    base_url: str
    text_model: str
    vision_model: str


@dataclass(frozen=True)
class ModelSettings:
    api_key: str
    base_url: str
    text_model: str
    vision_model: str


PROVIDER_PRESETS = {
    "Together AI": ProviderPreset(
        name="Together AI",
        base_url=TOGETHER_BASE_URL,
        text_model=TOGETHER_TEXT_MODEL,
        vision_model=TOGETHER_VISION_MODEL,
    ),
    "Groq / Custom OpenAI-compatible": ProviderPreset(
        name="Groq / Custom OpenAI-compatible",
        base_url=GROQ_BASE_URL,
        text_model=GROQ_TEXT_MODEL,
        vision_model=GROQ_VISION_MODEL,
    ),
}


def env_default(name: str, fallback: str = "") -> str:
    return os.getenv(name, fallback).strip()


def default_settings_for_preset(preset: ProviderPreset) -> ModelSettings:
    return ModelSettings(
        api_key=env_default("MEDBILL_API_KEY"),
        base_url=env_default("MEDBILL_BASE_URL", preset.base_url),
        text_model=env_default("MEDBILL_TEXT_MODEL", preset.text_model),
        vision_model=env_default("MEDBILL_VISION_MODEL", preset.vision_model),
    )
