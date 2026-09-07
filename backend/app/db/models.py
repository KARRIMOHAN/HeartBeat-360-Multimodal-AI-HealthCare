from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.database import Base

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    weight_unit = Column(String, default="kg")
    height = Column(Float, nullable=False)
    height_unit = Column(String, default="cm")
    created_at = Column(DateTime, default=datetime.utcnow)

    reminders = relationship("Reminder", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Field / Specialty Name (e.g. Cardiology Department)
    specialty = Column(String, nullable=False)
    experience_years = Column(Integer, default=5)
    hospital = Column(String, nullable=False)
    rating = Column(Float, default=4.9)
    available_days = Column(String, default="Mon, Tue, Wed, Thu, Fri")
    available_hours = Column(String, default="09:00 AM - 05:00 PM")
    is_verified = Column(Boolean, default=True)
    license_number = Column(String, nullable=False)
    bio = Column(Text, nullable=True)

    appointments = relationship("Appointment", back_populates="doctor")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), nullable=True)
    patient_name = Column(String, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=False)
    date = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="Confirmed") # Confirmed, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientProfile", back_populates="appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    dosage_form = Column(String, default="Tablet")
    standard_dosage = Column(String, nullable=False)
    side_effects = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    category = Column(String, default="General")
    review_date = Column(String, default="2026-08-01")

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), nullable=True)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False) # e.g. "Once daily at 8:00 AM", "Twice daily"
    time = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientProfile", back_populates="reminders")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    key_findings = Column(Text, nullable=False)
    plain_summary = Column(Text, nullable=False)
    risk_level = Column(String, default="LOW")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_name = Column(String, nullable=False)
    patient_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    medications = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIInteraction(Base):
    """Tracks every AI query/response for audit, analytics, and safety review."""
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), nullable=True)
    input_type = Column(String, nullable=False, default="text")  # text, image, audio, multimodal
    input_summary = Column(Text, nullable=False)  # Truncated user input for logging
    ai_response = Column(Text, nullable=True)  # AI-generated response
    confidence_score = Column(Float, nullable=True)  # Model confidence (0.0-1.0)
    risk_tier = Column(String, nullable=False, default="LOW")  # HIGH, MEDIUM, LOW
    model_used = Column(String, nullable=True)  # Which HF model processed this
    processing_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    validation_passed = Column(Boolean, default=True)  # Did it pass ResponseValidator?
    timestamp = Column(DateTime, default=datetime.utcnow)
