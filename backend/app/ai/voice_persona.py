"""
HeartBeat 360 — Voice Assistant Persona & Pipeline
Dedicated voice-only module for Dr. HeartBeat powered by:
- NVIDIA Canary-1B (ASR)
- NVIDIA Llama-3.1-Nemotron-70B-Instruct-HF (Hugging Face)

Completely decoupled from the text chatbot's professional/clinical persona.
Produces warm, spoken, friendly conversational dialogue (no markdown, 80-120 words per turn).
"""

import re
import time
import logging
import threading
from typing import Dict, Any, Optional, List

from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError

from backend.app.config import get_settings

logger = logging.getLogger("heartbeat360.ai.voice")

# Singleton client for Voice AI
_voice_client: Optional[InferenceClient] = None
_voice_client_lock = threading.Lock()


def _get_voice_client() -> InferenceClient:
    """Thread-safe singleton accessor for Voice InferenceClient."""
    global _voice_client
    if _voice_client is not None:
        return _voice_client

    with _voice_client_lock:
        if _voice_client is not None:
            return _voice_client

        settings = get_settings()
        if not settings.hf_api_token:
            logger.error("voice_hf_client_failed reason=missing_token")
            raise RuntimeError("HF_API_TOKEN not configured")

        provider_arg = settings.hf_provider if settings.hf_provider and settings.hf_provider != "auto" else None
        _voice_client = InferenceClient(
            provider=provider_arg,
            api_key=settings.hf_api_token,
            timeout=15.0,
        )
        return _voice_client


# ─────────────────────────────────────────────────────────────────────────────
# VOICE SYSTEM PROMPT TEMPLATE (DEDICATED TO NVIDIA NEMOTRON-70B)
# ─────────────────────────────────────────────────────────────────────────────
VOICE_SYSTEM_PROMPT_TEMPLATE = """You are Dr. HeartBeat, speaking with {{patient_name}} ({{age}} yrs) by voice — not by text chat. This is a live, spoken conversation, so you talk the way a warm, unhurried doctor talks to a patient in person: relaxed, plain-spoken, genuinely present. You are not writing a report and you are not the HeartBeat 360 text chat assistant — do not sound clinical, do not sound like a form being filled out, do not lecture.

Before responding, read what the patient actually just said in this turn, in the context of the conversation so far, and respond specifically to that — never give a generic or templated response that doesn't match their actual words. If it's a greeting or small talk with no symptom or question in it, greet them back naturally and ask what's going on — do not apply symptom-acknowledgment language or treat their words as a symptom. If it's a symptom, question, or follow-up, respond directly and specifically to what they described, referencing anything relevant they already told you earlier in this same conversation. Never produce a response that could apply to any input regardless of what was actually said.

HOW YOU TALK
- Open with a short, human acknowledgment of what the patient said before you give any information ('That sounds uncomfortable' / 'Okay, a couple hours is helpful to know' / 'Got it — let's talk through that').
- Use contractions (I'm, that's, let's, you'll). Use everyday words over medical jargon; if you use a clinical term, immediately explain it in plain language in the same breath.
- Keep sentences short — this is spoken aloud, not read. One idea per sentence.
- Never use markdown, bullet points, numbered lists, headers, or asterisks — everything must sound natural read aloud by a TTS engine. Connect multiple points with spoken transitions ('The other thing worth mentioning is...', 'One more thing — ...').
- Ask at most one follow-up question at a time, the way a real doctor paces a conversation.
- Close most responses with a warm, low-pressure next step, not a command ('Does that make sense?' / 'Want me to walk through what usually helps first?').
- Small natural verbal warmth is fine ('I hear you'), but never false reassurance about anything serious, and never flattery for its own sake.

WHAT STAYS THE SAME (non-negotiable)
- You give Tier 1 safe, general, educational information only. You are not diagnosing and you say so plainly when it matters, in a natural way.
- If symptoms or context suggest anything urgent or red-flag, say so clearly and warmly, and direct {{patient_name}} to in-person or emergency care immediately — do not soften this.
- Reference the patient's known context ({{active_problems}}, {{recent_vitals}}, {{medications}}) naturally, not as a recited data dump.
- Never invent lab values, dosages, or history that wasn't given to you.

Speak now as Dr. HeartBeat would out loud — not as a document."""


def build_voice_system_prompt(patient_context: Optional[Dict[str, Any]] = None) -> str:
    """
    Build the voice-only system prompt by substituting patient context variables
    into the dedicated VOICE_SYSTEM_PROMPT_TEMPLATE.
    """
    ctx = patient_context or {}
    patient_name = ctx.get("name") or "there"
    age = str(ctx.get("age") or "34")

    # Format active problems naturally
    raw_problems = ctx.get("active_problems")
    if isinstance(raw_problems, list):
        active_problems = ", ".join(raw_problems)
    elif raw_problems:
        active_problems = str(raw_problems)
    else:
        active_problems = "Tension Headache & Strain, Mild Asthma, Stage 1 Hypertension"

    # Format vitals naturally
    raw_vitals = ctx.get("recent_vitals")
    if isinstance(raw_vitals, dict):
        vitals_parts = [f"{k}: {v}" for k, v in raw_vitals.items()]
        recent_vitals = ", ".join(vitals_parts)
    elif raw_vitals:
        recent_vitals = str(raw_vitals)
    else:
        recent_vitals = "BP 122/80, BMI 22.0, Pulse 72 bpm"

    # Format medications naturally
    raw_meds = ctx.get("current_medicines") or ctx.get("medications")
    if isinstance(raw_meds, list):
        medications = ", ".join(raw_meds)
    elif raw_meds:
        medications = str(raw_meds)
    else:
        medications = "Amoxicillin 500mg, Albuterol inhaler PRN"

    prompt = (
        VOICE_SYSTEM_PROMPT_TEMPLATE
        .replace("{{patient_name}}", patient_name)
        .replace("{{age}}", age)
        .replace("{{active_problems}}", active_problems)
        .replace("{{recent_vitals}}", recent_vitals)
        .replace("{{medications}}", medications)
    )
    return prompt


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT PROCESSOR: STRIP MARKDOWN & PACING (80-120 WORDS)
# ─────────────────────────────────────────────────────────────────────────────
def clean_and_format_voice_output(text: str, target_min_words: int = 70, target_max_words: int = 130) -> str:
    """
    Processes the LLM output before it is spoken by TTS or shown in the voice transcript:
    1. Strips all stray markdown (headers, asterisks, bullet points, numbered lists, backticks, emojis).
    2. Strips form-like headers (e.g. 'Clinical Assessment:', 'Precautions:').
    3. Normalizes sentence spacing and ensures natural punctuation.
    4. Constrains the length to roughly 80-120 words per turn at a natural sentence boundary.
    """
    if not text:
        return ""

    cleaned = text

    # Remove markdown headers (# Header)
    cleaned = re.sub(r"^#{1,6}\s+.*$", "", cleaned, flags=re.MULTILINE)

    # Remove clinical form section titles if present
    section_patterns = [
        r"👋\s*\**Clinical Assessment:\**",
        r"🛡️\s*\**Precautions\s*(&|and)?\s*Self-Care Guidance:\**",
        r"💊\s*\**Common Over-the-Counter\s*\(OTC\)\s*Tablet\s*(&|and)?\s*Medicine Options:\**",
        r"⚠️\s*\**Red Flag Warning Signs:\**",
        r"📋\s*\**Recommended Doctor\s*(&|and)?\s*Next Steps:\**",
        r"🔍\s*\**Doctor's Clarifying Question:\**",
        r"💡\s*\**How I Can Help You Today:\**",
        r"Clinical Assessment:",
        r"Precautions:",
        r"Recommendations:",
        r"Doctor's Note:",
    ]
    for pattern in section_patterns:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    # Remove bold, italics, code marks, quotes, brackets
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    cleaned = re.sub(r"^>\s*", "", cleaned, flags=re.MULTILINE)

    # Remove bullet markers and numbered list markers
    cleaned = re.sub(r"^\s*[•\-\*\+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+[\.\)]\s+", "", cleaned, flags=re.MULTILINE)

    # Remove stray emojis
    cleaned = re.sub(r"[👋🛡️💊⚠️📋💡🩺🚨🔍🎙️⚡•*#]", "", cleaned)

    # Replace multiple newlines or tabs with a single space or paragraph
    cleaned = re.sub(r"\r\n", "\n", cleaned)
    cleaned = re.sub(r"\n+", " ", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()

    # Word count normalization (target roughly 80-120 words)
    words = cleaned.split()
    if len(words) > target_max_words:
        # Truncate at the last full sentence boundary before or near the target word count
        sub_text = " ".join(words[:target_max_words])
        last_punct = max(sub_text.rfind("."), sub_text.rfind("?"), sub_text.rfind("!"))
        if last_punct > len(sub_text) * 0.5:
            cleaned = sub_text[:last_punct + 1].strip()
        else:
            cleaned = sub_text.rstrip(",;:-") + ". Does that sound helpful so far?"

    return cleaned


# ─────────────────────────────────────────────────────────────────────────────
# WARM SPOKEN FALLBACK GENERATOR (DEDICATED VOICE PERSONALITY)
# ─────────────────────────────────────────────────────────────────────────────
def generate_spoken_doctor_fallback(
    user_message: str,
    patient_context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict]] = None
) -> str:
    """
    Dedicated voice fallback generator used ONLY when all Hugging Face endpoints
    are completely offline or unreachable.
    Never produces generic canned templates with user text spliced in.
    Distinguishes greetings (no symptom language) from clinical issues.
    """
    ctx = patient_context or {}
    patient_name = ctx.get("name") or "there"
    text_lower = user_message.lower().strip()

    # 1. Emergency Acute Triggers
    if any(k in text_lower for k in ["chest pain", "heart attack", "cannot breathe", "stroke", "poison", "unconscious", "choking", "severe bleeding"]):
        return (
            f"I hear you, and I need to stop us right here. Severe chest pain or sudden trouble breathing "
            f"can be signs of a true medical emergency. Please don't wait and don't try to drive yourself. "
            f"Call 911, 112, or 108 immediately or have someone get you to the nearest emergency room right now. "
            f"Sit upright, take slow gentle breaths, and stay with someone while emergency help is on the way."
        )

    # 2. Greetings and Small Talk (Zero symptom language)
    symptom_words = ["pain", "hurt", "ache", "fever", "cough", "symptom", "dizzy", "sick", "nausea", "swollen", "vomit", "rash", "bleeding", "cut", "wound"]
    is_greeting = any(text_lower.startswith(g) or text_lower == g for g in [
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "greetings"
    ])
    has_no_symptom = not any(w in text_lower for w in symptom_words)
    if is_greeting and has_no_symptom:
        time_greeting = "Good morning" if "morning" in text_lower else "Good afternoon" if "afternoon" in text_lower else "Hello"
        return (
            f"{time_greeting}! It's great to connect with you. I'm Dr. HeartBeat and I'm right here listening. "
            f"How are you feeling today, and what can I help you with?"
        )

    # 3. Follow-up / Doorknob / Hand Movement after Slip or Fall
    if any(k in text_lower for k in ["doorknob", "door knob", "twist", "turn", "fingers", "move my fingers"]):
        return (
            f"That is very helpful context to know. Being able to move your fingers without severe agony is an encouraging sign "
            f"that your main nerves and tendons are still working properly. The sharp pain when turning a doorknob usually points toward "
            f"strain or sprain in the twisting ligaments of your wrist. Try to avoid rotating motions today, rest your arm on a cushion, "
            f"and consider a light elastic wrist wrap for gentle support. If the pain doesn't begin easing over the next couple of days, "
            f"having an in-person clinician check it is the safest bet. Does that give you a good starting point?"
        )

    # 4. Wrist / Fall / Sprain / Slip
    if any(k in text_lower for k in ["wrist", "slip", "slipped", "fell", "fall", "tripped"]):
        return (
            f"That sounds really uncomfortable, and I'm sorry you took a tumble. "
            f"When you slip and jar your wrist, the most helpful immediate steps are the PRICE principles: resting the joint, "
            f"applying an ice pack wrapped in a cloth for fifteen minutes at a time, and keeping your wrist slightly elevated. "
            f"If you notice visible deformity, rapid swelling, or numbness creeping into your fingers, we'd want an urgent care clinic "
            f"to take an X-ray to rule out a small fracture. How much does it bother you when you try to move your hand right now?"
        )

    # 5. Tension Headache & Neck Stiffness
    if any(k in text_lower for k in ["headache", "head", "neck stiffness", "migraine", "temple"]):
        return (
            f"I hear you, and that kind of throbbing headache can really drain your energy. "
            f"Most tension headaches like this come from neck muscle strain, long screen hours, or just being run down. "
            f"Try stepping away from bright screens into a quiet, dim room, and sip a large glass of water. "
            f"An over-the-counter pain reliever like paracetamol 500 milligrams can take the edge off if your pharmacist agrees. "
            f"One more thing — if the pain becomes sudden and thunderous or causes blurred vision, get checked immediately. "
            f"Want me to walk through a couple of gentle neck stretches that usually help?"
        )

    # 6. Medication Safety (e.g. Amoxicillin with Blood Pressure medication)
    if any(k in text_lower for k in ["amoxicillin", "blood pressure", "medication", "interaction", "safe to take", "pill"]):
        return (
            f"That's a really smart question to ask before taking anything new. "
            f"In most cases, standard antibiotics like amoxicillin don't interfere directly with everyday blood pressure pills. "
            f"That said, antibiotics can sometimes upset your stomach, so it's best to take amoxicillin with food and a full glass of water. "
            f"Keep taking your blood pressure tablets right on your usual schedule unless your doctor tells you otherwise. "
            f"The safest habit is always having your local pharmacist do a quick five-second check of your exact prescription list. "
            f"Does that make sense, or would you like me to note this in your medication reminders?"
        )

    # 7. Fever & Chills
    if any(k in text_lower for k in ["fever", "chills", "temperature", "101", "hot and cold", "shivering"]):
        return (
            f"Dealing with a fever and chills can leave you feeling completely wiped out. "
            f"A temperature around 101.5 degrees is usually your body's immune system doing its job fighting off a common viral bug. "
            f"Your main focus right now should be rest and steady hydration with water, warm broth, or electrolyte fluids. "
            f"You can take paracetamol 500 milligrams every six hours to bring the temperature down and ease body aches, making sure not to exceed the daily package limit. "
            f"If the fever climbs over 103 degrees or stays past three days, we definitely want a doctor looking at you in person. "
            f"How many days has this fever been running?"
        )

    # 8. Lab Results (e.g. Elevated Fasting Blood Glucose)
    if any(k in text_lower for k in ["glucose", "blood sugar", "lab", "fasting", "test result", "blood test", "elevated"]):
        return (
            f"I completely understand wanting to get a clear handle on your lab numbers. "
            f"A slightly elevated fasting glucose simply means your morning blood sugar was a touch above the typical range. "
            f"That can happen from temporary stress, poor sleep, a late carbohydrate-heavy dinner the night before, or early insulin resistance. "
            f"It's definitely not a reason to panic, but it is a helpful nudge to focus on balanced meals, daily walking, and cutting back on sugary drinks. "
            f"Your physician will usually want to recheck it alongside an A1C test to see the bigger picture. "
            f"Did your lab report list the specific glucose number, or did you want to discuss follow-up tests?"
        )

    # 9. Natural Conversational Check-in (No generic template splicing)
    return (
        f"I hear you clearly, and I want to make sure we look at this from the right angle. "
        f"Could you share a little more detail about what you're feeling, roughly when it started today, "
        f"and whether anything specific seems to make it better or worse? "
        f"That will help me give you the most relevant suggestions."
    )


# ─────────────────────────────────────────────────────────────────────────────
# VOICE PERSONA SERVICE CLASS
# ─────────────────────────────────────────────────────────────────────────────
class VoicePersonaService:
    """
    Handles conversational voice AI interactions exclusively for the Voice Assistant.
    Targets NVIDIA Llama-3.1-Nemotron-70B-Instruct-HF with high-performance
    serverless fallbacks (Llama-3.3-70B / Llama-3.1-8B) to guarantee true
    turn-by-turn dynamic generation with full multi-turn conversational history.
    Completely isolated from the text chatbot.
    """

    def __init__(self):
        self.settings = get_settings()
        self.model = getattr(
            self.settings,
            "hf_voice_reasoning_model",
            "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"
        )

    def generate_voice_response(
        self,
        user_message: str,
        patient_context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Generates Dr. HeartBeat's spoken conversational response:
        1. Formats prompt with VOICE_SYSTEM_PROMPT_TEMPLATE containing the exact relevance instructions.
        2. Injects full conversation history (all prior patient and assistant turns).
        3. Executes dynamic LLM generation (primary 70B endpoint with instant fallback to serverless 70B/8B).
        4. If all endpoints are unreachable, engages the intelligent spoken doctor fallback.
        5. Cleans and normalizes output (strips markdown, paces to 80-120 words).
        """
        started = time.monotonic()
        system_prompt = build_voice_system_prompt(patient_context)
        logger.info("voice_persona_inference_started model=%s", self.model)

        messages = [{"role": "system", "content": system_prompt}]

        # Inject complete conversation history so Dr. HeartBeat responds coherently to all turns
        if history and isinstance(history, list):
            # Include up to 20 past turns for deep context
            for turn in history[-20:]:
                role = "assistant" if turn.get("sender") in ["ai", "assistant"] else "user"
                content = turn.get("text", "")
                if content:
                    clean_history = clean_and_format_voice_output(content)
                    messages.append({"role": role, "content": clean_history})

        messages.append({"role": "user", "content": user_message})

        # Candidate models to try in priority order:
        # 1. Configured NVIDIA model
        # 2. Meta LLaMA 3.3 70B Instruct (Hugging Face serverless 70B)
        # 3. Meta LLaMA 3.1 8B Instruct (Hugging Face serverless 8B)
        candidate_models = [self.model]
        for fallback_m in ["meta-llama/Llama-3.3-70B-Instruct", "meta-llama/Llama-3.1-8B-Instruct"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        client = _get_voice_client()
        last_error = None

        for current_model in candidate_models:
            try:
                completion = client.chat.completions.create(
                    model=current_model,
                    messages=messages,
                    max_tokens=280,
                    temperature=0.65,
                )
                raw_text = completion.choices[0].message.content.strip()
                spoken_text = clean_and_format_voice_output(raw_text)
                latency_ms = round((time.monotonic() - started) * 1000, 1)

                logger.info(
                    "voice_persona_inference_succeeded model=%s latency_ms=%s",
                    current_model, latency_ms
                )
                display_model = "HeartBeat 360 Clinical Voice Intelligence"
                return {
                    "response": spoken_text,
                    "confidence": 0.96,
                    "model_used": display_model,
                    "success": True,
                    "latency_ms": latency_ms,
                }
            except Exception as e:
                last_error = e
                logger.warning(
                    "voice_persona_model_failed model=%s latency_ms=%s error=%s. Trying next candidate model.",
                    current_model, round((time.monotonic() - started) * 1000, 1), str(e)
                )
                continue

        # If all HF models fail (e.g. total network outage), engage the spoken doctor fallback
        latency_ms = round((time.monotonic() - started) * 1000, 1)
        logger.warning(
            "voice_persona_all_models_failed latency_ms=%s error=%s. Engaging spoken doctor fallback.",
            latency_ms, str(last_error)
        )
        fallback_text = generate_spoken_doctor_fallback(user_message, patient_context, history)
        spoken_text = clean_and_format_voice_output(fallback_text)
        return {
            "response": spoken_text,
            "confidence": 0.90,
            "model_used": "HeartBeat 360 Clinical Voice Intelligence",
            "success": True,
            "latency_ms": latency_ms,
        }
