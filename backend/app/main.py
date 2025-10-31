# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime

from . import crud, models, schemas, ai
from .database import engine, SessionLocal
from .models import create_all as models_create_all

app = FastAPI(title="LifeLens Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    models_create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Create user
# -------------------------
@app.post("/api/create_user", response_model=schemas.CreateUserRes)
async def create_user(req: schemas.CreateUserReq, db: Session = Depends(get_db)):
    user_id = crud.create_user(db, req)
    # optional background training
    loop = asyncio.get_event_loop()
    loop.create_task(asyncio.to_thread(ai.make_predictor, user_id))
    return {"user_id": user_id}

# -------------------------
# Add habit
# -------------------------
@app.post("/api/add_habit", response_model=schemas.HabitRes)
async def add_habit(req: schemas.AddHabitReq, db: Session = Depends(get_db)):
    habit = crud.add_habit(db, req)
    return {"id": habit.id, "name": habit.name, "target_per_day": habit.target_per_day}

# -------------------------
# List habits
# -------------------------
@app.get("/api/habits", response_model=schemas.HabitListRes)
async def get_habits(user_id: str, db: Session = Depends(get_db)):
    habits = crud.list_habits(db, user_id)
    return {"habits": [{"id": h.id, "name": h.name, "target_per_day": h.target_per_day} for h in habits]}

# -------------------------
# Logging events
# -------------------------
@app.post("/api/log")
async def log_event(req: schemas.LogReq, db: Session = Depends(get_db)):
    crud.log_event(db, req)
    loop = asyncio.get_event_loop()
    loop.create_task(asyncio.to_thread(ai.make_predictor, req.user_id))
    return {"status": "ok"}

@app.get("/api/logs", response_model=schemas.LogListRes)
async def get_logs(user_id: str, habit_id: str, limit: int = 100, db: Session = Depends(get_db)):
    logs = crud.get_logs(db, user_id, habit_id, limit)
    return {"logs": [{"timestamp": l.timestamp, "success": l.success} for l in logs]}

# -------------------------
# Diary
# -------------------------
@app.post("/api/diary", response_model=schemas.DiaryEntryRes)
async def add_diary_entry(req: schemas.DiaryEntryReq, db: Session = Depends(get_db)):
    entry = crud.add_diary_entry(db, req)
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "title": entry.title,
        "text": entry.text,
        "mood": entry.mood,
        "audio_path": entry.audio_path,
        "created_at": entry.created_at,
    }

@app.get("/api/diary", response_model=schemas.DiaryListRes)
async def list_diary(user_id: str, limit: int = 50, db: Session = Depends(get_db)):
    entries = crud.list_diary_entries(db, user_id, limit)
    out = []
    for e in entries:
        out.append({
            "id": e.id,
            "user_id": e.user_id,
            "title": e.title,
            "text": e.text,
            "mood": e.mood,
            "audio_path": e.audio_path,
            "created_at": e.created_at,
        })
    return {"entries": out}

# -------------------------
# Groups
# -------------------------
@app.post("/api/create_group", response_model=schemas.GroupRes)
async def create_group(req: schemas.CreateGroupReq, db: Session = Depends(get_db)):
    g = crud.create_group(db, req)
    return {"id": g.id, "name": g.name, "description": g.description}

@app.get("/api/groups")
async def list_groups(db: Session = Depends(get_db)):
    groups = crud.list_groups(db)
    return {"groups": [{"id": g.id, "name": g.name, "description": g.description} for g in groups]}

@app.post("/api/join_group")
async def join_group(req: schemas.JoinGroupReq, db: Session = Depends(get_db)):
    membership = crud.join_group(db, req)
    return {"id": membership.id, "user_id": membership.user_id, "group_id": membership.group_id}

@app.get("/api/user_groups")
async def user_groups(user_id: str, db: Session = Depends(get_db)):
    groups = crud.list_user_groups(db, user_id)
    return {"groups": [{"id": g.id, "name": g.name, "description": g.description} for g in groups]}

# -------------------------
# Pet state
# -------------------------
@app.get("/api/pet_state", response_model=schemas.PetStateRes)
async def pet_state(user_id: str, db: Session = Depends(get_db)):
    pet = crud.get_pet_state(db, user_id)
    return {
        "user_id": pet.user_id,
        "mood": pet.mood,
        "hunger": pet.hunger,
        "energy": pet.energy,
        "affection": pet.affection,
        "last_updated": pet.last_updated,
    }

@app.post("/api/pet_state")
async def update_pet(user_id: str, updates: dict, db: Session = Depends(get_db)):
    pet = crud.update_pet_state(db, user_id, updates)
    return {"user_id": pet.user_id, "mood": pet.mood, "hunger": pet.hunger, "energy": pet.energy, "affection": pet.affection}

# -------------------------
# Prediction / Nudge (adaptive)
# -------------------------
def generate_adaptive_nudge(habit_name: str, p: float, style: str):
    return ai.generate_adaptive_nudge_text(habit_name, p, style)

@app.get("/api/predict", response_model=schemas.NudgeRes)
async def predict(user_id: str, habit_id: str, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    habit = crud.get_habit(db, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="habit not found")

    logs = crud.get_logs(db, user_id, habit_id, limit=200)
    if not logs:
        msg = f"Let’s begin building your '{habit.name}' routine — start small and be consistent."
        return {"message": msg, "probability": 0.5, "style_used": user.style}

    successes = [l.success for l in reversed(logs)]
    streak = 0
    for s in successes:
        if s == 1:
            streak += 1
        else:
            break
    mean_success = float(sum(successes) / len(successes)) if successes else 0.0

    recency_hours = (datetime.utcnow() - logs[0].timestamp).total_seconds() / 3600.0

    # simple features; if a predictor exists, ai.make_predictor returns callable
    predictor = ai.make_predictor(user.id)
    if predictor:
        p = predictor([streak, mean_success, recency_hours])
    else:
        if mean_success > 0.6 and streak >= 2:
            p = 0.85
        elif mean_success > 0.4:
            p = 0.55
        else:
            p = 0.25

    msg = generate_adaptive_nudge(habit.name, p, user.style)
    return {"message": msg, "probability": float(p), "style_used": user.style}
