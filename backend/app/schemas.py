# backend/app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ---------------------------
# User Schemas
# ---------------------------
class CreateUserReq(BaseModel):
    name: str
    style: str = Field(default="encourager", description="encourager | mentor | challenger")

class CreateUserRes(BaseModel):
    user_id: str

class UserRes(BaseModel):
    id: str
    name: str
    style: str

# ---------------------------
# Habit Schemas
# ---------------------------
class AddHabitReq(BaseModel):
    user_id: str
    name: str
    target_per_day: int = Field(default=1, ge=1)

class HabitRes(BaseModel):
    id: str
    name: str
    target_per_day: int

class HabitListRes(BaseModel):
    habits: List[HabitRes]

# ---------------------------
# Logging Schemas
# ---------------------------
class LogReq(BaseModel):
    user_id: str
    habit_id: str
    success: int = Field(ge=0, le=1)

class LogEntry(BaseModel):
    timestamp: datetime
    success: int

class LogListRes(BaseModel):
    logs: List[LogEntry]

# ---------------------------
# Nudge / Prediction Schemas
# ---------------------------
class NudgeRes(BaseModel):
    message: str
    probability: float
    style_used: Optional[str] = None

# ---------------------------
# Diary Schemas
# ---------------------------
class DiaryEntryReq(BaseModel):
    user_id: str
    title: Optional[str] = None
    text: Optional[str] = None
    mood: Optional[str] = None
    audio_path: Optional[str] = None
    created_at: Optional[datetime] = None

class DiaryEntryRes(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    text: Optional[str] = None
    mood: Optional[str] = None
    audio_path: Optional[str] = None
    created_at: datetime

class DiaryListRes(BaseModel):
    entries: List[DiaryEntryRes]

# ---------------------------
# Groups
# ---------------------------
class CreateGroupReq(BaseModel):
    name: str
    description: Optional[str] = None

class GroupRes(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class JoinGroupReq(BaseModel):
    user_id: str
    group_id: str

# ---------------------------
# Pet / Generic
# ---------------------------
class PetStateRes(BaseModel):
    user_id: str
    mood: Optional[str] = None
    hunger: int
    energy: int
    affection: int
    last_updated: datetime

class SuccessRes(BaseModel):
    success: bool = True
    message: Optional[str] = None
