"""
HeartBeat 360 — FastAPI Application Entry Point
Initializes configuration, database, AI services, and mounts all routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging

from backend.app.config import get_settings
from backend.app.db.database import engine, Base, SessionLocal
from backend.app.db.models import DoctorProfile, Medicine, Reminder, AuditLog, AIInteraction
from backend.app.routers import patient_router, doctor_router, admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("heartbeat360")

# Initialize FastAPI App
app = FastAPI(
    title="HeartBeat 360 API",
    description="Multimodal Healthcare Assistant Backend with Hugging Face AI Integration, Clinical Safety Engine, and Response Validation",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database with sample doctors and medicines if empty
def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(DoctorProfile).count() == 0:
            sample_doctors = [
                DoctorProfile(
                    name="Cardiology Department",
                    specialty="Cardiology",
                    experience_years=14,
                    hospital="St. Jude Heart Institute",
                    rating=4.9,
                    available_days="Mon, Wed, Fri",
                    available_hours="09:00 AM - 03:00 PM",
                    is_verified=True,
                    license_number="CARD-883920",
                    bio="Specializing in preventive heart health, cardiac evaluation, lipid management, and non-invasive diagnostics."
                ),
                DoctorProfile(
                    name="General Medicine Department",
                    specialty="General Medicine",
                    experience_years=10,
                    hospital="Metropolitan Health Clinic",
                    rating=4.8,
                    available_days="Mon, Tue, Thu, Sat",
                    available_hours="10:00 AM - 06:00 PM",
                    is_verified=True,
                    license_number="GEN-449102",
                    bio="Primary care team focused on holistic patient wellness, chronic condition management, and preventive screening."
                ),
                DoctorProfile(
                    name="Physiotherapy Department",
                    specialty="Physiotherapy",
                    experience_years=8,
                    hospital="Apex Sports & Rehabilitation Center",
                    rating=4.9,
                    available_days="Tue, Wed, Thu, Fri",
                    available_hours="08:00 AM - 04:00 PM",
                    is_verified=True,
                    license_number="PT-110293",
                    bio="Specialists in musculoskeletal rehab, post-surgical recovery, ergonomic assessments, and physical therapy."
                ),
                DoctorProfile(
                    name="Neurology Department",
                    specialty="Neurology",
                    experience_years=16,
                    hospital="NeuroScience Medical Center",
                    rating=5.0,
                    available_days="Mon, Thu",
                    available_hours="01:00 PM - 07:00 PM",
                    is_verified=True,
                    license_number="NEURO-994011",
                    bio="Consultant team expert in headache disorders, movement disorders, and neuro-cognitive evaluations."
                )
            ]
            db.add_all(sample_doctors)
            
        if db.query(Medicine).count() == 0:
            sample_medicines = [
                Medicine(
                    name="Amoxicillin 500mg",
                    generic_name="Amoxicillin",
                    dosage_form="Capsule",
                    standard_dosage="500mg every 8 hours",
                    side_effects="Mild stomach pain, diarrhea, nausea",
                    contraindications="Penicillin hypersensitivity",
                    category="Antibiotic"
                ),
                Medicine(
                    name="Ibuprofen 400mg",
                    generic_name="Ibuprofen",
                    dosage_form="Tablet",
                    standard_dosage="400mg every 6 hours after food",
                    side_effects="Heartburn, abdominal discomfort, drowsiness",
                    contraindications="Active peptic ulcer disease, aspirin allergy",
                    category="NSAID / Analgesic"
                ),
                Medicine(
                    name="Metformin 850mg",
                    generic_name="Metformin Hydrochloride",
                    dosage_form="Extended Release Tablet",
                    standard_dosage="850mg once daily with evening meal",
                    side_effects="GI upset, metallic taste, vitamin B12 depletion",
                    contraindications="Severe renal impairment (eGFR < 30 mL/min)",
                    category="Antidiabetic"
                )
            ]
            db.add_all(sample_medicines)
            
        if db.query(Reminder).count() == 0:
            sample_reminders = [
                Reminder(
                    patient_id=1,
                    medicine_name="Vitamin D3 2000 IU",
                    dosage="1 Tablet",
                    frequency="Daily",
                    time="08:00 AM",
                    is_active=True
                ),
                Reminder(
                    patient_id=1,
                    medicine_name="Omega-3 Fish Oil 1000mg",
                    dosage="1 Softgel",
                    frequency="Twice daily",
                    time="08:00 AM & 08:00 PM",
                    is_active=True
                )
            ]
            db.add_all(sample_reminders)
            
        if db.query(AuditLog).count() == 0:
            sample_logs = [
                AuditLog(
                    user_role="System",
                    action="INITIALIZE_DATABASE",
                    details="HeartBeat 360 database tables created and seeded with clinical reference data."
                )
            ]
            db.add_all(sample_logs)

        db.commit()
    finally:
        db.close()

# Create tables & seed data on startup
@app.on_event("startup")
def startup_event():
    # Load and validate configuration
    try:
        settings = get_settings()
        logger.info("=" * 60)
        logger.info("  HeartBeat 360 — Starting Up")
        logger.info("=" * 60)
        logger.info(f"  HF Token: {'✅ Loaded' if settings.hf_api_token else '❌ Missing'}")
        logger.info(f"  Text Model:   {settings.hf_text_model}")
        logger.info(f"  Vision Model: {settings.hf_vision_model}")
        logger.info(f"  OCR Model:    {settings.hf_ocr_model}")
        logger.info(f"  Speech Model: {settings.hf_speech_model}")
        logger.info(f"  Safety Threshold: {settings.safety_confidence_threshold}")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"⚠️ Configuration error: {str(e)}")
        logger.error("Make sure .env file exists with HF_API_TOKEN set.")

    # Create database tables (includes new AIInteraction table)
    Base.metadata.create_all(bind=engine)
    seed_initial_data()

    logger.info("✅ Database tables created and seeded.")
    logger.info("✅ HeartBeat 360 API v2.0 ready.")
    logger.info(f"   Swagger UI: http://127.0.0.1:8000/docs")
    logger.info(f"   Web Portal:  http://127.0.0.1:8000/")

# Register API Routers
app.include_router(patient_router.router)
app.include_router(doctor_router.router)
app.include_router(admin_router.router)

# ── AI Health Check Endpoint ──
@app.get("/api/ai/health", tags=["ai"])
def ai_health_check():
    """Check the status of all Hugging Face AI services."""
    from backend.app.ai.orchestrator import AIOrchestrator
    orchestrator = AIOrchestrator()
    return orchestrator.check_all_services()

# Anti-cache middleware for frontend assets
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.startswith("/js") or path.startswith("/css") or path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Mount Frontend Static Files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(frontend_dir):
    css_dir = os.path.join(frontend_dir, "css")
    js_dir = os.path.join(frontend_dir, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    src_dir = os.path.join(frontend_dir, "src")
    if os.path.exists(src_dir):
        app.mount("/src", StaticFiles(directory=src_dir), name="src")
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"message": "HeartBeat 360 Backend API Operational. Access /docs for Swagger UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
