# HeartBeat 360 - Complete Project Overview & Technical Architecture

## 📋 Project Overview
**HeartBeat 360** is a full-stack, multimodal healthcare assistant platform designed to empower patients, streamline clinical workflows for healthcare providers, and provide safe, AI-guided medical information. The platform integrates cross-platform mobile capability (Flutter), interactive web portal (HTML5/JS SPA), Hugging Face multimodal AI inference (Text, Vision, Speech), automated clinical safety triage with AI confidence checks, doctor directory booking, medication management, lab report analysis, and emergency escalation protocols.

---

## 🏗️ System Architecture & Monorepo Structure

```text
care bridge 360 multimodel healthcare/
├── .env                      # Environment variables & Hugging Face API token configuration
├── .gitignore                # Protects secrets and temporary build artifacts
├── requirements.txt          # Python backend dependencies
├── backend/                  # FastAPI Python Backend Application
│   └── app/
│       ├── main.py           # FastAPI application entry point, CORS, seeding, static file server & startup AI health checks
│       ├── config.py         # Pydantic BaseSettings configuration loader for .env
│       ├── db/               # Database management (SQLAlchemy ORM + SQLite)
│       │   ├── database.py   # Database connection pool & session engine
│       │   ├── models.py     # SQLAlchemy DB Schemas (Patient, Doctor, Appointment, Medicine, AIInteraction, etc.)
│       │   └── heartbeat360.db # SQLite database instance
│       ├── ai/               # Multimodal Hugging Face AI Services & Orchestrator
│       │   ├── __init__.py   # AI package initialization
│       │   ├── text_ai.py    # Text AI Service (Medical Q&A & text summarization via Hugging Face)
│       │   ├── vision_ai.py  # Vision AI Service (BLIP Image Captioning & TrOCR Text Extraction)
│       │   ├── speech_ai.py  # Speech AI Service (OpenAI Whisper voice-to-text transcription)
│       │   └── orchestrator.py # Central AI Orchestrator coordinating multimodal inputs & workflows
│       ├── routers/          # API Route Controllers
│       │   ├── patient_router.py # Patient services, AI chat, voice query, image analysis, OCR, booking & reminders
│       │   ├── doctor_router.py  # Doctor profile management, appointment slots, prescription issue
│       │   └── admin_router.py   # Admin overview, system metrics, HIPAA audit log viewer
│       └── services/
│           ├── safety_service.py # 3-Tier Clinical Safety Engine (Rules + AI Confidence Checks)
│           └── response_validator.py # Final Response Validator safety gate before returning AI output
├── flutter_app/              # Flutter / Dart Cross-Platform Mobile Application
│   ├── pubspec.yaml          # Flutter dependencies & metadata
│   ├── firestore.rules       # Firebase Firestore security rules
│   ├── seed_data/
│   │   └── seed_database.json # Seed JSON dataset for Firestore / Local DB
│   ├── test/                 # Automated Unit & Widget Tests
│   │   ├── models_test.dart
│   │   └── safety_check_service_test.dart
│   └── lib/
│       ├── main.dart         # Flutter app bootstrap with ProviderScope
│       ├── models/           # Dart Data Models (AppUser, Doctor, Medicine, Appointment, etc.)
│       ├── providers/        # State Management (StateNotifier & Riverpod providers)
│       ├── services/         # Firestore service, Mock Data provider, Safety Checker
│       ├── screens/          # Application Screens (Home, Assistant, Doctors, Medicines, My Health, Emergency)
│       └── widgets/          # Reusable UI Components (Cards, Banners, Search Bars, Modals)
└── frontend/                 # Web Portal (HTML5, CSS3 Glassmorphism, JavaScript SPA)
    ├── index.html            # Web Single Page Application interface
    ├── css/styles.css        # Custom CSS styling with dynamic themes & modern UI
    └── js/app.js             # Client-side JavaScript routing & API client logic
```

---

## 🚀 Multimodal AI Pipeline Architecture

```text
               ┌──────────────────────────────┐
                │        HEARTBEAT 360         │
                └──────────────┬───────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
      Flutter Mobile                       Web Portal
            │                                   │
            └─────────────────┬─────────────────┘
                              │
                       ┌──────▼──────┐
                       │   FastAPI   │
                       │ API Gateway │
                       └──────┬──────┘
                              │
            ┌─────────────────┼──────────────────┐
            │                 │                  │
       Patient Service   Doctor Service     Admin Service
            │                 │                  │
            └─────────────────┼──────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   AI ORCHESTRATOR   │
                   └──────────┬──────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
       Hugging Face       Hugging Face       Hugging Face
         Text AI            Vision AI          Speech AI
       (flan-t5)          (BLIP/TrOCR)       (Whisper)
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │ CLINICAL SAFETY     │
                   │ ENGINE              │
                   │                     │
                   │ Rules + AI +        │
                   │ Confidence Checks   │
                   └──────────┬──────────┘
                              │
                     ┌────────┼────────┐
                     │        │        │
                    HIGH    MEDIUM     LOW
                     │        │        │
                 Emergency  Doctor   Education
                     │        │        │
                     └────────┼────────┘
                              │
                   ┌──────────▼──────────┐
                   │ RESPONSE VALIDATOR  │
                   └──────────┬──────────┘
                              │
                   ┌──────────▼──────────┐
                   │   SQLAlchemy DB     │
                   │ SQLite/PostgreSQL   │
                   └─────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. Multimodal AI Assistant & Safety Engine
- **Multimodal Hugging Face AI Models**:
  - **Text AI (`google/flan-t5-base`)**: Context-aware clinical guidance and lab report summarization.
  - **Vision AI (`Salesforce/blip-image-captioning-base` & `microsoft/trocr-base-printed`)**: Image analysis & OCR label text extraction.
  - **Speech AI (`openai/whisper-small`)**: Voice-to-text audio transcription.
- **AI Orchestrator**: Coordinates multi-input requests (text, image, audio) and routes them through the AI services.
- **Enhanced Clinical Safety Engine**:
  - **Rules Layer**: Regex keyword detection for emergency conditions.
  - **AI Confidence Layer**: Evaluates model confidence scores; automatically escalates LOW risk to MEDIUM tier if confidence falls below the safety threshold (default: 70%).
  - **3-Tier Escalation**:
    - **HIGH (Emergency)**: Halts AI conversation immediately, prompts emergency hotline numbers (911 / 112 / 108), and logs emergency audit trail.
    - **MEDIUM (Doctor Recommendation)**: Recommends professional doctor consultation while providing educational background.
    - **LOW (Educational)**: Provides general wellness guidelines with medical attributions and safety disclaimers.
- **Response Validator**: Acts as a final security gate checking for forbidden diagnosis phrases, gibberish detection, and mandatory disclaimer enforcement.

### 2. Doctor Directory & Appointment Booking
- Filter doctors by specialty (Cardiology, Neurology, General Medicine, Physiotherapy).
- View verified doctor credentials, experience, ratings, available hours, and hospital affiliations.
- Book appointment time slots with instant database persistence and audit tracking.

### 3. Medication Database & Smart Reminders
- Search comprehensive medication library with standard dosage forms, side effects, contraindications, and category details.
- Vision OCR medication scanner for label identification and patient-weight dosage verification.
- Personalized daily medication reminders with frequency tracking and toggle control.

### 4. Lab Report OCR & Summarizer
- Upload or select diagnostic lab reports (e.g., CBC, Fasting Glucose, Cholesterol).
- Automatically extracts lab parameters via Vision OCR, flags out-of-range values, and uses Text AI to generate plain-language summaries.

### 5. Patient Health Hub ("My Health")
- Manage personal vitals profile: Age, Gender, Weight, Height.
- Access digital health record history, past lab summaries, prescriptions, and appointment records.

### 6. Admin Dashboard & Compliance Audit Log
- Admin portal to review system metrics (Active Patients, Total Appointments, Doctors, High-Risk Alerts).
- Immutable HIPAA-conscious audit logs capturing system initializations, profile creations, appointment bookings, emergency triggers, and AI interaction history.

---

## 📊 Database Schemas (`SQLAlchemy`)

| Table Name | Key Attributes | Purpose |
| :--- | :--- | :--- |
| `patient_profiles` | `id`, `name`, `age`, `gender`, `weight`, `height`, `created_at` | Patient demographic and body measurement profile |
| `doctor_profiles` | `id`, `name`, `specialty`, `experience_years`, `hospital`, `rating`, `license_number`, `bio` | Doctor & department clinical profiles |
| `appointments` | `id`, `patient_id`, `patient_name`, `doctor_id`, `date`, `time_slot`, `reason`, `status` | Scheduled patient-doctor clinical visits |
| `medicines` | `id`, `name`, `generic_name`, `dosage_form`, `standard_dosage`, `side_effects`, `contraindications` | Reference drug database |
| `reminders` | `id`, `patient_id`, `medicine_name`, `dosage`, `frequency`, `time`, `is_active` | Medication adherence reminder schedules |
| `medical_reports` | `id`, `patient_name`, `title`, `upload_date`, `key_findings`, `plain_summary`, `risk_level` | Parsed lab & diagnostic reports |
| `prescriptions` | `id`, `doctor_name`, `patient_name`, `date`, `medications`, `notes` | Issued digital doctor prescriptions |
| `audit_logs` | `id`, `timestamp`, `user_role`, `action`, `details` | Compliance & security activity tracking |
| `ai_interactions` | `id`, `patient_id`, `input_type`, `input_summary`, `ai_response`, `confidence_score`, `risk_tier`, `model_used`, `processing_time_ms`, `validation_passed`, `timestamp` | Detailed log of all AI query/response interactions |

---

## 🌐 API Endpoint Matrix (`FastAPI`)

### Patient Endpoints (`/api/patient`)
- `POST /api/patient/profile`: Create/update patient vitals profile.
- `POST /api/patient/chat`: Process patient text query through AI Orchestrator → Safety Engine → Response Validator.
- `POST /api/patient/voice-query`: Process voice audio through Speech AI (Whisper) → Text AI → Safety Engine.
- `POST /api/patient/analyze-image`: Analyze medical images via Vision AI (BLIP + TrOCR) → Safety Engine.
- `POST /api/patient/scan-medicine`: OCR drug label scanner & AI safety check.
- `POST /api/patient/scan-report`: OCR lab report parser & plain-language AI summarizer.
- `GET /api/patient/doctors`: Retrieve list of doctors (filtered by specialty).
- `POST /api/patient/book-appointment`: Confirm appointment booking.
- `GET /api/patient/reminders`: Fetch active patient reminders.
- `POST /api/patient/reminders`: Add new medication reminder.
- `POST /api/patient/emergency-log`: Record manual SOS/Emergency button press.

### Doctor Endpoints (`/api/doctor`)
- `GET /api/doctor/appointments`: List appointments for a given doctor.
- `POST /api/doctor/prescriptions`: Issue new prescription.

### Admin & AI Status Endpoints
- `GET /api/admin/metrics`: Summary platform stats.
- `GET /api/admin/audit-logs`: Access security & compliance audit logs.
- `GET /api/ai/health`: Real-time health check status for Text AI, Vision AI, and Speech AI services.

---

## ⚙️ Setup & Execution Instructions

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
HF_API_TOKEN=your_hugging_face_token_here
SAFETY_CONFIDENCE_THRESHOLD=0.7
```

### 2. Running Backend Server
```bash
# Install dependencies
pip install -r requirements.txt

# Start backend application
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Web Portal Interface: `http://127.0.0.1:8000/`

### 3. Running Flutter App
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## 🛡️ Medical Disclaimer & Clinical Safety Note
HeartBeat 360 is engineered as an educational health navigation tool and clinical decision support system. It is **not** a substitute for professional medical advice, diagnosis, or treatment. All AI responses undergo automated keyword triage and AI confidence evaluation, and are filtered through a strict Response Validator. In any emergency situation, users are immediately directed to call official emergency hotlines.
