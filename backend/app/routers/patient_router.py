"""
HeartBeat 360 — Patient Router
All patient-facing API endpoints wired through the full AI pipeline:
AI Orchestrator → Safety Engine → Response Validator → Database
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import json
from typing import Optional, List
from datetime import datetime

from backend.app.db.database import get_db
from backend.app.db.models import (
    PatientProfile, DoctorProfile, Appointment, 
    Medicine, Reminder, MedicalReport, AuditLog, AIInteraction
)
from backend.app.services.safety_service import analyze_risk
from backend.app.ai.orchestrator import AIOrchestrator

router = APIRouter(prefix="/api/patient", tags=["patient"])

# Initialize AI Orchestrator (singleton per worker)
orchestrator = AIOrchestrator()


# ── Pydantic Schemas ──

class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1)
    gender: str = Field(..., min_length=1)
    age: int = Field(..., gt=0, le=120, description="Patient age in years (Required)")
    email: Optional[str] = Field(None, description="Patient email address")
    weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    height: Optional[float] = None
    height_unit: Optional[str] = "cm"

class ChatRequest(BaseModel):
    message: str
    patient_id: Optional[int] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    history: Optional[list] = None
    memory: Optional[str] = None
    session_id: Optional[str] = None

class VoiceAssistantRequest(BaseModel):
    message: Optional[str] = None
    patient_id: Optional[int] = 1
    age: Optional[int] = None
    weight: Optional[float] = None
    history: Optional[list] = None
    memory: Optional[str] = None
    session_id: Optional[str] = None

class BookingRequest(BaseModel):
    patient_name: str
    doctor_id: int
    date: str
    time_slot: str
    reason: str

class ReminderCreate(BaseModel):
    patient_id: Optional[int] = 1
    medicine_name: str
    dosage: str
    frequency: str
    time: str


# ── Patient Profile ──

@router.post("/profile")
def create_or_update_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    # Mandatory validation check on Name, Gender, and Age
    if not profile.name or not profile.gender or profile.age is None:
        raise HTTPException(status_code=400, detail="Name, Gender, and Age are required fields.")
    
    db_profile = PatientProfile(
        name=profile.name,
        email=profile.email or "",
        age=profile.age,
        gender=profile.gender,
        weight=profile.weight or 0.0,
        weight_unit=profile.weight_unit or "kg",
        height=profile.height or 0.0,
        height_unit=profile.height_unit or "cm"
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    audit = AuditLog(
        user_role="Patient",
        action="CREATE_PROFILE",
        details=f"Patient {db_profile.name} created profile."
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "data": db_profile}


# ── AI Chat (Text) — Full Pipeline ──

@router.post("/chat")
def process_patient_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Process patient text query through the full AI pipeline:
    AI Orchestrator → Text AI (Hugging Face) → Safety Engine → Response Validator → DB
    """
    # Build patient context from request
    patient_context = {}
    if req.age:
        patient_context["age"] = req.age
    if req.weight:
        patient_context["weight"] = req.weight
    if req.memory:
        patient_context["memory"] = req.memory
    if req.session_id:
        patient_context["session_id"] = req.session_id

    # Run through AI Orchestrator (handles Text AI + Safety + Validation)
    result = orchestrator.process_text_query(req.message, patient_context, req.history)

    # Log to AIInteraction table
    ai_log = AIInteraction(
        patient_id=req.patient_id,
        input_type="text",
        input_summary=req.message[:500],
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence"),
        risk_tier=result["risk_analysis"]["risk_tier"],
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)

    # Audit log for HIGH risk
    if result["risk_analysis"]["risk_tier"] == "HIGH":
        audit = AuditLog(
            user_role="Patient",
            action="HIGH_RISK_ESCALATION",
            details=f"Chat query triggered HIGH risk: '{req.message[:200]}'"
        )
        db.add(audit)

    db.commit()

    return {
        "risk_analysis": result["risk_analysis"],
        "reply": result["reply"],
        "confidence": result.get("confidence"),
        "model_used": result.get("model_used"),
        "processing_time_ms": result.get("processing_time_ms"),
        "attribution": result.get("attribution", result["risk_analysis"].get("source_attribution"))
    }


# ── Voice Query (Speech AI → Text AI) ──

@router.post("/voice-query")
async def process_voice_query(
    audio: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    age: Optional[int] = Form(None),
    weight: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Process voice input through the full AI pipeline:
    Speech AI (Whisper) → Text AI → Safety Engine → Response Validator → DB
    """
    audio_bytes = await audio.read()

    patient_context = {}
    if age:
        patient_context["age"] = age
    if weight:
        patient_context["weight"] = weight

    # Run through AI Orchestrator (handles Speech → Text → Safety → Validation)
    result = orchestrator.process_audio(audio_bytes, patient_context)

    # Log to AIInteraction table
    ai_log = AIInteraction(
        patient_id=patient_id,
        input_type="speech",
        input_summary=result.get("transcription", "Audio input")[:500],
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence"),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)
    db.commit()

    return {
        "transcription": result.get("transcription", ""),
        "risk_analysis": result.get("risk_analysis"),
        "reply": result["reply"],
        "confidence": result.get("confidence"),
        "model_used": result.get("model_used"),
        "modality": result.get("modality"),
        "processing_time_ms": result.get("processing_time_ms")
    }


# ── NVIDIA Voice Assistant (Hugging Face Canary-1B & Nemotron-70B) ──

@router.post("/voice-assistant")
def process_nvidia_voice_assistant(req: VoiceAssistantRequest, db: Session = Depends(get_db)):
    """
    Dedicated AI Voice Assistant endpoint powered by NVIDIA models on Hugging Face:
    - Conversational Spoken Guidance: nvidia/Llama-3.1-Nemotron-70B-Instruct-HF
    - Speech ASR: nvidia/canary-1b
    - Safety Engine: Clinical Guardrails (Tiers 1, 2, 3)
    """
    patient_context = {
        "name": "there",
        "age": req.age or 34,
        "weight": req.weight or 62.0,
        "active_problems": "Tension Headache & Strain, Mild Asthma, Stage 1 Hypertension",
        "recent_vitals": "BP 122/80, BMI 22.0, Pulse 72 bpm",
        "medications": "Amoxicillin 500mg, Albuterol inhaler PRN",
        "memory": req.memory or ""
    }
    if req.session_id:
        patient_context["session_id"] = req.session_id

    # If patient exists in DB, fetch actual profile details
    if req.patient_id:
        db_patient = db.query(PatientProfile).filter(PatientProfile.id == req.patient_id).first()
        if db_patient:
            patient_context["name"] = db_patient.name
            patient_context["age"] = db_patient.age
            if db_patient.weight:
                patient_context["weight"] = db_patient.weight

    result = orchestrator.process_nvidia_voice_query(
        message=req.message,
        audio_bytes=None,
        patient_context=patient_context,
        history=req.history
    )

    # Log interaction
    ai_log = AIInteraction(
        patient_id=req.patient_id or 1,
        input_type="nvidia_voice",
        input_summary=(req.message or "NVIDIA Voice query")[:500],
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence"),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used", "HeartBeat 360 Clinical Voice Intelligence"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)

    if result.get("risk_analysis", {}).get("risk_tier") == "HIGH":
        audit = AuditLog(
            user_role="Patient",
            action="VOICE_HIGH_RISK",
            details=f"Voice query triggered HIGH emergency risk: '{(req.message or '')[:200]}'"
        )
        db.add(audit)

    db.commit()

    return {
        "reply": result["reply"],
        "transcription": result.get("transcription", ""),
        "risk_analysis": result.get("risk_analysis"),
        "confidence": result.get("confidence"),
        "model_used": result.get("model_used", "HeartBeat 360 Clinical Voice Intelligence"),
        "modality": "voice",
        "attribution": result.get("attribution", "HeartBeat 360 Clinical Voice Intelligence"),
        "processing_time_ms": result.get("processing_time_ms")
    }


@router.post("/voice-assistant/audio")
async def process_nvidia_voice_audio(
    audio: UploadFile = File(...),
    patient_id: Optional[int] = Form(1),
    age: Optional[int] = Form(None),
    weight: Optional[float] = Form(None),
    memory: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Process raw audio stream via NVIDIA Canary-1B ASR + NVIDIA Nemotron-70B conversational reasoning.
    """
    audio_bytes = await audio.read()

    patient_context = {}
    if age:
        patient_context["age"] = age
    if weight:
        patient_context["weight"] = weight
    if memory:
        patient_context["memory"] = memory

    result = orchestrator.process_nvidia_voice_query(
        message=None,
        audio_bytes=audio_bytes,
        patient_context=patient_context
    )

    ai_log = AIInteraction(
        patient_id=patient_id,
        input_type="nvidia_voice_audio",
        input_summary=result.get("transcription", "Audio Voice Input")[:500],
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence"),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)
    db.commit()

    return {
        "transcription": result.get("transcription", ""),
        "reply": result["reply"],
        "risk_analysis": result.get("risk_analysis"),
        "confidence": result.get("confidence"),
        "model_used": result.get("model_used", "HeartBeat 360 Clinical Voice Intelligence"),
        "modality": "voice_audio",
        "attribution": result.get("attribution", "HeartBeat 360 Clinical Voice Intelligence"),
        "processing_time_ms": result.get("processing_time_ms")
    }


# ── Image Analysis (Vision AI) ──

@router.post("/analyze-image")
async def analyze_medical_image(
    file: UploadFile = File(...),
    query: Optional[str] = Form(None),
    patient_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Analyze a medical image through Vision AI:
    Vision AI (BLIP + TrOCR) → Safety Engine → Response Validator → DB
    """
    image_bytes = await file.read()

    result = orchestrator.process_image(image_bytes, query)

    # Log to AIInteraction table
    ai_log = AIInteraction(
        patient_id=patient_id,
        input_type="image",
        input_summary=f"Image: {file.filename or 'uploaded'}" + (f" Query: {query}" if query else ""),
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence"),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)
    db.commit()

    return {
        "status": "analyzed",
        "caption": result.get("caption", ""),
        "ocr_text": result.get("ocr_text", ""),
        "interpretation": result.get("interpretation"),
        "reply": result["reply"],
        "risk_analysis": result.get("risk_analysis"),
        "confidence": result.get("confidence"),
        "model_used": result.get("model_used"),
        "processing_time_ms": result.get("processing_time_ms")
    }


# ── Tablet / Medicine Scanner (Qwen LLM + Search Tool: Tavily/Serper/Brave) ──

@router.post("/scan-medicine")
async def scan_medicine_ocr(
    medicine_name: Optional[str] = Form(None),
    patient_weight: Optional[float] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_allergies: Optional[str] = Form(None),
    current_medicines: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Scan tablet / medicine using Qwen multimodal model + Search Tool (Tavily/Serper/Brave):
    User scans → Qwen LLM → Search Tool → Web Results → Qwen LLM → Final Answer
    """
    image_bytes = None
    if file:
        image_bytes = await file.read()

    allergies_list = [a.strip() for a in patient_allergies.split(",") if a.strip()] if patient_allergies else []
    current_meds_list = [m.strip() for m in current_medicines.split(",") if m.strip()] if current_medicines else []

    # Execute full Qwen + Search Tool pipeline
    result = orchestrator.process_tablet_scan(
        image_bytes=image_bytes,
        medicine_name=medicine_name,
        patient_weight=patient_weight,
        patient_age=patient_age,
        patient_allergies=allergies_list,
        current_medicines=current_meds_list,
    )

    detected_name = result.get("brand_name") or medicine_name or "Unknown Medicine"
    generic_name = result.get("generic_name") or detected_name

    # Cross-reference database medicine if exists
    db_medicine = db.query(Medicine).filter(
        Medicine.name.ilike(f"%{detected_name.split()[0] if detected_name else ''}%")
    ).first()

    med_info = {
        "generic": generic_name,
        "active_ingredients": result.get("active_ingredients", [generic_name]),
        "strength": result.get("strength", "Standard"),
        "dosage_form": result.get("dosage_form", "Tablet"),
        "usage": f"Standard therapeutic use for {generic_name}",
        "dosage_check": f"Calculated for {patient_weight}kg, {patient_age} yrs: See clinical guidance below." if (patient_weight or patient_age) else "Adult standard dosing.",
        "side_effects": "Refer to clinical synthesis below for detailed mild and serious symptoms.",
        "allergy_warning": f"Check allergies ({', '.join(allergies_list) if allergies_list else 'None reported'}) with your pharmacist."
    }

    if db_medicine:
        med_info["usage"] = f"{db_medicine.category} — {db_medicine.dosage_form}"
        med_info["dosage_check"] = db_medicine.standard_dosage
        med_info["side_effects"] = db_medicine.side_effects
        med_info["allergy_warning"] = db_medicine.contraindications

    # Log to AIInteraction
    ai_log = AIInteraction(
        input_type="image" if file else "text",
        input_summary=f"Qwen Tablet Scan: {detected_name}",
        ai_response=result.get("reply", "")[:1000],
        confidence_score=result.get("confidence", 0.9),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)
    db.commit()

    return {
        "status": "scanned",
        "brand_name": result.get("brand_name"),
        "generic_name": generic_name,
        "active_ingredients": result.get("active_ingredients", []),
        "strength": result.get("strength"),
        "dosage_form": result.get("dosage_form"),
        "ocr_detected_text": f"Scanned: {detected_name} ({generic_name})",
        "search_queries": result.get("search_queries", []),
        "search_provider": result.get("search_provider"),
        "search_citations": result.get("search_citations", []),
        "medicine_details": med_info,
        "ai_analysis": result.get("reply"),
        "final_answer": result.get("reply"),
        "risk_tier": result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        "confidence": result.get("confidence"),
        "processing_time_ms": result.get("processing_time_ms"),
        "attribution": "HeartBeat 360 Clinical Intelligence · Evidence-Based Drug Safety Engine"
    }


# ── Medical Report Scanner (Qwen LLM + Search Tool: Tavily/Serper/Brave) ──

@router.post("/scan-report")
async def scan_report_ocr(
    title: Optional[str] = Form("Comprehensive Blood Count (CBC) & Metabolic Panel"),
    patient_id: Optional[int] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Parse a medical lab report using Qwen LLM + Search Tool (Tavily/Serper/Brave):
    User scans → Qwen LLM → Search Tool → Web Results → Qwen LLM → Final Answer
    """
    image_bytes = None
    if file:
        image_bytes = await file.read()

    patient_ctx = {}
    if patient_age:
        patient_ctx["age"] = patient_age
    if patient_gender:
        patient_ctx["gender"] = patient_gender

    # If patient_id given, fetch patient details from DB
    if patient_id:
        p = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
        if p:
            if p.age:
                patient_ctx["age"] = p.age
            if p.gender:
                patient_ctx["gender"] = p.gender

    # Run Qwen + Search Tool pipeline
    result = orchestrator.process_medical_scan(
        image_bytes=image_bytes,
        title=title,
        patient_context=patient_ctx
    )

    report_title = result.get("report_title") or title or "Clinical Diagnostic Report"
    structured_findings = result.get("structured_findings", [])
    final_text = result.get("reply", "")

    # Save report to database
    rep = MedicalReport(
        patient_name="Patient User",
        title=report_title,
        key_findings=json.dumps(structured_findings) if isinstance(structured_findings, list) else str(structured_findings),
        plain_summary=final_text[:2000],
        risk_level=result.get("risk_analysis", {}).get("risk_tier", "LOW")
    )
    db.add(rep)

    # Log AI interaction
    ai_log = AIInteraction(
        patient_id=patient_id,
        input_type="image" if file else "text",
        input_summary=f"Qwen Report Scan: {report_title}",
        ai_response=final_text[:1000],
        confidence_score=result.get("confidence", 0.9),
        risk_tier=result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        model_used=result.get("model_used"),
        processing_time_ms=result.get("processing_time_ms"),
        validation_passed=result.get("validation_passed", True)
    )
    db.add(ai_log)
    db.commit()

    return {
        "status": "success",
        "title": report_title,
        "ocr_status": f"Clinical Extraction ({len(structured_findings)} parameters parsed)" if file else "Synthesized Diagnostic Parameters",
        "structured_findings": structured_findings,
        "abnormal_count": result.get("abnormal_count", 0),
        "search_queries": result.get("search_queries", []),
        "search_provider": result.get("search_provider"),
        "search_citations": result.get("search_citations", []),
        "plain_language_explanation": final_text,
        "final_answer": final_text,
        "confidence": result.get("confidence"),
        "risk_tier": result.get("risk_analysis", {}).get("risk_tier", "LOW"),
        "processing_time_ms": result.get("processing_time_ms"),
        "disclaimer": "IMPORTANT: This clinical analysis is synthesized with verified medical guidelines for patient educational guidance only. It is NOT an in-person physical diagnosis.",
        "attribution": "HeartBeat 360 Diagnostic Intelligence · Evidence-Based Clinical Guidelines"
    }


# ── Doctor Search ──

@router.get("/doctors")
def get_doctors(specialty: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DoctorProfile)
    if specialty and specialty.strip() != "All":
        query = query.filter(DoctorProfile.specialty.ilike(f"%{specialty}%"))
    return query.all()


# ── Appointment Booking ──

@router.post("/book-appointment")
def book_appointment(req: BookingRequest, db: Session = Depends(get_db)):
    appt = Appointment(
        patient_name=req.patient_name,
        doctor_id=req.doctor_id,
        date=req.date,
        time_slot=req.time_slot,
        reason=req.reason,
        status="Confirmed"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    
    audit = AuditLog(
        user_role="Patient",
        action="BOOK_APPOINTMENT",
        details=f"Booked appointment with Doctor ID #{req.doctor_id} for {req.date} at {req.time_slot}"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "confirmed", "appointment": appt}


# ── Reminders ──

@router.get("/reminders")
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).all()

@router.post("/reminders")
def add_reminder(rem: ReminderCreate, db: Session = Depends(get_db)):
    new_rem = Reminder(
        patient_id=rem.patient_id,
        medicine_name=rem.medicine_name,
        dosage=rem.dosage,
        frequency=rem.frequency,
        time=rem.time,
        is_active=True
    )
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return new_rem


# ── Emergency ──

@router.post("/emergency-log")
def log_emergency(reason: str = "User pressed emergency overlay button", db: Session = Depends(get_db)):
    audit = AuditLog(
        user_role="Patient",
        action="EMERGENCY_BUTTON_TRIGGERED",
        details=f"Emergency action overlay initiated: {reason}"
    )
    db.add(audit)
    db.commit()
    return {"status": "logged", "timestamp": datetime.utcnow().isoformat()}
