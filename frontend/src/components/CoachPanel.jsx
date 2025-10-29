// frontend/src/components/CoachPanel.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import PersonaBadge from "./PersonaBadge";
import "./coachpanel.css";

/**
 * CoachPanel (frontend-only intelligent coaching)
 *
 * - Fetches habits + predictions (/predict) like before
 * - Also fetches recent logs for each habit to compute a simple success rate
 * - Generates habit-specific, persona-aware suggestions on the front-end
 * - Keeps all existing features: quick log (I did it / Missed), modal popup,
 *   mood, confetti animation, onOpen, onRefresh, etc.
 *
 * Props:
 *  - user: { id, name, persona }
 *  - petType: { type } or string (for emoji)
 *  - onOpen(habit)
 *  - onRefresh()
 */

export default function CoachPanel({ user, petType, onOpen, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [riskInfo, setRiskInfo] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState("calm"); // calm, happy, sad

  useEffect(() => {
    if (!user) return;
    fetchRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Helper: compute success rate from logs (front-end only)
  async function computeSuccessRate(userId, habitId, lookback = 30) {
    try {
      const r = await apiGet(`/logs?user_id=${userId}&habit_id=${habitId}&limit=200`);
      const logs = r.logs || [];
      if (!logs.length) return 0;
      // consider up to `lookback` latest logs
      const recent = logs.slice(-lookback);
      const successes = recent.filter(l => Number(l.success) === 1).length;
      return successes / Math.max(1, recent.length);
    } catch (err) {
      console.error("computeSuccessRate error", err);
      return 0;
    }
  }

  // Generate persona-aware, habit-specific coaching messages (front-end rules)
  function generateCoachMessage(habit, successRate = 0, persona = "default") {
    const name = (habit?.name || "").toLowerCase();

    // persona tone adjustments
    const tone = {
      default: { prefix: "", suffix: "" },
      planner: { prefix: "Small plan — ", suffix: " (add it to your calendar!)" },
      creative: { prefix: "Creative spark — ", suffix: " (keep it playful!)" },
      social: { prefix: "Team-up idea — ", suffix: " (invite someone!)" },
      student: { prefix: "Study tip — ", suffix: " (break it into 20-min sprints)" },
      night_owl: { prefix: "Night mode — ", suffix: " (try a gentle wind-down routine)" },
      neutral: { prefix: "", suffix: "" },
      kind: { prefix: "Kind nudge — ", suffix: " (you’re doing great!)" },
      harsh: { prefix: "Tough love — ", suffix: " (no excuses!)" },
      playful: { prefix: "Playful idea — ", suffix: " (make it fun!)" },
      analytical: { prefix: "Data-driven — ", suffix: " (track and iterate!)" },
      inspirational: { prefix: "Inspiration — ", suffix: " (you've got this!)" },
    }[persona] || { prefix: "", suffix: "" };

    // Writing / storytelling
    if (name.includes("write") || name.includes("story") || name.includes("journal") || name.includes("book")) {
      if (successRate < 0.25) return `${tone.prefix}Don’t aim for perfect pages yet — pick a theme and sketch 2 characters.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}Good progress — set a 10-minute timer and write one short scene now.${tone.suffix}`;
      return `${tone.prefix}Nice momentum! Try sharing a draft or writing a short outline for the next chapter.${tone.suffix}`;
    }

    // Fitness / movement
    if (name.includes("run") || name.includes("walk") || name.includes("exercise") || name.includes("workout")) {
      if (successRate < 0.25) return `${tone.prefix}Start tiny — a 5-minute walk counts. Add it after lunch to build habit.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}Consistency is growing — try pairing it with your favorite song or route.${tone.suffix}`;
      return `${tone.prefix}You're doing great — consider a small challenge (distance or time) this week.${tone.suffix}`;
    }

    // Sleep / wind-down
    if (name.includes("sleep") || name.includes("bedtime") || name.includes("rest")) {
      if (successRate < 0.25) return `${tone.prefix}Try a 20-minute screen-free wind-down before bed.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}Nice — keep a consistent bedtime and reduce bright screens 30 min earlier.${tone.suffix}`;
      return `${tone.prefix}Excellent routine — maintain it and notice the energy gains tomorrow.${tone.suffix}`;
    }

    // Study / learning
    if (name.includes("study") || name.includes("learn") || name.includes("practice")) {
      if (successRate < 0.25) return `${tone.prefix}Pick one tiny topic and study for 15 minutes — set a timer and just start.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}Nice effort — switch between study and short breaks (Pomodoro).${tone.suffix}`;
      return `${tone.prefix}Strong streak — try teaching someone what you learned to cement it.${tone.suffix}`;
    }

    // Meditation / mindfulness
    if (name.includes("meditat") || name.includes("mindful") || name.includes("breath")) {
      if (successRate < 0.25) return `${tone.prefix}Start with 2 minutes: breathe in for 4, out for 6 — small wins add up.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}Good — try a guided 5-minute session after a busy hour.${tone.suffix}`;
      return `${tone.prefix}You're consistent — consider a longer session or body-scan.${tone.suffix}`;
    }

    // Social / accountability
    if (name.includes("talk") || name.includes("call") || name.includes("share") || name.includes("group")) {
      if (successRate < 0.25) return `${tone.prefix}Reach out to one person and set a short check-in — accountability helps.${tone.suffix}`;
      if (successRate < 0.6) return `${tone.prefix}You're on track — try scheduling a weekly buddy check-in.${tone.suffix}`;
      return `${tone.prefix}Great teamwork — consider leading a short group session this week.${tone.suffix}`;
    }

    // Default guidance
    if (successRate < 0.25) return `${tone.prefix}Start with one tiny action today — consistency matters more than intensity.${tone.suffix}`;
    if (successRate < 0.6) return `${tone.prefix}You're making progress — celebrate small wins and keep the momentum going.${tone.suffix}`;
    return `${tone.prefix}Fantastic — your routine is forming. Consider leveling up or sharing your success.${tone.suffix}`;
  }

  // Fetch predictions + success rates, then compute top risk habit & message
  async function fetchRisk() {
    setLoading(true);
    setError(null);
    try {
      // get habits
      const hres = await apiGet(`/habits?user_id=${user.id}`);
      const habits = hres.habits || [];
      if (!habits.length) {
        setRiskInfo(null);
        setLoading(false);
        return;
      }

      // for each habit get predict and logs to compute success rate
      const preds = await Promise.all(
        habits.map(async (h) => {
          try {
            const r = await apiGet(`/predict?user_id=${user.id}&habit_id=${h.id}`);
            const successRate = await computeSuccessRate(user.id, h.id);
            return { habit: h, ...r, success_rate: successRate };
          } catch (err) {
            console.warn("predict/log fetch error for habit", h.id, err);
            const successRate = await computeSuccessRate(user.id, h.id).catch(()=>0);
            return { habit: h, message: "", probability: 0.5, success_rate: successRate };
          }
        })
      );

      // sort by probability ascending (most at-risk first)
      preds.sort((a, b) => a.probability - b.probability);
      const top = preds[0];

      // compute front-end message using habit name, success rate and user persona
      const personaKey = (user.persona || "default").toString().toLowerCase();
      const message = generateCoachMessage(top.habit, top.success_rate || 0, personaKey);

      setRiskInfo({ ...top, message });
    } catch (err) {
      console.error("fetchRisk error", err);
      setError("Could not fetch coach predictions.");
    } finally {
      setLoading(false);
    }
  }

  // Quick log (I did it / Missed) — posts and triggers UI reactions
  async function quickLog(success = 1) {
    if (!riskInfo || !user) return;
    setChecking(true);
    try {
      await apiPost("/log", {
        user_id: user.id,
        habit_id: riskInfo.habit.id,
        success: success,
      });
      // refresh predictions & parent UI
      await fetchRisk();
      onRefresh && onRefresh();

      // mood + modal
      setMood(success ? "happy" : "sad");
      setShowModal(true);

      // auto-hide modal after 2.4s
      setTimeout(() => setShowModal(false), 2400);
    } catch (err) {
      console.error("quickLog error", err);
      alert("Could not log quick action");
    } finally {
      setChecking(false);
    }
  }

  // pet emoji resolution (robust for petType as string or object)
  const petEmojiMap = {
    dog: "🐶", cat: "🐱", rabbit: "🐰", fox: "🦊", panda: "🐼",
    tiger: "🐯", koala: "🐨", bear: "🐻", frog: "🐸", penguin: "🐧",
    unicorn: "🦄", mouse: "🐭", hamster: "🐹", lion: "🦁",
    cow: "🐮", pig: "🐷", chick: "🐥", duck: "🦆", owl: "🦉", elephant: "🐘"
  };
  let petEmoji = "🐾";
  if (typeof petType === "string" && petType.trim()) petEmoji = petType;
  else if (petType && typeof petType === "object") {
    const t = petType.type || petType.emoji;
    petEmoji = (typeof t === "string" && petEmojiMap[t]) ? petEmojiMap[t] : (t || "🐾");
  }

  const moodColors = {
    calm: "#f0f4ff",
    happy: "#fff8d9",
    sad: "#ffe2e2",
  };

  // UI
  if (!user) {
    return (
      <div className="card">
        <strong>LifeLens Coach</strong>
        <div className="small">Create an account to let the coach learn your rhythms.</div>
      </div>
    );
  }

  return (
    <div
      className="card coach-panel"
      style={{
        background: moodColors[mood] || "#f0f4ff",
        transition: "background 0.4s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>LifeLens Coach</strong>
          <div className="small">Persona: <PersonaBadge persona={user.persona} /></div>
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
                  <div className="small">Recent success rate: {(((riskInfo.success_rate || 0) * 100)).toFixed(0)}%</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button className="button" onClick={() => onOpen && onOpen(riskInfo.habit)}>Open</button>

                  <div style={{ marginTop: 6 }}>
                    <button
                      className="button success"
                      onClick={() => quickLog(1)}
                      disabled={checking}
                      style={{ marginRight: 8 }}
                    >
                      I did it ✓
                    </button>
                    <button
                      className="button danger"
                      onClick={() => quickLog(0)}
                      disabled={checking}
                    >
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

      {/* Popup modal with confetti */}
      {showModal && (
        <div className={`coach-modal ${mood}`}>
          <div className="confetti" />
          <div className="coach-modal-content">
            <div className="pet-emoji" style={{ fontSize: 48 }}>{petEmoji}</div>
            <div className="coach-message" style={{ marginTop: 8 }}>
              {mood === "happy"
                ? "Your pet is bursting with joy! 🎉"
                : "Your pet looks a bit down — try again soon 💕"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






