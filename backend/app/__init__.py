"""
LifeLens Backend Package
========================
This package contains the FastAPI backend for the LifeLens app.

Modules:
- main.py: FastAPI app entry point and endpoints
- db.py: Database setup and session handling
- models.py: SQLAlchemy ORM models
- schemas.py: Pydantic request/response models
- crud.py: CRUD helpers
- ml.py: ML and fallback logic for predictions
"""

# Ensures that relative imports work correctly when run from the project root
from pathlib import Path

PACKAGE_ROOT = Path(__file__).parent

