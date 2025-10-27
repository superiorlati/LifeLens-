# pydantic schemas for request/response shapes

from pydantic import BaseModel
from typing import Optional

class CreateUserReq(BaseModel):
    name: str
    persona: str  # "neutral" | "storyteller" | "musician"

class CreateUserRes(BaseModel):
    user_id: str

class AddHabitReq(BaseModel):
    user_id: str
    name: str
    target_per_day: int = 1

class HabitRes(BaseModel):
    id: str
    name: str
    target_per_day: int

class LogReq(BaseModel):
    user_id: str
    habit_id: str
    success: int

class NudgeRes(BaseModel):
    message: str
    probability: float
