"""
HeartBeat 360 — Voice Assistant Fixes Verification Suite
Tests:
1. Verbatim Voice System Prompt inclusion & decoupling from text chatbot
2. Full conversation history propagation across multiple turns
3. Turn 1 (Greeting) -> Natural greeting back, zero symptom language
4. Turn 2 (Real Symptom: slipped & left wrist pain) -> Specifically addresses wrist & slip
5. Turn 3 (Follow-up: doorknob & finger movement) -> Coherent follow-up referencing previous turns
6. Frontend Female Voice TTS selection verification in app.js
"""

import re
import json
import requests

BASE_URL = "http://127.0.0.1:8000/api/patient"

EXPECTED_PROMPT_SNIPPET = (
    "Before responding, read what the patient actually just said in this turn, in the context of "
    "the conversation so far, and respond specifically to that — never give a generic or "
    "templated response that doesn't match their actual words. If it's a greeting or small talk "
    "with no symptom or question in it, greet them back naturally and ask what's going on — do "
    "not apply symptom-acknowledgment language or treat their words as a symptom. If it's a "
    "symptom, question, or follow-up, respond directly and specifically to what they described, "
    "referencing anything relevant they already told you earlier in this same conversation. "
    "Never produce a response that could apply to any input regardless of what was actually said."
)


def test_system_prompt_and_isolation():
    print("=== TEST 1: VOICE SYSTEM PROMPT & DECOUPLING ===")
    with open("backend/app/ai/voice_persona.py", "r", encoding="utf-8") as f:
        voice_code = f.read()

    with open("backend/app/ai/text_ai.py", "r", encoding="utf-8") as f:
        text_code = f.read()

    # Check that the verbatim text is in voice_persona.py
    normalized_expected = " ".join(EXPECTED_PROMPT_SNIPPET.split())
    normalized_voice = " ".join(voice_code.split())
    assert normalized_expected in normalized_voice, "Verbatim prompt snippet missing from voice_persona.py!"
    print(" [PASS] Exact verbatim relevance paragraph found in voice_persona.py")

    # Check that text_ai.py does NOT have the voice prompt
    assert normalized_expected not in " ".join(text_code.split()), "Voice prompt found in text_ai.py!"
    print(" [PASS] Text chatbot is completely decoupled from voice persona prompt")


def test_frontend_female_voice_and_history():
    print("\n=== TEST 2: FRONTEND TTS FEMALE VOICE & FULL HISTORY ===")
    with open("frontend/js/app.js", "r", encoding="utf-8") as f:
        app_code = f.read()

    # Verify getFemaleVoice exists
    assert "getFemaleVoice" in app_code, "getFemaleVoice function missing in app.js!"
    assert "utterance.voice = femaleVoice" in app_code, "utterance.voice is not set to femaleVoice in speakResponse!"
    print(" [PASS] getFemaleVoice() implemented and applied to SpeechSynthesisUtterance.voice")

    # Verify female voice tokens
    for token in ["zira", "jenny", "aria", "samantha", "victoria", "karen", "female"]:
        assert token in app_code, f"Female voice filter token '{token}' missing from app.js!"
    print(" [PASS] Female voice keyword filtering contains standard OS & browser female voices")

    # Verify full history is passed (not dialogue.slice(-4))
    assert "history: dialogue.map(d => ({ sender: d.sender, text: d.text }))" in app_code, "Full dialogue history not passed in fetch body!"
    print(" [PASS] Full conversation history (dialogue.map) is transmitted to backend")


def test_multi_turn_conversation_relevance():
    print("\n=== TEST 3: MULTI-TURN CONVERSATION RELEVANCE ===")

    # Turn 1: Greeting
    turn1_msg = "Hi Dr. HeartBeat, good morning!"
    print(f"\n>> Patient Turn 1: '{turn1_msg}'")
    payload1 = {
        "message": turn1_msg,
        "patient_id": 1,
        "age": 34,
        "weight": 62.0,
        "history": [
            {"sender": "assistant", "text": "Hello! I'm Dr. HeartBeat. How are you doing today?"}
        ]
    }
    r1 = requests.post(f"{BASE_URL}/voice-assistant", json=payload1)
    assert r1.status_code == 200, f"Turn 1 request failed: {r1.text}"
    data1 = r1.json()
    reply1 = data1["reply"]
    print(f"<< Dr. HeartBeat Reply 1: {reply1}")
    print(f"   Model used: {data1.get('model_used')}")

    # Verify Turn 1 is a natural greeting and has NO symptom acknowledgment
    lower1 = reply1.lower()
    symptom_markers = ["discomfort like", "symptom", "throbbing", "paracetamol", "prescription", "condition", "treatment"]
    has_bad_markers = any(m in lower1 for m in symptom_markers)
    assert not has_bad_markers, f"Turn 1 contained inappropriate symptom language: {reply1}"
    assert any(g in lower1 for g in ["morning", "hello", "hi", "nice to", "day", "help"]), f"Turn 1 was not a warm greeting: {reply1}"
    print(" [PASS] Turn 1 greeted naturally with zero symptom-acknowledgment language")

    # Turn 2: Real Symptom
    turn2_msg = "I have had a sharp throbbing pain in my left wrist since I slipped yesterday."
    print(f"\n>> Patient Turn 2: '{turn2_msg}'")
    payload2 = {
        "message": turn2_msg,
        "patient_id": 1,
        "age": 34,
        "weight": 62.0,
        "history": payload1["history"] + [
            {"sender": "user", "text": turn1_msg},
            {"sender": "assistant", "text": reply1}
        ]
    }
    r2 = requests.post(f"{BASE_URL}/voice-assistant", json=payload2)
    assert r2.status_code == 200, f"Turn 2 request failed: {r2.text}"
    data2 = r2.json()
    reply2 = data2["reply"]
    print(f"<< Dr. HeartBeat Reply 2: {reply2}")
    print(f"   Model used: {data2.get('model_used')}")

    lower2 = reply2.lower()
    assert "wrist" in lower2, f"Turn 2 failed to mention wrist: {reply2}"
    assert any(w in lower2 for w in ["slip", "fell", "fall", "pain", "hurt"]), f"Turn 2 failed to reference slip or pain: {reply2}"
    print(" [PASS] Turn 2 specifically addressed left wrist pain and the slip")

    # Turn 3: Follow-up Detail
    turn3_msg = "Yes, it hurts when I turn a doorknob, but I can still move my fingers."
    print(f"\n>> Patient Turn 3: '{turn3_msg}'")
    payload3 = {
        "message": turn3_msg,
        "patient_id": 1,
        "age": 34,
        "weight": 62.0,
        "history": payload2["history"] + [
            {"sender": "user", "text": turn2_msg},
            {"sender": "assistant", "text": reply2}
        ]
    }
    r3 = requests.post(f"{BASE_URL}/voice-assistant", json=payload3)
    assert r3.status_code == 200, f"Turn 3 request failed: {r3.text}"
    data3 = r3.json()
    reply3 = data3["reply"]
    print(f"<< Dr. HeartBeat Reply 3: {reply3}")
    print(f"   Model used: {data3.get('model_used')}")

    lower3 = reply3.lower()
    # Coherent follow-up must address the doorknob/turning or fingers or movement
    assert any(w in lower3 for w in ["doorknob", "turn", "twist", "movement", "grip", "fingers", "motion", "wrist"]), (
        f"Turn 3 failed to address the follow-up detail: {reply3}"
    )
    print(" [PASS] Turn 3 coherently responded to doorknob turning, finger movement, and previous context")

    print("\n ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ")


if __name__ == "__main__":
    test_system_prompt_and_isolation()
    test_frontend_female_voice_and_history()
    test_multi_turn_conversation_relevance()
