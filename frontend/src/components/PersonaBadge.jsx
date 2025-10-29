// frontend/src/components/PersonaBadge.jsx
import React from "react";

/**
 * PersonaBadge — shows user’s persona & tone mode 🌈
 *
 * Features:
 * ✅ Dynamic persona color schemes & icons
 * ✅ Subtle glow animation based on journal mood or AI feedback
 * ✅ Clickable badge that can open persona settings (if handler passed)
 * ✅ Supports new personas: harsh, kind, fun, playful, analytical, inspirational, brutal, patient
 * ✅ Preserves old personas (neutral, storyteller, musician, motivator, supporter, challenger, reflector)
 *
 * Usage:
 * <PersonaBadge persona={user.persona} mood={user.mood} onClickChange={openPersonaSettings}/>
 */

export default function PersonaBadge({ persona = "neutral", mood = "neutral", onClickChange }) {
  // persona colors + icons
  const personaStyles = {
    neutral: { color: "#6b7280", icon: "⚪" },
    storyteller: { color: "#7c3aed", icon: "📖" },
    musician: { color: "#0ea5e9", icon: "🎵" },
    motivator: { color: "#ef4444", icon: "🔥" },
    supporter: { color: "#60a5fa", icon: "🤝" },
    challenger: { color: "#f59e0b", icon: "⚡" },
    reflector: { color: "#10b981", icon: "🌿" },
    kind: { color: "#34d399", icon: "💚" },
    analytical: { color: "#3b82f6", icon: "🧠" },
    fun: { color: "#f472b6", icon: "🎈" },
    playful: { color: "#facc15", icon: "😄" },
    inspirational: { color: "#a855f7", icon: "✨" },
    brutal: { color: "#ef4444", icon: "💥" },
    patient: { color: "#6366f1", icon: "🕊️" },
    harsh: { color: "#b91c1c", icon: "⚔️" },
  };

  // glow colors (based on mood/journal emotion)
  const moodGlow = {
    neutral: "0 0 6px rgba(107,114,128,0.4)",
    happy: "0 0 10px rgba(250,204,21,0.6)",
    sad: "0 0 10px rgba(239,68,68,0.4)",
    inspired: "0 0 10px rgba(168,85,247,0.7)",
    calm: "0 0 10px rgba(56,189,248,0.6)",
    overwhelmed: "0 0 12px rgba(239,68,68,0.6)",
    grateful: "0 0 10px rgba(34,197,94,0.7)",
  };

  const personaData = personaStyles[persona] || personaStyles["neutral"];
  const shadow = moodGlow[mood] || moodGlow["neutral"];

  const handleClick = () => {
    if (onClickChange) onClickChange();
  };

  return (
    <span
      onClick={handleClick}
      title={`Persona: ${persona} (${mood})`}
      aria-label={`Persona badge for ${persona}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: personaData.color,
        color: "white",
        padding: "6px 12px",
        borderRadius: "999px",
        fontWeight: 700,
        fontSize: "0.9rem",
        letterSpacing: "0.2px",
        cursor: onClickChange ? "pointer" : "default",
        boxShadow: shadow,
        transition: "all 0.3s ease-in-out",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{personaData.icon}</span>
      <span>{persona}</span>
    </span>
  );
}
