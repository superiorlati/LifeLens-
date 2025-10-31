// frontend/src/components/PersonaPanel.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

/**
 * PersonaPanel — AI persona manager and adaptive emotional interface 🌈
 *
 * ✅ Displays and manages the current persona mode (kind, playful, direct, patient, analytical)
 * ✅ Reacts dynamically to mood analysis (from JournalPanel or backend)
 * ✅ Allows the user to switch personas manually or accept AI suggestions
 * ✅ Syncs persona state with backend (if available) and localStorage (offline-ready)
 * ✅ Shows persona description and emotional tone highlights
 * ✅ Adaptive prompt: AI explains what each persona tone means
 *
 * Props:
 *  - user: { id, name, persona }
 *  - currentMood: "happy" | "sad" | "neutral" | "overwhelmed" | "excited"
 *  - onPersonaChange(newPersona)
 */

export default function PersonaPanel({ user, currentMood, onPersonaChange }) {
  const [persona, setPersona] = useState(user?.persona || "kind");
  const [suggestedPersona, setSuggestedPersona] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [desc, setDesc] = useState("");

  // 🎯 Persona descriptions
  const personaDescriptions = {
    kind: "Warm, empathetic, gentle encouragement — perfect for low moods or reflection.",
    playful: "Light, humorous, motivational tone — energizing and uplifting.",
    direct: "Clear, focused, and concise — ideal when you need productivity and clarity.",
    patient: "Soft, understanding, and slow-paced — great for emotional recovery.",
    analytical: "Insightful, data-driven, and reflective — useful for self-discovery and progress review.",
  };

  // 🎨 Suggested persona colors / icons
  const personaVisuals = {
    kind: { color: "#f4d6ff", emoji: "🌸" },
    playful: { color: "#ffe3a3", emoji: "😄" },
    direct: { color: "#d0e7ff", emoji: "🎯" },
    patient: { color: "#e2f0cb", emoji: "💗" },
    analytical: { color: "#f1f1f1", emoji: "🧠" },
  };

  // 🪄 Load personas (from backend or default set)
  useEffect(() => {
    async function loadPersonas() {
      try {
        const res = await apiGet("/personas");
        setPersonas(res.personas || Object.keys(personaDescriptions));
      } catch (err) {
        console.warn("Using local persona set (no backend):", err);
        setPersonas(Object.keys(personaDescriptions));
      } finally {
        setLoading(false);
      }
    }
    loadPersonas();
  }, []);

  // 💡 Determine suggested persona based on mood
  useEffect(() => {
    if (!currentMood) return;

    let suggested = null;
    if (currentMood === "overwhelmed") suggested = "kind";
    else if (currentMood === "sad") suggested = "patient";
    else if (currentMood === "happy") suggested = "playful";
    else if (currentMood === "neutral") suggested = "analytical";
    else if (currentMood === "excited") suggested = "direct";

    setSuggestedPersona(suggested);
  }, [currentMood]);

  // 💾 Persist persona changes locally and remotely
  async function updatePersona(newPersona) {
    setUpdating(true);
    setPersona(newPersona);
    setDesc(personaDescriptions[newPersona] || "");
    onPersonaChange && onPersonaChange(newPersona);

    localStorage.setItem("currentPersona", newPersona);

    try {
      await apiPost("/persona/update", {
        user_id: user?.id || 0,
        persona: newPersona,
      });
    } catch (err) {
      console.warn("Persona update stored locally:", err);
    } finally {
      setUpdating(false);
    }
  }

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("currentPersona");
    if (saved && saved !== persona) {
      setPersona(saved);
      setDesc(personaDescriptions[saved] || "");
    } else {
      setDesc(personaDescriptions[persona] || "");
    }
  }, []);

  if (loading)
    return <div className="card">Loading persona settings...</div>;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>🎭 Your AI Persona</h3>
      <p className="small">
        Adjust how your LifeLens AI communicates and supports you emotionally.
      </p>

      {/* 🌈 Current persona display */}
      <div
        style={{
          marginTop: 12,
          background: personaVisuals[persona]?.color || "#f5f5f5",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease",
        }}
      >
        <div>
          <strong style={{ fontSize: "1.1rem" }}>
            {personaVisuals[persona]?.emoji} {persona.charAt(0).toUpperCase() + persona.slice(1)} Mode
          </strong>
          <div className="small" style={{ marginTop: 4 }}>
            {desc}
          </div>
        </div>
        <button
          className="button secondary"
          style={{ fontSize: "0.9rem" }}
          onClick={() => updatePersona(suggestedPersona || persona)}
          disabled={updating}
        >
          {updating ? "Updating..." : "🔁 Refresh"}
        </button>
      </div>

      {/* 💫 Suggested persona based on mood */}
      {suggestedPersona && suggestedPersona !== persona && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#fffbea",
            border: "1px solid #f0e2a8",
            borderRadius: 10,
          }}
        >
          <strong>Suggestion:</strong>{" "}
          Based on your current mood (<b>{currentMood}</b>), you might benefit from{" "}
          <b>{suggestedPersona}</b> mode.
          <div style={{ marginTop: 6 }}>
            <button
              className="button"
              onClick={() => updatePersona(suggestedPersona)}
              disabled={updating}
            >
              Switch to {suggestedPersona.charAt(0).toUpperCase() + suggestedPersona.slice(1)} Mode
            </button>
          </div>
        </div>
      )}

      {/* 🧩 Persona selector grid */}
      <div style={{ marginTop: 20 }}>
        <h4>Available Personas</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
            marginTop: 8,
          }}
        >
          {personas.map((p) => (
            <div
              key={p}
              className={`persona-option ${
                p === persona ? "active" : ""
              }`}
              onClick={() => updatePersona(p)}
              style={{
                cursor: "pointer",
                border: p === persona ? "2px solid #4a7dff" : "1px solid rgba(0,0,0,0.1)",
                borderRadius: 10,
                padding: "10px 8px",
                textAlign: "center",
                background: personaVisuals[p]?.color || "#fff",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>
                {personaVisuals[p]?.emoji || "🎭"}
              </div>
              <div style={{ marginTop: 4, fontWeight: 500 }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
