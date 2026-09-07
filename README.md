# HeartBeat 360 - Multimodal Healthcare Assistant

HeartBeat 360 is an integrated, multimodal healthcare platform providing AI-assisted triage, doctor booking, medication reminders, diagnostic lab report summarization, and emergency escalation workflows across Mobile (Flutter) and Web (FastAPI + HTML5/JS) interfaces.

## 🌟 Highlights & Features
- 🏥 **Automated Safety Triage**: 3-Tier risk escalation engine (High/Emergency, Medium/Doctor, Low/Educational).
- 🩺 **Doctor Directory & Booking**: Real-time scheduling with verified medical specialists.
- 💊 **Medication Tracker & OCR**: Dosage safety checking, side effect lookup, and smart daily reminders.
- 📄 **Lab Report Parser**: Translates complex blood counts and diagnostic panels into plain language summaries.
- 🚨 **Emergency SOS System**: One-tap emergency escalation, critical alerts, and global hotline access.
- 📊 **HIPAA-Conscious Audit Log**: Comprehensive activity tracking for compliance and auditability.

## 📁 Repository Structure
- [`/backend`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/backend): Python FastAPI backend server, SQLite database, and safety service.
- [`/flutter_app`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/flutter_app): Cross-platform Flutter mobile client with Riverpod and Firestore integration.
- [`/frontend`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/frontend): Interactive glassmorphism single-page web portal.
- [`/PROJECT_INFO.md`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/PROJECT_INFO.md): Detailed technical architecture, DB schemas, and API reference.

## ⚡ Quick Start

### Start Backend API Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) to access the Web Portal or [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for Swagger API documentation.

### Run Flutter Mobile App
```bash
cd flutter_app
flutter pub get
flutter run
```

## 🚀 Cloud Deployment

See [`DEPLOYMENT.md`](file:///c:/Users/kmoha/Downloads/care%20bridge%20360%20multimodel%20healthcare/DEPLOYMENT.md) for complete step-by-step guides on:
- **Render** (Recommended 1-click GitHub deployment for FastAPI + Web Portal)
- **Railway** (Automated Docker container deployment)
- **Docker / Cloud VPS** (Self-hosted production deployment)
- **Hugging Face Spaces** (Dr. HeartBeat Gradio AI Medical Consultant)
- **Flutter Mobile App Build** (Android APK & iOS)

