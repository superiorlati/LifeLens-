// frontend/src/App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import CreateUser from "./components/CreateUser";
import HabitsList from "./components/HabitsList";
import NudgePanel from "./components/NudgePanel";
import CoachPanel from "./components/CoachPanel";
import AvatarPicker from "./components/AvatarPicker";
import PetPanel from "./components/PetPanel";
import PersonaBadge from "./components/PersonaBadge";
import PersonaSetup from "./components/PersonaSetup"; // new: onboarding persona selector
import JournalPanel from "./components/JournalPanel"; // new: journaling / voice notes
import GroupPanel from "./components/GroupPanel"; // new: group accountability view
import { apiGet } from "./api";
import "./index.css";

/**
 * LifeLens – Study Bunny–style gamified habit companion
 *
 * Pages:
 *  - onboard: create user → pick persona → pick pet
 *  - dashboard: habit & nudge view
 *  - playroom: interactive pet view
 *  - journal: write / voice journaling
 *  - groups: group accountability
 *
 * This file preserves ALL existing features the app had previously
 * (habit fetching, logging hooks, playroom, coach panel, audio toggle, etc.)
 * while adding:
 *  - persona selection at onboarding (and editable in-settings via header)
 *  - journal & group panels accessible from dashboard
 *  - mood state driving background color and pet emotion
 *  - place to toggle background music (audio element expected in public/assets)
 */

export default function App() {
  const [page, setPage] = useState("onboard"); // onboard, dashboard, playroom, journal, groups
  const [user, setUser] = useState(null); // { id, name, persona }
  const [pet, setPet] = useState(null); // { type }
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);

  // gamification stats
  const [food, setFood] = useState(0);
  const [toys, setToys] = useState(0);
  const [dailyStatus, setDailyStatus] = useState({}); // habitId -> true/false

  // persona & mood
  const [persona, setPersona] = useState(null); // string like 'kind','playful','analytical', etc.
  const [mood, setMood] = useState("calm"); // calm | happy | sad | excited
  const audioRef = useRef(null);

  /** -----------------------
   * Data fetching & helpers
   * ----------------------- */
  const fetchHabits = useCallback(
    async (u = user) => {
      if (!u) return;
      try {
        const res = await apiGet(`/habits?user_id=${u.id}`);
        setHabits(res.habits || []);
      } catch (e) {
        console.error("Error fetching habits", e);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchHabits();
      // if user already has persona on record, sync
      if (user.persona) setPersona(user.persona);
    }
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
      // If any missing -> gentle sad nudge
      setMood("sad");
    } else {
      setMood("calm");
    }
  }

  /** -----------------------
   * Event handlers
   * ----------------------- */
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
    // newUser may not include persona yet; persona setup follows
    setUser(newUser);
    // if user doesn't have persona, remain on onboarding to pick persona & pet
    setPage("onboard");
  }

  function handlePersonaChosen(chosenPersona) {
    setPersona(chosenPersona);
    // persist to user object (frontend-only; backend sync can be done separately)
    setUser((u) => (u ? { ...u, persona: chosenPersona } : { persona: chosenPersona }));
  }

  function handlePetChosen(petObj) {
    // expected petObj: { type: 'dog' | 'cat' | 'rabbit' | ... }
    setPet(petObj);
    setPage("dashboard");
    // small delay so habits can load then evaluate mood
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
    setPersona(null);
    setMood("calm");
    setPage("onboard");
  }

  // run recompute when entering dashboard or when habits change
  useEffect(() => {
    if (page === "dashboard") recomputeDailyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, habits]);

  /** -----------------------
   * UI helpers: mood -> background
   * ----------------------- */
  const moodColors = {
    calm: "#f0f4ff",
    happy: "#fff9d6",
    sad: "#f8e4e4",
    excited: "#d9ffec",
  };

  /** -----------------------
   * Header controls
   * ----------------------- */
  const HeaderRightControls = () => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button className="button ghost" onClick={toggleMusic}>🎷 Music</button>
      {user && <button className="button ghost" onClick={() => setPage("journal")}>Journal</button>}
      {user && <button className="button ghost" onClick={() => setPage("groups")}>Groups</button>}
      {user && <button className="button ghost" onClick={() => setPage("playroom")}>Playroom</button>}
      {user && <button className="button" onClick={logout}>Logout</button>}
    </div>
  );

  /** -----------------------
   * Render
   * ----------------------- */
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
      {/* background music audio element (place your file in public/assets if using) */}
      <audio id="bg-music" src="/assets/jazz-loop.mp3" loop preload="auto" />

      <div className="header">
        <div>
          <h1>LifeLens</h1>
          <div className="small">Persona-aware nudges • Habit companion</div>
          {user && persona && (
            <div className="small">
              Persona: <PersonaBadge persona={persona} />
            </div>
          )}
        </div>

        <HeaderRightControls />
      </div>

      {/* -------------------- ONBOARD -------------------- */}
      {page === "onboard" && (
        <>
          {!user ? (
            <div className="card">
              <CreateUser onCreated={handleUserCreated} />
            </div>
          ) : !persona ? (
            // If user exists but hasn't chosen persona yet — prompt
            <div className="card">
              <h3>Choose your coaching persona</h3>
              <div className="small">Pick a tone that suits how you want feedback delivered.</div>
              <div style={{ marginTop: 12 }}>
                <PersonaSetup onChoose={(p) => handlePersonaChosen(p)} />
              </div>
            </div>
          ) : !pet ? (
            // After persona selected, pick pet
            <div className="card">
              <h3>Choose a companion</h3>
              <div className="small">Pick your virtual friend to begin your journey.</div>
              <div style={{ marginTop: 12 }}>
                <AvatarPicker onSelect={handlePetChosen} />
              </div>
            </div>
          ) : (
            // Fallback: if everything selected, go to dashboard
            <div className="card">
              <div className="small">All set — heading to your dashboard.</div>
              <button className="button" onClick={() => setPage("dashboard")}>Open Dashboard</button>
            </div>
          )}
        </>
      )}

      {/* -------------------- DASHBOARD -------------------- */}
      {page === "dashboard" && user && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Welcome, {user.name}</strong>
                <div className="small">
                  Persona: <PersonaBadge persona={persona || user.persona} /> • Food: {food} 🍖 • Toys: {toys} 🧸
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* quick persona edit */}
                <button
                  className="button ghost"
                  onClick={() => {
                    // let them change persona quickly (re-open persona setup inline)
                    setPersona(null);
                    setPage("onboard");
                  }}
                >
                  Edit Persona
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <CoachPanel
              user={user}
              petType={pet}
              onOpen={(h) => setSelectedHabit(h)}
              onRefresh={handleLogFromPanels}
            />
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
              {/* PetPanel will display emoji pet and react based on props */}
              <PetPanel petType={pet} completedHabits={food} toys={toys} />
            </div>
          </div>
        </>
      )}

      {/* -------------------- PLAYROOM -------------------- */}
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

      {/* -------------------- JOURNAL -------------------- */}
      {page === "journal" && user && (
        <div className="card">
          <h2>Journal</h2>
          <div className="small">Write a quick entry or record a short voice note — LifeLens will analyze mood and adapt suggestions.</div>
          <div style={{ marginTop: 12 }}>
            <JournalPanel
              user={user}
              persona={persona}
              onInsight={(insight) => {
                // journal returned insight could influence mood/persona suggestions
                if (insight?.mood === "distressed") {
                  setMood("sad");
                }
              }}
              onDone={() => setPage("dashboard")}
            />
          </div>
        </div>
      )}

      {/* -------------------- GROUPS -------------------- */}
      {page === "groups" && user && (
        <div className="card">
          <h2>Accountability Groups</h2>
          <div className="small">Join groups working on similar habits to stay motivated together.</div>
          <div style={{ marginTop: 12 }}>
            <GroupPanel user={user} habits={habits} onBack={() => setPage("dashboard")} />
          </div>
        </div>
      )}
    </div>
  );
}
