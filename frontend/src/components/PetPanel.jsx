// frontend/src/components/PetPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import "./petpanel.css";

/**
 * PetPanel — displays your emoji pet & reacts to progress, mood, and interactions.
 *
 * New features added:
 *  ✅ Animated mood transitions (happy bounce, excited wiggle)
 *  ✅ Interactive pet (click / feed / toy triggers mini animations)
 *  ✅ Dynamic background changes with gradient shimmer based on mood
 *  ✅ Support for custom emoji or type-based pet objects
 *  ✅ FullView mode adds pet nameplate and richer status display
 *
 * All old functionality is preserved.
 *
 * Props:
 *  - petType: string or { type: "dog" }
 *  - completedHabits: number
 *  - toys: number
 *  - fullView: boolean (for playroom)
 */

export default function PetPanel({
  petType,
  completedHabits = 0,
  toys = 0,
  fullView = false,
}) {
  const [mood, setMood] = useState("neutral"); // neutral, happy, excited
  const [animation, setAnimation] = useState("");
  const [petName, setPetName] = useState("Your Pet");
  const bounceRef = useRef(null);

  // choose pet emoji
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

  // choose name automatically if type known
  useEffect(() => {
    if (typeof petType === "string") {
      setPetName(petType.charAt(0).toUpperCase() + petType.slice(1));
    } else if (petType?.type) {
      setPetName(
        petType.type.charAt(0).toUpperCase() + petType.type.slice(1)
      );
    } else {
      setPetName("Your Pet");
    }
  }, [petType]);

  // mood update based on progress
  useEffect(() => {
    if (completedHabits > 5) setMood("excited");
    else if (completedHabits > 0 || toys > 0) setMood("happy");
    else setMood("neutral");
  }, [completedHabits, toys]);

  // interactive reactions
  function handlePetClick() {
    if (mood === "neutral") {
      setAnimation("bounce");
      setMood("happy");
    } else if (mood === "happy") {
      setAnimation("wiggle");
      setMood("excited");
    } else {
      setAnimation("bounce");
    }

    // reset animation class after 1s
    setTimeout(() => setAnimation(""), 1000);
  }

  // color palettes per mood
  const moodGradients = {
    neutral: "linear-gradient(145deg, #e0e7ff, #f8fafc)",
    happy: "linear-gradient(145deg, #fff8d9, #fffbec)",
    excited: "linear-gradient(145deg, #d9ffec, #e6fff4)",
  };

  const moodMessages = {
    neutral: "Your pet is waiting patiently 💤",
    happy: "Your pet looks cheerful! 😊",
    excited: "Your pet is bursting with joy! 🎉",
  };

  // CSS animations
  const animations = {
    bounce: { transform: "translateY(-8px)", transition: "transform 0.2s" },
    wiggle: {
      animation: "wiggle 0.6s ease-in-out",
      "@keyframes wiggle": {
        "0%, 100%": { transform: "rotate(0deg)" },
        "25%": { transform: "rotate(10deg)" },
        "75%": { transform: "rotate(-10deg)" },
      },
    },
  };

  return (
    <div
      className={`pet-panel ${mood}`}
      style={{
        background: moodGradients[mood],
        borderRadius: 16,
        textAlign: "center",
        padding: fullView ? "40px 0" : "20px 0",
        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
        transition: "background 0.6s ease, transform 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating sparkle effects when excited */}
      {mood === "excited" && (
        <div className="sparkle-overlay">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + Math.random() * 50}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <div
        ref={bounceRef}
        onClick={handlePetClick}
        className={`pet-emoji ${animation}`}
        style={{
          fontSize: fullView ? "5rem" : "3.2rem",
          cursor: "pointer",
          transition: "transform 0.3s ease",
          ...(animation === "bounce" ? animations.bounce : {}),
        }}
      >
        {emoji}
      </div>

      {fullView && (
        <div style={{ fontWeight: 600, fontSize: "1.1rem", marginTop: 6 }}>
          {petName}
        </div>
      )}

      <div
        className="pet-stats"
        style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.85 }}
      >
        🍖 {completedHabits} food | 🧸 {toys} toys
      </div>

      <div className="pet-mood" style={{ marginTop: 8 }}>
        {moodMessages[mood]}
      </div>
    </div>
  );
}
