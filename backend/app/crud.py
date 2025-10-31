# backend/app/crud.py
from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from . import models, schemas

# ------------------------------
# Users
# ------------------------------
def create_user(db: Session, req: schemas.CreateUserReq) -> str:
    user = models.User(
        id=str(uuid.uuid4()),
        name=req.name,
        style=req.style,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id

def get_user(db: Session, user_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_style(db: Session, user_id: str, style: str) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        user.style = style
        db.commit()
        db.refresh(user)
    return user

# ------------------------------
# Habits
# ------------------------------
def add_habit(db: Session, req: schemas.AddHabitReq) -> models.Habit:
    habit = models.Habit(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        name=req.name,
        target_per_day=req.target_per_day,
        created_at=datetime.utcnow(),
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit

def list_habits(db: Session, user_id: str) -> List[models.Habit]:
    return db.query(models.Habit).filter(models.Habit.user_id == user_id).all()

def get_habit(db: Session, habit_id: str) -> Optional[models.Habit]:
    return db.query(models.Habit).filter(models.Habit.id == habit_id).first()

# ------------------------------
# Logs
# ------------------------------
def log_event(db: Session, req: schemas.LogReq) -> models.Log:
    log = models.Log(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        habit_id=req.habit_id,
        timestamp=datetime.utcnow(),
        success=req.success,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_logs(db: Session, user_id: str, habit_id: str, limit: int = 100) -> List[models.Log]:
    return (
        db.query(models.Log)
        .filter(models.Log.user_id == user_id, models.Log.habit_id == habit_id)
        .order_by(models.Log.timestamp.desc())
        .limit(limit)
        .all()
    )

# ------------------------------
# Diary
# ------------------------------
def add_diary_entry(db: Session, req: schemas.DiaryEntryReq) -> models.DiaryEntry:
    entry = models.DiaryEntry(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        title=req.title,
        text=req.text,
        mood=req.mood,
        audio_path=req.audio_path,
        created_at=req.created_at or datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def list_diary_entries(db: Session, user_id: str, limit: int = 50) -> List[models.DiaryEntry]:
    return (
        db.query(models.DiaryEntry)
        .filter(models.DiaryEntry.user_id == user_id)
        .order_by(models.DiaryEntry.created_at.desc())
        .limit(limit)
        .all()
    )

# ------------------------------
# Groups
# ------------------------------
def create_group(db: Session, req: schemas.CreateGroupReq) -> models.Group:
    group = models.Group(
        id=str(uuid.uuid4()),
        name=req.name,
        description=req.description,
        created_at=datetime.utcnow(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

def list_groups(db: Session) -> List[models.Group]:
    return db.query(models.Group).order_by(models.Group.created_at.desc()).all()

def join_group(db: Session, req: schemas.JoinGroupReq) -> models.GroupMembership:
    membership = models.GroupMembership(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        group_id=req.group_id,
        joined_at=datetime.utcnow(),
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

def list_user_groups(db: Session, user_id: str) -> List[models.Group]:
    memberships = db.query(models.GroupMembership).filter(models.GroupMembership.user_id == user_id).all()
    group_ids = [m.group_id for m in memberships]
    if not group_ids:
        return []
    return db.query(models.Group).filter(models.Group.id.in_(group_ids)).all()

# ------------------------------
# Pet
# ------------------------------
def get_pet_state(db: Session, user_id: str) -> models.PetState:
    pet = db.query(models.PetState).filter(models.PetState.user_id == user_id).first()
    if not pet:
        pet = models.PetState(
            user_id=user_id,
            mood="neutral",
            hunger=50,
            energy=50,
            affection=50,
            last_updated=datetime.utcnow(),
        )
        db.add(pet)
        db.commit()
        db.refresh(pet)
    return pet

def update_pet_state(db: Session, user_id: str, updates: Dict[str, Any]) -> models.PetState:
    pet = get_pet_state(db, user_id)
    changed = False
    for key, value in updates.items():
        if hasattr(pet, key) and value is not None:
            setattr(pet, key, value)
            changed = True
    if changed:
        pet.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(pet)
    return pet

# ------------------------------
# Model Spec
# ------------------------------
def save_model_spec(db: Session, user_id: str, scaler: Dict[str, Any], model: Dict[str, Any]) -> models.ModelSpec:
    spec = db.query(models.ModelSpec).filter(models.ModelSpec.user_id == user_id).first()
    now = datetime.utcnow()
    spec_text_scaler = str(scaler)
    spec_text_model = str(model)
    if spec:
        spec.scaler_params = spec_text_scaler
        spec.model_params = spec_text_model
        spec.last_trained = now
    else:
        spec = models.ModelSpec(
            user_id=user_id,
            scaler_params=spec_text_scaler,
            model_params=spec_text_model,
            last_trained=now,
        )
        db.add(spec)
    db.commit()
    db.refresh(spec)
    return spec

def load_model_spec(db: Session, user_id: str) -> Optional[models.ModelSpec]:
    return db.query(models.ModelSpec).filter(models.ModelSpec.user_id == user_id).first()

# ------------------------------
# Utilities
# ------------------------------
def safe_commit(db: Session) -> bool:
    try:
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return False
