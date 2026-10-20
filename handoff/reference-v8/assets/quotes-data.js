// Original template-based quote generator (money / motivation / discipline).
// Combines word banks below into full sentences -- thousands of unique
// combinations, all generated locally, changes every page refresh.
// No external API calls (keeps it working reliably on free hosting).

const QUOTE_SUBJECTS = [
  "Discipline","Consistency","Patience","Focus","Hard work","Small steps",
  "Every rupee saved","Every hour invested","Clarity","Courage","Persistence",
  "Good habits","Momentum","Ambition","Gratitude","Preparation","Self-control",
  "Deep work","Daily effort","A clear plan","Steady progress","Sacrifice today",
  "Showing up daily","Learning fast","Staying patient","Taking action"
];

const QUOTE_VERBS = [
  "builds","creates","compounds into","turns into","shapes","fuels",
  "protects","multiplies","secures","unlocks","quietly becomes","eventually becomes"
];

const QUOTE_OUTCOMES = [
  "wealth","freedom","success","a better future","financial peace",
  "unstoppable momentum","the life you want","real progress","lasting change",
  "opportunity","independence","confidence","mastery","a legacy worth building"
];

const QUOTE_UNITS = [
  "day","habit","decision","hour","rupee","task","small win","honest effort"
];

const QUOTE_EFFORTS = [
  "discipline","hustle","focus","sacrifice","patience","consistency","grind","effort"
];

function _cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function _lower(s){ return s.charAt(0).toLowerCase() + s.slice(1); }
function _pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const QUOTE_TEMPLATES = [
  () => `${_pick(QUOTE_SUBJECTS)} ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)}.`,
  () => `The market rewards ${_lower(_pick(QUOTE_SUBJECTS))}, not luck.`,
  () => `You don't need more time -- you need more ${_lower(_pick(QUOTE_SUBJECTS))}.`,
  () => `${_cap(_pick(QUOTE_OUTCOMES))} is built one ${_pick(QUOTE_UNITS)} at a time.`,
  () => `Today's ${_pick(QUOTE_EFFORTS)} is tomorrow's ${_pick(QUOTE_OUTCOMES)}.`,
  () => `${_pick(QUOTE_SUBJECTS)} is the quiet edge that ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)}.`,
  () => `No one sees the ${_pick(QUOTE_UNITS)} you put in today -- everyone sees the ${_pick(QUOTE_OUTCOMES)} later.`,
  () => `Small, boring, repeated ${_lower(_pick(QUOTE_SUBJECTS))} beats big, rare motivation.`,
  () => `Every ${_pick(QUOTE_UNITS)} you complete is a deposit toward ${_lower(_pick(QUOTE_OUTCOMES))}.`,
  () => `${_pick(QUOTE_SUBJECTS)} doesn't feel productive in the moment -- it just ${_pick(QUOTE_VERBS)} ${_pick(QUOTE_OUTCOMES)} later.`,
];

function generateQuote() {
  const template = _pick(QUOTE_TEMPLATES);
  return template();
}
