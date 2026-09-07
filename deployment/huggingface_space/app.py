"""
Dr. HeartBeat — Senior AI Medical Consultant (HeartBeat 360)
Hugging Face Space Deployment Application (Gradio / FastAPI)
Focused 2-Turn Clinical Triage: 1 Major Question -> Immediate Final Care Plan
"""

import os
import gradio as gr
from huggingface_hub import InferenceClient

SYSTEM_PROMPT = """You are Dr. HeartBeat, a compassionate, warm, and highly experienced Senior Medical Consultant at HeartBeat 360 with over 25 years of clinical wisdom.

YOUR CLINICAL PERSONA & FOCUSED 2-STEP TRIAGE PROTOCOL:

STEP 1: WHEN PATIENT STATES A SYMPTOM / PROBLEM (TURN 1):
• Warmly acknowledge the patient and provide a gentle safe comfort tip.
• Ask EXACTLY ONE major, highly relevant clinical question directly tied to their symptom (e.g. asking about the key food/activity trigger and location/sensation).
• NEVER ask multiple numbered questions, never interrogate, and DO NOT mention doctor recommendations in this step.

STEP 2: WHEN PATIENT REPLIES WITH THEIR ANSWER (TURN 2):
• You now have sufficient clinical clarity. DO NOT ask any further questions!
• Immediately deliver the complete finalized care plan formatted cleanly as:
   👋 **Clinical Assessment:** (Explain the likely condition, e.g. Acute Acid Reflux / Indigestion based on their reply)
   🛡️ **Precautions & Self-Care Guidance:** (Actionable precautions, posture, diet, and rest rules)
   💊 **Common Over-the-Counter (OTC) Tablet & Medicine Options:** (Suggest safe standard OTC relief options such as Antacids for stomach, Paracetamol 500mg for fever/pain, Cetirizine 10mg for allergy, with clear instructions to check packaging and consult a pharmacist)
   ⚠️ **Red Flag Warning Signs:** (Emergency symptoms requiring immediate hospital care)
   📋 **Recommended Doctor & Next Steps:** (Which medical specialist to consult and link to Doctors directory)

SAFETY & BOUNDARIES:
• State that advice is educational and not an in-person physical diagnosis or prescription.
• For acute red flags (severe chest pain, stroke signs, breathing crisis, poisoning, severe bleeding), immediately direct calling 911 / 112 / 108.

Always respond as Dr. HeartBeat in this focused, compassionate format.
"""

HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HF_API_TOKEN")
MODEL_ID = os.getenv("MODEL_ID", "meta-llama/Llama-3.1-8B-Instruct")

client = InferenceClient(api_key=HF_TOKEN, timeout=15.0) if HF_TOKEN else None


def respond(message, history):
    if not message.strip():
        return "Please describe how you are feeling or what symptoms you are experiencing."
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for val in history:
        if isinstance(val, (list, tuple)) and len(val) == 2:
            if val[0]:
                messages.append({"role": "user", "content": val[0]})
            if val[1]:
                messages.append({"role": "assistant", "content": val[1]})

    messages.append({"role": "user", "content": message})

    if client:
        try:
            response = client.chat.completions.create(
                model=MODEL_ID,
                messages=messages,
                max_tokens=450,
                temperature=0.6,
            )
            return response.choices[0].message.content.strip()
        except Exception:
            pass

    # Focused 2-Turn Fallback
    text_lower = message.lower().strip()
    history_text = " ".join([h[0] for h in history if isinstance(h, (list, tuple)) and h[0]]) + " " + message
    ht = history_text.lower()
    user_turn_count = len(history or []) + 1

    if any(k in text_lower for k in ["chest pain", "heart attack", "cannot breathe", "stroke", "poison", "overdose"]):
        return (
            "🚨 **URGENT CLINICAL ALERT:**\n"
            "Chest discomfort, tightness, or pain radiating to the jaw, neck, back, or left arm is a potential medical emergency.\n\n"
            "⚠️ **Immediate Emergency Action Required:**\n"
            "• **Call 911 (US) / 112 (EU) / 108 (India) immediately** or proceed to the nearest emergency department.\n"
            "• **Do not drive yourself.**\n"
            "• Sit upright, rest quietly, and stay calm while emergency assistance arrives."
        )

    # Turn 1: Ask 1 major question (no doctor recommendation)
    if user_turn_count == 1 and len(message.split()) < 10:
        if "stomach" in ht or "belly" in ht:
            q = "What specific food or beverage did you consume recently (e.g. spicy, oily, fast food, dairy, or soda), and where in your stomach is the pain located?"
            tip = "Sip room-temperature water or warm mint/ginger tea slowly, and avoid lying down flat."
        elif "shoulder" in ht or "knee" in ht or "sprain" in ht or "ankle" in ht:
            q = f"What physical activity or movement triggered this pain, and can you move it right now?"
            tip = "Rest the joint and apply an ice pack wrapped in a cloth for 15–20 minutes."
        else:
            q = f"What specific activity or trigger seemed to bring on this discomfort ('{message.strip()}'), and how intense is it on a scale of 1 to 10?"
            tip = "Take a moment to sit down comfortably, rest quietly, and drink a glass of water."

        return (
            f"👋 **Clinical Assessment:**\n"
            f"Hello! I have noted your concern regarding {message.strip()}.\n\n"
            f"🔍 **Doctor's Clarifying Question:**\n"
            f"{q}\n\n"
            f"💡 **Immediate Safe Care Tip:**\n"
            f"• {tip}\n\n"
            f"📋 *Please share your reply, and I will immediately provide your diagnosis, precautions, and safe OTC tablet recommendations.*"
        )

    # Turn 2: Complete Final Suggestions with Doctor Referral
    if "stomach" in ht or "belly" in ht or "acid" in ht:
        return (
            "👋 **Clinical Assessment:**\n"
            "Hello! Based on your symptoms and meal history, your condition is consistent with **Acute Acid Reflux (GERD) / Dyspepsia (Indigestion)** caused by gastric acid irritating the stomach lining.\n\n"
            "🛡️ **Precautions & Self-Care Guidance:**\n"
            "• **Stay Upright:** Remain upright for at least 2 to 3 hours after meals; elevate your head with 2 pillows when sleeping.\n"
            "• **Dietary Precautions:** Avoid spicy seasonings, fried/fatty foods, citrus, tomatoes, caffeine, and carbonated sodas for the next 48 hours.\n"
            "• **Small Bland Meals:** Eat small, frequent bland meals (oatmeal, bananas, plain rice, crackers).\n"
            "• **Hydration:** Sip room-temperature water gradually throughout the day.\n\n"
            "💊 **Common Over-the-Counter (OTC) Tablet & Medicine Options:**\n"
            "• **Antacid Chewables / Liquid:** (e.g., Calcium carbonate, Magnesium/Aluminium hydroxide like Tums, Rolaids, Digene, or Gelusil) for rapid relief within 15 minutes.\n"
            "• **Acid Reducers (OTC):** (e.g., Famotidine 10mg–20mg or Pantoprazole/Omeprazole 20mg OTC taken 30 minutes before meals).\n"
            "• *Safety Note:* Always read packaging for proper dosage and check with a pharmacist or doctor.\n\n"
            "⚠️ **Red Flag Warning Signs:**\n"
            "• Severe sharp lower right abdominal pain, rigid belly, or persistent vomiting requires emergency care.\n\n"
            "📋 **Recommended Doctor & Next Steps:**\n"
            "• If symptoms persist beyond 48 hours, schedule a clinical consultation with a **Gastroenterologist** via our **Doctors** directory."
        )
    else:
        return (
            "👋 **Clinical Assessment:**\n"
            "Hello! Based on your symptoms and clinical details, your condition is consistent with mild musculoskeletal or physiological strain.\n\n"
            "🛡️ **Precautions & Self-Care Guidance:**\n"
            "• **Rest & Recovery:** Prioritize 7 to 8 hours of restorative sleep and avoid heavy strain.\n"
            "• **Hydration:** Drink 2 to 3 liters of water daily.\n"
            "• **Symptom Monitoring:** Note any changes in intensity or location.\n\n"
            "💊 **Common Over-the-Counter (OTC) Tablet & Relief Options:**\n"
            "• **Pain Relief:** **Paracetamol (Acetaminophen) 500mg** or **Ibuprofen 400mg** (taken with food) for short-term relief.\n"
            "• *Safety Note:* Always consult a pharmacist or doctor before taking new medications.\n\n"
            "📋 **Recommended Doctor & Next Steps:**\n"
            "• If symptoms persist beyond 48–72 hours, schedule a consultation with a **Primary Care Physician**."
        )

# Gradio Interface
demo = gr.ChatInterface(
    fn=respond,
    title="🩺 Dr. HeartBeat — Senior AI Medical Consultant",
    description="HeartBeat 360 AI Health Assistant with focused 2-turn triage: 1 major question followed by complete precautions, OTC tablets, and recommended doctor.",
    examples=[
        "Doctor, I have a stomachache.",
        "My left shoulder hurts after playing badminton.",
        "My throat hurts when swallowing.",
        "I have a mild headache that started this afternoon.",
    ],
    theme="soft"
)

if __name__ == "__main__":
    demo.launch()
