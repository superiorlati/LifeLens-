# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# SQLite DB file in project root (relative)
DB_FILE = os.environ.get("LIFELENS_DB", "sqlite:///./lifelens.db")

# echo=False to avoid noisy SQL logs; set True for debugging
engine = create_engine(DB_FILE, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
def get_db():
    """Yield a database session; ensure it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()