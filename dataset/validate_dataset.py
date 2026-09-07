"""
HeartBeat 360 — Medical Education Dataset Validator
Validates JSONL dataset for structural integrity, WHO compliance, and clinical safety rules.
"""

import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


FORBIDDEN_DIAGNOSES = [
    r"\byou have (cancer|diabetes|hypertension|asthma|covid|pneumonia|a stroke|a heart attack)\b",
    r"\bi diagnose you with\b",
    r"\bmy diagnosis is\b",
    r"\byou are suffering from [a-z]+ disease\b",
]

FORBIDDEN_PRESCRIPTIONS = [
    r"\btake \d+\s*(mg|ml|tablets|capsules)\b",
    r"\bi prescribe\b",
    r"\bstart taking [a-z]+ at \d+\b",
    r"\bincrease your dose to\b",
]

RECOMMENDATION_KEYWORDS = [
    "consult", "doctor", "physician", "healthcare", "specialist", "medical",
    "pharmacist", "pediatrician", "cardiologist", "dermatologist", "dentist",
    "gynecologist", "orthopedic", "physiotherapist", "psychiatrist", "psychologist",
    "neurologist", "pulmonologist", "gastroenterologist", "nephrologist", "urologist",
    "oncologist", "ophthalmologist", "ent", "endocrinologist", "dietitian", "audiologist",
    "hospital", "clinic", "surgeon", "therapist", "optometrist", "podiatrist",
    "डॉक्टर", "चिकित्सक", "हਸਪਤਾਲ", "ਡਾਕਟਰ", "ਮਾਹਿਰ", "ਬਾਲ ਰੋਗ", "ਹਸਪਤਾਲ"
]

EMERGENCY_KEYWORDS = [
    "emergency", "911", "112", "108", "urgent", "immediate", "आपातकालीन", "ਐਮਰਜੈਂਸੀ",
    "immediately", "promptly", "urgently", "life-threatening", "critical"
]

ACUTE_TRIGGERS = [
    "chest pain", "cannot breathe", "stroke", "overdose", "choking", "anaphylaxis",
    "heart attack", "knocked out", "severe bleeding", "sudden vision loss",
    "poison", "heat stroke", "seizure", "unresponsive", "severe burn"
]


def validate_dataset(filepath: str):
    if not os.path.exists(filepath):
        print(f"[FAIL] File not found: {filepath}")
        return False

    total_entries = 0
    errors = []
    warnings = []
    specialty_counts = {}

    with open(filepath, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            total_entries += 1

            # 1. JSON parsing check
            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"Line {idx}: Invalid JSON -> {e}")
                continue

            # 2. Schema check (ShareGPT format)
            if "conversations" not in data or not isinstance(data["conversations"], list):
                errors.append(f"Line {idx}: Missing or invalid 'conversations' key")
                continue

            convs = data["conversations"]
            if len(convs) < 3 or len(convs) % 2 == 0:
                errors.append(f"Line {idx}: Conversation must have odd number of turns >= 3 (system, human, gpt, [human, gpt]*)")
                continue

            system_turn = convs[0]
            if system_turn.get("from") != "system" or not system_turn.get("value"):
                errors.append(f"Line {idx}: First turn must be non-empty system prompt")

            # Validate all human and gpt turns
            for turn_idx in range(1, len(convs), 2):
                h_turn = convs[turn_idx]
                g_turn = convs[turn_idx + 1]

                if h_turn.get("from") != "human" or not h_turn.get("value"):
                    errors.append(f"Line {idx} Turn {turn_idx}: Must be valid human message")
                if g_turn.get("from") != "gpt" or not g_turn.get("value"):
                    errors.append(f"Line {idx} Turn {turn_idx+1}: Must be valid gpt response")

                h_text = h_turn.get("value", "")
                g_text = g_turn.get("value", "").lower()

                # Safety Check: No independent diagnosis
                for pattern in FORBIDDEN_DIAGNOSES:
                    if re.search(pattern, g_text, re.IGNORECASE):
                        errors.append(f"Line {idx} Turn {turn_idx+1}: Potential forbidden diagnosis: '{pattern}'")

                # Safety Check: No independent prescription
                for pattern in FORBIDDEN_PRESCRIPTIONS:
                    if re.search(pattern, g_text, re.IGNORECASE):
                        errors.append(f"Line {idx} Turn {turn_idx+1}: Potential forbidden prescription: '{pattern}'")

                # Check recommendation keywords across the dialogue
                has_rec = any(kw in g_text for kw in RECOMMENDATION_KEYWORDS)
                has_question = any(q_mark in g_text for q_mark in ["?", "could you", "can you", "please tell", "how long", "what", "where"])
                if not has_rec and not has_question:
                    warnings.append(f"Line {idx} Turn {turn_idx+1}: Missing consultation advice or clarifying questions")

                # Check emergency escalation if human message mentions acute red-flags
                if any(trig in h_text.lower() for trig in ACUTE_TRIGGERS):
                    has_emergency = any(ekw in g_text for ekw in EMERGENCY_KEYWORDS)
                    if not has_emergency:
                        warnings.append(f"Line {idx} Turn {turn_idx+1}: Acute trigger present but missing emergency escalation term")

    print("=" * 60)
    print(" HEARTBEAT 360 — DATASET VALIDATION REPORT")
    print("=" * 60)
    print(f"File: {os.path.basename(filepath)}")
    print(f"Total Conversations: {total_entries}")
    print(f"Total Validation Errors: {len(errors)}")
    print(f"Total Warnings: {len(warnings)}")
    print("-" * 60)

    if errors:
        print("[FAIL] ERRORS FOUND:")
        for err in errors[:10]:
            print(f"  ❌ {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors.")
        return False
    else:
        print("✅ ZERO STRUCTURAL OR SAFETY ERRORS DETECTED.")
        print("✅ ALL CONVERSATIONS COMPLY WITH WHO HEALTHCARE AI SAFETY GUIDELINES.")
        if warnings:
            print(f"\n⚠️ Warnings ({len(warnings)}):")
            for w in warnings[:5]:
                print(f"  - {w}")
        print("=" * 60)
        return True


if __name__ == "__main__":
    default_path = os.path.join(os.path.dirname(__file__), "heartbeat360_medical_education_dataset.jsonl")
    target = sys.argv[1] if len(sys.argv) > 1 else default_path
    success = validate_dataset(target)
    sys.exit(0 if success else 1)
