// frontend/src/App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import CreateUser from "./components/CreateUser";
import HabitsList from "./components/HabitsList";
import NudgePanel from "./components/NudgePanel";
import CoachPanel from "./components/CoachPanel";
import AvatarPicker from "./components/AvatarPicker";
import PetPanel from "./components/PetPanel";
import PersonaBadge from "./components/PersonaBadge";
import { apiGet } from "./api";
import "./index.css";

/**
 * LifeLens – Study Bunny–style gamified habit companion
 * Pages:
 *  - onboard: create user → pick pet
 *  - dashboard: habit & nudge view
 *  - playroom: interactive pet view
 */
export default function App() {
  const [page, setPage] = useState("onboard"); // onboard, dashboard, playroom
  const [user, setUser] = useState(null); // { id, name, persona }
  const [pet, setPet] = useState(null);   // { type }
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);

  // gamification stats
  const [food, setFood] = useState(0);
  const [toys, setToys] = useState(0);
  const [dailyStatus, setDailyStatus] = useState({}); // habitId -> true/false
  const [mood, setMood] = useState("calm"); // sync with pet mood (calm|happy|sad)
  const audioRef = useRef(null);

  /** ─────────────────────────────
   *  Data Fetching & Daily Logic
   *  ───────────────────────────── */
  const fetchHabits = useCallback(async (u = user) => {
    if (!u) return;
    try {
      const res = await apiGet(`/habits?user_id=${u.id}`);
      setHabits(res.habits || []);
    } catch (e) {
      console.error("Error fetching habits", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchHabits();
  }, [user, fetchHabits]);

  async function habitCompletedToday(userId, habitId) {
    try {
      const r = await apiGet(`/logs?user_id=${userId}&habit_id=${habitId}`);
      const logs = r.logs || [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return logs.some((l) => {
        if (!l.timestamp) return false;
        const t = new Date(l.timestamp);
        return t >= start && l.success === 1;
      });
    } catch (e) {
      console.error("Error checking habit completion", e);
      return false;
    }
  }

  async function recomputeDailyStatus() {
    if (!user) return;
    const status = {};
    for (const h of habits) {
      status[h.id] = await habitCompletedToday(user.id, h.id);
    }
    setDailyStatus(status);

    // Award toy if all habits are completed today
    const ids = Object.keys(status);
    if (ids.length > 0 && ids.every((id) => status[id])) {
      setToys((t) => t + 1);
      setMood("happy");
    } else if (ids.some((id) => !status[id])) {
      setMood("sad");
    } else {
      setMood("calm");
    }
  }

  /** ─────────────────────────────
   *  Event Handlers
   *  ───────────────────────────── */
  function onHabitLoggedSuccess() {
    setFood((f) => f + 1);
    fetchHabits();
    recomputeDailyStatus();
    setMood("happy");
  }

  async function handleLogFromPanels({ success } = {}) {
    if (success === 1) {
      onHabitLoggedSuccess();
    } else {
      setMood("sad");
      await recomputeDailyStatus();
    }
  }

  function handleUserCreated(newUser) {
    setUser(newUser);
    setPage("onboard"); // next step: pick pet
  }

  function handlePetChosen(petObj) {
    // petObj expected like { type: "dog" } from AvatarPicker
    setPet(petObj);
    setPage("dashboard");
    setTimeout(recomputeDailyStatus, 400);
  }

  function toggleMusic() {
    if (!audioRef.current) audioRef.current = document.getElementById("bg-music");
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }

  function logout() {
    setUser(null);
    setPet(null);
    setHabits([]);
    setSelectedHabit(null);
    setFood(0);
    setToys(0);
    setDailyStatus({});
    setPage("onboard");
    setMood("calm");
  }

  useEffect(() => {
    if (page === "dashboard") recomputeDailyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, habits]);

  /** ─────────────────────────────
   *  Mood-based background colors
   *  ───────────────────────────── */
  const moodColors = {
    calm: "#f0f4ff",
    happy: "#fff9d6",
    sad: "#f8e4e4",
  };

  /** ─────────────────────────────
   *  Render Logic
   *  ───────────────────────────── */
  return (
    <div
      className="container"
      role="main"
      style={{
        background: moodColors[mood] || "#f0f4ff",
        minHeight: "100vh",
        transition: "background 0.35s ease",
      }}
    >
      <div className="header">
        <div>
          <h1>LifeLens</h1>
          <div className="small">Persona-aware nudges • Habit companion</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="button ghost" onClick={toggleMusic}>🎷 Music</button>
          {user && <button className="button ghost" onClick={() => setPage("playroom")}>Playroom</button>}
          {user && <button className="button" onClick={logout}>Logout</button>}
        </div>
      </div>

      {/* Onboarding */}
      {page === "onboard" && (
        <>
          {!user ? (
            <div className="card"><CreateUser onCreated={handleUserCreated} /></div>
          ) : (
            <div className="card">
              <h3>Choose a companion</h3>
              <div className="small">Pick your virtual friend to begin your journey.</div>
              <AvatarPicker onSelect={handlePetChosen} />
            </div>
          )}
        </>
      )}

      {/* Dashboard */}
      {page === "dashboard" && user && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Welcome, {user.name}</strong>
                <div className="small">
                  Persona: <PersonaBadge persona={user.persona} /> • Food: {food} 🍖 • Toys: {toys} 🧸
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <CoachPanel user={user} petType={pet} onOpen={(h) => setSelectedHabit(h)} onRefresh={handleLogFromPanels} />
          </div>

          <div className="card">
            <HabitsList user={user} habits={habits} onSelect={(h) => setSelectedHabit(h)} onRefresh={fetchHabits} />
          </div>

          <div className="card">
            <NudgePanel user={user} habit={selectedHabit} onLog={handleLogFromPanels} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
            <div className="card">
              <h3>Today's Progress</h3>
              <div className="small">LifeLens will nudge you if you miss a habit.</div>
              <ul style={{ marginTop: 12 }}>
                {habits.length === 0 && <div className="small">No habits yet — add one to start.</div>}
                {habits.map((h) => (
                  <li key={h.id} style={{ marginBottom: 8 }}>
                    <strong>{h.name}</strong>{" "}
                    <span className="small">— {dailyStatus[h.id] ? "Done ✅" : "Missed ❌"}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Your Companion</h3>
              <PetPanel petType={pet} completedHabits={food} toys={toys} />
            </div>
          </div>
        </>
      )}

      {/* Playroom */}
      {page === "playroom" && user && pet && (
        <div className="card">
          <h2>Playroom</h2>
          <div className="small">Spend time with your {pet.type}. Feed or play to cheer them up!</div>

          <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <PetPanel petType={pet} completedHabits={food} toys={toys} fullView />
            </div>

            <div style={{ width: 260 }}>
              <h4>Actions</h4>
              <div className="control-row">
                <button className="button" onClick={() => setFood((f) => f + 1)}>Feed 🍖</button>
                <button className="button secondary" onClick={() => setToys((t) => t + 1)}>Give Toy 🧸</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="button ghost" onClick={() => setPage("dashboard")}>Back to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
