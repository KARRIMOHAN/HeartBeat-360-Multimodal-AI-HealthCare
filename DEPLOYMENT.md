# HeartBeat 360 — Deployment Guide

This guide covers step-by-step instructions to deploy **HeartBeat 360** (Backend API + Interactive Web Portal + Mobile App).

---

## 🚀 Option 1: Deploy Web Platform on Render (Recommended - Free & Easiest)

Render can automatically build and host the FastAPI backend + React/HTML5 Web Portal directly from your GitHub repository.

1. **Log in to Render**: Go to [render.com](https://render.com/) and sign in with your GitHub account.
2. **Create New Web Service**:
   - Click **New +** -> **Web Service**.
   - Select your repository: `KARRIMOHAN/HeartBeat-360-Multimodal-AI-HealthCare`.
3. **Configure Settings**:
   - **Name**: `heartbeat-360`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore).
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses root).
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables**:
   In the **Environment Variables** section, add:
   - `HF_API_TOKEN`: Your Hugging Face user access token (from [hf.co/settings/tokens](https://huggingface.co/settings/tokens)).
   - `PYTHONUNBUFFERED`: `1`
   - `API_HOST`: `0.0.0.0`
5. **Deploy**:
   - Click **Deploy Web Service**.
   - Once deployed, Render will generate a public HTTPS URL like:
     `https://heartbeat-360.onrender.com`
   - Both the Web Portal (`/`) and Swagger UI (`/docs`) will be live!

---

## 🚂 Option 2: Deploy on Railway

1. Go to [railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `KARRIMOHAN/HeartBeat-360-Multimodal-AI-HealthCare`.
4. Railway will automatically detect the `Dockerfile` or `Procfile`.
5. Go to **Variables** tab and add:
   - `HF_API_TOKEN`: `your_token_here`
6. Click **Generate Domain** under **Networking** in Settings to get your public live link.

---

## 🐳 Option 3: Deploy with Docker (Any Cloud VPS / AWS / DigitalOcean / GCP)

You can run the pre-configured `Dockerfile` on any server with Docker installed:

```bash
# 1. Clone the repository
git clone https://github.com/KARRIMOHAN/HeartBeat-360-Multimodal-AI-HealthCare.git
cd HeartBeat-360-Multimodal-AI-HealthCare

# 2. Configure .env
cp .env.example .env
# Edit .env and paste your HF_API_TOKEN

# 3. Build Docker container
docker build -t heartbeat360:latest .

# 4. Run Docker container
docker run -d -p 8000:8000 --env-file .env --name heartbeat360-app heartbeat360:latest
```
Access at `http://your-server-ip:8000/`.

---

## 🩺 Option 4: Deploy AI Medical Consultant on Hugging Face Spaces

A standalone Gradio Space is pre-configured in `deployment/huggingface_space/`:

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Space Name: `Dr-HeartBeat-Medical-Consultant`
3. SDK: **Gradio**
4. Hardware: **CPU Basic (Free)**
5. Upload the contents of `deployment/huggingface_space/` (`app.py`, `requirements.txt`, `README.md`).
6. In **Settings -> Variables and Secrets**, add a Secret:
   - Key: `HF_TOKEN`
   - Value: Your Hugging Face API Key.
7. The Space will build and launch a dedicated Dr. HeartBeat clinical persona chat interface.

---

## 📱 Option 5: Build & Run Flutter Mobile App

The Flutter client connects with Firestore and backend services:

```bash
cd flutter_app

# 1. Fetch dependencies
flutter pub get

# 2. Run locally on Chrome / Emulator
flutter run

# 3. Build Android Release APK
flutter build apk --release
```
The compiled APK will be located at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`
