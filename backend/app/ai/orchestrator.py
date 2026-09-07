"""
HeartBeat 360 — AI Orchestrator
Central coordinator that routes requests to the appropriate AI services
(Text, Vision, Speech) and chains the results through the Safety Engine
and Response Validator.
"""

import time
import logging
from typing import Dict, Any, Optional

from backend.app.ai.text_ai import TextAIService
from backend.app.ai.vision_ai import VisionAIService
from backend.app.ai.speech_ai import SpeechAIService
from backend.app.ai.voice_persona import VoicePersonaService, clean_and_format_voice_output
from backend.app.ai.qwen_scanner import QwenScannerService
from backend.app.services.safety_service import analyze_risk, evaluate_ai_confidence
from backend.app.services.response_validator import ResponseValidator

logger = logging.getLogger("heartbeat360.ai.orchestrator")


class AIOrchestrator:
    """
    Central AI Orchestrator — coordinates all modalities:
      1. Receives input (text / image / audio)
      2. Routes to the appropriate Hugging Face AI service:
         - Text Chat: TextAIService (Dr. HeartBeat clinical triage persona)
         - Voice Assistant: VoicePersonaService (Dr. HeartBeat spoken voice persona)
         - Tablet & Medical Scans: QwenScannerService (Qwen LLM + Tavily/Serper/Brave Search)
         - Vision: VisionAIService
         - Speech ASR: SpeechAIService
      3. Passes result through Clinical Safety Engine
      4. Validates response via Response Validator
      5. Returns unified, safe response
    """

    def __init__(self):
        self.text_ai = TextAIService()
        self.voice_persona = VoicePersonaService()
        self.vision_ai = VisionAIService()
        self.speech_ai = SpeechAIService()
        self.qwen_scanner = QwenScannerService()
        self.validator = ResponseValidator()

    def process_text_query(
        self, 
        message: str, 
        patient_context: Optional[Dict] = None,
        history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Process a text-based patient query through the full pipeline:
        Text AI → Safety Engine → Response Validator
        """
        start_time = time.time()

        # Step 1: Run safety triage on the raw user input
        safety_result = analyze_risk(message)

        # If HIGH risk, immediately return emergency response (skip AI)
        if safety_result["risk_tier"] == "HIGH":
            return {
                "reply": "⚠️ EMERGENCY TRIGGERED: Please stop using this chat and call emergency services immediately.",
                "risk_analysis": safety_result,
                "ai_response": None,
                "confidence": 1.0,
                "model_used": "Safety Engine (keyword match)",
                "modality": "text",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

        # Step 2: Generate AI response
        ai_result = self.text_ai.generate_response(message, patient_context, history)

        # Step 3: Evaluate AI confidence and potentially escalate risk tier
        confidence_assessment = evaluate_ai_confidence(
            ai_text=ai_result["response"],
            confidence_score=ai_result["confidence"],
            original_risk=safety_result
        )

        # Step 4: Validate the AI response for safety
        validated = self.validator.validate(
            response_text=ai_result["response"],
            confidence=ai_result["confidence"],
            risk_tier=confidence_assessment["final_risk_tier"]
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "reply": validated["safe_response"],
            "risk_analysis": {
                **safety_result,
                "risk_tier": confidence_assessment["final_risk_tier"],
                "ai_confidence": ai_result["confidence"],
                "confidence_note": confidence_assessment.get("note", "")
            },
            "ai_response": ai_result["response"],
            "confidence": ai_result["confidence"],
            "model_used": ai_result["model_used"],
            "modality": "text",
            "validation_passed": validated["passed"],
            "attribution": safety_result.get("source_attribution", "HeartBeat AI Engine"),
            "processing_time_ms": processing_time
        }

    def process_image(
        self, 
        image_bytes: bytes, 
        query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process an image through the Vision AI pipeline:
        Vision AI (caption + OCR) → Safety Engine → Response Validator
        """
        start_time = time.time()

        # Step 1: Analyze the image (get caption)
        caption_result = self.vision_ai.analyze_image(image_bytes)

        # Step 2: Extract text via OCR
        ocr_result = self.vision_ai.extract_text_from_image(image_bytes)

        # Combine findings
        combined_text = ""
        if caption_result["success"]:
            combined_text += f"Image shows: {caption_result['caption']}. "
        if ocr_result["success"] and ocr_result["extracted_text"]:
            combined_text += f"Text found: {ocr_result['extracted_text']}. "

        if not combined_text:
            combined_text = "Image received but could not be fully analyzed. "

        # Step 3: If user provided a query, use Text AI to interpret findings
        interpretation = None
        if query:
            context_message = f"{query}. Image analysis results: {combined_text}"
            interpretation = self.text_ai.generate_response(context_message)

        # Step 4: Safety check on the combined output
        text_to_check = combined_text + (interpretation["response"] if interpretation else "")
        safety_result = analyze_risk(text_to_check)

        # Step 5: Validate
        validated = self.validator.validate(
            response_text=text_to_check,
            confidence=caption_result.get("confidence", 0.5),
            risk_tier=safety_result["risk_tier"]
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "caption": caption_result.get("caption", ""),
            "ocr_text": ocr_result.get("extracted_text", ""),
            "interpretation": interpretation["response"] if interpretation else None,
            "reply": validated["safe_response"],
            "risk_analysis": safety_result,
            "confidence": caption_result.get("confidence", 0.0),
            "model_used": f"{caption_result['model_used']} + {ocr_result['model_used']}",
            "modality": "vision",
            "validation_passed": validated["passed"],
            "processing_time_ms": processing_time
        }

    def process_tablet_scan(
        self,
        image_bytes: Optional[bytes] = None,
        medicine_name: Optional[str] = None,
        patient_weight: Optional[float] = None,
        patient_age: Optional[int] = None,
        patient_allergies: Optional[list] = None,
        current_medicines: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Full 2-stage Tablet Scanning Pipeline:
        Scan/Input → Qwen LLM → Search Tool (Tavily/Serper/Brave) → Web Results → Qwen LLM → Safety Check → Final Answer
        """
        start_time = time.time()

        # Extract OCR as hint if image present
        ocr_hint = None
        if image_bytes:
            ocr_res = self.vision_ai.extract_text_from_image(image_bytes)
            if ocr_res.get("success") and ocr_res.get("extracted_text"):
                ocr_hint = ocr_res["extracted_text"]

        # Run Qwen + Search Tool pipeline
        scan_res = self.qwen_scanner.scan_tablet(
            image_bytes=image_bytes,
            medicine_name=medicine_name,
            patient_weight=patient_weight,
            patient_age=patient_age,
            patient_allergies=patient_allergies,
            current_medicines=current_medicines,
            ocr_hint=ocr_hint,
        )

        final_text = scan_res.get("final_answer", "")

        # Safety Check & Clinical Triage on the output
        safety_result = analyze_risk(final_text)
        confidence_assessment = evaluate_ai_confidence(
            ai_text=final_text,
            confidence_score=scan_res.get("confidence", 0.9),
            original_risk=safety_result
        )

        # Response Validator check
        validated = self.validator.validate(
            response_text=final_text,
            confidence=scan_res.get("confidence", 0.9),
            risk_tier=confidence_assessment["final_risk_tier"]
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "brand_name": scan_res.get("brand_name"),
            "generic_name": scan_res.get("generic_name"),
            "active_ingredients": scan_res.get("active_ingredients", []),
            "strength": scan_res.get("strength"),
            "dosage_form": scan_res.get("dosage_form"),
            "search_queries": scan_res.get("search_queries", []),
            "search_provider": scan_res.get("search_provider"),
            "search_citations": scan_res.get("search_citations", []),
            "reply": validated["safe_response"],
            "final_answer": validated["safe_response"],
            "raw_clinical_output": final_text,
            "risk_analysis": {
                **safety_result,
                "risk_tier": confidence_assessment["final_risk_tier"],
                "ai_confidence": scan_res.get("confidence", 0.9),
                "confidence_note": confidence_assessment.get("note", "")
            },
            "confidence": scan_res.get("confidence", 0.9),
            "model_used": scan_res.get("model_pipeline"),
            "modality": "tablet_scanner",
            "validation_passed": validated["passed"],
            "processing_time_ms": processing_time
        }

    def process_medical_scan(
        self,
        image_bytes: Optional[bytes] = None,
        title: Optional[str] = None,
        patient_context: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Full 2-stage Medical Report Scanning Pipeline:
        Scan/Input → Qwen LLM → Search Tool (Tavily/Serper/Brave) → Web Results → Qwen LLM → Safety Check → Final Answer
        """
        start_time = time.time()

        # Extract OCR as hint if image present
        ocr_hint = None
        if image_bytes:
            ocr_res = self.vision_ai.extract_text_from_image(image_bytes)
            if ocr_res.get("success") and ocr_res.get("extracted_text"):
                ocr_hint = ocr_res["extracted_text"]

        # Run Qwen + Search Tool pipeline
        scan_res = self.qwen_scanner.scan_medical_report(
            image_bytes=image_bytes,
            title=title,
            patient_context=patient_context,
            ocr_hint=ocr_hint,
        )

        final_text = scan_res.get("final_answer", "")

        # Safety Check & Clinical Triage on the output
        safety_result = analyze_risk(final_text)
        confidence_assessment = evaluate_ai_confidence(
            ai_text=final_text,
            confidence_score=scan_res.get("confidence", 0.9),
            original_risk=safety_result
        )

        # Response Validator check
        validated = self.validator.validate(
            response_text=final_text,
            confidence=scan_res.get("confidence", 0.9),
            risk_tier=confidence_assessment["final_risk_tier"]
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "report_title": scan_res.get("report_title"),
            "structured_findings": scan_res.get("structured_findings", []),
            "abnormal_count": scan_res.get("abnormal_count", 0),
            "search_queries": scan_res.get("search_queries", []),
            "search_provider": scan_res.get("search_provider"),
            "search_citations": scan_res.get("search_citations", []),
            "plain_language_explanation": final_text,
            "reply": validated["safe_response"],
            "final_answer": validated["safe_response"],
            "risk_analysis": {
                **safety_result,
                "risk_tier": confidence_assessment["final_risk_tier"],
                "ai_confidence": scan_res.get("confidence", 0.9),
                "confidence_note": confidence_assessment.get("note", "")
            },
            "confidence": scan_res.get("confidence", 0.9),
            "model_used": scan_res.get("model_pipeline"),
            "modality": "medical_scanner",
            "validation_passed": validated["passed"],
            "processing_time_ms": processing_time
        }

    def process_audio(
        self, 
        audio_bytes: bytes, 
        patient_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process audio through: Speech AI → Text AI → Safety Engine → Response Validator
        """
        start_time = time.time()

        # Step 1: Transcribe audio to text
        transcription_result = self.speech_ai.transcribe_audio(audio_bytes)

        if not transcription_result["success"] or not transcription_result["transcription"]:
            processing_time = int((time.time() - start_time) * 1000)
            return {
                "transcription": "",
                "reply": transcription_result.get("error", "Could not transcribe audio. Please try again or type your question."),
                "risk_analysis": {"risk_tier": "LOW", "action": "RETRY"},
                "confidence": 0.0,
                "model_used": transcription_result["model_used"],
                "modality": "speech",
                "validation_passed": False,
                "processing_time_ms": processing_time
            }

        # Step 2: Process the transcribed text through the text pipeline
        text_result = self.process_text_query(
            transcription_result["transcription"], 
            patient_context
        )

        processing_time = int((time.time() - start_time) * 1000)

        # Merge results
        return {
            "transcription": transcription_result["transcription"],
            "reply": text_result["reply"],
            "risk_analysis": text_result["risk_analysis"],
            "ai_response": text_result.get("ai_response"),
            "confidence": min(transcription_result["confidence"], text_result["confidence"]),
            "model_used": f"{transcription_result['model_used']} → {text_result['model_used']}",
            "modality": "speech+text",
            "validation_passed": text_result.get("validation_passed", False),
            "attribution": text_result.get("attribution", ""),
            "processing_time_ms": processing_time
        }

    def process_nvidia_voice_query(
        self,
        message: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        patient_context: Optional[Dict] = None,
        history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Process patient voice interaction using the NVIDIA pipeline from Hugging Face:
        Speech (nvidia/canary-1b) → Reasoning (nvidia/Llama-3.1-Nemotron-70B-Instruct) → Safety Guard
        """
        start_time = time.time()
        transcription = ""
        transcription_model = None

        # Step 1: Transcribe audio if audio_bytes provided
        if audio_bytes:
            transcription_result = self.speech_ai.transcribe_audio_nvidia(audio_bytes)
            if transcription_result.get("success") and transcription_result.get("transcription"):
                transcription = transcription_result["transcription"]
                transcription_model = transcription_result.get("model_used")
                if not message:
                    message = transcription

        final_query = (message or transcription or "").strip()
        if not final_query:
            return {
                "reply": "I could not detect spoken symptoms or input text. Please speak into the microphone or type your question.",
                "risk_analysis": {"risk_tier": "LOW", "action": "RETRY"},
                "confidence": 0.0,
                "model_used": "HeartBeat Clinical Voice Transcription Engine",
                "modality": "voice",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }

        # Step 2: Clinical Safety Triage on the spoken input
        safety_result = analyze_risk(final_query)
        if safety_result.get("risk_tier") == "HIGH":
            processing_time = int((time.time() - start_time) * 1000)
            return {
                "transcription": transcription,
                "reply": "⚠️ EMERGENCY TRIGGERED: Severe symptoms detected. Please stop and call emergency services (911 / 112 / 108) immediately.",
                "risk_analysis": safety_result,
                "ai_response": None,
                "confidence": 1.0,
                "model_used": "HeartBeat Clinical Safety Guard (Emergency Triage)",
                "modality": "voice",
                "processing_time_ms": processing_time
            }

        # Step 3: Run through NVIDIA Nemotron voice persona reasoning
        ai_result = self.voice_persona.generate_voice_response(
            final_query, 
            patient_context, 
            history
        )

        # Step 4: Safety & Confidence evaluation
        confidence_assessment = evaluate_ai_confidence(
            ai_text=ai_result["response"],
            confidence_score=ai_result["confidence"],
            original_risk=safety_result
        )

        # Step 5: Clean and format voice output (strip stray markdown, enforce 80-120 words pacing)
        clean_voice_reply = clean_and_format_voice_output(ai_result["response"])

        combined_model = (
            f"{transcription_model} → {ai_result['model_used']}" 
            if transcription_model 
            else ai_result["model_used"]
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "transcription": transcription,
            "reply": clean_voice_reply,
            "risk_analysis": {
                **safety_result,
                "risk_tier": confidence_assessment["final_risk_tier"],
                "ai_confidence": ai_result["confidence"],
                "confidence_note": confidence_assessment.get("note", "")
            },
            "ai_response": clean_voice_reply,
            "confidence": ai_result["confidence"],
            "model_used": combined_model,
            "modality": "voice",
            "validation_passed": True,
            "attribution": "HeartBeat 360 Clinical Voice Intelligence",
            "processing_time_ms": processing_time
        }

    def process_multimodal(
        self, 
        text: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        audio_bytes: Optional[bytes] = None,
        patient_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process any combination of input modalities.
        Priority: audio (transcribe first) → text → image (analyze)
        """
        final_text = text or ""

        # If audio provided, transcribe and prepend
        if audio_bytes:
            transcription = self.speech_ai.transcribe_audio(audio_bytes)
            if transcription["success"] and transcription["transcription"]:
                final_text = transcription["transcription"] + " " + final_text
                final_text = final_text.strip()

        # If image provided, analyze and append context
        image_result = None
        if image_bytes:
            image_result = self.process_image(image_bytes, final_text if final_text else None)

        # If we have text (original or from transcription), process it
        if final_text:
            text_result = self.process_text_query(final_text, patient_context)

            # Merge image findings if available
            if image_result:
                text_result["image_analysis"] = {
                    "caption": image_result.get("caption"),
                    "ocr_text": image_result.get("ocr_text")
                }
                text_result["modality"] = "multimodal"

            return text_result

        # If only image (no text or audio)
        if image_result:
            return image_result

        # Nothing provided
        return {
            "reply": "Please provide a text message, image, or audio recording for analysis.",
            "risk_analysis": {"risk_tier": "LOW"},
            "confidence": 0.0,
            "model_used": "none",
            "modality": "none",
            "processing_time_ms": 0
        }

    def check_all_services(self) -> Dict[str, Any]:
        """Health check for all AI services — used at startup and by admin."""
        return {
            "text_ai": self.text_ai.check_health(),
            "vision_ai": self.vision_ai.check_health(),
            "speech_ai": self.speech_ai.check_health()
        }
