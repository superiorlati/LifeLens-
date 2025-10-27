# LifeLens — Prototype

LifeLens is an AI-assisted, persona-aware habit & creativity companion. This repo contains a FastAPI backend and a React frontend (Vite).

## Quick start

### Backend
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

shell
Copy code

### Frontend
cd frontend
npm install
npm run dev

pgsql
Copy code

Open the frontend (usually `http://localhost:3000`) and interact.

## Repo structure
- `backend/app/` — FastAPI backend, DB helpers, ML training.
- `frontend/` — React frontend (Vite + React).

## How it works
- Users create an account with a persona (neutral / storyteller / musician).
- Add habits and log successes/failures.
- A small per-user model (logistic regression) predicts likelihood of maintaining habit; frontend shows persona-adapted micro-nudges.
- Models are trained locally and saved to the SQLite DB.

## Notes & next steps
- This is a prototype: add auth, production DB, better models, calendar