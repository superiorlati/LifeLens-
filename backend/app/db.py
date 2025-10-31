"""
db.py -- SQLite persistence and helpers for LifeLens
====================================================

Handles lightweight persistence for users, habits, logs, and model metadata.
This module uses the built-in sqlite3 library for full Windows compatibility
(no compiled extensions required).

Tables created:
- users
- habits
- logs
- models

Updated version:
- Adds "style" field to users table to store AI communication tone.
  (encourager | mentor | challenger)
"""

import sqlite3
from pathlib import Path
from datetime import datetime
import json
import uuid
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------
# Database path setup
# ---------------------------------------------------------------------

DB_FILE = Path(__file__).resolve().parent.parent / "lifelens.db"
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------

def get_conn() -> sqlite3.Connection:
    """
    Return a sqlite connection suitable for multi-thread usage in FastAPI.
    """
    conn = sqlite3.connect(str(DB_FILE), check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """
    Initialize schema if it does not exist.
    Tables: users, habits, logs, models.
    """
    conn = get_conn()
    cur = conn.cursor()

    # -----------------------------
    # USERS
    # -----------------------------
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        style TEXT DEFAULT 'encourager',
        created_at TEXT
    )
    """)

    # -----------------------------
    # HABITS
    # -----------------------------
    cur.execute("""
    CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        target_per_day INTEGER,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # -----------------------------
    # LOGS
    # -----------------------------
    cur.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        habit_id TEXT,
        timestamp TEXT,
        success INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    )
    """)

    # -----------------------------
    # MODELS
    # -----------------------------
    cur.execute("""
    CREATE TABLE IF NOT EXISTS models (
        user_id TEXT PRIMARY KEY,
        scaler_params TEXT,
        model_params TEXT,
        last_trained TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------

def create_user(name: str, style: str = "encourager") -> str:
    """
    Create a new user entry in the database and return its unique ID.
    Includes AI communication style preference.
    """
    conn = get_conn()
    cur = conn.cursor()
    user_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO users (id, name, style, created_at) VALUES (?, ?, ?, ?)",
        (user_id, name, style, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return user_id


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single user by ID.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, style, created_at FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "style": row[2], "created_at": row[3]}


def add_habit(user_id: str, name: str, target_per_day: int) -> str:
    """
    Create a new habit for a user.
    """
    conn = get_conn()
    cur = conn.cursor()
    hid = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO habits (id, user_id, name, target_per_day, created_at) VALUES (?, ?, ?, ?, ?)",
        (hid, user_id, name, int(target_per_day), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return hid


def list_habits(user_id: str) -> List[Dict[str, Any]]:
    """
    Return all habits for a given user.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, target_per_day, created_at FROM habits WHERE user_id = ?",
        (user_id,)
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {"id": r[0], "name": r[1], "target_per_day": r[2], "created_at": r[3]}
        for r in rows
    ]


def log_event(user_id: str, habit_id: str, success: int) -> str:
    """
    Log a new habit event (success/failure).
    """
    conn = get_conn()
    cur = conn.cursor()
    lid = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO logs (id, user_id, habit_id, timestamp, success) VALUES (?, ?, ?, ?, ?)",
        (lid, user_id, habit_id, datetime.utcnow().isoformat(), int(success))
    )
    conn.commit()
    conn.close()
    return lid


def get_logs(user_id: str, habit_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Retrieve recent logs for a habit.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT timestamp, success FROM logs WHERE user_id = ? AND habit_id = ? ORDER BY timestamp DESC LIMIT ?",
        (user_id, habit_id, limit)
    )
    rows = cur.fetchall()
    conn.close()
    return [{"timestamp": r[0], "success": r[1]} for r in rows]


def save_model(user_id: str, scaler_params: Dict[str, Any], model_params: Dict[str, Any]) -> None:
    """
    Save serialized model specs as JSON in the models table.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO models (user_id, scaler_params, model_params, last_trained) VALUES (?, ?, ?, ?)",
        (
            user_id,
            json.dumps(scaler_params or {}),
            json.dumps(model_params or {}),
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def load_model_spec(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Load stored model parameters for a user.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT scaler_params, model_params FROM models WHERE user_id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    try:
        return {
            "scaler": json.loads(row[0]) if row[0] else {},
            "model": json.loads(row[1]) if row[1] else {},
        }
    except json.JSONDecodeError:
        return {"scaler": {}, "model": {}}


# ---------------------------------------------------------------------
# Initialize database automatically if missing
# ---------------------------------------------------------------------

if not DB_FILE.exists():
    init_db()
# End of backend/app/db.py