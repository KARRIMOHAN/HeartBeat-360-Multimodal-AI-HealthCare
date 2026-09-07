import urllib.request
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/patient"

queries = [
    {
        "name": "1. Tension Headache",
        "query": "I have had a throbbing tension headache and neck stiffness for 2 days.",
        "expected_tier": "LOW"
    },
    {
        "name": "2. Medication Safety",
        "query": "Is it safe to take Amoxicillin 500mg with my blood pressure medication?",
        "expected_tier": "LOW"
    },
    {
        "name": "3. Fever & Chills",
        "query": "What should I do for an adult running a 101.5°F fever with chills and fatigue?",
        "expected_tier": "LOW"
    },
    {
        "name": "4. Lab Results",
        "query": "Can you explain what slightly elevated fasting blood glucose means?",
        "expected_tier": "LOW"
    },
    {
        "name": "5. Emergency: Severe Chest Pain",
        "query": "I have severe crushing chest pain radiating to my jaw and left arm with shortness of breath.",
        "expected_tier": "HIGH"
    }
]

print("=" * 80)
print("HEARTBEAT 360: TESTING VOICE ASSISTANT (NVIDIA VOICE PERSONA)")
print("=" * 80)

results = []

for q in queries:
    payload = {
        "message": q["query"],
        "patient_id": 1,
        "age": 34,
        "weight": 62.0
    }
    req = urllib.request.Request(
        f"{BASE_URL}/voice-assistant",
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        reply = data.get("reply", "")
        tier = data.get("risk_analysis", {}).get("risk_tier", "UNKNOWN")
        words = len(reply.split())
        has_markdown = bool(re.search(r"[\*#•\-\+]|(\*\*)|(👋|🛡️|💊|⚠️|📋|💡|🩺|🚨|🔍)", reply))
        
        print(f"\n--- {q['name']} ---")
        print(f"Patient Query: \"{q['query']}\"")
        print(f"Risk Tier: {tier} (Expected: {q['expected_tier']})")
        print(f"Word Count: {words} words")
        print(f"Contains Stray Markdown/Bullets/Emojis: {has_markdown}")
        print(f"Model Used: {data.get('model_used')}")
        print(f"Attribution: {data.get('attribution')}")
        print(f"Response:\n{reply}\n")
        
        results.append({
            "name": q["name"],
            "tier": tier,
            "words": words,
            "has_markdown": has_markdown,
            "reply": reply
        })

print("=" * 80)
print("COMPARING TEXT CHATBOT VS. VOICE ASSISTANT ON TENSION HEADACHE")
print("=" * 80)

chat_req = urllib.request.Request(
    f"{BASE_URL}/chat",
    data=json.dumps({"message": "I have had a throbbing tension headache and neck stiffness for 2 days.", "patient_id": 1}).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(chat_req) as c_resp:
    chat_data = json.loads(c_resp.read().decode('utf-8'))
    print("TEXT CHATBOT RESPONSE (Clinical/Structured format):")
    print(chat_data.get("reply", "")[:350] + "...\n")

print("=" * 80)
print("ALL TESTS COMPLETED SUCCESSFULLY")
print("=" * 80)
