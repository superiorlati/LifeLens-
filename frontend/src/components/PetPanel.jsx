// frontend/src/components/PetPanel.jsx
import React, { useEffect, useState } from "react";
import "./petpanel.css";

/**
 * PetPanel — displays your emoji pet & reacts to progress!
 * Props:
 *  - petType: { type: "dog" } etc.
 *  - completedHabits: number
 *  - toys: number
 *  - fullView: optional (playroom mode)
 */

export default function PetPanel({ petType, completedHabits = 0, toys = 0, fullView = false }) {
  const [mood, setMood] = useState("neutral");

  useEffect(() => {
    if (completedHabits > 5) setMood("excited");
    else if (completedHabits > 0 || toys > 0) setMood("happy");
    else setMood("neutral");
  }, [completedHabits, toys]);

  const petEmojiMap = {
    dog: "🐶",
    cat: "🐱",
    rabbit: "🐰",
    fox: "🦊",
    panda: "🐼",
    tiger: "🐯",
    koala: "🐨",
    bear: "🐻",
    frog: "🐸",
    penguin: "🐧",
    unicorn: "🦄",
    mouse: "🐭",
    hamster: "🐹",
    lion: "🦁",
    cow: "🐮",
    pig: "🐷",
    chick: "🐥",
    duck: "🦆",
    owl: "🦉",
    elephant: "🐘",
  };

  const emoji =
    typeof petType === "string"
      ? petEmojiMap[petType] || petType
      : petEmojiMap[petType?.type] || "🐾";

  const moodMessages = {
    neutral: "Your pet is waiting patiently 💤",
    happy: "Your pet looks cheerful! 😊",
    excited: "Your pet is full of energy! 🎉",
  };

  const backgroundColors = {
    neutral: "#f0f4ff",
    happy: "#fff8d9",
    excited: "#d9ffec",
  };

  return (
    <div
      className={`pet-panel ${mood}`}
      style={{
        background: backgroundColors[mood],
        borderRadius: 16,
        textAlign: "center",
        padding: fullView ? "40px 0" : "20px 0",
        transition: "background 0.5s ease",
      }}
    >
      <div
        className="pet-emoji"
        style={{
          fontSize: fullView ? "5rem" : "3rem",
          transition: "transform 0.3s",
        }}
      >
        {emoji}
      </div>

      <div className="pet-stats" style={{ marginTop: 8, fontSize: "0.9rem" }}>
        🍖 {completedHabits} food | 🧸 {toys} toys
      </div>

      <div className="pet-mood" style={{ marginTop: 8 }}>
        {moodMessages[mood]}
      </div>
    </div>
  );
}
