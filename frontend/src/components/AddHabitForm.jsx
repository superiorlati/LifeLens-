// frontend/src/components/AddHabitForm.jsx
import React, { useState, useEffect } from "react";
import { addHabit, getHabits, getHabitFeedback } from "../api";

export default function AddHabitForm() {
  const [habitName, setHabitName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [habits, setHabits] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  // Load habits on mount
  useEffect(() => {
    refreshHabits();
  }, []);

  async function refreshHabits() {
    try {
      const data = await getHabits();
      setHabits(data.habits || []);
    } catch (err) {
      console.error("Failed to load habits:", err);
      setError("Failed to load habits.");
    }
  }

  async function handleAddHabit(e) {
    e.preventDefault();
    setError("");
    setFeedback("");

    if (!habitName.trim()) {
      setError("Please enter a habit name.");
      return;
    }

    try {
      const res = await addHabit(habitName.trim(), frequency);
      if (res.success) {
        setHabitName("");
        await refreshHabits();

        // AI feedback from personality mode & mood
        const fb = await getHabitFeedback(habitName);
        setFeedback(fb.feedback || "Habit added!");
      } else {
        setError("Could not add habit.");
      }
    } catch (err) {
      console.error("Add habit error:", err);
      setError("Error adding habit.");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Add a New Habit</h2>

      <form onSubmit={handleAddHabit} style={styles.form}>
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="Enter habit name..."
          style={styles.input}
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={styles.select}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>
        <button type="submit" style={styles.button}>
          Add Habit
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
      {feedback && <p style={styles.feedback}>{feedback}</p>}

      <div style={styles.listContainer}>
        <h3>Your Habits</h3>
        {habits.length === 0 ? (
          <p>No habits added yet.</p>
        ) : (
          <ul style={styles.list}>
            {habits.map((habit) => (
              <li key={habit.id} style={styles.item}>
                <strong>{habit.name}</strong> — {habit.frequency}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "2rem auto",
    padding: "1rem",
    border: "1px solid #ccc",
    borderRadius: "12px",
    backgroundColor: "#fafafa",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
  },
  input: {
    flex: "1",
    padding: "0.5rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  select: {
    padding: "0.5rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "0.5rem 1rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
  feedback: {
    color: "green",
    marginTop: "0.5rem",
  },
  listContainer: {
    marginTop: "1.5rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  item: {
    background: "#fff",
    borderRadius: "8px",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
};
