// frontend/src/utils/moodLogic.js

/**
 * moodLogic.js — central intelligence for emotion & persona adaptation
 *
 * Features:
 * ✅ Analyzes journal text or voice transcript for mood/emotion
 * ✅ Returns normalized mood labels: calm, happy, sad, overwhelmed, grateful, inspired
 * ✅ Suggests persona tone adjustments based on user emotional state
 * ✅ Supports “auto-suggest mode switch” for emotional adaptation
 * ✅ Used by: JournalPanel, CoachPanel, PersonaBadge, Dashboard
 *
 * Exported functions:
 *  - analyzeMood(text)
 *  - suggestPersonaSwitch(mood, currentPersona)
 *  - getMoodColor(mood)
 *  - getMoodEmoji(mood)
 *  - getMoodMessage(mood)
 */

//////////////////////////
// 🔹 Mood Analysis
//////////////////////////

export function analyzeMood(text = "") {
  if (!text.trim()) return "neutral";

  const lower = text.toLowerCase();

  // keyword categories
  const happyWords = ["grateful", "thankful", "excited", "joy", "love", "great", "happy", "optimistic", "hopeful"];
  const sadWords = ["sad", "tired", "alone", "disappointed", "upset", "cry", "lost", "heartbroken"];
  const stressedWords = ["overwhelmed", "anxious", "worried", "stressed", "panic", "pressure", "burnt"];
  const calmWords = ["calm", "peaceful", "relaxed", "serene", "content"];
  const inspiredWords = ["inspired", "creative", "determined", "motivated", "focused"];
  const angryWords = ["angry", "frustrated", "furious", "irritated", "mad"];

  // basic sentiment scoring
  const score = {
    happy: happyWords.some(w => lower.includes(w)),
    sad: sadWords.some(w => lower.includes(w)),
    stressed: stressedWords.some(w => lower.includes(w)),
    calm: calmWords.some(w => lower.includes(w)),
    inspired: inspiredWords.some(w => lower.includes(w)),
    angry: angryWords.some(w => lower.includes(w)),
  };

  if (score.happy || score.inspired) return "happy";
  if (score.sad) return "sad";
  if (score.stressed || score.angry) return "overwhelmed";
  if (score.calm) return "calm";
  if (score.inspired) return "inspired";

  return "neutral";
}

//////////////////////////
// 🔹 Persona Auto-Suggestion
//////////////////////////

export function suggestPersonaSwitch(mood, currentPersona) {
  // Suggest switching tone based on emotional distress
  const emotionalMap = {
    overwhelmed: ["kind", "patient", "supporter"],
    sad: ["kind", "inspirational"],
    angry: ["reflector", "analytical"],
    calm: ["analytical", "neutral"],
    happy: ["playful", "fun"],
    inspired: ["inspirational", "motivator"],
  };

  const recommended = emotionalMap[mood] || [];
  const shouldSuggestSwitch =
    (mood === "overwhelmed" || mood === "sad") &&
    !recommended.includes(currentPersona);

  return {
    shouldSuggestSwitch,
    recommended,
    message: shouldSuggestSwitch
      ? `You seem ${mood} — would you like your AI coach to switch to a more ${recommended[0]} and ${recommended[1] || "soothing"} tone?`
      : "",
  };
}

//////////////////////////
// 🔹 UI Helpers
//////////////////////////

export function getMoodColor(mood = "neutral") {
  const colors = {
    neutral: "#f3f4f6",
    happy: "#fef3c7",
    sad: "#fee2e2",
    calm: "#e0f2fe",
    overwhelmed: "#fecaca",
    grateful: "#dcfce7",
    inspired: "#f3e8ff",
  };
  return colors[mood] || colors["neutral"];
}

export function getMoodEmoji(mood = "neutral") {
  const emojis = {
    neutral: "😐",
    happy: "😊",
    sad: "😢",
    calm: "🧘",
    overwhelmed: "😫",
    grateful: "🙏",
    inspired: "💡",
  };
  return emojis[mood] || "🙂";
}

export function getMoodMessage(mood = "neutral") {
  const messages = {
    neutral: "You're steady and balanced today.",
    happy: "You seem upbeat! Keep that energy flowing.",
    sad: "You're feeling low — take things slow and be gentle with yourself.",
    calm: "You're at peace. This is a great time to focus or rest.",
    overwhelmed: "It sounds like you're under pressure. Let’s take a deep breath together.",
    grateful: "You're grateful — that's a powerful mindset!",
    inspired: "You're inspired! Capture that spark before it fades.",
  };
  return messages[mood] || "How are you feeling today?";
}

//////////////////////////
// 🔹 Combined Analysis Utility
//////////////////////////

export function interpretJournalEntry(entryText = "", currentPersona = "neutral") {
  const mood = analyzeMood(entryText);
  const suggestion = suggestPersonaSwitch(mood, currentPersona);
  const color = getMoodColor(mood);
  const emoji = getMoodEmoji(mood);
  const message = getMoodMessage(mood);

  return {
    mood,
    color,
    emoji,
    message,
    ...suggestion,
  };
}
