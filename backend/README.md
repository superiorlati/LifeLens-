# Backend (FastAPI)

## Setup
LifeLens Backend

This is the backend for LifeLens, a holistic habit, journal, and wellness coaching app with AI support.

🚀 Features

User management (signup, login, authentication)

Habit tracking (create, update, delete, view)

Daily logs and progress visualization

Journaling and diary entries

Rewards and achievement system

AI-based habit coaching via OpenAI API

Nudges, pet reactions, and motivational messages

Group support and shared accountability features

SQLite database for lightweight, local data persistence

🧩 Tech Stack

FastAPI for backend APIs

SQLite (via SQLAlchemy + aiosqlite) for data storage

Uvicorn for ASGI server

OpenAI API for AI coaching responses

Python 3.12+

⚙️ Setup Instructions
1. Clone the repository
git clone https://github.com/<your-username>/LifeLens-.git
cd LifeLens-/backend

2. Create and activate virtual environment
py -3.11 -m venv venv
.\venv\Scripts\activate

3. Install dependencies
python -m pip install fastapi uvicorn[standard] sqlalchemy aiosqlite python-multipart aiofiles numpy scikit-learn-intelex openai

4. Set your OpenAI API key

Create a .env file in the backend directory:

OPENAI_API_KEY=your_openai_api_key_here
eg. $env:OPENAI_MODEL="gpt-4o-mini"
5. Run the backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000


Your backend will now run at:

http://127.0.0.1:8000


Endpoints:
- POST `/api/create_user` {name, persona} -> {user_id}
- POST `/api/add_habit` {user_id, name, target_per_day} -> habit
- GET `/api/habits?user_id=...` -> list habits
- POST `/api/log` {user_id, habit_id, success}
- GET `/api/logs?user_id=...&habit_id=...` -> logs
- GET `/api/predict?user_id=...&habit_id=...` -> {message, probability}