"""
HeartBeat 360 — Clinical Safety Engine (Enhanced)
3-Tier risk escalation: HIGH (Emergency) → MEDIUM (Doctor) → LOW (Education)
Now combines keyword-based rules WITH AI confidence scoring.
"""

import re
import logging
from typing import Dict, Any, Optional

from backend.app.config import get_settings

logger = logging.getLogger("heartbeat360.services.safety")

# ── Emergency high-risk triggers ──
EMERGENCY_KEYWORDS = [
    "chest pain", "shortness of breath", "severe bleeding", "unconscious", 
    "stroke", "numbness on one side", "suicide", "poison", "anaphylaxis",
    "seizure", "heart attack", "coughing blood", "head injury", "overdose"
]

# ── Medium risk triggers ──
MEDIUM_RISK_KEYWORDS = [
    "fever", "persistent headache", "dizziness", "vomiting", "stomach pain",
    "rash", "infection", "swelling", "joint pain", "blurred vision", "palpitations"
]


def analyze_risk(text: str, patient_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Primary keyword-based safety triage.
    This is the RULES layer of the Clinical Safety Engine.
    Returns HIGH / MEDIUM / LOW risk tier with action directives.
    """
    text_lower = text.lower()
    
    # 1. Check High Risk Emergency Triggers
    for kw in EMERGENCY_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
            return {
                "risk_tier": "HIGH",
                "action": "EMERGENCY_ESCALATION",
                "headline": "CRITICAL HEALTH ALERT — IMMEDIATE ATTENTION REQUIRED",
                "message": f"Your input matched a high-risk medical keyword ('{kw}'). Please seek emergency medical care immediately or call emergency response.",
                "emergency_numbers": ["911 (US)", "112 (EU/Global)", "108 (India)"],
                "source_attribution": "HeartBeat Emergency Escalation Protocol v3.2",
                "allow_ai_continuation": False,
                "matched_keyword": kw
            }

    # 2. Check Medium Risk Triggers
    for kw in MEDIUM_RISK_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
            return {
                "risk_tier": "MEDIUM",
                "action": "RECOMMEND_DOCTOR",
                "headline": "Professional Medical Evaluation Recommended",
                "banner_text": f"You mentioned '{kw}'. While AI can provide educational background, symptoms like this should be evaluated by a certified doctor.",
                "recommendation_link": "/doctors",
                "source_attribution": "HeartBeat Clinical Advisory Board · Reviewed 2026-08-01",
                "allow_ai_continuation": True,
                "matched_keyword": kw
            }

    # 3. Default Low Risk
    return {
        "risk_tier": "LOW",
        "action": "STANDARD_AI_RESPONSE",
        "headline": "Educational Health Information",
        "banner_text": None,
        "source_attribution": "Retrieved from HeartBeat Clinical Knowledge Base · Reviewed on 2026-08-01 · Not a substitute for professional medical diagnosis.",
        "allow_ai_continuation": True,
        "matched_keyword": None
    }


def evaluate_ai_confidence(
    ai_text: str,
    confidence_score: float,
    original_risk: Dict[str, Any]
) -> Dict[str, Any]:
    """
    AI Confidence layer of the Clinical Safety Engine.
    Evaluates the AI's response confidence and may ESCALATE the risk tier.
    
    Rules:
    - If confidence < threshold AND risk is LOW → escalate to MEDIUM
    - If AI response mentions critical symptoms → escalate regardless
    - HIGH risk from keyword rules is NEVER downgraded
    
    Args:
        ai_text: The AI-generated response text
        confidence_score: AI model's confidence (0.0 - 1.0)
        original_risk: The risk tier from keyword-based analyze_risk()
        
    Returns:
        Dict with 'final_risk_tier' and 'note'
    """
    settings = get_settings()
    threshold = settings.safety_confidence_threshold
    original_tier = original_risk["risk_tier"]

    # HIGH risk from keywords is NEVER downgraded
    if original_tier == "HIGH":
        return {
            "final_risk_tier": "HIGH",
            "note": "Emergency keyword detected — AI confidence check skipped.",
            "escalated": False
        }

    # Check if the AI response itself mentions emergency keywords
    ai_text_lower = ai_text.lower() if ai_text else ""
    for kw in EMERGENCY_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', ai_text_lower):
            logger.warning(f"AI response contained emergency keyword '{kw}' — escalating to HIGH")
            return {
                "final_risk_tier": "HIGH",
                "note": f"AI response mentioned critical keyword '{kw}' — auto-escalated to HIGH.",
                "escalated": True
            }

    # Low confidence on a LOW risk query → escalate to MEDIUM
    if original_tier == "LOW" and confidence_score < threshold:
        logger.info(f"AI confidence {confidence_score:.2f} below threshold {threshold} — escalating LOW → MEDIUM")
        return {
            "final_risk_tier": "MEDIUM",
            "note": f"AI confidence ({confidence_score:.0%}) below safety threshold ({threshold:.0%}). Recommending doctor consultation as a precaution.",
            "escalated": True
        }

    # Otherwise, keep the original tier
    return {
        "final_risk_tier": original_tier,
        "note": f"AI confidence ({confidence_score:.0%}) meets safety threshold.",
        "escalated": False
    }
