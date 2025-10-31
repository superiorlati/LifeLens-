// frontend/src/utils/moodLogic.js
/**
 * moodLogic.js — central intelligence for emotional adaptation
 *
 * Features:
 * ✅ Analyzes journal or habit reflection text for mood/emotion
 * ✅ Returns normalized mood labels: calm, happy, sad, overwhelmed, inspired
 * ✅ Suggests tone adjustments (supportive, reflective, energetic) — no personas
 * ✅ Used by: JournalPanel, CoachPanel, Dashboard, SuggestionEngine
 *
 * Exported functions:
 *  - analyzeMood(text)
 *  - suggestToneAdjustment(mood)
 *  - getMoodColor(mood)
 *  - getMoodEmoji(mood)
 *  - getMoodMessage(mood)
 *  - interpretJournalEntry(entryText)
 */

//////////////////////////
// 🔹 Mood Analysis
//////////////////////////

export function analyzeMood(text = "") {
  if (!text.trim()) return "neutral";

  const lower = text.toLowerCase();

  const happyWords = [
    "grateful", "thankful", "excited", "joy", "love", "great", "happy", "optimistic", "hopeful"
  ];
  const sadWords = [
    "sad", "tired", "alone", "disappointed", "upset", "cry", "lost", "heartbroken"
  ];
  const stressedWords = [
    "overwhelmed", "anxious", "worried", "stressed", "panic", "pressure", "burnt", "busy"
  ];
  const calmWords = [
    "calm", "peaceful", "relaxed", "serene", "content"
  ];
  const inspiredWords = [
    "inspired", "creative", "determined", "motivated", "focused", "productive"
  ];
  const angryWords = [
    "angry", "frustrated", "furious", "irritated", "mad"
  ];

  const match = (words) => words.some((w) => lower.includes(w));

  if (match(happyWords) || match(inspiredWords)) return "happy";
  if (match(sadWords)) return "sad";
  if (match(stressedWords) || match(angryWords)) return "overwhelmed";
  if (match(calmWords)) return "calm";
  if (match(inspiredWords)) return "inspired";

  return "neutral";
}

//////////////////////////
// 🔹 Tone Adaptation (no personas)
//////////////////////////

export function suggestToneAdjustment(mood) {
  // Instead of persona switching, we give tone recommendations for the AI coach.
  const toneMap = {
    happy: { tone: "energetic", message: "Keep up the momentum! Let’s channel your good mood into small wins." },
    sad: { tone: "gentle", message: "You’re feeling low — let’s focus on kindness and one small step today." },
    overwhelmed: { tone: "supportive", message: "You might be under pressure. Let’s simplify things and start small." },
    calm: { tone: "reflective", message: "You’re calm and centered — a perfect mindset for focus or gratitude." },
    inspired: { tone: "motivational", message: "You’re inspired — let’s turn that spark into action." },
    neutral: { tone: "balanced", message: "You’re steady — we can go either way depending on your goals." },
  };

  return toneMap[mood] || toneMap["neutral"];
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
    neutral: "You’re steady and balanced today.",
    happy: "You seem upbeat! Let’s build on that energy.",
    sad: "You’re feeling low — take things slow and be gentle with yourself.",
    calm: "You’re at peace. This is a great time to focus or rest.",
    overwhelmed: "It sounds like you’re under pressure. Let’s take a deep breath and simplify your next step.",
    inspired: "You’re inspired! Let’s capture that spark and make progress.",
  };
  return messages[mood] || "How are you feeling today?";
}

//////////////////////////
// 🔹 Combined Analysis Utility
//////////////////////////

export function interpretJournalEntry(entryText = "") {
  const mood = analyzeMood(entryText);
  const toneSuggestion = suggestToneAdjustment(mood);
  const color = getMoodColor(mood);
  const emoji = getMoodEmoji(mood);
  const message = getMoodMessage(mood);

  return {
    mood,
    color,
    emoji,
    message,
    tone: toneSuggestion.tone,
    toneMessage: toneSuggestion.message,
  };
}

export default {
  analyzeMood,
  suggestToneAdjustment,
  getMoodColor,
  getMoodEmoji,
  getMoodMessage,
  interpretJournalEntry,
};
