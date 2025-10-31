import React, { useState, useRef } from "react";

/**

AvatarPicker — swipe or scroll to pick from a range of animal companions 🐾

✅ Horizontal emoji carousel with scroll snapping

✅ Calls onSelect({ type }) when an animal is chosen

✅ Includes live preview area

✅ Accessible and responsive

✅ Subtle animation + consistent design with LifeLens visuals
*/

export default function AvatarPicker({ onSelect }) {
const [selected, setSelected] = useState(null);
const scrollRef = useRef(null);

const animals = [
{ type: "dog", emoji: "🐶", label: "Dog" },
{ type: "cat", emoji: "🐱", label: "Cat" },
{ type: "rabbit", emoji: "🐰", label: "Rabbit" },
{ type: "fox", emoji: "🦊", label: "Fox" },
{ type: "panda", emoji: "🐼", label: "Panda" },
{ type: "tiger", emoji: "🐯", label: "Tiger" },
{ type: "koala", emoji: "🐨", label: "Koala" },
{ type: "bear", emoji: "🐻", label: "Bear" },
{ type: "frog", emoji: "🐸", label: "Frog" },
{ type: "penguin", emoji: "🐧", label: "Penguin" },
{ type: "unicorn", emoji: "🦄", label: "Unicorn" },
{ type: "mouse", emoji: "🐭", label: "Mouse" },
{ type: "hamster", emoji: "🐹", label: "Hamster" },
{ type: "lion", emoji: "🦁", label: "Lion" },
{ type: "cow", emoji: "🐮", label: "Cow" },
{ type: "pig", emoji: "🐷", label: "Pig" },
{ type: "chick", emoji: "🐥", label: "Chick" },
{ type: "duck", emoji: "🦆", label: "Duck" },
{ type: "owl", emoji: "🦉", label: "Owl" },
{ type: "elephant", emoji: "🐘", label: "Elephant" },
];

const handlePick = (type) => {
setSelected(type);
onSelect?.({ type });
};

return (
<div className="avatar-picker" style={{ textAlign: "center" }}>
<div className="small" style={{ fontWeight: 600 }}>
Pick your companion
</div>

  <div
    ref={scrollRef}
    className="avatar-scroll"
    style={{
      display: "flex",
      gap: "16px",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      padding: "12px 0",
      marginTop: "8px",
      WebkitOverflowScrolling: "touch",
    }}
  >
    {animals.map((a) => (
      <button
        key={a.type}
        onClick={() => handlePick(a.type)}
        aria-label={`Choose ${a.label}`}
        className={`breed-card ${selected === a.type ? "selected" : ""}`}
        style={{
          flex: "0 0 auto",
          scrollSnapAlign: "center",
          textAlign: "center",
          cursor: "pointer",
          minWidth: "90px",
          background: selected === a.type ? "var(--soft, #f5f3ff)" : "transparent",
          border:
            selected === a.type
              ? "2px solid rgba(124,87,246,0.4)"
              : "2px solid transparent",
          borderRadius: "12px",
          padding: "10px 6px",
          transition: "all 0.25s ease",
          outline: "none",
        }}
      >
        <div
          style={{
            fontSize: 46,
            marginBottom: 4,
            transform: selected === a.type ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.25s ease",
          }}
        >
          {a.emoji}
        </div>
        <div className="small">{a.label}</div>
      </button>
    ))}
  </div>

  <div style={{ marginTop: 24 }}>
    <div className="small">Preview</div>
    <div
      className="pet-stage"
      style={{
        width: 200,
        height: 160,
        margin: "10px auto 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fff, #f9f9ff)",
        borderRadius: 16,
        boxShadow: "var(--shadow, 0 4px 12px rgba(0,0,0,0.1))",
      }}
    >
      {selected ? (
        <div
          style={{
            fontSize: 72,
            transform: "scale(1)",
            transition: "transform 0.4s ease",
          }}
        >
          {animals.find((a) => a.type === selected)?.emoji}
        </div>
      ) : (
        <div style={{ fontSize: 36, opacity: 0.7 }}>🐾</div>
      )}
    </div>
  </div>
</div>


);
}