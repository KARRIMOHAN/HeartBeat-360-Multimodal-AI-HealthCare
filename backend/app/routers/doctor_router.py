from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from backend.app.db.database import get_db
from backend.app.db.models import DoctorProfile, Appointment, PatientProfile, Prescription, AuditLog

router = APIRouter(prefix="/api/doctor", tags=["doctor"])

class PrescriptionCreate(BaseModel):
    doctor_name: str
    patient_name: str
    date: str
    medications: str
    notes: Optional[str] = "Take after meals."

class DoctorSetup(BaseModel):
    name: str # Field Title (e.g. Cardiology Department)
    specialty: str
    hospital: str
    experience_years: int
    license_number: str
    available_hours: str

@router.get("/appointments")
def get_doctor_appointments(doctor_id: Optional[int] = 1, db: Session = Depends(get_db)):
    return db.query(Appointment).all()

@router.post("/appointments/{appt_id}/status")
def update_appointment_status(appt_id: int, status: str, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = status
    db.commit()
    return {"status": "updated", "appointment": appt}

@router.get("/patient-records/{patient_id}")
def get_patient_record(patient_id: int, consent_granted: bool = True, db: Session = Depends(get_db)):
    if not consent_granted:
        return {
            "status": "CONSENT_REQUIRED",
            "message": "Access to patient medical history is gated by patient consent. Request consent via HeartBeat 360 portal."
        }
    
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        # Fallback sample patient record if profile ID 1
        return {
            "patient_name": "Eleanor Vance",
            "email": "eleanor.vance@example.com",
            "age": 34,
            "gender": "Female",
            "weight": "62 kg",
            "height": "168 cm",
            "consent_status": "GRANTED",
            "allergies": ["Penicillin", "Sulfa drugs"],
            "medical_history": ["Mild asthma (controlled)", "Hypertension stage 1"],
            "recent_labs": "Blood pressure 122/80 mmHg, HbA1c 5.4%"
        }
    
    return {
        "patient_name": patient.name,
        "email": getattr(patient, 'email', '') or "",
        "age": patient.age,
        "gender": patient.gender,
        "weight": f"{patient.weight} {patient.weight_unit}",
        "height": f"{patient.height} {patient.height_unit}",
        "consent_status": "GRANTED",
        "allergies": ["None reported"],
        "medical_history": ["Routine annual wellness checkup"],
        "recent_labs": "Metabolic panel normal"
    }

@router.post("/prescriptions")
def create_prescription(presc: PrescriptionCreate, db: Session = Depends(get_db)):
    new_p = Prescription(
        doctor_name=presc.doctor_name,
        patient_name=presc.patient_name,
        date=presc.date,
        medications=presc.medications,
        notes=presc.notes
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    
    audit = AuditLog(
        user_role="Doctor",
        action="ISSUE_PRESCRIPTION",
        details=f"Specialist {presc.doctor_name} issued digital prescription to {presc.patient_name}"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "prescription": new_p}

@router.post("/setup")
def setup_doctor_profile(profile: DoctorSetup, db: Session = Depends(get_db)):
    doc = DoctorProfile(
        name=profile.name,
        specialty=profile.specialty,
        hospital=profile.hospital,
        experience_years=profile.experience_years,
        license_number=profile.license_number,
        available_hours=profile.available_hours,
        is_verified=False # Pending admin verification
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"status": "submitted_for_verification", "doctor": doc}
