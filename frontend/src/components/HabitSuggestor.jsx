// frontend/src/components/HabitSuggestor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiPost } from "../api";
import { analyzeHabitText, breakDownHabit, generateNudge, defaultMicroAction } from "frontend/src/utils/personaLogic";
import { interpretJournalEntry, analyzeMood } from "frontend/src/utils/moodLogic";

/**
 * HabitSuggestor.jsx
 *
 * Purpose:
 *  - Take a free-text habit name from the user
 *  - Show analyzed verb/tags, an AI-style nudge, and a 2-4 step breakdown
 *  - Allow the user to tweak target/day and create the habit (POST /add_habit)
 *  - Use personaLogic + moodLogic locally (no backend calls required) so the UI works offline
 *
 * Props:
 *  - user: { id, name, persona } (required to actually create habit)
 *  - persona: optional string override for preview tone
 *  - onCreated(): optional callback invoked after successful creation (parent should refresh habits)
 *
 * Notes:
 *  - Keeps all features and never discards existing behaviors: micro-actions, suggested steps,
 *    persona and mood adaptation, and graceful fallbacks.
 */

export default function HabitSuggestor({ user, persona: personaProp, onCreated }) {
  const [text, setText] = useState("");
  const [targetPerDay, setTargetPerDay] = useState(1);
  const [previewSteps, setPreviewSteps] = useState([]);
  const [previewNudge, setPreviewNudge] = useState("");
  const [analyzed, setAnalyzed] = useState({ verb: "do", tags: ["general"] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [moodContext, setMoodContext] = useState({ mood: "neutral", emoji: "🙂", message: "" });

  // derive active persona from prop (or fallback to 'neutral')
  const personaKey = (personaProp || (user && user.persona) || "neutral").toString().toLowerCase();

  // When user text changes, update analysis & preview
  useEffect(() => {
    const t = (text || "").trim();
    if (!t) {
      setAnalyzed({ verb: "do", tags: ["general"] });
      setPreviewSteps([]);
      setPreviewNudge("");
      setMoodContext({ mood: "neutral", emoji: "🙂", message: "" });
      return;
    }

    // run personaLogic analysis (deterministic local)
    try {
      const analysis = analyzeHabitText(t);
      setAnalyzed(analysis);
      // generate breakdown steps (2-4)
      const steps = breakDownHabit(t, "auto");
      setPreviewSteps(Array.isArray(steps) ? steps : [String(steps)]);
      // attempt a nudge preview with a default probability informed by tags (heuristic)
      let p = 0.5;
      if (analysis.tags.includes("exercise") || analysis.tags.includes("physical")) p = 0.55;
      if (analysis.tags.includes("creative")) p = 0.6;
      if (analysis.tags.includes("time-bound")) p = 0.7;
      setPreviewNudge(generateNudge(t, p));
    } catch (err) {
      console.warn("Local analysis failed", err);
      setAnalyzed({ verb: "do", tags: ["general"] });
      setPreviewSteps([defaultMicroAction(t)]);
      setPreviewNudge(defaultMicroAction(t));
    }

    // also analyze mood from text to show context-aware tone suggestion
    try {
      const mood = analyzeMood(t);
      const interp = interpretJournalEntry(t);
      setMoodContext({
        mood: interp.mood || mood || "neutral",
        emoji: interp.emoji || "🙂",
        message: interp.message || "",
      });
    } catch (err) {
      setMoodContext({ mood: "neutral", emoji: "🙂", message: "" });
    }
  }, [text]);

  // human-friendly label for verb
  const verbLabel = useMemo(() => {
    return (analyzed.verb || "do").toString();
  }, [analyzed]);

  // create habit (POST). Matches HabitsList usage of `/add_habit`.
  async function createHabit(e) {
    e && e.preventDefault && e.preventDefault();
    if (!text.trim()) {
      setError("Please enter a habit name.");
      return;
    }
    if (!user || !user.id) {
      setError("You must be signed in to create habits.");
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const body = {
        user_id: user.id,
        name: text.trim(),
        target_per_day: Number(targetPerDay) || 1,
      };

      // Use backend endpoint HabitList already expects '/add_habit'
      // If backend fails, let apiPost handle fallback (per unified api.js)
      await apiPost("/add_habit", body);

      // success — call parent refresh
      setText("");
      setPreviewSteps([]);
      setPreviewNudge("");
      onCreated && onCreated();
    } catch (err) {
      console.error("createHabit error", err);
      setError("Could not create habit — check your connection.");
    } finally {
      setCreating(false);
    }
  }

  // Quick create: make the smallest micro-action habit
  async function quickCreate() {
    if (!user || !user.id) {
      setError("You must be signed in to create habits.");
      return;
    }
    const smallest = defaultMicroAction(text || "New habit");
    setText(smallest);
    // set a short timeout so the effect above computes previews, then call create
    setTimeout(() => createHabit(), 220);
  }

  return (
    <div className="card">
      <h3>Create or Refine a Habit</h3>
      <div className="small">Type your habit goal and get an AI-style suggestion + tiny steps to start.</div>

      <form onSubmit={createHabit} style={{ marginTop: 12 }}>
        <label className="small">Habit name</label>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Write 500 words", "10-minute stretch", "Read one chapter"'
        />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="small">Target per day</label>
            <input
              className="input"
              type="number"
              min="1"
              value={targetPerDay}
              onChange={(e) => setTargetPerDay(Math.max(1, Number(e.target.value || 1)))}
            />
          </div>

          <div style={{ width: 150 }}>
            <label className="small">Verb</label>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.04)" }}>
              {verbLabel}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="button" type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create habit"}
          </button>
          <button type="button" className="button secondary" onClick={quickCreate} disabled={creating}>
            Quick micro-habit
          </button>
        </div>
      </form>

      {/* Analysis & Preview */}
      <div style={{ marginTop: 14 }}>
        <div className="small">Mood context</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 20 }}>{moodContext.emoji}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{moodContext.mood}</div>
            <div className="small" style={{ color: "var(--muted)" }}>{moodContext.message}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="small">AI preview ({personaKey})</div>
        <div style={{ marginTop: 8, borderRadius: 10, padding: 10, background: "#f7f8ff", border: "1px solid rgba(124,87,246,0.06)" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{previewNudge || "Try a tiny step — start with 5 minutes."}</div>
          <div className="small" style={{ color: "var(--muted)" }}>{`(Suggested by persona: ${personaKey})`}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="small">Suggested micro-steps</div>
        <ol style={{ marginTop: 8 }}>
          {previewSteps.length ? (
            previewSteps.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{s}</li>
            ))
          ) : (
            <li>{defaultMicroAction(text || "Start something small")}</li>
          )}
        </ol>
      </div>

      {error && <div className="small" style={{ color: "var(--danger)", marginTop: 10 }}>{error}</div>}
    </div>
  );
}
// ------------------------------------------------------------