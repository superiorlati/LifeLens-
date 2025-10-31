import React, { useEffect, useState } from "react";
import { getAIReflection } from "../api";
import { generateReflection } from "frontend/src/utils/personaLogic";

/**

AIReflection — displays an adaptive AI-style reflection 💬

✅ Fetches AI-generated reflection from backend or falls back to personaLogic.js

✅ Responds to persona + mood + recent context

✅ Includes typing animation + fade-in transition

✅ Matches LifeLens color & animation style

✅ Fully resilient (no crash if backend fails)
*/

export default function AIReflection({ persona = "neutral", mood = "neutral", context = {} }) {
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(true);

// Fetch reflection once persona/mood/context changes
useEffect(() => {
let isMounted = true;
setLoading(true);
setMessage("");

async function fetchReflection() {
  try {
    const response = await getAIReflection({ persona, mood, context });
    if (isMounted && response?.message) {
      setMessage(response.message);
    } else if (isMounted) {
      // fallback
      const fallback = generateReflection(persona, mood, context);
      setMessage(fallback);
    }
  } catch {
    const fallback = generateReflection(persona, mood, context);
    if (isMounted) setMessage(fallback);
  } finally {
    if (isMounted) setLoading(false);
  }
}

fetchReflection();
return () => {
  isMounted = false;
};


}, [persona, mood, JSON.stringify(context)]);

// Persona accent colors (matches PersonaBadge)
const personaColors = {
neutral: "#6b7280",
storyteller: "#7c3aed",
musician: "#0ea5e9",
motivator: "#ef4444",
supporter: "#60a5fa",
challenger: "#f59e0b",
reflector: "#10b981",
kind: "#34d399",
analytical: "#3b82f6",
fun: "#f472b6",
playful: "#facc15",
inspirational: "#a855f7",
brutal: "#ef4444",
patient: "#6366f1",
harsh: "#b91c1c",
};

const color = personaColors[persona] || personaColors.neutral;

return (
<div
className="ai-reflection"
style={{
marginTop: "16px",
padding: "16px",
borderRadius: "12px",
background: "var(--panel-bg, #fff)",
boxShadow: "var(--shadow, 0 2px 10px rgba(0,0,0,0.05))",
display: "flex",
flexDirection: "column",
alignItems: "flex-start",
animation: "fadeIn 0.6s ease",
}}
>
<div
style={{
fontWeight: 600,
color,
marginBottom: "6px",
fontSize: "0.95rem",
display: "flex",
alignItems: "center",
gap: "6px",
}}
>
<span>🤖</span> <span>{persona} says:</span>
</div>

  <div
    style={{
      fontSize: "1rem",
      lineHeight: 1.5,
      color: "#374151",
      minHeight: "32px",
      width: "100%",
    }}
  >
    {loading ? (
      <span
        className="typing"
        style={{
          display: "inline-block",
          animation: "blink 1s infinite",
          color: "#9ca3af",
        }}
      >
        ...
      </span>
    ) : (
      <span
        style={{
          display: "inline-block",
          opacity: message ? 1 : 0.6,
          transition: "opacity 0.4s ease",
        }}
      >
        {message}
      </span>
    )}
  </div>

  <style>
    {`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes blink {
      0%, 50%, 100% { opacity: 0.3; }
      25%, 75% { opacity: 1; }
    }
    `}
  </style>
</div>


);
}