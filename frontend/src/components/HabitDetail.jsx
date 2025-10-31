// frontend/src/components/HabitDetail.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import { breakDownHabit, generateNudge, analyzeHabitText } from "frontend/src/utils/personaLogic";
import "../index.css";
import "./coachpanel.css";
import { addHabit, getHabits } from "../api";

/**
 * HabitDetail.jsx
 *
 * Detailed view for a single habit:
 *  - shows logs (most recent first)
 *  - computes streak, success rate, recency
 *  - allows quick log (I did it / Missed)
 *  - fetches /predict for AI nudge + shows generated message
 *  - fetches or computes AI breakdown steps for the habit
 *  - displays a progress ring and small confetti/pet feedback
 *
 * Props:
 *  - user: { id, name, ... } (required)
 *  - habit: { id, name, target_per_day, created_at } (required)
 *  - onClose() optional - called when closing detail view
 *  - onRefresh() optional - parent refresh callback after logs
 *
 * Notes:
 *  - Uses backend endpoints if available:
 *      GET /logs?user_id=...&habit_id=...
 *      POST /log
 *      GET /predict?user_id=...&habit_id=...
 *      POST /breakdown  (optional)
 *  - Falls back to local heuristics if backend endpoints are unavailable.
 */

function formatDateIso(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HabitDetail({ user, habit, onClose, onRefresh }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictInfo, setPredictInfo] = useState(null); // {message, probability}
  const [breakingDown, setBreakingDown] = useState(false);
  const [breakdownSteps, setBreakdownSteps] = useState(null);
  const [actioning, setActioning] = useState(false);
  const [lastActionMood, setLastActionMood] = useState(null); // 'happy'|'sad'
  const [error, setError] = useState(null);

  // Derived: success array and stats
  const successes = useMemo(() => logs.map((l) => Number(l.success || 0)), [logs]);
  const successRate = useMemo(() => {
    if (!successes.length) return 0;
    return successes.reduce((a, b) => a + b, 0) / successes.length;
  }, [successes]);

  const streak = useMemo(() => {
    // count consecutive 1s from the end (most recent chronological assumed at end)
    if (!logs.length) return 0;
    // logs are returned in reverse-chronological usually; ensure chronological order
    const chrono = [...logs].slice().reverse();
    let s = 0;
    for (let i = chrono.length - 1; i >= 0; i--) {
      // actually iterate from last to first for most recent first, safer:
    }
    // Simpler: iterate from start (most recent at index 0 if backend returns desc)
    // We'll compute by reading logs[0] as most recent (as other components do)
    let count = 0;
    for (const l of logs) {
      if (Number(l.success) === 1) count++;
      else break;
    }
    return count;
  }, [logs]);

  const lastLogTime = useMemo(() => (logs[0] ? logs[0].timestamp : null), [logs]);

  // fetch logs
  const fetchLogs = useCallback(async () => {
    if (!user || !habit) return;
    setLoadingLogs(true);
    setError(null);
    try {
      const res = await apiGet(`/logs?user_id=${user.id}&habit_id=${habit.id}&limit=200`);
      const remote = (res && res.logs) || [];
      // Ensure logs sorted descending by timestamp (remote may already be)
      remote.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      setLogs(remote);
    } catch (err) {
      console.warn("fetchLogs failed, falling back to empty logs", err);
      setLogs([]);
      setError("Could not fetch logs (running in local-only mode?)");
    } finally {
      setLoadingLogs(false);
    }
  }, [user, habit]);

  // fetch prediction + nudge
  const fetchPredict = useCallback(async () => {
    if (!user || !habit) return;
    setLoadingPredict(true);
    setError(null);
    try {
      const res = await apiGet(`/predict?user_id=${user.id}&habit_id=${habit.id}`);
      if (res && res.message) {
        setPredictInfo({ message: res.message, probability: Number(res.probability) || 0.5 });
      } else {
        // fallback local nudge
        const p = 0.5;
        setPredictInfo({ message: generateNudge(habit.name, p), probability: p });
      }
    } catch (err) {
      console.warn("predict fetch failed, using local nudge", err);
      const p = Math.max(0, Math.min(1, successRate || 0.5));
      setPredictInfo({ message: generateNudge(habit.name, p), probability: p });
    } finally {
      setLoadingPredict(false);
    }
  }, [user, habit, successRate]);

  // fetch breakdown (backend if available, fallback to local personaLogic)
  const fetchBreakdown = useCallback(async () => {
    if (!user || !habit) return;
    if (breakdownSteps) return;
    setBreakingDown(true);
    try {
      // try backend first
      try {
        const res = await apiPost("/breakdown", { user_id: user.id, habit_name: habit.name });
        const steps = res?.steps || res?.data?.steps || null;
        if (steps && steps.length) {
          setBreakdownSteps(steps);
          setBreakingDown(false);
          return;
        }
      } catch (err) {
        // ignore and fallback
        console.warn("backend /breakdown not available, using local fallback", err);
      }

      // local fallback using personaLogic.breakDownHabit
      try {
        const localSteps = breakDownHabit(habit.name, "auto");
        setBreakdownSteps(Array.isArray(localSteps) ? localSteps : [localSteps]);
      } catch (err) {
        console.warn("local breakdown failed", err);
        setBreakdownSteps([`Try: ${habit.name} — do one tiny step for 5 minutes.`]);
      }
    } finally {
      setBreakingDown(false);
    }
  }, [user, habit, breakdownSteps]);

  // quick log (0/1)
  const doLog = useCallback(
    async (success = 1) => {
      if (!user || !habit) return;
      setActioning(true);
      try {
        await apiPost("/log", {
          user_id: user.id,
          habit_id: habit.id,
          success: success,
        });
        setLastActionMood(success ? "happy" : "sad");
        // fetch latest logs & update predictions + parent
        await fetchLogs();
        await fetchPredict();
        onRefresh && onRefresh();
        // small auto-hide mood after 2s
        setTimeout(() => setLastActionMood(null), 2000);
      } catch (err) {
        console.error("log failed", err);
        alert("Could not record log — check connection.");
      } finally {
        setActioning(false);
      }
    },
    [user, habit, fetchLogs, fetchPredict, onRefresh]
  );

  // initial load
  useEffect(() => {
    if (!user || !habit) return;
    fetchLogs();
    fetchPredict();
    // don't auto-fetch breakdown until user opens it to avoid noise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, habit?.id]);

  // Derived UI progress percent based on success rate vs target_per_day
  const progressPercent = useMemo(() => {
    const t = Math.max(1, Number(habit.target_per_day || 1));
    // scale successRate to percent of target (clamped)
    let p = Math.round(Math.min(100, Math.floor((successRate * t) / t * 100)));
    if (Number.isNaN(p)) p = 0;
    return p;
  }, [successRate, habit]);

  // small helper to format relative recency
  function relativeTime(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  }

  // small confetti visual (pure CSS element reuse)
  function renderConfetti() {
    return <div className="confetti" style={{ position: "absolute", right: -40, top: -24 }} />;
  }

  if (!user || !habit) {
    return (
      <div className="card">
        <strong>Habit</strong>
        <div className="small">Select a habit to view details.</div>
      </div>
    );
  }

  const verbTags = analyzeHabitText(habit.name);

  return (
    <div className="card" style={{ position: "relative", overflow: "visible" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ fontSize: "1.05rem" }}>{habit.name}</strong>
          <div className="small" style={{ marginTop: 6 }}>
            Target / day: {habit.target_per_day} • Created: {formatDateIso(habit.created_at)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="button ghost" onClick={() => fetchBreakdown()} disabled={breakingDown}>
            {breakingDown ? "Thinking…" : "AI Breakdown"}
          </button>
          <button className="button" onClick={() => fetchPredict()} disabled={loadingPredict}>
            {loadingPredict ? "Checking…" : "Re-check risk"}
          </button>
          <button className="button ghost" onClick={() => onClose && onClose()}>
            Close
          </button>
        </div>
      </div>

      {/* top panels: progress + AI suggestion */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginTop: 12 }}>
        {/* Progress ring */}
        <div>
          <div className="progress-ring" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} style={{ height: 80 }}>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, textAlign: "center" }}>{progressPercent}%</div>
              <div className="small" style={{ textAlign: "center", marginTop: 6 }}>
                Success rate
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestion + meta */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="small">AI Suggestion</div>
              <div style={{ marginTop: 6 }}>
                {predictInfo ? (
                  <div className="ai-feedback" style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{(predictInfo.probability * 100).toFixed(0)}% confidence</div>
                    <div>{predictInfo.message}</div>
                  </div>
                ) : (
                  <div className="small">No suggestion yet — press "Re-check risk".</div>
                )}
              </div>
            </div>

            <div style={{ width: 160 }}>
              <div className="small">Habit analysis</div>
              <div style={{ marginTop: 8 }}>
                <div className="small"><strong>Verb</strong>: {verbTags.verb}</div>
                <div className="small"><strong>Tags</strong>: {verbTags.tags.join(", ")}</div>
              </div>
            </div>
          </div>

          {/* breakdown steps (if loaded) */}
          <div style={{ marginTop: 12 }}>
            {breakdownSteps ? (
              <div style={{ padding: 10, borderRadius: 8, background: "#fafafa" }}>
                <div style={{ fontWeight: 700 }}>Suggested Steps</div>
                <ol style={{ marginTop: 8 }}>
                  {breakdownSteps.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="small">No breakdown yet — try the AI Breakdown button.</div>
            )}
          </div>
        </div>
      </div>

      {/* logs & quick actions */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Recent logs</strong>
            <div className="small">Most recent first</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button success" onClick={() => doLog(1)} disabled={actioning}>I did it ✓</button>
            <button className="button danger" onClick={() => doLog(0)} disabled={actioning}>Missed ✗</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loadingLogs ? (
            <div className="small">Loading logs…</div>
          ) : !logs.length ? (
            <div className="small">No logs yet — log a completion to start tracking.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {logs.map((l, idx) => (
                <li key={l.id || idx} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.6)", marginBottom: 8, border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="small">{formatDateIso(l.timestamp)}</div>
                    <div className="small">{l.success ? "Completed ✓" : "Missed ✗"}</div>
                  </div>
                  {l.note && <div style={{ marginTop: 8 }}>{l.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* metadata & extra */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <div className="small">Streak: <strong>{streak}</strong></div>
          <div className="small">Success rate: <strong>{Math.round((successRate || 0) * 100)}%</strong></div>
          <div className="small">Last: {lastLogTime ? relativeTime(lastLogTime) : "—"}</div>
        </div>
      </div>

      {/* Pet/confetti feedback overlay */}
      {lastActionMood && (
        <div style={{ position: "absolute", right: 8, top: 8 }}>
          {renderConfetti()}
        </div>
      )}

      {/* error */}
      {error && <div className="small" style={{ marginTop: 12, color: "var(--danger)" }}>{error}</div>}
    </div>
  );
}
