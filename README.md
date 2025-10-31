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
I have always been fascinated by how technology can feel. As someone with ADHD, I have tried dozens of habit apps that promised structure but left me feeling disconnected, like I was just checking boxes for a robot. I wanted something that felt alive. That is how LifeLens was born: an AI-powered habit coach and emotional pet companion that turns discipline into something warm, joyful, and human.

## What it does
LifeLens helps users build better habits through emotion and empathy. It predicts which habits you might struggle with, offers personalized feedback based on your emotional persona, and celebrates progress with your virtual pet, whose mood and environment change with your actions. It combines behavioral science with emotional intelligence to create a deeply personal experience. LifeLens is like if Duolingo, a life coach, and a mental wellness companion all merged into one app.

But LifeLens goes further. It uses a Personalized Continuous Emotional Model that learns from your tone, habits, and reflections to adapt its coaching style in real time. The Adaptive Micro-Task Composer breaks big goals into small, manageable steps based on your current energy level. A Multimodal Habit Predictor identifies when you are likely to fall behind and offers preemptive, context-aware support. Together, these features make LifeLens feel truly alive.

## How we built it
I built LifeLens’s front end using React, creating a smooth, color-shifting interface that visually represents mood and progress. The AI logic connects to a prediction model that learns from user data to provide tailored feedback and encouragement. The pet system is designed using expressive emoji companions that react instantly to your behavior, creating emotional feedback loops that help users stay motivated. Every design choice, from soft pastels to rounded typography, was made to create a sense of calm and care.

I also implemented a persona-based tone system that changes how the AI communicates, depending on whether the user prefers an encouraging, analytical, or challenging style. Each of these systems works together to make LifeLens feel emotionally aware rather than mechanical.

## Challenges we ran into
Building LifeLens was not easy. I encountered countless small but time-consuming bugs, from missing imports to broken asynchronous calls. At one point, habits would not even save properly, and debugging that took hours. But the hardest part was not the syntax; it was bringing everything I had ever learned about coding, design, and psychology together into one cohesive, functioning prototype. Making it all run smoothly while feeling emotionally responsive tested every skill I had. Seeing it finally come to life felt amazing.

## Accomplishments that we are proud of
LifeLens actually works. It does not just track habits; it responds to them. When your pet’s mood shifts, your background color changes, and your AI coach adapts its tone, it feels like the app truly understands you. I am proud that LifeLens feels alive and comforting. It blends code, design, psychology, and AI into a single experience that can genuinely support people like me who struggle to stay motivated or emotionally connected to routine.

## What we learned
I learned that emotional design can be more powerful than pure productivity. People do not just need systems to manage habits; they need empathy and connection. I also learned how to use AI responsibly to support emotional well-being, rather than replace it. On the technical side, I improved my ability to manage React states, handle asynchronous data flow, and build dynamic, intuitive UI systems. The biggest lesson, though, was that passion truly transforms code into something meaningful. Building LifeLens reminded me that technology can feel human if you design it with empathy.

## What is next for LifeLens
There is so much potential ahead. I want to add animated pet sprites that move and emote, creating a deeper bond between user and companion. Custom accessories and virtual rewards will add personalization and monetization options. Smart notifications will feel gentle and personal rather than pushy.

I plan to expand the AI features even further with the Personalized Continuous Emotional Model, Adaptive Micro-Task Composer, and Explainable AI Coaching that tells users exactly why certain nudges appear. I also aim to add multilingual coaching to make LifeLens accessible worldwide.

Long-term, LifeLens will grow into a full emotional wellness ecosystem that supports schools, workplaces, and therapy programs. It will include Habit Co-ops where small groups can support one another, Adaptive Soundscapes that match mood and focus, and Automated Journaling that turns daily reflections into insight summaries.

LifeLens will continue to evolve until every user can have an AI companion that learns, grows, and cares alongside them. The goal is simple but powerful: to make emotional wellness feel human again.

## ![IMG_7614](https://github.com/user-attachments/assets/bab6ab0d-84c8-4f14-95a1-acdd97ca80bf)
<img width="1722" height="988" alt="Screenshot 2025-10-27 030309" src="https://github.com/user-attachments/assets/ad34224f-9de0-4cb8-8587-ca061cb4e9ac" />
<img width="1676" height="992" alt="Screenshot 2025-10-27 030228" src="https://github.com/user-attachments/assets/18e402f3-cf3f-4d73-a061-47964fea4dad" />
<img width="1696" height="1000" alt="Screenshot 2025-10-27 030212" src="https://github.com/user-attachments/assets/fc27630d-53a4-4354-aed7-0f660e46b37b" />
<img width="991" height="640" alt="Screenshot 2025-10-27 024435" src="https://github.com/user-attachments/assets/e2c3c079-d186-4bbb-ba5e-b611ea63e426" />
<img width="973" height="647" alt="Screenshot 2025-10-27 022149" src="https://github.com/user-attachments/assets/ab0ea81c-31f7-4768-93cf-2c6a466f2049" />
<img width="1667" height="938" alt="Screenshot 2025-10-27 015547" src="https://github.com/user-attachments/assets/04e1dd5a-3170-4f42-9c80-a663e27eae6f" />
