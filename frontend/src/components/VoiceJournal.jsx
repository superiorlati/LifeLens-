// frontend/src/components/VoiceJournal.jsx
import React, { useEffect, useRef, useState } from "react";
import { apiPost, transcribeVoice } from "../api";

/**
 * VoiceJournal.jsx
 *
 * Voice-first journaling component that:
 *  - Records short voice notes via MediaRecorder (preferred)
 *  - Falls back to Web Speech API (SpeechRecognition) for direct transcription if available
 *  - Calls transcribeVoice(blob) if provided by the api layer (mock or real backend)
 *  - Performs lightweight mood analysis and suggests persona changes
 *  - Persists journal entries to localStorage and optionally posts to backend (/journal)
 *
 * Props:
 *  - user: { id, name, persona } (optional)
 *  - onMoodDetected(mood) optional callback to bubble mood up
 *  - onEntrySaved(entry) optional callback after saving entry
 *
 * Notes:
 *  - Keeps UX simple: Start / Stop recording, shows live state, transcript,
 *    allow edit/add notes, save to journal.
 *  - Uses small heuristics for mood detection (same family as JournalPanel).
 */

export default function VoiceJournal({ user, onMoodDetected, onEntrySaved }) {
  const [recording, setRecording] = useState(false);
  const [mediaSupported, setMediaSupported] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [entries, setEntries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [mood, setMood] = useState("neutral");
  const [suggestedPersona, setSuggestedPersona] = useState(null);
  const [error, setError] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);

  // Media recorder refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // load entries from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("voiceJournalEntries") || "[]");
    setEntries(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("voiceJournalEntries", JSON.stringify(entries));
  }, [entries]);

  // detect runtime support
  useEffect(() => {
    setMediaSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder));
  }, []);

  // small mood detector (same heuristic family as JournalPanel)
  function detectMood(text) {
    if (!text) return "neutral";
    const t = text.toLowerCase();
    if (t.includes("sad") || t.includes("tired") || t.includes("lonely")) return "sad";
    if (t.includes("angry") || t.includes("frustrated") || t.includes("upset")) return "overwhelmed";
    if (t.includes("happy") || t.includes("grateful") || t.includes("great") || t.includes("joy")) return "happy";
    if (t.includes("excited") || t.includes("amazing") || t.includes("stoked")) return "excited";
    return "neutral";
  }

  // persona suggestion heuristics
  function suggestPersonaForMood(m) {
    if (m === "overwhelmed") return "kind";
    if (m === "sad") return "patient";
    if (m === "happy" || m === "excited") return "playful";
    return null;
  }

  // start MediaRecorder-based recording
  async function startRecording() {
    setError(null);

    // prefer MediaRecorder if available
    if (mediaSupported) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunksRef.current = [];
        const options = {}; // allow browser to pick codec
        const mr = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mr;

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        mr.onstop = async () => {
          // create blob+url
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          try {
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
          } catch (err) {
            console.warn("Could not create audio url", err);
          }

          // attempt transcription via api.transcribeVoice if available
          await transcribeAndAnalyze(blob);
        };

        mr.start();
        setRecording(true);
        setRecordTime(0);
        timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
      } catch (err) {
        console.error("startRecording error", err);
        setError("Microphone access denied or not available.");
      }
      return;
    }

    // fallback: Web Speech API live recognition (no audio blob produced)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.onresult = (e) => {
          const text = e.results[0][0].transcript;
          setTranscript((prev) => (prev ? prev + " " + text : text));
          analyzeAndSetMood(text);
        };
        recognition.onerror = (e) => {
          console.error("SpeechRecognition error", e);
          setError("Speech recognition error.");
        };
        recognition.onend = () => {
          setRecording(false);
          clearInterval(timerRef.current);
        };

        recognition.start();
        setRecording(true);
        setRecordTime(0);
        timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
        // store recognition instance so we can stop later
        mediaRecorderRef.current = recognition;
      } catch (err) {
        console.error("SpeechRecognition start failed", err);
        setError("Speech recognition not available.");
      }
      return;
    }

    setError("No audio recording or speech recognition available in this browser.");
  }

  // stop recording
  function stopRecording() {
    // stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recording) return;

    if (mediaSupported && mediaRecorderRef.current instanceof MediaRecorder) {
      try {
        mediaRecorderRef.current.stop();
        // stop tracks
        const tracks = mediaRecorderRef.current.stream && mediaRecorderRef.current.stream.getTracks();
        if (tracks && tracks.length) {
          tracks.forEach((t) => t.stop());
        }
      } catch (err) {
        console.warn("stopRecording error", err);
      } finally {
        setRecording(false);
      }
      return;
    }

    // if using SpeechRecognition fallback
    if (mediaRecorderRef.current && typeof mediaRecorderRef.current.stop === "function") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop SpeechRecognition", err);
      } finally {
        setRecording(false);
      }
      return;
    }

    setRecording(false);
  }

  // Transcribe blob (calls api.transcribeVoice if exists), then analyze mood
  async function transcribeAndAnalyze(blob) {
    setAnalyzing(true);
    try {
      // Attempt to call transcribeVoice helper (api layer): may be mocked
      if (typeof transcribeVoice === "function") {
        try {
          const res = await transcribeVoice(blob);
          const text = res?.transcription || res?.transcript || "";
          if (text) setTranscript((prev) => (prev ? prev + " " + text : text));
          analyzeAndSetMood(text);
        } catch (err) {
          console.warn("transcribeVoice failed, falling back to silent transcript", err);
          // no transcript available — do nothing else
        }
      } else {
        // no transcribe API, try client-side nothing more
        console.warn("transcribeVoice not provided by api layer.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  // analyze text for mood and set suggestions
  function analyzeAndSetMood(text) {
    const m = detectMood(text || transcript || "");
    setMood(m);
    onMoodDetected && onMoodDetected(m);
    const suggested = suggestPersonaForMood(m);
    setSuggestedPersona(suggested);
  }

  // Save the current audio+transcript as a journal entry
  async function saveEntry({ privateEntry = true } = {}) {
    // build entry object
    const entry = {
      id: Date.now(),
      user_id: user?.id || null,
      audio_url: audioUrl || null,
      // we don't persist the blob itself to localStorage, only the audioUrl (objectURL) and transcript.
      transcript: transcript || "",
      mood,
      suggested_persona: suggestedPersona,
      private: !!privateEntry,
      timestamp: new Date().toISOString(),
    };

    // persist locally
    setEntries((prev) => [entry, ...prev]);
    onEntrySaved && onEntrySaved(entry);

    // optionally send to backend
    try {
      // If audio blob exists, attempt to POST a FormData (works with mock/backends that accept files)
      if (audioBlob) {
        const fd = new FormData();
        fd.append("user_id", user?.id || "");
        fd.append("timestamp", entry.timestamp);
        fd.append("mood", mood);
        fd.append("private", entry.private ? "1" : "0");
        fd.append("transcript", entry.transcript || "");
        fd.append("file", audioBlob, `voice_${entry.id}.webm`);
        // apiPost expects JSON in many versions — try sending directly via fetch to /journal if needed.
        // We attempt apiPost("/journal") first; if it fails, try a direct fetch with FormData.
        try {
          await apiPost("/journal", {
            user_id: user?.id || 0,
            entry: entry.transcript,
            mood: mood,
            timestamp: entry.timestamp,
            private: entry.private,
          });
        } catch (err) {
          // fallback to direct FormData POST (some backends accept multipart)
          try {
            await fetch("/api/journal", {
              method: "POST",
              body: fd,
            });
          } catch (err2) {
            console.warn("Backend journal upload failed (fallback), continuing locally.", err2);
          }
        }
      } else {
        // no blob — send transcript only
        await apiPost("/journal", {
          user_id: user?.id || 0,
          entry: entry.transcript,
          mood: mood,
          timestamp: entry.timestamp,
          private: entry.private,
        });
      }
    } catch (err) {
      console.warn("Could not send journal to backend — saved locally.", err);
    }

    // clear UI state after save (keep transcript in history)
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setSuggestedPersona(null);
    setMood("neutral");
  }

  // delete single entry (UI only)
  function deleteEntry(id) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
  }

  // render timer as mm:ss
  function renderTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>🎤 Voice Journal</h3>
      <div className="small">Record a short voice note — LifeLens will transcribe and analyze mood.</div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          className="button"
          onClick={() => (recording ? stopRecording() : startRecording())}
          aria-pressed={recording}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? "Stop" : "Record"} {recording && `• ${renderTime(recordTime)}`}
        </button>

        <button
          className="button ghost"
          onClick={() => {
            // quick play if available
            if (audioUrl) {
              const a = new Audio(audioUrl);
              a.play().catch(() => {});
            } else if (transcript) {
              alert("No audio to play — transcript available.");
            } else {
              alert("No audio recorded yet.");
            }
          }}
        >
          Play
        </button>

        <button
          className="button secondary"
          onClick={() => {
            // clear / reset
            if (recording) stopRecording();
            setAudioBlob(null);
            setAudioUrl(null);
            setTranscript("");
            setMood("neutral");
            setSuggestedPersona(null);
          }}
        >
          Reset
        </button>
      </div>

      {error && <div className="small" style={{ color: "var(--danger)", marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <label className="small">Transcript / Notes</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Transcript will appear here — you can edit before saving..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <div className="small">Detected mood: <strong>{mood}</strong></div>
        {suggestedPersona && <div className="small" style={{ marginLeft: 8 }}>Suggested persona: <strong>{suggestedPersona}</strong></div>}
        {analyzing && <div className="small" style={{ marginLeft: 8 }}>Analyzing…</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="button"
          onClick={() => {
            // perform local analysis before save if transcript changed
            analyzeAndSetMood(transcript);
            saveEntry({ privateEntry: true });
          }}
        >
          Save (private)
        </button>

        <button
          className="button ghost"
          style={{ marginLeft: 8 }}
          onClick={() => {
            analyzeAndSetMood(transcript);
            saveEntry({ privateEntry: false });
          }}
        >
          Save & Share with Coach
        </button>
      </div>

      {/* history */}
      <div style={{ marginTop: 18 }}>
        <h4>Recent voice entries</h4>
        {entries.length === 0 ? (
          <div className="small">No entries yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {entries.map((e) => (
              <li key={e.id} style={{ marginBottom: 8, borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="small" style={{ color: "var(--muted)" }}>{new Date(e.timestamp).toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {e.audio_url && (
                      <button className="button ghost" onClick={() => {
                        try {
                          const a = new Audio(e.audio_url);
                          a.play();
                        } catch {
                          alert("Can't play audio (object URL may be expired).");
                        }
                      }}>
                        ▶️ Play
                      </button>
                    )}
                    <button className="button ghost" onClick={() => { navigator.clipboard?.writeText(e.transcript || ""); alert("Transcript copied to clipboard"); }}>
                      Copy
                    </button>
                    <button className="button" onClick={() => deleteEntry(e.id)}>Delete</button>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>{e.transcript || <span className="small">No transcript</span>}</div>
                <div className="small" style={{ marginTop: 6 }}>Mood: <strong>{e.mood}</strong></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
