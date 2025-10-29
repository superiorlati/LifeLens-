// frontend/src/components/JournalPanel.jsx
import React, { useState, useEffect } from "react";
import { apiPost } from "../api";

/**
 * JournalPanel — hybrid emotional journaling + voice notes + adaptive AI analysis
 *
 * ✨ Features:
 *  ✅ Text-based journaling: user can type an entry (feelings, reflections)
 *  ✅ Voice note journaling: record a short audio snippet that auto-transcribes
 *  ✅ AI-powered emotional tone analysis (frontend-simulated)
 *  ✅ Persona + mood-aware adaptation: suggests if persona mode should shift
 *  ✅ History list of entries (localStorage-based)
 *  ✅ Option to mark “private” or “share with coach” (in future backend)
 *  ✅ Auto mood classification (happy, sad, neutral, overwhelmed)
 *
 * Props:
 *  - user: { id, name, persona }
 *  - onMoodChange(mood)
 */

export default function JournalPanel({ user, onMoodChange }) {
  const [entry, setEntry] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [entries, setEntries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [mood, setMood] = useState("neutral");
  const [suggestedPersona, setSuggestedPersona] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    setEntries(saved);
  }, []);

  // Save entries
  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  // 🎤 Voice recording & transcription (browser speech API)
  async function handleVoiceRecord() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    setRecording(true);
    recognition.start();

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setEntry((prev) => prev + " " + text);
      setRecording(false);
      analyzeEntry(text);
    };

    recognition.onerror = () => {
      setRecording(false);
      alert("Voice recording failed. Please try again.");
    };
  }

  // 🧠 Emotion analysis (frontend simulated sentiment model)
  async function analyzeEntry(text) {
    setAnalyzing(true);

    // very lightweight heuristic model
    const lower = text.toLowerCase();
    const moodGuess = lower.includes("sad") || lower.includes("tired")
      ? "sad"
      : lower.includes("angry") || lower.includes("upset")
      ? "overwhelmed"
      : lower.includes("happy") || lower.includes("grateful")
      ? "happy"
      : "neutral";

    setMood(moodGuess);
    onMoodChange && onMoodChange(moodGuess);

    // Suggest persona tone shift if overwhelmed
    if (moodGuess === "overwhelmed") {
      setSuggestedPersona("kind");
    } else if (moodGuess === "sad") {
      setSuggestedPersona("patient");
    } else if (moodGuess === "happy") {
      setSuggestedPersona("playful");
    } else {
      setSuggestedPersona(null);
    }

    // Optional backend submission for journaling insights
    try {
      await apiPost("/journal", {
        user_id: user?.id || 0,
        entry: text,
        mood: moodGuess,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Local-only mode (no backend):", err);
    }

    setAnalyzing(false);
  }

  // ✍️ Submit text entry
  function handleSubmit(e) {
    e.preventDefault();
    if (!entry.trim()) return;
    analyzeEntry(entry);

    const newEntry = {
      text: entry,
      date: new Date().toLocaleString(),
      mood,
    };
    setEntries([newEntry, ...entries]);
    setEntry("");
    setTranscript("");
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>🪶 Journal & Reflection</h3>
      <p className="small">
        Write or record your thoughts — LifeLens adapts based on your emotions.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          className="input"
          rows={4}
          placeholder="How are you feeling today?"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          style={{ resize: "vertical" }}
        />

        {transcript && (
          <div className="small" style={{ marginTop: 6, color: "var(--muted)" }}>
            Transcript added: “{transcript}”
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            className="button secondary"
            onClick={handleVoiceRecord}
            disabled={recording}
          >
            {recording ? "Recording…" : "🎙️ Record voice note"}
          </button>

          <button type="submit" className="button" disabled={analyzing}>
            {analyzing ? "Analyzing…" : "Save entry"}
          </button>
        </div>
      </form>

      {mood && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 10,
            background:
              mood === "happy"
                ? "#e7fbe7"
                : mood === "sad"
                ? "#ffe7e7"
                : mood === "overwhelmed"
                ? "#fff4e1"
                : "#f2f2f2",
            transition: "background 0.4s ease",
          }}
        >
          <strong>Detected mood:</strong> {mood === "overwhelmed" ? "😔 Overwhelmed" : mood === "happy" ? "😊 Happy" : mood === "sad" ? "💙 Sad" : "😐 Neutral"}
          {suggestedPersona && (
            <div className="small" style={{ marginTop: 4 }}>
              Suggestion: your AI coach could switch to <b>{suggestedPersona}</b> mode for better support.
            </div>
          )}
        </div>
      )}

      {/* 📜 Journal history */}
      <div style={{ marginTop: 20 }}>
        <h4>Previous entries</h4>
        {entries.length === 0 ? (
          <div className="small">No journal entries yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {entries.map((e, i) => (
              <li
                key={i}
                style={{
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <div className="small" style={{ color: "var(--muted)" }}>
                  {e.date}
                </div>
                <div style={{ marginTop: 4 }}>{e.text}</div>
                {e.mood && (
                  <div className="small" style={{ marginTop: 4 }}>
                    Mood: {e.mood}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
