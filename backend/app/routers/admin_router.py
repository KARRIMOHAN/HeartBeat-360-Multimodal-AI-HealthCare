from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.app.db.database import get_db
from backend.app.db.models import DoctorProfile, Medicine, AuditLog

router = APIRouter(prefix="/api/admin", tags=["admin"])

class MedicineCreate(BaseModel):
    name: str
    generic_name: str
    dosage_form: str = "Tablet"
    standard_dosage: str
    side_effects: str
    contraindications: str
    category: str = "General"

@router.get("/doctor-verifications")
def get_pending_doctors(db: Session = Depends(get_db)):
    return db.query(DoctorProfile).all()

@router.post("/doctor-verifications/{doc_id}/approve")
def approve_doctor(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doc.is_verified = True
    
    audit = AuditLog(
        user_role="Admin",
        action="APPROVE_DOCTOR_LICENSE",
        details=f"Approved license #{doc.license_number} for Dr. {doc.name}"
    )
    db.add(audit)
    db.commit()
    return {"status": "approved", "doctor": doc}

@router.get("/medicines")
def get_all_medicines(db: Session = Depends(get_db)):
    return db.query(Medicine).all()

@router.post("/medicines")
def add_medicine(med: MedicineCreate, db: Session = Depends(get_db)):
    new_med = Medicine(
        name=med.name,
        generic_name=med.generic_name,
        dosage_form=med.dosage_form,
        standard_dosage=med.standard_dosage,
        side_effects=med.side_effects,
        contraindications=med.contraindications,
        category=med.category,
        review_date=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(new_med)
    
    audit = AuditLog(
        user_role="Admin",
        action="ADD_MEDICINE_DATABASE",
        details=f"Added drug '{med.name}' ({med.generic_name}) to safety database"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
