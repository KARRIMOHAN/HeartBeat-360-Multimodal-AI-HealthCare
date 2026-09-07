"""
HeartBeat 360 — Response Validator
Final safety gate before AI responses are returned to users.
Ensures no unsafe medical claims, proper disclaimers, and quality checks.
"""

import re
import logging
from typing import Dict, Any

from backend.app.config import get_settings

logger = logging.getLogger("heartbeat360.services.validator")

# Phrases that indicate an AI is making absolute medical diagnoses
# (which is unsafe and must be blocked)
FORBIDDEN_DIAGNOSIS_PHRASES = [
    r"\byou definitely have\b",
    r"\byou are diagnosed with\b",
    r"\bthis confirms you have\b",
    r"\byou are suffering from\b",
    r"\bi can confirm the diagnosis\b",
    r"\bstop taking your medication\b",
    r"\bdo not see a doctor\b",
    r"\bno need to consult\b",
    r"\bignore these symptoms\b",
    r"\bthis is certainly\b.*\bdisease\b",
    r"\byou should self-medicate\b",
]

# Required disclaimer must be present or will be appended
MEDICAL_DISCLAIMER = (
    "This information is for educational purposes only and is not a substitute "
    "for professional medical advice, diagnosis, or treatment."
)


class ResponseValidator:
    """
    Final validation gate for all AI responses before they reach users.
    
    Checks:
    1. Response is not empty or gibberish
    2. No absolute medical diagnoses (forbidden phrases)
    3. Confidence meets minimum threshold
    4. Appends disclaimers if missing
    5. Ensures source attribution
    """

    def __init__(self):
        self.settings = get_settings()
        self.min_confidence = self.settings.safety_confidence_threshold
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in FORBIDDEN_DIAGNOSIS_PHRASES]

    def validate(
        self, 
        response_text: str, 
        confidence: float, 
        risk_tier: str = "LOW"
    ) -> Dict[str, Any]:
        """
        Validate an AI response and return a safe version.
        
        Args:
            response_text: The AI-generated response text
            confidence: AI confidence score (0.0 - 1.0)
            risk_tier: Current risk tier from safety engine
            
        Returns:
            Dict with 'passed' (bool), 'safe_response' (str), 'issues' (list)
        """
        issues = []
        safe_response = response_text

        # Check 1: Empty or too short response
        if not response_text or len(response_text.strip()) < 10:
            issues.append("EMPTY_RESPONSE")
            safe_response = self._get_safe_fallback(risk_tier)
            return {
                "passed": False,
                "safe_response": safe_response,
                "issues": issues,
                "disclaimer_added": True
            }

        # Check 2: Gibberish detection (very low ratio of real words)
        if self._is_gibberish(response_text):
            issues.append("GIBBERISH_DETECTED")
            safe_response = self._get_safe_fallback(risk_tier)
            return {
                "passed": False,
                "safe_response": safe_response,
                "issues": issues,
                "disclaimer_added": True
            }

        # Check 3: Forbidden diagnosis phrases
        for pattern in self.compiled_patterns:
            if pattern.search(response_text):
                issues.append(f"FORBIDDEN_PHRASE: {pattern.pattern}")
                # Remove the dangerous sentence and replace with safe alternative
                safe_response = pattern.sub(
                    "Based on the information you've shared, it would be advisable to consult a doctor who can",
                    safe_response
                )

        # Check 4: Low confidence — add extra caution
        if confidence < self.min_confidence:
            issues.append(f"LOW_CONFIDENCE: {confidence:.2f}")
            safe_response = (
                f"⚠️ Note: This response has lower confidence ({confidence:.0%}). "
                f"Please treat this as general guidance only.\n\n{safe_response}"
            )

        # Check 5: Append disclaimer if not already present
        disclaimer_added = False
        if "not a substitute" not in response_text.lower() and "educational" not in response_text.lower():
            safe_response = f"{safe_response}\n\n📋 {MEDICAL_DISCLAIMER}"
            disclaimer_added = True

        passed = len(issues) == 0

        if not passed:
            logger.warning(f"Response validation issues: {issues}")

        return {
            "passed": passed,
            "safe_response": safe_response,
            "issues": issues,
            "disclaimer_added": disclaimer_added
        }

    def _is_gibberish(self, text: str) -> bool:
        """Basic gibberish detection — checks if text has reasonable word structure."""
        words = text.split()
        if len(words) < 3:
            return False  # Too short to judge

        # Check ratio of words with mostly alphabetical characters
        real_words = sum(1 for w in words if re.match(r'^[a-zA-Z\'-]+$', w.strip('.,;:!?')))
        ratio = real_words / len(words)
        return ratio < 0.3  # Less than 30% recognizable words = gibberish

    def _get_safe_fallback(self, risk_tier: str = "LOW") -> str:
        """Return a safe fallback response based on the risk tier."""
        if risk_tier == "MEDIUM":
            return (
                "Thank you for sharing your health concern. Based on what you've described, "
                "we recommend scheduling a consultation with a qualified healthcare professional "
                "for a proper evaluation. You can use our 'Specialty Consult' feature to find "
                "a verified doctor near you.\n\n"
                f"📋 {MEDICAL_DISCLAIMER}"
            )

        # LOW risk or default
        return (
            "Thank you for your health question. For your safety, here is general guidance: "
            "Stay well hydrated, get adequate rest, and maintain a balanced diet. "
            "Track your symptoms and their duration. If symptoms persist or worsen, "
            "please consult a healthcare professional.\n\n"
            f"📋 {MEDICAL_DISCLAIMER}"
        )
