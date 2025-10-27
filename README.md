# LifeLens — Prototype

LifeLens is an AI-assisted, persona-aware habit & creativity companion. This repo contains a FastAPI backend and a React frontend (Vite).

## Quick start

### Backend
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

shell
Copy code

### Frontend
cd frontend
npm install
npm run dev

pgsql
Copy code

Open the frontend (usually `http://localhost:3000`) and interact.

## Repo structure
- `backend/app/` — FastAPI backend, DB helpers, ML training.
- `frontend/` — React frontend (Vite + React).

## How it works
- Users create an account with a persona (neutral / storyteller / musician).
- Add habits and log successes/failures.
- A small per-user model (logistic regression) predicts likelihood of maintaining habit; frontend shows persona-adapted micro-nudges.
- Models are trained locally and saved to the SQLite DB.

## Notes & next steps
- This is a prototype: add auth, production DB, better models, calendar
## NAME: LifeLens

## My elevator pitch: 
An AI powered habit coaching app and emotional pet companion designed to make self-improvement joyful. Utilising mental health and personalised responses this app aims to combat negative feelings.

## Inspiration
I’ve always been fascinated by how technology can feel. As someone with ADHD, I’ve tried dozens of habit apps that promised structure but left me feeling disconnected; like I was just checking boxes for a robot. I wanted something that felt alive. That’s how LifeLens was born; an AI-powered habit coach and emotional pet companion that turns discipline into something warm, joyful, and human.

## What it does
LifeLens helps users build better habits through emotion and empathy. It predicts which habits you might struggle with, offers personalized feedback based on your emotional persona, and celebrates progress with your virtual pet - whose mood and environment change with your actions. It’s like if Duolingo, a life coach, and a mental wellness buddy all merged into one playful app.

## How we built it
I built LifeLens’s front end in React, creating a smooth, color-shifting interface that reflects mood and progress. The coach logic connects to an AI-assisted prediction model through a backend API, learning from user patterns and offering targeted feedback. I designed the pet system using emoji “companions” that react in real time, building emotional engagement through visuals and microinteractions. Every line of code, from the background color transitions to the persona-based tone system, was meant to feel intentional - not rushed.

## Challenges we ran into
This project definitely tested me. I ran into countless small but painful bugs; missing curly braces, mismatched imports, and one stubborn API call that refused to cooperate. Even just getting the app to launch correctly was a challenge at first. But the hardest part wasn’t fixing syntax — it was learning how to bring everything I’d ever learned about coding, design, and psychology together into one cohesive, functioning prototype. Seeing it finally run, with everything connected and alive, was the most rewarding moment of all.

## Accomplishments that we’re proud of
LifeLens actually works; it doesn’t just track habits, it responds emotionally. Seeing the pet change mood and the app background shift based on my progress was an incredible moment. I’m proud that it feels like something alive, something comforting. And I’m proud that I built most of it by blending code, design, psychology, and AI to create something that genuinely supports people like me.

## What we learned
I learned how powerful emotional design is. That people don’t just need productivity tools; they need connection. I also learned how to integrate AI in ways that support human emotion, not replace it. On the technical side, I improved at handling asynchronous calls in React and learned to design clean, intuitive UX that communicates mood. But the biggest lesson was personal; that coding for something you are passionate about really is the best thing for someone

## What’s next for LifeLens
There’s so much room to grow! I want to add animated pet sprites for a stronger emotional bond, customizable accessories for monetization, and smart notifications that feel caring instead of pushy. I also want to support multilingual coaching so LifeLens can reach users around the world. Long-term, I see LifeLens as part of a bigger mental wellness ecosystem; helping schools, workplaces, and individuals find emotional balance through technology that cares.

## ![IMG_7614](https://github.com/user-attachments/assets/bab6ab0d-84c8-4f14-95a1-acdd97ca80bf)
<img width="1722" height="988" alt="Screenshot 2025-10-27 030309" src="https://github.com/user-attachments/assets/ad34224f-9de0-4cb8-8587-ca061cb4e9ac" />
<img width="1676" height="992" alt="Screenshot 2025-10-27 030228" src="https://github.com/user-attachments/assets/18e402f3-cf3f-4d73-a061-47964fea4dad" />
<img width="1696" height="1000" alt="Screenshot 2025-10-27 030212" src="https://github.com/user-attachments/assets/fc27630d-53a4-4354-aed7-0f660e46b37b" />
<img width="991" height="640" alt="Screenshot 2025-10-27 024435" src="https://github.com/user-attachments/assets/e2c3c079-d186-4bbb-ba5e-b611ea63e426" />
<img width="973" height="647" alt="Screenshot 2025-10-27 022149" src="https://github.com/user-attachments/assets/ab0ea81c-31f7-4768-93cf-2c6a466f2049" />
<img width="1667" height="938" alt="Screenshot 2025-10-27 015547" src="https://github.com/user-attachments/assets/04e1dd5a-3170-4f42-9c80-a663e27eae6f" />
