import React, { useState, useEffect } from "react";
import { apiPost } from "../api";

export default function CreateUser({ onCreated }) {
const [name, setName] = useState("");
const [persona, setPersona] = useState("kind");
const [loading, setLoading] = useState(false);
const [preview, setPreview] = useState("");
const [showGlow, setShowGlow] = useState(false);

const personas = [
{
id: "kind",
label: "Kind & Supportive 💖",
desc: "Encouraging, patient, gentle — celebrates small wins and uplifts you when you stumble.",
tone: "soft, positive, emotionally aware",
},
{
id: "harsh",
label: "Tough Love 💪",
desc: "Blunt, disciplined, direct — pushes you hard when motivation drops.",
tone: "firm, no-nonsense, focused on accountability",
},
{
id: "playful",
label: "Playful 🎈",
desc: "Cheerful, quirky, gamified — helps you laugh through setbacks and stay lighthearted.",
tone: "fun, humorous, optimistic",
},
{
id: "analytical",
label: "Insightful & Analytical 🧠",
desc: "Helps you reflect, understand patterns, and optimize habits using logic and insight.",
tone: "calm, thoughtful, data-driven",
},
{
id: "inspirational",
label: "Inspirational 🌟",
desc: "Fuels your spirit with quotes, perspective, and purpose — reminds you why you started.",
tone: "motivational, emotional, high-energy",
},
{
id: "neutral",
label: "Balanced ⚖️",
desc: "Keeps things steady and adaptable — neutral guidance without extremes.",
tone: "clear, calm, balanced",
},
];

useEffect(() => {
const selected = personas.find((p) => p.id === persona);
if (selected) setPreview(selected.desc);
setShowGlow(true);
const timeout = setTimeout(() => setShowGlow(false), 800);
return () => clearTimeout(timeout);
}, [persona]);

async function handleCreate(e) {
e.preventDefault();
if (!name.trim()) {
alert("Please enter your name!");
return;
}

setLoading(true);
try {
  const res = await apiPost("/create_user", { name, persona });
  onCreated({ id: res.user_id, name, persona });
} catch (err) {
  console.error(err);
  alert("Could not create user. Please try again.");
} finally {
  setLoading(false);
}


}

return (
<form onSubmit={handleCreate} aria-label="Create user" className="create-user-form">
<h3 style={{ marginBottom: 8 }}>✨ Create Your LifeLens Companion</h3>
<div className="small" style={{ marginBottom: 16 }}>
Choose your persona type — this affects how your AI coach motivates and supports you.
</div>

  <label className="small">Your name</label>
  <input
    className="input"
    placeholder="Type your name..."
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
  />

  <label className="small" style={{ marginTop: 12 }}>
    Choose your coach style
  </label>
  <select
    className={`input ${showGlow ? "persona-glow" : ""}`}
    value={persona}
    onChange={(e) => setPersona(e.target.value)}
  >
    {personas.map((p) => (
      <option key={p.id} value={p.id}>
        {p.label}
      </option>
    ))}
  </select>

  {preview && (
    <div
      className="card"
      style={{
        marginTop: 12,
        border: "1px solid rgba(124,87,246,0.1)",
        background: "rgba(255,255,255,0.7)",
        transition: "all 0.35s ease",
      }}
    >
      <strong>Personality Preview</strong>
      <div className="small" style={{ marginTop: 6 }}>
        {preview}
      </div>
    </div>
  )}

  <div style={{ marginTop: 20 }}>
    <button className="button" type="submit" disabled={loading}>
      {loading ? "Creating…" : "Start My Journey 🚀"}
    </button>
  </div>
</form>


);
}
