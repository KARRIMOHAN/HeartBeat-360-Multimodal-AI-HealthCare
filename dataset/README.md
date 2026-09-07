# 🩺 HeartBeat 360 — Medical Education Dataset

A comprehensive, safety-first clinical conversation dataset in **ShareGPT / JSONL format** designed for fine-tuning **`meta-llama/Llama-3.1-8B-Instruct`** and other open-weights LLMs.

Fully compliant with **World Health Organization (WHO)** guidance on Artificial Intelligence for Health: AI must support, triage, and educate — **never independently diagnose diseases or prescribe treatments**.

---

## 🛡️ Core Safety Principles

Every single conversation in this dataset strictly enforces the following 6 clinical safety rules:

1. **No Independent Diagnosis (❌):**
   The model never says *"You have X disease"* or offers definitive clinical conclusions over chat.
2. **No Independent Prescription (❌):**
   The model never says *"Take medicine X at Y dose"* or advises changing medication regimens without a doctor.
3. **Consistent Educational Disclaimers (✅):**
   Every response makes clear that guidance is educational and not a substitute for direct medical evaluation.
4. **Always Recommends Qualified Consultation (✅):**
   Directs users to consult primary care doctors, pediatricians, dentists, pharmacists, or appropriate medical specialists.
5. **Immediate Emergency Escalation (🚨):**
   For red-flag symptoms (severe chest pain, stroke signs, breathing difficulty, poisoning, anaphylaxis, heavy bleeding), immediate emergency contacts (911/112/108) are provided.
6. **Source Awareness & Rigor (📋):**
   Information aligns with evidence-based first-aid protocols, standard reference ranges, and established health practices.

---

## 📂 Dataset Specification

- **File Name:** [`heartbeat360_medical_education_dataset.jsonl`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/dataset/heartbeat360_medical_education_dataset.jsonl)
- **Format:** JSON Lines (`.jsonl`), 1 JSON object per line
- **Schema:** ShareGPT / Multi-Turn conversation format:

```json
{
  "conversations": [
    {
      "from": "system",
      "value": "You are a healthcare education assistant. You provide general educational information only. You do not diagnose diseases, prescribe medicines, or change treatment plans. You always recommend consulting a qualified healthcare professional. For emergency symptoms, you instruct users to contact emergency services immediately."
    },
    {
      "from": "human",
      "value": "I have a fever and body pain for two days. What should I do?"
    },
    {
      "from": "gpt",
      "value": "Fever and generalized body pain are common responses of the immune system to various infections. General self-care measures include resting, maintaining good hydration (drinking 2 to 3 liters of water or broths daily), and keeping the room at a comfortable temperature..."
    }
  ]
}
```

---

## 📊 Dataset Coverage (312 Total Conversations)

### 🏥 20 Medical Specialties Covered:
1. **General Medicine:** Fever, fatigue, dehydration, low-grade temperature, nausea, vertigo.
2. **Cardiology:** Chest pain, palpitations, hypertension, resting heart rates, heart failure, PAD.
3. **Dermatology:** Rashes, mole evaluation (ABCDE), eczema, sunburn, acne routines, chemical burns.
4. **Dentistry:** Jaw swelling, toothache, bleeding gums, tooth avulsion, dry socket, TMJ.
5. **Pediatrics:** Toddler fever, dehydration signs, teething, croup, foreign body ingestion.
6. **Gynecology & Obstetrics:** Menorrhagia, PCOS, pregnancy warning signs, Pap smear, endometriosis.
7. **Orthopedics:** Ankle sprains (R.I.C.E.), knee pain, posture, osteoporosis, rotator cuff tears.
8. **Physiotherapy:** Lower back exercises, active vs passive therapy, core stability, balance training.
9. **Psychiatry / Psychology:** Depression, panic attacks, GAD, insomnia (CBT-I), acute overwhelm.
10. **Neurology:** Stroke signs (B.E. F.A.S.T.), migraines, carpal tunnel, seizure first-aid, concussions.
11. **Pulmonology:** Dyspnea, asthma triggers, sleep apnea (OSA), bronchitis, smoking cessation.
12. **Gastroenterology:** Acute stomach pain, GERD management, IBS vs IBD, celiac disease, gallstones.
13. **Nephrology:** Leg edema with hypertension, kidney stones, CKD screening (eGFR, UACR), AKI.
14. **Urology:** UTI symptoms, BPH, painless hematuria, testicular torsion, pelvic floor training.
15. **Oncology:** Breast lumps, standard screening schedules (CAUTION), benign vs malignant tumors.
16. **Ophthalmology:** Sudden vision loss, digital eye strain (20-20-20 rule), retinal tears, glaucoma.
17. **ENT:** Acute ear pain, epistaxis (nosebleeds), tinnitus, sinusitis, epiglottitis.
18. **Endocrinology:** Polydipsia/polyuria (diabetes), hypothyroidism vs hyperthyroidism, vitamin D.
19. **Nutrition & Dietetics:** Healthy weight management, Mediterranean diet, iron absorption, prebiotics.
20. **Emergency Medicine:** Drug overdose, choking (Heimlich), thermal burns, anaphylaxis, sepsis.

### 🌐 4 Cross-Cutting Domains:
21. **Medicine Safety & Pharmacology:** Acetaminophen/NSAID combining, early antibiotic cessation risks, grapefruit interactions, missed doses.
22. **Lab Report Explanations:** CBC analysis, HbA1c & fasting glucose, lipid panels, liver enzymes (ALT/AST), renal markers.
23. **Appointment & Clinical Navigation:** Preparing for visits, requesting medical records, second opinions, telemedicine vs in-person.
24. **Multilingual Conversations:** Fluent, culturally natural conversations in **Hindi** (हिंदी) and **Punjabi** (ਪੰਜਾਬੀ).

---

## 🛠️ Verification & Quality Assurance

Run the automated validator to inspect the dataset:

```bash
python dataset/validate_dataset.py
```

**Output:**
```
============================================================
 HEARTBEAT 360 — DATASET VALIDATION REPORT
============================================================
File: heartbeat360_medical_education_dataset.jsonl
Total Conversations: 312
Total Validation Errors: 0
Total Warnings: 0
------------------------------------------------------------
✅ ZERO STRUCTURAL OR SAFETY ERRORS DETECTED.
✅ ALL CONVERSATIONS COMPLY WITH WHO HEALTHCARE AI SAFETY GUIDELINES.
============================================================
```

---

## 🚀 Fine-Tuning LLaMA 3.1 with `train_llama.py`

A production-ready training script ([`train_llama.py`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/dataset/train_llama.py)) is provided to fine-tune `meta-llama/Llama-3.1-8B-Instruct` using **4-bit QLoRA** (or full FP16/BF16 LoRA).

### 1. Install Dependencies
```bash
pip install torch transformers peft trl bitsandbytes datasets accelerate
```

### 2. Run Fine-Tuning (4-bit QLoRA — Consumer GPU / Google Colab / Kaggle)
```bash
python dataset/train_llama.py \
  --model_id meta-llama/Llama-3.1-8B-Instruct \
  --dataset_path dataset/heartbeat360_medical_education_dataset.jsonl \
  --output_dir ./heartbeat360_llama3_adapter \
  --use_4bit \
  --epochs 3 \
  --batch_size 2 \
  --grad_accum 4 \
  --lr 2e-4
```

### 3. Hyperparameters & Settings:
- **Quantization:** 4-bit NF4 with double quantization & bfloat16 computation.
- **LoRA Configuration:** `r=16`, `alpha=32`, `dropout=0.05`, targeting all projection layers (`q, k, v, o, gate, up, down`).
- **Sequence Length:** 1024 tokens.
- **VRAM Requirements:** ~10–12 GB VRAM (easily fits in free Google Colab T4 or Kaggle P100/T4 GPUs).

---

## 🏥 Proactive Symptom Clarification

In real-world clinical consultations, when a patient gives vague symptom descriptions (e.g., *"I have stomach pain"*), the model is trained to:
1. **Warmly Acknowledge:** Ease anxiety with empathy.
2. **Ask Targeted Diagnostic Questions:** Clarify onset, severity (1–10), location, triggers, and associated red flags.
3. **Offer Immediate Safe Comfort:** Provide evidence-based non-pharmacological relief measures.
4. **Synthesize upon Clarification:** In subsequent turns, synthesize the patient's answers to recommend the right specialist and lifestyle care.

---

## 📜 License & Compliance

This dataset is released for medical AI research, education, and healthcare assistant development under the MIT License. Always ensure real-world clinical deployments are validated by licensed medical professionals.

