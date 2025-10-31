// frontend/src/components/NudgePanel.jsx
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { generateNudge } from "../utils/personaLogic";
import { addHabit, getHabits } from "../api";

/**
 * NudgePanel
 * ----------
 * Displays adaptive AI nudges for a specific habit, including probability-based
 * suggestions and habit logs. Integrates persona-aware fallback logic via
 * personaLogic.js if backend response is missing or malformed.
 *
 * Props:
 *  - user: { id }
 *  - habit: { id, name }
 *  - onLog: callback({ success }) after logging success/failure
 */
export default function NudgePanel({ user, habit, onLog }) {
  const [nudge, setNudge] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !habit) return;
    fetchNudge();
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, habit?.id]);

  /** ---------------------------
   * Fetch AI prediction/nudge
   * --------------------------- */
  async function fetchNudge() {
    if (!user || !habit) return;
    try {
      setLoading(true);
      const res = await apiGet(`/predict?user_id=${user.id}&habit_id=${habit.id}`);

      // Backend may return { message, probability } or nested { nudge: {...} }
      const payload = res?.nudge || res || {};
      const probability = typeof payload.probability === "number" ? payload.probability : 0.5;
      const message =
        payload.message ||
        generateNudge(habit.name, probability) ||
        "No prediction available right now.";

      setNudge({ message, probability });
    } catch (err) {
      console.error("Error fetching nudge:", err);
      // graceful fallback
      setNudge({
        message: generateNudge(habit.name, 0.4),
        probability: 0.4,
      });
    } finally {
      setLoading(false);
    }
  }

  /** ---------------------------
   * Fetch recent logs
   * --------------------------- */
  async function fetchLogs() {
    if (!user || !habit) return;
    try {
      const res = await apiGet(`/logs?user_id=${user.id}&habit_id=${habit.id}`);
      setLogs(res.logs || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }

  /** ---------------------------
   * Log habit outcome
   * --------------------------- */
  async function logOutcome(success) {
    if (!user || !habit) return;
    try {
      await apiPost("/log", { user_id: user.id, habit_id: habit.id, success });
      await fetchNudge();
      await fetchLogs();
      onLog && onLog({ success });
    } catch (err) {
      console.error("Error logging outcome:", err);
    }
  }

  /** ---------------------------
   * Render
   * --------------------------- */
  if (!habit)
    return <div className="small">Select a habit to see prediction & logs.</div>;

  return (
    <div>
      <h3>{habit.name}</h3>

      {loading ? (
        <div className="small">Loading prediction…</div>
      ) : nudge ? (
        <div className="nudge" role="status" aria-live="polite">
          <div>
            <strong>Nudge</strong>
          </div>
          <div style={{ marginTop: 8 }}>{nudge.message}</div>
          <div className="small" style={{ marginTop: 8 }}>
            Confidence: {(nudge.probability * 100).toFixed(0)}%
          </div>
        </div>
      ) : (
        <div className="small">No nudge available yet.</div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="button" onClick={() => logOutcome(1)}>
          I did it ✓
        </button>
        <button
          className="button"
          style={{ marginLeft: 8, background: "#ef4444" }}
          onClick={() => logOutcome(0)}
        >
          Missed ✗
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Recent logs</strong>
        <div className="small" aria-live="polite">
          {logs.length === 0 ? (
            <div className="small">No logs yet</div>
          ) : (
            logs.map((l, i) => (
              <div key={i}>
                {new Date(l.timestamp).toLocaleString()} — {l.success ? "✓" : "✗"}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
