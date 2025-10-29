const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api
";

// --------------------
// Core API Helpers
// --------------------
async function apiPost(path, body) {
const res = await fetch(${BASE}${path}, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(body),
});
if (!res.ok) throw new Error(await res.text());
return res.json();
}

async function apiGet(path) {
const res = await fetch(${BASE}${path});
if (!res.ok) throw new Error(await res.text());
return res.json();
}

// --------------------
// Mock Data + Helpers
// --------------------
const mockUser = {
id: 1,
name: "Alex",
personalityMode: "inspirational",
mood: "neutral",
diary: [],
habits: [],
};

const personalityModes = [
"inspirational",
"fun",
"playful",
"analytical",
"brutal",
"kind",
"patient",
];

const mockGroups = {
"storytelling": ["user123", "writerFox", "dreamerDaisy"],
"fitness": ["runnerJay", "mindfulMia"],
"productivity": ["focusLeo", "taskTiger"]
};

// Simulated AI responses
function generateAIFeedback(habit, trend, mode, mood) {
const toneMap = {
inspirational: "Keep pushing — your effort is paying off!",
fun: "Woohoo! You’re on fire 🔥 Keep that streak alive!",
playful: "Looks like your pet’s proud of you 🐾",
analytical: "Your trend shows strong consistency; consider incrementally raising your goals.",
brutal: "No excuses. Reset, refocus, and dominate tomorrow.",
kind: "Hey, don’t be hard on yourself. Every step counts ❤️",
patient: "Progress takes time — breathe and keep showing up.",
};

const emotionalShift =
mood === "sad"
? "You seem down today. Maybe take a break or write a quick reflection?"
: mood === "angry"
? "Strong emotions fuel action — channel that energy productively."
: "";

return ${toneMap[mode]} ${emotionalShift};
}

// --------------------
// Mock Feature APIs
// --------------------

// Fetch personality options
export async function getPersonalityModes() {
return { modes: personalityModes };
}

// Update user’s AI personality mode
export async function updatePersonalityMode(mode) {
if (!personalityModes.includes(mode)) throw new Error("Invalid personality mode");
mockUser.personalityMode = mode;
return { success: true, mode };
}

// Fetch AI feedback for habits
export async function getHabitFeedback(habitName, trend = "neutral", mood = "neutral") {
const feedback = generateAIFeedback(habitName, trend, mockUser.personalityMode, mood);
return { feedback };
}

// Join a habit accountability group
export async function joinHabitGroup(habitName) {
if (!mockGroups[habitName]) {
mockGroups[habitName] = [];
}
if (!mockGroups[habitName].includes(mockUser.name)) {
mockGroups[habitName].push(mockUser.name);
}
return { groupName: habitName, members: mockGroups[habitName] };
}

// Add or get diary entries (text or voice)
export async function addDiaryEntry(entry) {
const date = new Date().toISOString();
const analyzedMood = analyzeEmotion(entry);
mockUser.diary.push({ entry, date, analyzedMood });
mockUser.mood = analyzedMood;
return { success: true, analyzedMood, entry };
}

export async function getDiaryEntries() {
return { diary: mockUser.diary };
}

// Mock voice transcription (in real app, integrate Speech-to-Text API)
export async function transcribeVoice(audioBlob) {
return {
transcription:
"Transcribed text from voice note (mocked). In real app, integrate Whisper API or Web Speech.",
};
}

// Simple emotion analysis mock (basic keyword scan)
function analyzeEmotion(text) {
const t = text.toLowerCase();
if (t.includes("sad") || t.includes("tired") || t.includes("lonely")) return "sad";
if (t.includes("angry") || t.includes("frustrated")) return "angry";
if (t.includes("happy") || t.includes("excited") || t.includes("grateful")) return "happy";
return "neutral";
}

// Fetch user data
export async function getUserProfile() {
return mockUser;
}

// Reset user data (for debugging/demo)
export async function resetMockUser() {
mockUser.personalityMode = "inspirational";
mockUser.mood = "neutral";
mockUser.diary = [];
mockUser.habits = [];
return { success: true };
}

// Keep the original exports intact
export { apiPost, apiGet };
