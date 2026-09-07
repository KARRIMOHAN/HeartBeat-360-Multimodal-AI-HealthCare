"""
HeartBeat 360 — Application Configuration
Loads settings from .env file using Pydantic BaseSettings.
"""

import os
from typing import Optional
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Central configuration loaded from .env at project root."""

    # ── Hugging Face ──
    hf_api_token: str = Field(
        default_factory=lambda: os.getenv("HF_API_TOKEN") or os.getenv("HF_TOKEN") or "",
        description="Hugging Face API access token"
    )
    hf_provider: str = Field(default="auto", description="HF inference provider (auto, hf-inference, together, etc.)")

    # ── Model IDs ──
    hf_text_model: str = Field(default="meta-llama/Llama-3.1-8B-Instruct", description="HF model for text generation/Q&A")
    hf_vision_model: str = Field(default="Salesforce/blip-image-captioning-base", description="HF model for image captioning")
    hf_ocr_model: str = Field(default="microsoft/trocr-base-printed", description="HF model for OCR text extraction")
    hf_speech_model: str = Field(default="openai/whisper-small", description="HF model for speech-to-text")
    hf_voice_speech_model: str = Field(default="nvidia/canary-1b", description="NVIDIA Hugging Face model for voice speech-to-text")
    hf_voice_reasoning_model: str = Field(default="nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", description="NVIDIA Hugging Face model for conversational voice AI")
    # Qwen multimodal and reasoning models for Medical & Tablet Scanning
    hf_qwen_vl_model: str = Field(default="Qwen/Qwen2.5-VL-72B-Instruct", description="Qwen Vision-Language model for medical/tablet scans")
    hf_qwen_text_model: str = Field(default="Qwen/Qwen2.5-72B-Instruct", description="Qwen reasoning model for search query generation & synthesis")

    # ── Medical Web Search Providers (Tavily / Serper / Brave) ──
    search_provider: str = Field(default="auto", description="Active search provider: auto, tavily, serper, or brave")
    tavily_api_key: Optional[str] = Field(default=None, description="Tavily Search API Key")
    serper_api_key: Optional[str] = Field(default=None, description="Serper Search API Key")
    brave_search_api_key: Optional[str] = Field(default=None, description="Brave Search API Key")

    # ── Safety ──
    safety_confidence_threshold: float = Field(default=0.7, description="Minimum AI confidence for LOW risk tier")

    # ── Database ──
    database_url: str = Field(default="sqlite:///backend/app/db/heartbeat360.db")

    # ── Server ──
    api_host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    api_port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))

    @property
    def hf_inference_url(self) -> str:
        return "https://api-inference.huggingface.co/models"

    @property
    def hf_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.hf_api_token}"}

    model_config = {
        "env_file": os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"
        ),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Singleton accessor for application settings. Cached after first load."""
    return Settings()
