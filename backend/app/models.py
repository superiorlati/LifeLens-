# backend/app/models.py
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    style = Column(String, default="encourager", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="user", cascade="all, delete-orphan")
    model = relationship("ModelSpec", back_populates="user", uselist=False, cascade="all, delete-orphan")
    groups = relationship("GroupMembership", back_populates="user", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="user", cascade="all, delete-orphan")
    pet_state = relationship("PetState", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Habit(Base):
    __tablename__ = "habits"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    target_per_day = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="habits")
    logs = relationship("Log", back_populates="habit", cascade="all, delete-orphan")


class Log(Base):
    __tablename__ = "logs"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    habit_id = Column(String, ForeignKey("habits.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Integer, default=0)

    user = relationship("User", back_populates="logs")
    habit = relationship("Habit", back_populates="logs")


class ModelSpec(Base):
    __tablename__ = "models"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    scaler_params = Column(Text, nullable=True)
    model_params = Column(Text, nullable=True)
    last_trained = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="model")


class Group(Base):
    __tablename__ = "groups"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")


class GroupMembership(Base):
    __tablename__ = "group_memberships"
    id = Column(String, primary_key=True, index=True)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    joined_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="memberships")
    user = relationship("User", back_populates="groups")


class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=True)
    text = Column(Text, nullable=True)
    mood = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="diary_entries")


class PetState(Base):
    __tablename__ = "pet_states"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    mood = Column(String, nullable=True)
    hunger = Column(Integer, default=50)
    energy = Column(Integer, default=50)
    affection = Column(Integer, default=50)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pet_state")


def create_all(engine):
    Base.metadata.create_all(bind=engine)
def drop_all(engine):
    Base.metadata.drop_all(bind=engine)