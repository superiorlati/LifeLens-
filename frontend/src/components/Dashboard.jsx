// frontend/src/components/Dashboard.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import CoachPanel from "./CoachPanel";
import HabitsList from "./HabitsList";
import NudgePanel from "./NudgePanel";
import PetPanel from "./PetPanel";
import AvatarPicker from "./AvatarPicker";
import PersonaBadge from "./PersonaBadge";
import { apiGet, apiPost } from "../api";
import "../index.css";

/**
 * Dashboard.jsx
 *
 * A single, integrated dashboard view that:
 *  - loads the user's habits and computes daily completion status
 *  - shows CoachPanel, HabitsList, NudgePanel and PetPanel
 *  - keeps all existing functionality from the App.jsx inline dashboard
 *
 * Props:
 *  - user: { id, name, persona } (required)
 *  - pet: { type } or string (optional)
 *  - onPetChosen(petObj) - called when user picks/changes a pet (optional)
 *  - onOpenHabit(habit) - open habit details (optional)
 *  - onNavigate(page) - navigate (e.g. "playroom") (optional)
 *  - onLogout() - optional logout handler
 *
 * This component mirrors the logic previously in App.jsx so you can either
 * use the component inside App.jsx or swap the dashboard area with this.
 */

export default function Dashboard({
  user,
  pet,
  onPetChosen,
  onOpenHabit,
  onNavigate,
  onLogout,
}) {
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [food, setFood] = useState(0);
  const [toys, setToys] = useState(0);
  const [dailyStatus, setDailyStatus] = useState({}); // habitId -> bool
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // fetch user's habits
  const fetchHabits = useCallback(
    async (u = user) => {
      if (!u) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet(`/habits?user_id=${u.id}`);
        setHabits(res.habits || []);
      } catch (err) {
        console.error("fetchHabits", err);
        setError("Could not load habits");
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    fetchHabits();
  }, [user, fetchHabits]);

  // check if a habit has been completed today
  async function habitCompletedToday(userId, habitId) {
    try {
      const r = await apiGet(`/logs?user_id=${userId}&habit_id=${habitId}`);
      const logs = r.logs || [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return logs.some((l) => {
        if (!l.timestamp) return false;
        const t = new Date(l.timestamp);
        return t >= start && Number(l.success) === 1;
      });
    } catch (e) {
      console.error("habitCompletedToday", e);
      return false;
    }
  }

  // recompute dailyStatus (and award toy if all done)
  async function recomputeDailyStatus() {
    if (!user) return;
    const status = {};
    for (const h of habits) {
      status[h.id] = await habitCompletedToday(user.id, h.id);
    }
    setDailyStatus(status);

    // award toy if all habits done
    const ids = Object.keys(status);
    if (ids.length > 0 && ids.every((id) => status[id])) {
      setToys((t) => t + 1);
    }
  }

  // recompute when habits change or on mount
  useEffect(() => {
    if (habits.length > 0) recomputeDailyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  // Called by child panels (CoachPanel / NudgePanel) after they log a habit
  // Accepts the same payloads previous handlers used: { success, habit_id } or similar
  async function handleLogFromPanels(payload = {}) {
    const success = payload.success;
    if (success === 1) {
      setFood((f) => f + 1);
      await fetchHabits();
      await recomputeDailyStatus();
    } else {
      await recomputeDailyStatus();
    }
  }

  // Quick UI helpers
  function toggleMusic() {
    if (!audioRef.current) audioRef.current = document.getElementById("bg-music");
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }

  // When the user picks a pet from AvatarPicker inside dashboard
  function handlePetPick(petObj) {
    onPetChosen && onPetChosen(petObj);
  }

  // small actions: feed / give toy (local only UI)
  function handleFeed() {
    setFood((f) => f + 1);
  }
  function handleGiveToy() {
    setToys((t) => t + 1);
  }

  // Render guard
  if (!user) {
    return (
      <div className="card">
        <strong>Dashboard</strong>
        <div className="small">Please sign in or create an account to use LifeLens.</div>
      </div>
    );
  }

  return (
    <div>
      {/* top welcome card */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Welcome, {user.name}</strong>
            <div className="small">
              Persona: <PersonaBadge persona={user.persona} /> • Food: {food} 🍖 • Toys: {toys} 🧸
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="button ghost" onClick={toggleMusic}>🎷 Music</button>
            <button className="button ghost" onClick={() => onNavigate && onNavigate("playroom")}>Playroom</button>
            <button className="button" onClick={() => onLogout && onLogout()}>Logout</button>
          </div>
        </div>
      </div>

      {/* Coach & Habits & Nudge panels */}
      <div className="card">
        <CoachPanel
          user={user}
          petType={pet}
          onOpen={(h) => {
            setSelectedHabit(h);
            onOpenHabit && onOpenHabit(h);
          }}
          onRefresh={handleLogFromPanels}
        />
      </div>

      <div className="card">
        <HabitsList
          user={user}
          habits={habits}
          onSelect={(h) => {
            setSelectedHabit(h);
            onOpenHabit && onOpenHabit(h);
          }}
          onRefresh={fetchHabits}
        />
      </div>

      <div className="card">
        <NudgePanel user={user} habit={selectedHabit} onLog={handleLogFromPanels} />
      </div>

      {/* Progress and companion columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div className="card">
          <h3>Today's Progress</h3>
          <div className="small">LifeLens will nudge you if you miss a habit.</div>

          <div style={{ marginTop: 12 }}>
            {loading && <div className="small">Loading habits…</div>}
            {error && <div className="small" style={{ color: "var(--danger)" }}>{error}</div>}
            {habits.length === 0 && !loading && (
              <div className="small">No habits yet — add one to start.</div>
            )}

            <ul style={{ marginTop: 12 }}>
              {habits.map((h) => (
                <li key={h.id} style={{ marginBottom: 8 }}>
                  <strong>{h.name}</strong>{" "}
                  <span className="small">— {dailyStatus[h.id] ? "Done ✅" : "Missed ❌"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <h3>Your Companion</h3>

          {/* PetPanel shows mood and responds to food/toys */}
          <PetPanel petType={pet} completedHabits={food} toys={toys} />

          {/* Quick actions in the companion card */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="button" onClick={handleFeed}>Feed 🍖</button>
            <button className="button secondary" onClick={handleGiveToy}>Give Toy 🧸</button>
            <button
              className="button ghost"
              onClick={() => {
                /* allow quick swap of pet type inline */
                const next = prompt("Pick a pet emoji or type (e.g. dog, cat, 🐶):");
                if (next) {
                  // prefer type strings (dog/cat) if user typed them; otherwise pass as emoji string
                  if (next.length <= 4 && /^[a-z_]+$/i.test(next)) {
                    handlePetPick({ type: next.toLowerCase() });
                  } else {
                    handlePetPick(next); // emoji string
                  }
                }
              }}
            >
              Change Pet
            </button>
          </div>

          {/* Offer to pick via AvatarPicker */}
          <div style={{ marginTop: 12 }}>
            <div className="small">Or pick from the gallery:</div>
            <AvatarPicker onSelect={(p) => handlePetPick(p)} />
          </div>
        </div>
      </div>
    </div>
  );
}
