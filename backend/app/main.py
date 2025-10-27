# main.py -- FastAPI application connecting DB, ML, and serving endpoints for frontend

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from . import db, ml
from .schemas import CreateUserReq, CreateUserRes, AddHabitReq, HabitRes, LogReq, NudgeRes
import asyncio

app = FastAPI(title="LifeLens Prototype API")

# Allow the React dev server to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # ensure DB initialized on startup
    db.init_db()

@app.post("/api/create_user", response_model=CreateUserRes)
async def create_user(req: CreateUserReq):
    """
    Create a user and schedule a background training attempt (safe: likely no data yet).
    """
    user_id = db.create_user(req.name, req.persona)
    # schedule async training attempt (non-blocking)
    loop = asyncio.get_event_loop()
    loop.create_task(asyncio.to_thread(ml.train_user_model, user_id))
    return {"user_id": user_id}

@app.post("/api/add_habit", response_model=HabitRes)
async def add_habit(req: AddHabitReq):
    hid = db.add_habit(req.user_id, req.name, req.target_per_day)
    return {"id": hid, "name": req.name, "target_per_day": req.target_per_day}

@app.get("/api/habits")
async def get_habits(user_id: str):
    return {"habits": db.list_habits(user_id)}

@app.post("/api/log")
async def log_event(req: LogReq):
    db.log_event(req.user_id, req.habit_id, req.success)
    # trigger background training to update model when more data accumulates
    loop = asyncio.get_event_loop()
    loop.create_task(asyncio.to_thread(ml.train_user_model, req.user_id))
    return {"status": "ok"}

@app.get("/api/logs")
async def get_logs(user_id: str, habit_id: str):
    return {"logs": db.get_logs(user_id, habit_id)}

def generate_persona_nudge(persona, habit_name, p):
    """
    Map probability and persona to a friendly micro-nudge message.
    Persona adaptation:
      - storyteller => metaphor & narrative prompt (e.g., writing prompt).
      - musician => riff suggestion or micro-practice.
      - neutral => pragmatic micro-task.
    """
    if p > 0.75:
        tone = "You have strong momentum — keep the streak alive!"
    elif p > 0.45:
        tone = "Good progress — a small, focused action will help."
    else:
        tone = "This one might slip — try a tiny, doable version now."

    if persona == "storyteller":
        # storytelling micro-intervention includes a very short prompt
        prompt = f"Write one sentence describing a scene where your {habit_name} succeeds."
        return f"{tone} {prompt}"
    if persona == "musician":
        # musical micro-intervention includes short practice suggestion
        prompt = f"Play a 60-second riff or pattern related to '{habit_name}'. Keep it simple and repeat it 3 times."
        return f"{tone} {prompt}"
    # neutral:
    return f"{tone} Try a 5-minute focused session on '{habit_name}'."

@app.get("/api/predict", response_model=NudgeRes)
async def predict(user_id: str, habit_id: str):
    """
    Compute features for the habit, attempt to use trained model for probability,
    otherwise fallback to heuristics / cold-start behavior.
    """
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    habits = db.list_habits(user_id)
    habit = next((h for h in habits if h["id"] == habit_id), None)
    if not habit:
        raise HTTPException(status_code=404, detail="habit not found")
    logs = db.get_logs(user_id, habit_id)
    if not logs or len(logs) == 0:
        # cold start: persona-aware onboarding nudge
        msg = generate_persona_nudge(user["persona"], habit["name"], 0.5)
        return {"message": msg, "probability": 0.5}
    # compute features same as training:
    successes = [l["success"] for l in logs[::-1]]  # reverse to chronological
    streak = 0
    for s in successes:
        if s == 1:
            streak += 1
        else:
            break
    mean_success = float(sum(successes) / len(successes))
    from datetime import datetime
    recency_hours = (datetime.utcnow() - datetime.fromisoformat(logs[0]["timestamp"])).total_seconds() / 3600.0
    features = [streak, mean_success, recency_hours]
    predictor = ml.make_predictor(user_id)
    if predictor:
        p = predictor(features)
    else:
        # heuristics fallback
        if mean_success > 0.6 and streak >= 2:
            p = 0.85
        elif mean_success > 0.4:
            p = 0.55
        else:
            p = 0.25
    msg = generate_persona_nudge(user["persona"], habit["name"], p)
    return {"message": msg, "probability": float(p)}
