import React from "react";

/**
 * PersonaBadge — small colored pill that shows the user's persona.
 * Usage: <PersonaBadge persona={user.persona} />
 */
export default function PersonaBadge({ persona }) {
  if (!persona) return null;

  const colors = {
    neutral: "#6b7280",
    storyteller: "#7c3aed",
    musician: "#0ea5e9",
    motivator: "#ef4444",
    supporter: "#60a5fa",
    challenger: "#f59e0b",
    reflector: "#10b981",
  };

  const label = (persona || "neutral").toString();

  return (
    <span
      aria-hidden="false"
      style={{
        display: "inline-block",
        backgroundColor: colors[label] || "#a78bfa",
        color: "white",
        padding: "6px 10px",
        borderRadius: "999px",
        fontWeight: 700,
        fontSize: "0.85rem",
        letterSpacing: "0.2px",
      }}
      title={`Persona: ${label}`}
    >
      {label}
    </span>
  );
}

