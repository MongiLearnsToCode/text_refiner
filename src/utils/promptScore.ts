export interface PromptScore {
  total: number;  // 0–100
  label: string;  // "Poor" | "Basic" | "Good" | "Strong" | "Excellent"
}

const ACTION_VERBS = [
  "create", "write", "build", "implement", "fix", "refactor", "add", "generate",
  "design", "develop", "update", "modify", "remove", "delete", "optimize", "test",
  "debug", "migrate", "integrate", "deploy", "convert", "extract", "parse",
  "validate", "render", "fetch", "submit", "calculate", "transform",
];

const VAGUE_WORDS = [
  "something", "somehow", "various", "etc", "maybe", "sort of", "kind of",
  "stuff", "things", "whatever", "somehow", "somewhere", "someone",
];

const TECH_TERMS = /\b(typescript|javascript|react|python|api|function|component|database|class|interface|hook|server|client|query|mutation|endpoint|route|model|schema|test|spec|module|package|import|export|async|await|promise)\b/i;

const OUTPUT_TERMS = /\b(output|result|return|should|must|need to|generate|produce|ensure that|so that|in order to)\b/i;

const CONSTRAINT_TERMS = /\b(constraint|requirement|ensure|make sure|note that|important|do not|avoid|must not|never|always|without)\b/i;

export function scorePrompt(text: string): PromptScore {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 10) return { total: 0, label: "Too short" };

  // 1. Clarity (0-25): clear action verb, no vague opener
  let clarity = 0;
  const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, "");
  if (ACTION_VERBS.includes(firstWord)) clarity += 18;
  else if (ACTION_VERBS.some((v) => lower.includes(v))) clarity += 10;
  if (!/^(help me|can you|could you|i need|i want|please help)/.test(lower)) clarity += 7;

  // 2. Specificity (0-25): no vague words, has concrete tech terms
  const vagueHits = VAGUE_WORDS.filter((v) => lower.includes(v)).length;
  let specificity = Math.max(0, 20 - vagueHits * 7);
  if (TECH_TERMS.test(text)) specificity = Math.min(25, specificity + 8);

  // 3. Structure (0-25): appropriate length + has lists/numbered steps
  let structure = 0;
  if (wordCount >= 40 && wordCount <= 600) structure += 15;
  else if (wordCount >= 15) structure += 8;
  if (/^[-*•]\s/m.test(text) || /^\d+\.\s/m.test(text)) structure += 10;

  // 4. Completeness (0-25): mentions expected output + constraints
  let completeness = 0;
  if (OUTPUT_TERMS.test(text)) completeness += 12;
  if (CONSTRAINT_TERMS.test(text)) completeness += 13;

  const total = Math.min(100, clarity + specificity + structure + completeness);
  const label =
    total >= 85 ? "Excellent" :
    total >= 68 ? "Strong" :
    total >= 48 ? "Good" :
    total >= 28 ? "Basic" :
    "Poor";

  return { total, label };
}
