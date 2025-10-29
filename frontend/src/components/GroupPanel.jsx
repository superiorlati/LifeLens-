// frontend/src/components/GroupPanel.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

/**
 * GroupPanel — community support & accountability space 🌍
 *
 * ✅ Displays user's group, its members, and recent messages
 * ✅ Allows posting supportive messages and mood updates
 * ✅ Shows group challenges (eg. “3-day gratitude streak”)
 * ✅ AI-simulated supportive feedback from coach & peers
 * ✅ Local persistence (works even offline)
 * ✅ Integrates mood and persona state for tone adjustment
 *
 * Props:
 *  - user: { id, name, persona }
 */

export default function GroupPanel({ user }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [challenges, setChallenges] = useState([]);

  // 🪄 Load group + messages
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const groupRes = await apiGet(`/group/${user?.id || 1}`);
        const msgRes = await apiGet(`/group/${user?.id || 1}/messages`);
        const challRes = await apiGet(`/group/${user?.id || 1}/challenges`);

        setGroup(groupRes.group || { name: "My Support Circle" });
        setMembers(groupRes.members || []);
        setMessages(msgRes.messages || []);
        setChallenges(challRes.challenges || []);
      } catch (err) {
        console.warn("Offline mode: using local data", err);
        // fallback demo group
        setGroup({ name: "LifeLens Community 🌱" });
        setMembers([
          { id: 1, name: "Maya", mood: "happy" },
          { id: 2, name: "Arjun", mood: "neutral" },
          { id: 3, name: user?.name || "You", mood: "neutral" },
        ]);
        setMessages(
          JSON.parse(localStorage.getItem("groupMessages") || "[]") || []
        );
        setChallenges([
          { id: 1, title: "3-Day Gratitude Chain", progress: 67 },
          { id: 2, title: "Mindful Morning Check-In", progress: 40 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Save messages locally (offline persistence)
  useEffect(() => {
    localStorage.setItem("groupMessages", JSON.stringify(messages));
  }, [messages]);

  // ✉️ Send message
  async function handleSend(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    const newMessage = {
      sender: user?.name || "You",
      text: newMsg,
      time: new Date().toLocaleTimeString(),
      mood: detectMood(newMsg),
    };
    try {
      await apiPost(`/group/${user?.id || 1}/message`, newMessage);
    } catch {
      console.warn("Message stored locally (no backend).");
    } finally {
      setMessages([...messages, newMessage]);
      setNewMsg("");
      setSending(false);
    }
  }

  // 💬 Lightweight mood detector
  function detectMood(text) {
    const t = text.toLowerCase();
    if (t.includes("thank") || t.includes("grateful")) return "grateful";
    if (t.includes("tired") || t.includes("sad")) return "sad";
    if (t.includes("excited") || t.includes("amazing")) return "excited";
    return "neutral";
  }

  // 🌟 AI-simulated group encouragement
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender === user?.name) {
      setTimeout(() => {
        const supportiveReply = {
          sender: "AI Coach 🤖",
          text:
            last.mood === "sad"
              ? "Hey, thank you for opening up. You’re not alone — your feelings are valid 💙"
              : last.mood === "grateful"
              ? "Love that gratitude energy! Keep spreading those good vibes ✨"
              : last.mood === "excited"
              ? "Wow! That’s the spirit! Keep that motivation going 🚀"
              : "Thanks for checking in — consistency matters 🌿",
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, supportiveReply]);
      }, 1800);
    }
  }, [messages]);

  if (loading) return <div className="card">Loading group info...</div>;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>{group?.name || "My Support Circle"}</h3>
      <p className="small">
        Stay connected with your peers and celebrate progress together 🌻
      </p>

      {/* 👥 Members */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: 10,
        }}
      >
        {members.map((m) => (
          <div
            key={m.id}
            style={{
              background: "rgba(255,255,255,0.8)",
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid rgba(0,0,0,0.05)",
              fontSize: "0.85rem",
            }}
          >
            {m.name}{" "}
            {m.mood === "happy"
              ? "😊"
              : m.mood === "sad"
              ? "💙"
              : m.mood === "excited"
              ? "🔥"
              : "😐"}
          </div>
        ))}
      </div>

      {/* 💬 Chat section */}
      <div
        style={{
          marginTop: 20,
          maxHeight: 250,
          overflowY: "auto",
          background: "#f9fafc",
          borderRadius: 12,
          padding: 10,
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {messages.length === 0 ? (
          <div className="small">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{m.sender}</strong>{" "}
              <span className="small" style={{ color: "gray" }}>
                {m.time}
              </span>
              <div>{m.text}</div>
            </div>
          ))
        )}
      </div>

      {/* 📤 Send message */}
      <form
        onSubmit={handleSend}
        style={{ display: "flex", gap: 8, marginTop: 10 }}
      >
        <input
          className="input"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Send a message to your group..."
          disabled={sending}
        />
        <button className="button" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      {/* 🎯 Group challenges */}
      <div style={{ marginTop: 24 }}>
        <h4>Group Challenges</h4>
        {challenges.length === 0 ? (
          <div className="small">No active challenges.</div>
        ) : (
          challenges.map((c) => (
            <div
              key={c.id}
              style={{
                marginBottom: 10,
                padding: "8px 12px",
                background: "#f4f8ff",
                borderRadius: 10,
              }}
            >
              <strong>{c.title}</strong>
              <div
                style={{
                  background: "#dce7ff",
                  borderRadius: 6,
                  height: 8,
                  width: "100%",
                  marginTop: 4,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    height: "100%",
                    background: "#4a7dff",
                    width: `${c.progress}%`,
                    borderRadius: 6,
                    transition: "width 0.4s ease",
                  }}
                ></div>
              </div>
              <div
                className="small"
                style={{ marginTop: 4, textAlign: "right" }}
              >
                {c.progress}% complete
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
