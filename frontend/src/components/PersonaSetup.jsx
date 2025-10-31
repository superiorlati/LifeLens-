import React, { useState, useEffect } from "react";
import { apiPost } from "../api";
import { addHabit, getHabits } from "../api";

/**
 * PersonaSetup.jsx
 *
 * Allows users to configure their AI coach's tone & personality.
 * Integrates with diary/voice mood detection (future logic ready).
 */
export default function PersonaSetup({ user, onPersonaSelected, currentPersona }) {
  const [selected, setSelected] = useState(currentPersona || "kind");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [previewText, setPreviewText] = useState("");

  const personas = [
    {
      id: "kind",
      label: "Kind & Supportive 💖",
      desc: "Encouraging, patient, gentle — celebrates small wins and uplifts you when you stumble.",
      sample: "You’re doing your best — progress is never wasted. Let’s take it one step at a time 💕",
      tone: "soft, positive, emotionally aware",
    },
    {
      id: "harsh",
      label: "Tough Love 💪",
      desc: "Blunt, disciplined, direct — pushes you to act when motivation fades.",
      sample: "No excuses. You said you wanted this. Let’s get back to work — you’ve got this.",
      tone: "firm, accountable, motivational",
    },
    {
      id: "playful",
      label: "Playful 🎈",
      desc: "Cheerful, gamified — keeps you laughing and engaged.",
      sample: "Haha, you almost nailed it! Let’s beat your own high score today 😄",
      tone: "fun, quirky, high-energy",
    },
    {
      id: "analytical",
      label: "Insightful & Analytical 🧠",
      desc: "Calm and logical — helps you understand patterns and optimize your progress.",
      sample: "You tend to miss habits on weekends — maybe we can rebalance your schedule?",
      tone: "data-driven, thoughtful, measured",
    },
    {
      id: "inspirational",
      label: "Inspirational 🌟",
      desc: "Radiates purpose — fuels your goals with emotion and meaning.",
      sample: "Every great journey begins with one brave step. Today is yours.",
      tone: "motivational, heartfelt, visionary",
    },
    {
      id: "neutral",
      label: "Balanced ⚖️",
      desc: "Simple, steady, adaptable — minimal emotional bias.",
      sample: "Habit logged successfully. Consistency builds momentum.",
      tone: "clear, calm, professional",
    },
  ];

  useEffect(() => {
    const persona = personas.find((p) => p.id === selected);
    setPreviewText(persona ? persona.sample : "");
  }, [selected]);

  // Simulated emotional suggestion logic (future integration)
  useEffect(() => {
    if (!emotion) return;
    if (emotion === "overwhelmed" && selected === "harsh") {
      setSuggestion("You seem really stressed — maybe switch to a 'Kind & Supportive 💖' mode?");
    } else if (emotion === "unmotivated" && selected === "neutral") {
      setSuggestion("Feeling flat? Try the 'Inspirational 🌟' persona for a boost!");
    } else {
      setSuggestion(null);
    }
  }, [emotion, selected]);

  async function savePersona() {
    if (!user?.id) {
      alert("User not loaded yet.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/update_persona", { user_id: user.id, persona: selected });
      if (onPersonaSelected) onPersonaSelected(selected);
    } catch (err) {
      console.error(err);
      alert("Could not update persona. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ transition: "all 0.4s ease" }}>
      <h3>🧠 Choose Your AI Coach’s Style</h3>
      <div className="small" style={{ marginBottom: 12 }}>
        You can change this later if your mood or goals shift. Your AI will adapt its tone to fit you.
      </div>

      <div className="persona-grid">
        {personas.map((p) => (
          <div
            key={p.id}
            className={`persona-card ${selected === p.id ? "selected" : ""}`}
            onClick={() => setSelected(p.id)}
            style={{
              cursor: "pointer",
              padding: 14,
              borderRadius: 14,
              border: selected === p.id ? "2px solid var(--accent)" : "1px solid rgba(0,0,0,0.06)",
              background: selected === p.id ? "var(--soft)" : "rgba(255,255,255,0.8)",
              boxShadow:
                selected === p.id
                  ? "0 6px 20px rgba(124,87,246,0.18)"
                  : "0 3px 10px rgba(0,0,0,0.04)",
              transition: "all 0.3s ease",
            }}
          >
            <strong>{p.label}</strong>
            <div className="small" style={{ marginTop: 4 }}>
              {p.desc}
            </div>
          </div>
        ))}
      </div>

      <div
        className="preview-box"
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 12,
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(124,87,246,0.08)",
        }}
      >
        <strong>Preview:</strong>
        <div
          className="small"
          style={{
            marginTop: 6,
            color: "var(--muted)",
            fontStyle: "italic",
          }}
        >
          {previewText}
        </div>
      </div>

      {suggestion && (
        <div
          className="nudge"
          style={{
            marginTop: 16,
            borderLeft: "5px solid var(--accent-2)",
            background: "#f0f8ff",
            padding: 8,
            borderRadius: 8,
          }}
        >
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="button" onClick={savePersona} disabled={loading}>
          {loading ? "Saving…" : "Save Persona ✨"}
        </button>
      </div>
    </div>
  );
}
