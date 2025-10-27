# db.py -- simple SQLite persistence and helpers for LifeLens prototype

import sqlite3
from pathlib import Path
from datetime import datetime
import json
import uuid

# DB file lives beside this module's parent (backend/lifelens.db)
DB_FILE = Path(__file__).resolve().parent.parent / "lifelens.db"

def get_conn():
    """
    Return a sqlite connection suitable for multi-thread usage in FastAPI (check_same_thread=False).
    """
    return sqlite3.connect(str(DB_FILE), check_same_thread=False)

def init_db():
    """
    Initialize schema if it does not exist.
    Tables: users, habits, logs, models.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        persona TEXT,
        created_at TEXT
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        target_per_day INTEGER,
        created_at TEXT
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        habit_id TEXT,
        timestamp TEXT,
        success INTEGER
    )""")
    # models stores serialized scaler and model params per user
    cur.execute("""
    CREATE TABLE IF NOT EXISTS models (
        user_id TEXT PRIMARY KEY,
        scaler_params TEXT,
        model_params TEXT,
        last_trained TEXT
    )""")
    conn.commit()
    conn.close()

# --- CRUD helpers below ---

def create_user(name: str, persona: str):
    conn = get_conn(); cur = conn.cursor()
    user_id = str(uuid.uuid4())
    cur.execute("INSERT INTO users (id, name, persona, created_at) VALUES (?, ?, ?, ?)",
                (user_id, name, persona, datetime.utcnow().isoformat()))
    conn.commit(); conn.close()
    return user_id

def get_user(user_id: str):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, name, persona, created_at FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "persona": row[2], "created_at": row[3]}

def add_habit(user_id: str, name: str, target_per_day: int):
    conn = get_conn(); cur = conn.cursor()
    hid = str(uuid.uuid4())
    cur.execute("INSERT INTO habits (id, user_id, name, target_per_day, created_at) VALUES (?, ?, ?, ?, ?)",
                (hid, user_id, name, int(target_per_day), datetime.utcnow().isoformat()))
    conn.commit(); conn.close()
    return hid

def list_habits(user_id: str):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, name, target_per_day, created_at FROM habits WHERE user_id = ?", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "target_per_day": r[2], "created_at": r[3]} for r in rows]

def log_event(user_id: str, habit_id: str, success: int):
    conn = get_conn(); cur = conn.cursor()
    lid = str(uuid.uuid4())
    cur.execute("INSERT INTO logs (id, user_id, habit_id, timestamp, success) VALUES (?, ?, ?, ?, ?)",
                (lid, user_id, habit_id, datetime.utcnow().isoformat(), int(success)))
    conn.commit(); conn.close()

def get_logs(user_id: str, habit_id: str, limit: int = 100):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT timestamp, success FROM logs WHERE user_id = ? AND habit_id = ? ORDER BY timestamp DESC LIMIT ?",
                (user_id, habit_id, limit))
    rows = cur.fetchall()
    conn.close()
    # return in reverse chronological order
    return [{"timestamp": r[0], "success": r[1]} for r in rows]

def save_model(user_id: str, scaler_params: dict, model_params: dict):
    """
    Save serialized scaler & model specs as JSON text in models table.
    """
    conn = get_conn(); cur = conn.cursor()
    cur.execute("INSERT OR REPLACE INTO models (user_id, scaler_params, model_params, last_trained) VALUES (?, ?, ?, ?)",
                (user_id, json.dumps(scaler_params), json.dumps(model_params), datetime.utcnow().isoformat()))
    conn.commit(); conn.close()

def load_model_spec(user_id: str):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT scaler_params, model_params FROM models WHERE user_id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"scaler": json.loads(row[0]), "model": json.loads(row[1])}
