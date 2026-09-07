"""
HeartBeat 360 — Speech AI Service
Hugging Face Inference API integration for voice-to-text transcription.
Uses OpenAI Whisper for speech recognition.
"""

import requests
import logging
from typing import Dict, Any, Optional

from backend.app.config import get_settings

logger = logging.getLogger("heartbeat360.ai.speech")


class SpeechAIService:
    """Handles voice/audio transcription via Hugging Face Inference API (Whisper)."""

    def __init__(self):
        self.settings = get_settings()
        self.api_url = f"{self.settings.hf_inference_url}/{self.settings.hf_speech_model}"
        self.headers = self.settings.hf_headers
        self.timeout = 60  # Audio processing can be slow

    def transcribe_audio(self, audio_bytes: bytes) -> Dict[str, Any]:
        """
        Transcribe an audio file to text using Whisper.
        
        Args:
            audio_bytes: Raw bytes of the uploaded audio file (WAV, MP3, FLAC, etc.)
            
        Returns:
            Dict with 'transcription', 'confidence', 'model_used', 'success'
        """
        try:
            response = requests.post(
                self.api_url,
                headers={**self.headers, "Content-Type": "audio/wav"},
                data=audio_bytes,
                timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                transcription = self._extract_transcription(result)
                return {
                    "transcription": transcription,
                    "confidence": 0.9,
                    "model_used": "HeartBeat Medical Audio Transcription Engine",
                    "success": True
                }
            elif response.status_code == 503:
                logger.warning(f"Speech model is loading: {response.json().get('error', 'Model loading')}")
                return {
                    "transcription": "",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Medical Audio Transcription Engine (loading)",
                    "success": False,
                    "error": "Speech recognition model is loading. Please wait 20-30 seconds and try again."
                }
            else:
                logger.error(f"HF Speech API error {response.status_code}: {response.text}")
                return {
                    "transcription": "",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Medical Audio Transcription Engine (error)",
                    "success": False,
                    "error": f"Speech processing error (HTTP {response.status_code})"
                }

        except requests.exceptions.Timeout:
            logger.error("HF Speech API timeout")
            return {
                "transcription": "",
                "confidence": 0.0,
                "model_used": "HeartBeat Medical Audio Transcription Engine (timeout)",
                "success": False,
                "error": "Audio transcription timed out. Try a shorter recording."
            }
        except Exception as e:
            logger.error(f"HF Speech AI error: {str(e)}")
            return {
                "transcription": "",
                "confidence": 0.0,
                "model_used": "HeartBeat Medical Audio Transcription Engine (error)",
                "success": False,
                "error": f"Speech service error: {str(e)}"
            }

    def transcribe_audio_nvidia(self, audio_bytes: bytes) -> Dict[str, Any]:
        """
        Transcribe voice audio using speech pipeline.
        Falls back to standard pipeline if endpoint is loading or unavailable.
        """
        nvidia_model = getattr(self.settings, 'hf_voice_speech_model', 'nvidia/canary-1b')
        nvidia_url = f"{self.settings.hf_inference_url}/{nvidia_model}"

        try:
            response = requests.post(
                nvidia_url,
                headers={**self.headers, "Content-Type": "audio/wav"},
                data=audio_bytes,
                timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                transcription = self._extract_transcription(result)
                if transcription:
                    return {
                        "transcription": transcription,
                        "confidence": 0.95,
                        "model_used": "HeartBeat Medical Audio Transcription Engine",
                        "success": True
                    }

            logger.info("Speech endpoint returned %s, falling back to standard audio pipeline", response.status_code)
            return self.transcribe_audio(audio_bytes)
        except Exception as e:
            logger.warning("NVIDIA HF speech call failed (%s), falling back to Whisper", str(e))
            return self.transcribe_audio(audio_bytes)

    def _extract_transcription(self, result) -> str:
        """Extract transcription text from Whisper API response."""
        if isinstance(result, dict):
            return result.get("text", "").strip()
        elif isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict):
                return result[0].get("text", "").strip()
            return str(result[0]).strip()
        return str(result).strip()

    def check_health(self) -> Dict[str, Any]:
        """Verify that the Hugging Face Speech AI service is accessible."""
        try:
            # Send a minimal WAV header as a health check
            # (44 bytes = minimal WAV with no audio data)
            minimal_wav = (
                b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00'
                b'\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00'
                b'\x02\x00\x10\x00data\x00\x00\x00\x00'
            )
            response = requests.post(
                self.api_url,
                headers={**self.headers, "Content-Type": "audio/wav"},
                data=minimal_wav,
                timeout=10
            )
            return {
                "service": "Speech AI",
                "model": self.settings.hf_speech_model,
                "status": "online" if response.status_code in [200, 503] else "error",
                "status_code": response.status_code,
                "loading": response.status_code == 503
            }
        except Exception as e:
            return {
                "service": "Speech AI",
                "model": self.settings.hf_speech_model,
                "status": "offline",
                "error": str(e)
            }
