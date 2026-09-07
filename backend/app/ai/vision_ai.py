"""
HeartBeat 360 — Vision AI Service
Hugging Face Inference API integration for medical image analysis and OCR.
Uses BLIP for image captioning and TrOCR for text extraction.
"""

import requests
import logging
import base64
from typing import Dict, Any, Optional

from backend.app.config import get_settings

logger = logging.getLogger("heartbeat360.ai.vision")


class VisionAIService:
    """Handles image analysis, captioning, and OCR via Hugging Face Inference API."""

    def __init__(self):
        self.settings = get_settings()
        self.caption_url = f"{self.settings.hf_inference_url}/{self.settings.hf_vision_model}"
        self.ocr_url = f"{self.settings.hf_inference_url}/{self.settings.hf_ocr_model}"
        self.headers = self.settings.hf_headers
        self.timeout = 45  # Vision models can be slower

    def analyze_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze a medical image and generate a descriptive caption.
        Uses BLIP image-captioning model.
        
        Args:
            image_bytes: Raw bytes of the uploaded image
            
        Returns:
            Dict with 'caption', 'confidence', 'model_used', 'success'
        """
        try:
            response = requests.post(
                self.caption_url,
                headers={**self.headers, "Content-Type": "application/octet-stream"},
                data=image_bytes,
                timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                caption = self._extract_caption(result)
                return {
                    "caption": caption,
                    "analysis": f"Image Analysis: {caption}",
                    "confidence": self._extract_confidence(result),
                    "model_used": "HeartBeat Vision Diagnostic Engine",
                    "success": True
                }
            elif response.status_code == 503:
                logger.warning(f"Vision model is loading: {response.json().get('error', 'Model loading')}")
                return {
                    "caption": "Image received. Vision diagnostic model is currently loading — please retry in 20-30 seconds.",
                    "analysis": "Model loading — analysis pending.",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Vision Diagnostic Engine (loading)",
                    "success": False
                }
            else:
                logger.error(f"HF Vision API error {response.status_code}: {response.text}")
                return {
                    "caption": "Unable to analyze image at this time.",
                    "analysis": "Vision service temporarily unavailable.",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Vision Diagnostic Engine (error)",
                    "success": False
                }

        except requests.exceptions.Timeout:
            logger.error("HF Vision API timeout")
            return {
                "caption": "Image analysis timed out. The image may be too large.",
                "analysis": "Timeout — try a smaller image or retry later.",
                "confidence": 0.0,
                "model_used": "HeartBeat Vision Diagnostic Engine (timeout)",
                "success": False
            }
        except Exception as e:
            logger.error(f"HF Vision AI error: {str(e)}")
            return {
                "caption": "An error occurred during image analysis.",
                "analysis": f"Error: {str(e)}",
                "confidence": 0.0,
                "model_used": "HeartBeat Vision Diagnostic Engine (error)",
                "success": False
            }

    def extract_text_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from an image using clinical OCR.
        Used for medicine label reading and lab report text extraction.
        
        Args:
            image_bytes: Raw bytes of the uploaded image
            
        Returns:
            Dict with 'extracted_text', 'confidence', 'model_used', 'success'
        """
        try:
            response = requests.post(
                self.ocr_url,
                headers={**self.headers, "Content-Type": "application/octet-stream"},
                data=image_bytes,
                timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                extracted_text = self._extract_ocr_text(result)
                return {
                    "extracted_text": extracted_text,
                    "confidence": self._extract_confidence(result),
                    "model_used": "HeartBeat Clinical OCR Engine",
                    "success": True
                }
            elif response.status_code == 503:
                logger.warning(f"OCR model is loading: {response.json().get('error', 'Model loading')}")
                return {
                    "extracted_text": "",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Clinical OCR Engine (loading)",
                    "success": False
                }
            else:
                logger.error(f"HF OCR API error {response.status_code}: {response.text}")
                return {
                    "extracted_text": "",
                    "confidence": 0.0,
                    "model_used": "HeartBeat Clinical OCR Engine (error)",
                    "success": False
                }

        except requests.exceptions.Timeout:
            logger.error("HF OCR API timeout")
            return {
                "extracted_text": "",
                "confidence": 0.0,
                "model_used": f"{self.settings.hf_ocr_model} (timeout)",
                "success": False
            }
        except Exception as e:
            logger.error(f"HF OCR error: {str(e)}")
            return {
                "extracted_text": "",
                "confidence": 0.0,
                "model_used": f"{self.settings.hf_ocr_model} (error)",
                "success": False
            }

    def _extract_caption(self, result) -> str:
        """Extract caption text from BLIP API response."""
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict):
                return result[0].get("generated_text", "No caption generated")
            return str(result[0])
        elif isinstance(result, dict):
            return result.get("generated_text", str(result))
        return str(result)

    def _extract_ocr_text(self, result) -> str:
        """Extract OCR text from TrOCR API response."""
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict):
                return result[0].get("generated_text", "")
            return str(result[0])
        elif isinstance(result, dict):
            return result.get("generated_text", "")
        return str(result)

    def _extract_confidence(self, result) -> float:
        """Extract confidence/score from API response if available."""
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict):
                return result[0].get("score", 0.8)
        return 0.8  # Default confidence for successful responses

    def check_health(self) -> Dict[str, Any]:
        """Verify that the Hugging Face Vision AI services are accessible."""
        statuses = {}
        for name, url in [("Vision (Caption)", self.caption_url), ("Vision (OCR)", self.ocr_url)]:
            try:
                # For vision models we send a tiny 1x1 PNG pixel
                tiny_png = base64.b64decode(
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                )
                response = requests.post(
                    url,
                    headers={**self.headers, "Content-Type": "application/octet-stream"},
                    data=tiny_png,
                    timeout=10
                )
                statuses[name] = {
                    "status": "online" if response.status_code in [200, 503] else "error",
                    "status_code": response.status_code,
                    "loading": response.status_code == 503
                }
            except Exception as e:
                statuses[name] = {"status": "offline", "error": str(e)}

        return {
            "service": "Vision AI",
            "models": {
                "caption": self.settings.hf_vision_model,
                "ocr": self.settings.hf_ocr_model
            },
            "statuses": statuses
        }
