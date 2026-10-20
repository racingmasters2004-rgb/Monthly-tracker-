/**
 * Motivational Quote Generator
 * Word-bank engine from the original Monthly Planner prototype (~13,600 unique combinations).
 * Changes locally on every refresh, requires zero external APIs.
 */

const QUOTE_SUBJECTS = [
  "Discipline", "Consistency", "Patience", "Focus", "Hard work", "Small steps",
  "Every rupee saved", "Every hour invested", "Clarity", "Courage", "Persistence",
  "Good habits", "Momentum", "Ambition", "Gratitude", "Preparation", "Self-control",
  "Deep work", "Daily effort", "A clear plan", "Steady progress", "Sacrifice today",
  "Showing up daily", "Learning fast", "Staying patient", "Taking action"
];

const QUOTE_VERBS = [
  "builds", "creates", "compounds into", "turns into", "shapes", "fuels",
  "protects", "multiplies", "secures", "unlocks", "quietly becomes", "eventually becomes"
];

const QUOTE_OUTCOMES = [
  "wealth", "freedom", "success", "a better future", "financial peace",
  "unstoppable momentum", "the life you want", "real progress", "lasting change",
  "opportunity", "independence", "confidence", "mastery", "a legacy worth building"
];

const QUOTE_UNITS = [
  "day", "habit", "decision", "hour", "rupee", "task", "small win", "honest effort"
];

const QUOTE_EFFORTS = [
  "discipline", "hustle", "focus", "sacrifice", "patience", "consistency", "grind", "effort"
];

function _cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function _lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function _pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const QUOTE_TEMPLATES: Array<() => string> = [
  () => `${_pick(QUOTE_SUBJECTS)} ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)}.`,
  () => `The market rewards ${_lower(_pick(QUOTE_SUBJECTS))}, not luck.`,
  () => `You don't need more time — you need more ${_lower(_pick(QUOTE_SUBJECTS))}.`,
  () => `${_cap(_pick(QUOTE_OUTCOMES))} is built one ${_pick(QUOTE_UNITS)} at a time.`,
  () => `Today's ${_pick(QUOTE_EFFORTS)} is tomorrow's ${_pick(QUOTE_OUTCOMES)}.`,
  () => `${_pick(QUOTE_SUBJECTS)} is the quiet edge that ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)}.`,
  () => `No one sees the ${_pick(QUOTE_UNITS)} you put in today — everyone sees the ${_pick(QUOTE_OUTCOMES)} later.`,
  () => `Small, boring, repeated ${_lower(_pick(QUOTE_SUBJECTS))} beats big, rare motivation.`,
  () => `Every ${_pick(QUOTE_UNITS)} you complete is a deposit toward ${_lower(_pick(QUOTE_OUTCOMES))}.`,
  () => `${_pick(QUOTE_SUBJECTS)} doesn't feel productive in the moment — it just ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)} later.`
];

export function generateQuote(): string {
  const template = _pick(QUOTE_TEMPLATES);
  return template();
}
