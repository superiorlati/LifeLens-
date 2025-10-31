# backend/app/ai.py
"""
AI helper that uses OpenAI to generate adaptive nudges and coach messages.
If OPENAI_API_KEY is missing, falls back to heuristics/local strings.
"""

import os
import openai
from typing import Optional, Callable, List

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

def generate_adaptive_nudge_text(habit_name: str, probability: float, style: str = "encourager") -> str:
    """
    If OpenAI key available, call Chat API to create a short nudge.
    Otherwise return a local heuristic nudge.
    """
    prompt = (
        f"You are an AI coach adopting a {style} tone. The user has a habit named "
        f"'{habit_name}'. The predicted success probability is {probability:.2f}.\n"
        "Write a single short motivational nudge (one or two sentences) with a practical tip."
    )

    if OPENAI_API_KEY:
        try:
            resp = openai.ChatCompletion.create(
                model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini") if os.environ.get("OPENAI_MODEL") else "gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a concise, helpful AI coach."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=120,
                temperature=0.7,
            )
            text = resp["choices"][0]["message"]["content"].strip()
            return text
        except Exception as e:
            # fallback to heuristic if OpenAI call fails
            return _heuristic_nudge(habit_name, probability, style) + f" (fallback; error: {e})"
    else:
        return _heuristic_nudge(habit_name, probability, style)

def _heuristic_nudge(habit_name: str, p: float, style: str) -> str:
    if p > 0.75:
        tip = f"You're in a great rhythm — keep your streak for '{habit_name}'. Try celebrating a small win!"
    elif p > 0.45:
        tip = f"Steady progress on '{habit_name}'. A quick scheduled reminder could help."
    else:
        tip = f"This might slip today — make '{habit_name}' tiny (1 minute) to get started."
    if style == "mentor":
        return f"{tip} (mentor tip: plan a 5-minute action and reflect afterwards.)"
    if style == "challenger":
        return f"{tip} (challenge: set a 10-minute timer and go.)"
    return tip

def make_predictor(user_id: str) -> Optional[Callable[[List[float]], float]]:
    """
    Return a predictor function if a trained model exists (stubbed).
    For now, returns None (no trained model), so main uses fallback heuristics.
    """
    return None
# ---------------------------------------------------------------------
# Database setup and CRUD helpers