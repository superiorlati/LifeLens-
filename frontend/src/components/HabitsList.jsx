// frontend/src/components/HabitsList.jsx
import React, { useState, useEffect } from "react";

/**
 * HabitsList — fully localStorage-compatible version
 *
 * ✅ Keeps all old features (add habit, targets, open button, AI breakdowns)
 * ✅ Works fully offline — no backend needed to add habits
 * ✅ Still supports backend /breakdown if available (fallback to local AI)
 * ✅ Persists habits in localStorage via "habits_<userId>"
 */

export default function HabitsList({ user, habits = [], onSelect, onRefresh }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState(1);
  const [loading, setLoading] = useState(false);
  const [breakdowns, setBreakdowns] = useState({});
  const [breakingDown, setBreakingDown] = useState(null);

  // 🔹 Load habits from localStorage on mount (in case parent didn’t)
  useEffect(() => {
    if (!habits?.length && user?.id) {
      try {
        const savedRaw = localStorage.getItem(`habits_${user.id}`) || "[]";
        const saved = JSON.parse(savedRaw);
        if (Array.isArray(saved) && saved.length) {
          // If parent provided onRefresh that accepts updated list, prefer that,
          // otherwise call onRefresh() with no args to let parent re-fetch.
          if (onRefresh) {
            try {
              onRefresh(saved);
            } catch {
              try {
                onRefresh();
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not parse saved habits from localStorage", err);
      }
    }
    // only run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 🔹 LocalStorage helper
  function saveToLocal(updated) {
    if (!user?.id) return;
    try {
      localStorage.setItem(`habits_${user.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn("Could not save habits to localStorage", err);
    }
  }

  // 🔹 Add new habit (frontend only)
  async function addHabit(e) {
    e.preventDefault();
    if (!user?.id) {
      alert("No user found.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter a habit name.");
      return;
    }

    setLoading(true);
    try {
      const newHabit = {
        id: Date.now().toString(),
        name: name.trim(),
        target_per_day: Number(target) || 1,
        progress: 0,
        created_at: new Date().toISOString(),
      };

      const updated = [...(habits || []), newHabit];
      saveToLocal(updated);

      // clear inputs
      setName("");
      setTarget(1);

      // call parent's refresh. Try with updated list first, fall back to no-arg.
      if (onRefresh) {
        try {
          onRefresh(updated);
        } catch {
          try {
            onRefresh();
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error("Add habit failed:", err);
      alert("Could not add habit.");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Get AI breakdown for a habit (try backend, fallback to local mock)
  async function getBreakdown(habit) {
    const habitId = habit.id;
    if (breakdowns[habitId]) return;

    setBreakingDown(habitId);
    try {
      let res;
      try {
        // Optional backend call (if available)
        const response = await fetch("/breakdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id || 0, habit_name: habit.name }),
        });
        if (!response.ok) throw new Error("Backend unavailable");
        res = await response.json();
      } catch (err) {
        console.warn("Backend breakdown unavailable, using fallback:", err);
        // Local fallback
        const nameLower = (habit.name || "").toLowerCase();
        const mock = [];

        if (nameLower.includes("write") || nameLower.includes("journal")) {
          mock.push("Outline your topic or story idea");
          mock.push("Write for 10 minutes without editing");
          mock.push("Reflect on what worked and save a snippet");
        } else if (nameLower.includes("exercise") || nameLower.includes("run") || nameLower.includes("walk")) {
          mock.push("Prepare your outfit and playlist");
          mock.push("Start with 5 minutes of warm-up");
          mock.push("Track your effort and hydrate after");
        } else if (nameLower.includes("meditat") || nameLower.includes("mindful") || nameLower.includes("breath")) {
          mock.push("Find a quiet spot");
          mock.push("Breathe deeply for 2 minutes");
          mock.push("Note how you feel afterward");
        } else {
          mock.push("Break the habit into 3 clear actions");
          mock.push("Set a small achievable goal for today");
          mock.push("Reflect at night and note what helped");
        }

        res = { steps: mock };
      }

      const steps = res?.steps || res?.data?.steps || [];
      setBreakdowns((prev) => ({ ...prev, [habitId]: steps }));
    } catch (err) {
      console.error("AI breakdown failed:", err);
      alert("Could not generate AI breakdown.");
    } finally {
      setBreakingDown(null);
    }
  }

  return (
    <div>
      <h3>My habits</h3>
      <form onSubmit={addHabit} aria-label="Add habit">
        <label className="small">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="small">Target per day</label>
        <input
          className="input"
          type="number"
          value={target}
          onChange={(e) => setTarget(Math.max(1, Number(e.target.value || 1)))}
          min="1"
          required
        />
        <div style={{ marginTop: 10 }}>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add habit"}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 12 }}>
        {(!habits || habits.length === 0) ? (
          <div className="small">You have no habits yet.</div>
        ) : (
          (habits || []).map((h) => (
            <div
              key={h.id}
              className="habit"
              role="article"
              aria-label={`Habit ${h.name}`}
              style={{
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div>
                    <strong>{h.name}</strong>
                  </div>
                  <div className="small">target/day: {h.target_per_day}</div>
                </div>
                <div>
                  <button
                    className="button"
                    onClick={() => {
                      if (onSelect) onSelect(h);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 6 }}>
                <button
                  className="button secondary small"
                  onClick={() => getBreakdown(h)}
                  disabled={breakingDown === h.id}
                >
                  {breakingDown === h.id ? "Thinking…" : "Get AI Breakdown"}
                </button>
              </div>

              {breakdowns[h.id] && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#f9f9f9",
                    fontSize: "0.9rem",
                  }}
                >
                  <strong>AI Suggested Steps:</strong>
                  <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                    {breakdowns[h.id].map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
