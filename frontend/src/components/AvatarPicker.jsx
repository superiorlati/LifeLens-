import React, { useState, useRef } from "react";

/**

AvatarPicker — swipe or scroll to pick from a range of animal companions.

Shows emoji avatars in a horizontal carousel.

Calls onSelect({ type }) when an animal is chosen.
*/
export default function AvatarPicker({ onSelect }) {
const [selected, setSelected] = useState(null);
const scrollRef = useRef();

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
if (onSelect) onSelect({ type });
};

return (
<div className="avatar-picker">
<div className="small">Pick your companion</div>

  <div
    className="avatar-scroll"
    ref={scrollRef}
    style={{
      display: "flex",
      gap: "16px",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      padding: "12px 0",
      marginTop: "8px",
    }}
  >
    {animals.map((a) => (
      <div
        key={a.type}
        className={`breed-card ${selected === a.type ? "selected" : ""}`}
        onClick={() => handlePick(a.type)}
        style={{
          flex: "0 0 auto",
          scrollSnapAlign: "center",
          textAlign: "center",
          cursor: "pointer",
          minWidth: "90px",
          background: selected === a.type ? "var(--soft)" : "transparent",
          border:
            selected === a.type
              ? "2px solid rgba(124,87,246,0.3)"
              : "2px solid transparent",
          borderRadius: "12px",
          padding: "10px 6px",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ fontSize: 46, marginBottom: 4 }}>{a.emoji}</div>
        <div className="small">{a.label}</div>
      </div>
    ))}
  </div>

  <div style={{ marginTop: 24, textAlign: "center" }}>
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
        boxShadow: "var(--shadow)",
      }}
    >
      {selected ? (
        <div style={{ fontSize: 72, transition: "transform 0.4s ease" }}>
          {animals.find((a) => a.type === selected)?.emoji}
        </div>
      ) : (
        <div style={{ fontSize: 36 }}>🐾</div>
      )}
    </div>
  </div>
</div>


);
}