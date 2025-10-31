# backend/app/utils.py
from datetime import datetime, timezone

def iso_now():
    return datetime.now(timezone.utc).isoformat()
def parse_iso(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str)