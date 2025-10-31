// frontend/src/components/CoachPanel.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiGet, apiPost } from "../api";
import PersonaBadge from "./PersonaBadge";
import "./coachpanel.css";

/**
 * CoachPanel — adaptive front-end LifeLens coaching system 🌱
 *
 * Features preserved:
 * - Fetch habits + /predict, compute success rate via logs
 * - Persona-aware suggestions (frontend tone adjustments)
 * - Pet emoji & confetti modal when logging quick actions
 * - Quick log actions (I did it / Missed)
 * - Async safety, loading/error states and accessibility attributes
 *
 * Improvements and fixes:
 * - Proper hook ordering and dependency arrays
 * - Fetch/risk logic defined before useEffect to avoid stale references
 * - Timeout cleanup to avoid memory leaks
 */

export default function CoachPanel({ user, petType, onOpen, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [riskInfo, setRiskInfo] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState("calm");
  const [persona, setPersona] = useState(user?.persona ? String(user.persona).toLowerCase() : "neutral");

  // timer ref so we can clear modal timeout on unmount / re-open
  const modalTimerRef = useRef(null);

  // Compute success rate helper
  const computeSuccessRate = useCallback(async (userId, habitId, lookback = 30) => {
    try {
      const r = await apiGet(`/logs?user_id=${userId}&habit_id=${habitId}&limit=200`);
      const logs = r.logs || [];
      if (!logs.length) return 0;
      const recent = logs.slice(-lookback);
      const successes = recent.filter((l) => Number(l.success) === 1).length;
      return successes / Math.max(1, recent.length);
    } catch (err) {
      console.error("computeSuccessRate error", err);
      return 0;
    }
  }, []);

  // Message generator (keeps persona tone variations)
  function generateCoachMessage(habit, successRate = 0, personaKey = "neutral") {
    const toneSets = {
      neutral: { prefix: "", suffix: "" },
      planner: { prefix: "Small plan — ", suffix: " (add it to your calendar!)" },
      creative: { prefix: "Creative spark — ", suffix: " (keep it playful!)" },
      social: { prefix: "Team-up idea — ", suffix: " (invite someone!)" },
      student: { prefix: "Study tip — ", suffix: " (20-min sprints help!)" },
      kind: { prefix: "Kind nudge — ", suffix: " (you’re doing great!)" },
      harsh: { prefix: "Tough love — ", suffix: " (no excuses!)" },
      analytical: { prefix: "Data-driven — ", suffix: " (track and iterate!)" },
      playful: { prefix: "Playful idea — ", suffix: " (make it fun!)" },
      inspirational: { prefix: "Inspiration — ", suffix: " (you've got this!)" },
    };
    const tone = toneSets[personaKey] || toneSets.neutral;

    const name = (habit?.name || "").toLowerCase();

    const pick = (low, mid, high) => {
      if (successRate < 0.25) return `${tone.prefix}${low}${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}${mid}${tone.suffix}`;
      return `${tone.prefix}${high}${tone.suffix}`;
    };

    if (name.includes("write") || name.includes("journal") || name.includes("story") || name.includes("book")) {
      return pick(
        "Don’t aim for perfect pages yet — pick a theme and sketch 2 characters.",
        "Good progress — set a 10-minute timer and write one short scene now.",
        "Nice momentum! Try sharing a draft or writing a short outline for the next chapter."
      );
    }

    if (name.includes("cook") || name.includes("bake") || name.includes("recipe") || name.includes("dinner")) {
      return pick(
        "Plan a simple meal with 3 ingredients and start one prep step.",
        "Gather ingredients and follow the first instruction — focus on one step.",
        "Great! Try a slightly more complex recipe or document this one."
      );
    }

    if (name.includes("run") || name.includes("walk") || name.includes("exercise") || name.includes("workout")) {
      return pick(
        "Start tiny — a 5-minute walk or quick stretch counts.",
        "Consistency is growing — try pairing it with your favorite song or route.",
        "You're doing great — consider a small challenge (distance or time) this week."
      );
    }

    if (name.includes("study") || name.includes("learn") || name.includes("practice")) {
      return pick(
        "Pick one tiny topic and study for 15 minutes — set a timer and just start.",
        "Nice effort — switch between study and short breaks (Pomodoro).",
        "Strong streak — try teaching someone what you learned to cement it."
      );
    }

    if (name.includes("meditat") || name.includes("mindful") || name.includes("breath")) {
      return pick(
        "Start with 2 minutes: breathe in for 4, out for 6 — small wins add up.",
        "Good — try a guided 5-minute session after a busy hour.",
        "You're consistent — consider a longer session or body-scan."
      );
    }

    if (name.includes("sleep") || name.includes("bedtime") || name.includes("rest")) {
      return pick(
        "Try a 20-minute screen-free wind-down before bed.",
        "Nice — keep a consistent bedtime and reduce bright screens 30 min earlier.",
        "Excellent routine — maintain it and notice the energy gains tomorrow."
      );
    }

    if (name.includes("talk") || name.includes("call") || name.includes("share") || name.includes("group")) {
      return pick(
        "Reach out to one person and set a short check-in — accountability helps.",
        "You're on track — try scheduling a weekly buddy check-in.",
        "Great teamwork — consider leading a short group session this week."
      );
    }

    // Generic fallback
    return pick(
      "Start with one tiny action today — consistency matters more than intensity.",
      "You're making progress — celebrate small wins and keep the momentum going.",
      "Fantastic — your routine is forming. Consider leveling up or sharing your success."
    );
  }

  // Fetch predictions + compute top risk habit
  const fetchRisk = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const hres = await apiGet(`/habits?user_id=${user.id}`);
      const habits = hres.habits || [];
      if (!habits.length) {
        setRiskInfo(null);
        setLoading(false);
        return;
      }

      const preds = await Promise.all(
        habits.map(async (h) => {
          try {
            const r = await apiGet(`/logs?user_id=${userId}&habit_id=${habitId}&limit=200`);
            const successRate = await computeSuccessRate(user.id, h.id);
            return { habit: h, ...r, success_rate: successRate };
          } catch (err) {
            console.warn("predict/log fetch error for habit", h.id, err);
            const successRate = await computeSuccessRate(user.id, h.id).catch(() => 0);
            return { habit: h, message: "", probability: 0.5, success_rate: successRate };
          }
        })
      );

      // sort ascending (most at-risk first)
      preds.sort((a, b) => a.probability - b.probability);
      const top = preds[0];
      const personaKey = (persona || "neutral").toLowerCase();
      const message = generateCoachMessage(top.habit, top.success_rate || 0, personaKey);

      setRiskInfo({ ...top, message });
    } catch (err) {
      console.error("fetchRisk error", err);
      setError("Could not fetch coach predictions.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, computeSuccessRate, persona]);

  // Run on user id or persona changes
  useEffect(() => {
    // keep persona in sync with user if user provides it
    if (user?.persona) setPersona(String(user.persona).toLowerCase());
    // fetch risk info for current user
    if (user?.id) {
      fetchRisk();
    }
    // cleanup modal timer if user changes
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
        modalTimerRef.current = null;
      }
    };
  }, [user?.id, user?.persona, fetchRisk]);

  // Quick log action (I did it / Missed)
  const quickLog = useCallback(
    async (success = 1) => {
      if (!riskInfo || !user) return;
      setChecking(true);
      try {
        await apiPost("/log", { user_id: user.id, habit_id: riskInfo.habit.id, success });
        await fetchRisk();
        onRefresh && onRefresh();
        setMood(success ? "happy" : "sad");
        setShowModal(true);
        // clear previous timer then set a new one
        if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
        modalTimerRef.current = setTimeout(() => {
          setShowModal(false);
          modalTimerRef.current = null;
        }, 2400);
      } catch (err) {
        console.error("quickLog error", err);
        alert("Could not log quick action");
      } finally {
        setChecking(false);
      }
    },
    [riskInfo, user, fetchRisk, onRefresh]
  );

  // Persona cycling helper (UI-only quick change)
  const cyclePersona = () => {
    const personas = ["neutral", "kind", "playful", "analytical", "inspirational", "harsh"];
    const idx = personas.indexOf(persona);
    const next = personas[(idx + 1) % personas.length];
    setPersona(next);
    // subtle mood boost to indicate change
    setMood("inspired");
    // optionally, could call backend to persist persona here
  };

  // Pet emoji resolution (robust)
  const petEmojiMap = {
    dog: "🐶", cat: "🐱", rabbit: "🐰", fox: "🦊", panda: "🐼",
    tiger: "🐯", koala: "🐨", bear: "🐻", frog: "🐸", penguin: "🐧",
    unicorn: "🦄", mouse: "🐭", hamster: "🐹", lion: "🦁",
    cow: "🐮", pig: "🐷", chick: "🐥", duck: "🦆", owl: "🦉", elephant: "🐘",
  };
  let petEmoji = "🐾";
  if (typeof petType === "string" && petType.trim()) petEmoji = petType;
  else if (petType && typeof petType === "object") {
    const t = petType.type || petType.emoji;
    petEmoji = petEmojiMap[t] || t || "🐾";
  }

  const moodColors = { calm: "#f0f4ff", happy: "#fff8d9", sad: "#ffe2e2", inspired: "#f5f0ff" };

  if (!user)
    return (
      <div className="card">
        <strong>LifeLens Coach</strong>
        <div className="small">Create an account to let the coach learn your rhythms.</div>
      </div>
    );

  return (
    <div
      className="card coach-panel"
      style={{
        background: moodColors[mood] || "#f0f4ff",
        transition: "background 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>LifeLens Coach</strong>
          <div className="small">
            Persona:{" "}
            <PersonaBadge persona={persona} mood={mood} onClickChange={cyclePersona} />
          </div>
        </div>

        <button className="button" onClick={fetchRisk} disabled={loading || checking}>
          {loading ? "Checking…" : "Check now"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {!riskInfo && !loading ? (
          <div className="small">No habits yet — add one to get personalized suggestions.</div>
        ) : error ? (
          <div className="small" style={{ color: "var(--danger)" }}>{error}</div>
        ) : (
          riskInfo && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="small">At-risk habit</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{riskInfo.habit.name}</div>
                  <div className="small">Confidence: {(riskInfo.probability * 100).toFixed(0)}%</div>
                  <div className="small">Recent success rate: {((riskInfo.success_rate || 0) * 100).toFixed(0)}%</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button className="button" onClick={() => onOpen?.(riskInfo.habit)}>
                    Open
                  </button>
                  <div style={{ marginTop: 6 }}>
                    <button
                      className="button success"
                      onClick={() => quickLog(1)}
                      disabled={checking}
                      style={{ marginRight: 8 }}
                    >
                      I did it ✓
                    </button>
                    <button className="button danger" onClick={() => quickLog(0)} disabled={checking}>
                      Missed ✗
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div><strong>Coach:</strong></div>
                <div style={{ marginTop: 6 }}>{riskInfo.message}</div>
              </div>
            </>
          )
        )}
      </div>

      {showModal && (
        <div className={`coach-modal ${mood}`} role="alert" aria-live="polite">
          <div className="confetti" />
          <div className="coach-modal-content">
            <div className="pet-emoji" style={{ fontSize: 48 }}>{petEmoji}</div>
            <div className="coach-message" style={{ marginTop: 8 }}>
              {mood === "happy"
                ? "Your pet is bursting with joy! 🎉"
                : mood === "inspired"
                ? "Your pet feels motivated by your reflection! 🌈"
                : "Your pet looks a bit down — try again soon 💕"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
