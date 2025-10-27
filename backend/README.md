# Backend (FastAPI)

## Setup
See root README. Main entrypoint: `app.main:app`.

Endpoints:
- POST `/api/create_user` {name, persona} -> {user_id}
- POST `/api/add_habit` {user_id, name, target_per_day} -> habit
- GET `/api/habits?user_id=...` -> list habits
- POST `/api/log` {user_id, habit_id, success}
- GET `/api/logs?user_id=...&habit_id=...` -> logs
- GET `/api/predict?user_id=...&habit_id=...` -> {message, probability}