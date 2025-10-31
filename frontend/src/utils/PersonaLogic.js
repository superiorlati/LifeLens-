// frontend/src/utils/personaLogic.js
/**
 * Formerly personaLogic.js — repurposed for habit-aware logic.
 *
 * Exports:
 *  - analyzeHabitText(habitName) -> { verb, tags }
 *  - breakDownHabit(habitName, difficultyHint = 'auto') -> [step1, step2, ...]
 *  - generateNudge(habitName, probability) -> string
 *  - defaultMicroAction(habitName) -> string
 *
 * This module intentionally keeps the old module name to avoid refactors
 * in components that import 'personaLogic', but all functions now focus on
 * habit-text analysis and micro-step generation (no personas).
 */

const VERB_KEYWORDS = {
  write: ["write", "journal", "blog", "song", "compose", "draft", "outline"],
  cook: ["cook", "bake", "meal", "dinner", "lunch", "recipe", "prepare"],
  exercise: ["run", "walk", "exercise", "workout", "yoga", "pushup", "squat"],
  read: ["read", "book", "article", "chapter"],
  study: ["study", "learn", "practice", "review", "memorize"],
  meditate: ["meditate", "mindfulness", "breath", "sit quietly"],
  clean: ["clean", "tidy", "organize", "declutter"],
  practice: ["practice", "rehearse", "drill", "repeat"],
  draw: ["draw", "sketch", "paint", "illustrate"]
};

/**
 * Lower-level helpers
 */
function safeLower(s) {
  return (s || "").toString().toLowerCase();
}

function pickVerbFromText(text) {
  const lower = safeLower(text);
  for (const [verb, keywords] of Object.entries(VERB_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return verb;
    }
  }
  // fallback: try to extract first verb-like token (very naive)
  const tokens = lower.split(/\s+/).filter(Boolean);
  if (tokens.length > 0) return tokens[0];
  return "do";
}

function detectTags(text) {
  const lower = safeLower(text);
  const tags = new Set();
  for (const [verb, keywords] of Object.entries(VERB_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        tags.add(verb);
        break;
      }
    }
  }
  // quick checks for time/creative/physical
  if (/\b(minute|minutes|hr|hour|second|sec)\b/.test(lower)) tags.add("time-bound");
  if (/\b(recipe|ingredient|cook|bake)\b/.test(lower)) tags.add("practical");
  if (/\b(song|compose|write|poem|story)\b/.test(lower)) tags.add("creative");
  if (/\b(run|walk|workout|yoga|pushup|squat)\b/.test(lower)) tags.add("physical");
  if (tags.size === 0) tags.add("general");
  return Array.from(tags);
}

/**
 * Public: analyzeHabitText
 * Returns an object with a guessed verb and tags inferred from the habit text.
 */
export function analyzeHabitText(habitName) {
  const verb = pickVerbFromText(habitName);
  const tags = detectTags(habitName);
  return { verb, tags };
}

/**
 * Public: defaultMicroAction
 * Returns a tiny, safe-to-run micro action suggestion for a habit string.
 */
export function defaultMicroAction(habitName) {
  const hn = (habitName || "").trim();
  if (!hn) return "Pick one smallest step for this habit and do it for 5 minutes.";
  return `Do the smallest possible version of "${hn}" for 5 minutes.`;
}

/**
 * Public: breakDownHabit
 *
 * Returns an array of 2-4 bite-sized steps to help start/complete the habit.
 * difficultyHint can be 'easy' | 'medium' | 'hard' | 'auto' (default: 'auto').
 *
 * This is intentionally heuristic and deterministic (no network requests).
 * Keep steps short, actionable, and sequenced (prep -> small action -> follow-up).
 */
export function breakDownHabit(habitName, difficultyHint = "auto") {
  const { verb, tags } = analyzeHabitText(habitName);
  const lower = safeLower(habitName);
  const steps = [];

  // helper to push unique steps
  function pushStep(s) {
    const txt = s && s.trim();
    if (txt && !steps.includes(txt)) steps.push(txt);
  }

  // common small starters
  if (/write|journal|song|compose|draft|outline/.test(lower)) {
    pushStep("Open a blank document or notes app and set a 5-minute timer.");
    pushStep("Write the very first sentence or a short prompt — ignore quality.");
    pushStep("Refine one small paragraph or note one idea to expand later.");
  } else if (/cook|bake|meal|recipe|prepare|ingredient/.test(lower)) {
    pushStep("Decide on one simple recipe you can finish with 3–5 ingredients.");
    pushStep("Gather the ingredients and put them on the counter.");
    pushStep("Start with a single prep step (e.g., chop one vegetable) for 5 minutes.");
    pushStep("Cook following the first instruction of the recipe — focus on one step.");
  } else if (/run|walk|exercise|workout|yoga|stretch/.test(lower)) {
    pushStep("Put on workout clothes and shoes to remove friction.");
    pushStep("Do a 2-minute warm-up or stretch to activate your body.");
    pushStep("Complete a 5–10 minute movement (walk, short routine, or 1 set).");
  } else if (/read|book|chapter|article/.test(lower)) {
    pushStep("Open the book or article and set a 10-minute timer.");
    pushStep("Read one paragraph or a single page.");
    pushStep("Write down one takeaway or quote to anchor the session.");
  } else if (/study|learn|practice|review|memorize/.test(lower)) {
    pushStep("Pick a single micro-topic (one concept or problem).");
    pushStep("Set a focused 10-minute study timer and remove distractions.");
    pushStep("Summarize what you learned in one sentence or solve one problem.");
  } else if (/clean|tidy|organize|declutter/.test(lower)) {
    pushStep("Choose one small area (desk corner, one shelf, or one drawer).");
    pushStep("Set a 10-minute timer and clear only that area.");
    pushStep("Put items back in their place and take one photo of the result.");
  } else if (/meditat|mindful|breath/.test(lower)) {
    pushStep("Find a comfortable seat and set a 3–5 minute timer.");
    pushStep("Focus on breathing — count breaths or follow a short guide.");
    pushStep("Notice one small bodily sensation and release judgment.");
  } else {
    // Generic fallback breakdown
    pushStep(defaultMicroAction(habitName));
    pushStep(`Identify one tiny next step for "${habitName}" and do it now for 5 minutes.`);
  }

  // Trim down to 2-4 steps in order
  if (steps.length > 4) {
    return steps.slice(0, 4);
  } else if (steps.length === 0) {
    return [defaultMicroAction(habitName)];
  }
  return steps;
}

/**
 * Public: generateNudge
 *
 * Creates a short adaptive nudge message given a habit name and a probability value.
 * Probability expected in 0..1. Tone varies:
 *  - p > 0.75: encouraging + sustain momentum
 *  - 0.45 < p <= 0.75: supportive + small action
 *  - p <= 0.45: low-friction micro-action
 */
export function generateNudge(habitName, probability = 0.5) {
  const p = Number.isFinite(probability) ? Math.max(0, Math.min(1, probability)) : 0.5;
  if (p > 0.75) {
    return `You're in a great rhythm — keep going with "${habitName}". Try the next short step to sustain momentum.`;
  }
  if (p > 0.45) {
    const steps = breakDownHabit(habitName, "medium");
    return `Good progress — try this: ${steps[0] || defaultMicroAction(habitName)}`;
  }
  // low probability => very small step + explicit micro-action
  const stepsLow = breakDownHabit(habitName, "easy");
  return `Let's make this easy: ${stepsLow[0] || defaultMicroAction(habitName)}`;
}

/**
 * Default export (for compatibility) exposes the same functions as named exports.
 */
export default {
  analyzeHabitText,
  breakDownHabit,
  generateNudge,
  defaultMicroAction
};
