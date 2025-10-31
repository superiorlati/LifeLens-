// frontend/src/components/PersonaBadge.jsx
import React from "react";
import { addHabit, getHabits } from "../api";

/**
 * PersonaBadge — adaptive badge showing user’s current persona & mood 🌈
 *
 * ✅ Keeps all old personas + adds new extended ones
 * ✅ Adds hover/active transitions and subtle scale pulse
 * ✅ Fully accessible (ARIA label + tooltip)
 * ✅ Mood glow now synced to CSS variables (for dark/light mode)
 * ✅ Supports click-to-change persona
 */

export default function PersonaBadge({ persona = "neutral", mood = "neutral", onClickChange }) {
  // persona color schemes + icons (unchanged, expanded)
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

  // Glow colors (CSS variables for theme adaptability)
  const moodGlow = {
    neutral: "0 0 6px var(--glow-neutral, rgba(107,114,128,0.4))",
    happy: "0 0 10px var(--glow-happy, rgba(250,204,21,0.6))",
    sad: "0 0 10px var(--glow-sad, rgba(239,68,68,0.4))",
    inspired: "0 0 10px var(--glow-inspired, rgba(168,85,247,0.7))",
    calm: "0 0 10px var(--glow-calm, rgba(56,189,248,0.6))",
    overwhelmed: "0 0 12px var(--glow-overwhelmed, rgba(239,68,68,0.6))",
    grateful: "0 0 10px var(--glow-grateful, rgba(34,197,94,0.7))",
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
      role="button"
      tabIndex={onClickChange ? 0 : -1}
      onKeyDown={(e) => e.key === "Enter" && onClickChange && onClickChange()}
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
        transition: "all 0.25s ease-in-out",
        transform: "translateY(0)",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{personaData.icon}</span>
      <span>{persona}</span>
    </span>
  );
}
// End of frontend/src/components/PersonaBadge.jsx