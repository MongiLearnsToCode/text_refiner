export interface AIDetectionScore {
  score: number;           // 0–100, higher = more AI-like
  label: string;           // "Likely Human" | "Uncertain" | "Likely AI"
  buzzwordCount: number;
  roboticPhraseCount: number;
  burstinessScore: number; // 0–100, higher = more varied (human-like)
  whStarterCount: number;  // NEW: sentences starting with Wh-/How
  adverbCount: number;     // NEW: filler adverbs (really, just, literally, etc.)
}

// ─── Signal Lists ─────────────────────────────────────────────────────────────

/** Words statistically overrepresented in LLM output */
const AI_BUZZWORDS = new Set([
  // Classics
  "delve","delves","delved","tapestry","testament","beacon","seamless","robust",
  "crucial","foster","fostering","fosters","leverage","leverages","leveraging",
  "leveraged","navigate","navigating","landscape","synergy","paradigm","holistic",
  "transformative","innovative","cutting-edge","game-changer","empower","empowers",
  "empowering","empowered","dynamic","streamline","streamlines","streamlining",
  "utilize","utilise","multifaceted","nuanced","comprehensive","pivotal",
  "groundbreaking","revolutionary","unprecedented","elevate","elevates","elevating",
  "reimagine","ecosystem","impactful","actionable","scalable","bespoke","vibrant",
  "thriving",
  // Tier 2
  "harness","harnessing","harnessed","unlock","unlocking","unleash","unleashing",
  "spearhead","catalyze","catalyse","expedite","facilitate","facilitates",
  "facilitating","iterate","iterating","synthesize","synthesise","orchestrate",
  "orchestrating","proactive","proactively","granular","robust","tangible",
  "deliverable","bandwidth","synergize","synergise","ideate","ideation",
  "disruptive","disruption","agile","iterative","stakeholder","stakeholders",
  "alignment","cadence","bandwidth","touchpoint","touchpoints","takeaway",
  "takeaways","mindset","skillset","toolset","reimagined","reimagining",
  "redefine","redefines","redefining","reshape","reshaping","reshaped",
  "underscore","underscores","underscoring","underscore","exemplify",
  "exemplifies","exemplifying","epitomize","epitomize","epitomises",
  "demystify","demystifies","unpack","unpacking","deep-dive","deep dive",
  "curate","curates","curating","curated","tailored","bespoke","tailor",
  "navigate","drives","driven","drive","fuel","fuels","fueling","propel",
  "propels","propelling","prioritize","prioritise","optimize","optimise",
  "maximize","maximise","minimize","minimise",
]);

/** Transition and filler phrases typical of AI prose */
const ROBOTIC_TRANSITIONS = [
  "furthermore","in conclusion","it is important to note","it is worth noting",
  "in summary","to summarize","to summarise","in addition","moreover",
  "consequently","as a result","therefore","thus","hence","in essence",
  "to reiterate","it should be noted","needless to say","last but not least",
  "without further ado","moving forward","going forward","at the end of the day",
  "as mentioned","as previously mentioned","rest assured","in light of",
  "that being said","with that said","with that in mind","all things considered",
  "it goes without saying","long story short","the bottom line","suffice it to say",
  "first and foremost","first things first","on the other hand","by the same token",
  "case in point","for instance","for example","in other words","to put it simply",
  "simply put","in a nutshell","to be fair","to be clear","to clarify","notably",
  // Stop Slop additions
  "full stop","let that sink in","make no mistake","here's why that matters",
  "this matters because",
];

/** Hedge/qualifier phrases overused by AI to sound careful */
const HEDGE_PHRASES = [
  "it is important to","it's important to","it is essential to","it's essential to",
  "it is crucial to","it's crucial to","it is vital to","it's vital to",
  "it is imperative to","one must consider","one should consider","one might argue",
  "it can be argued","it could be argued","generally speaking","broadly speaking",
  "in many cases","in most cases","in some cases","in certain cases",
  "to some extent","by and large","for the most part","as a general rule",
  "more often than not","under certain circumstances","depending on the context",
  "this can vary","results may vary","it depends","worth noting","worth mentioning",
  "particularly important","especially important","particularly relevant",
  "plays a crucial role","plays an important role","plays a key role",
  "plays a vital role","plays a significant role",
];

/** Structural opener phrases that AI uses to frame articles/responses */
const AI_STRUCTURAL_MARKERS = [
  "in this article","in this guide","in this post","in this tutorial",
  "in this overview","in this piece","in today's","in today's world",
  "in today's fast","in the modern","in the current","let's explore",
  "let's dive","let's look at","let's examine","let's consider",
  "whether you're","whether you are","by leveraging","by utilizing",
  "by harnessing","by implementing","the key takeaway","the main takeaway",
  "key takeaways","the good news is","the bad news is","the fact is",
  "the truth is","the reality is","here's the thing","here is the thing",
  "at its core","at the end of the day","in the grand scheme",
  // Stop Slop: throat-clearing openers
  "here's the problem","here is the problem","here's what i find interesting",
  "here's what i mean","here is what i mean","the uncomfortable truth",
  "it turns out","let me be clear","i'm going to be honest","i'll say it again",
  "can we talk about","here's why","here's what",
  // Stop Slop: meta-commentary
  "plot twist","spoiler alert","let me walk you through",
  "the rest of this","in this section we'll","as we'll see",
  "i want to explore","hint:",
];

/** Filler adverbs that AI overuses for empty emphasis */
const COMMON_ADVERBS = new Set([
  "really","just","literally","genuinely","honestly","simply","actually",
  "deeply","truly","fundamentally","inherently","inevitably","interestingly",
  "importantly","crucially","essentially","basically","practically","virtually",
  "absolutely","utterly","totally","completely","entirely","highly",
  "significantly","remarkably","notably","particularly","increasingly",
  "ultimately","undoubtedly","certainly","surely","definitely","indeed",
]);

/** Wh- words that start sentences in formulaic AI prose */
const WH_STARTERS = new Set(["what","when","where","which","who","why","how"]);

// ─── Statistical Helpers ──────────────────────────────────────────────────────

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

function getSentenceLengths(sentences: string[]): number[] {
  return sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
}

/** Coefficient of variation — low CV = AI-like uniformity */
function computeBurstiness(lengths: number[]): number {
  if (lengths.length < 3) return 50;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 50;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const cv = (Math.sqrt(variance) / mean) * 100;
  return Math.max(0, Math.min(100, cv));
}

/** Proportion of sentences that start with the top-2 most common first words */
function computeStarterRepetition(sentences: string[]): number {
  if (sentences.length < 4) return 0;
  const starters: Record<string, number> = {};
  for (const s of sentences) {
    const word = s.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
    if (word) starters[word] = (starters[word] ?? 0) + 1;
  }
  const counts = Object.values(starters).sort((a, b) => b - a);
  const top2 = (counts[0] ?? 0) + (counts[1] ?? 0);
  return (top2 / sentences.length) * 100;
}

/** Approximate passive voice: "was/were/is/are/been + past participle" */
function computePassiveVoiceRatio(sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const passiveRe = /\b(is|are|was|were|been|being)\s+\w+(?:ed|en)\b/gi;
  const passive = sentences.filter((s) => passiveRe.test(s)).length;
  return (passive / sentences.length) * 100;
}

/** Proportion of content lines that are bullet/numbered list items */
function computeListRatio(text: string): number {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 3) return 0;
  const listLines = lines.filter((l) => /^\s*[-*•]\s|^\s*\d+[.)]\s/.test(l)).length;
  return (listLines / lines.length) * 100;
}

/** Count sentences that start with Wh- words or How — a classic AI structural crutch */
function countWhStarters(sentences: string[]): number {
  let count = 0;
  for (const s of sentences) {
    const first = s.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
    if (WH_STARTERS.has(first)) count++;
  }
  return count;
}

/** Count filler adverb occurrences in word list */
function countAdverbs(words: string[]): number {
  let count = 0;
  for (const word of words) {
    const w = word.replace(/[^a-z]/g, "");
    if (COMMON_ADVERBS.has(w)) count++;
  }
  return count;
}

/** Phrase density helper: occurrences per 100 words */
function countPhrases(clean: string, phrases: string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    if (clean.includes(phrase)) count++;
  }
  return count;
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────

export function scoreAILikelihood(text: string): AIDetectionScore {
  const clean = text.toLowerCase().replace(/[#*`_>~[\]()]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 20) {
    return { score: 0, label: "Too short", buzzwordCount: 0, roboticPhraseCount: 0, burstinessScore: 50, whStarterCount: 0, adverbCount: 0 };
  }

  const sentences = getSentences(text);
  const lengths = getSentenceLengths(sentences);

  // ── Signal 1: AI buzzword density (weight 0.18) ──────────────────────────
  let buzzwordCount = 0;
  for (const word of words) {
    const w = word.replace(/[^a-z]/g, "");
    if (AI_BUZZWORDS.has(w)) buzzwordCount++;
  }
  const buzzScore = Math.min(100, (buzzwordCount / wordCount) * 100 * 18);

  // ── Signal 2: Robotic transition density (weight 0.12) ───────────────────
  const roboticPhraseCount = countPhrases(clean, ROBOTIC_TRANSITIONS);
  const roboticScore = Math.min(100, roboticPhraseCount * 12);

  // ── Signal 3: Hedge/qualifier phrase density (weight 0.13) ───────────────
  const hedgeCount = countPhrases(clean, HEDGE_PHRASES);
  const hedgeScore = Math.min(100, hedgeCount * 14);

  // ── Signal 4: AI structural markers (weight 0.10) ────────────────────────
  const structureCount = countPhrases(clean, AI_STRUCTURAL_MARKERS);
  const structureScore = Math.min(100, structureCount * 20);

  // ── Signal 5: Sentence length burstiness (weight 0.20) ───────────────────
  // Low burstiness (uniform sentence lengths) → AI-like
  const burstiness = computeBurstiness(lengths);
  const burstScore = Math.max(0, 100 - burstiness);

  // ── Signal 6: Sentence starter repetition (weight 0.12) ──────────────────
  // High repetition (many sentences starting with same word) → AI-like
  const starterRepetition = computeStarterRepetition(sentences);
  const starterScore = Math.min(100, Math.max(0, (starterRepetition - 20) * 2));

  // ── Signal 7: Passive voice ratio (weight 0.08) ───────────────────────────
  const passiveRatio = computePassiveVoiceRatio(sentences);
  const passiveScore = Math.min(100, passiveRatio * 1.8);

  // ── Signal 8: List/formatting density (weight 0.07) ──────────────────────
  const listRatio = computeListRatio(text);
  const listScore = Math.min(100, listRatio * 1.5);

  // ── Signal 9: Wh- sentence starters (weight 0.03) ─────────────────────────
  // AI overuses "What makes this hard is...", "Why this matters..." structures
  const whStarterCount = countWhStarters(sentences);
  const whStarterProportion = sentences.length > 0 ? whStarterCount / sentences.length : 0;
  const whStarterScore = Math.min(100, whStarterProportion * 100 * 3);

  // ── Signal 10: Filler adverb density (weight 0.02) ────────────────────────
  // "really", "just", "literally", "simply", "actually" — empty emphasis
  const adverbCount = countAdverbs(words);
  const adverbScore = Math.min(100, (adverbCount / wordCount) * 100 * 15);

  const score = Math.round(
    buzzScore    * 0.16 +
    roboticScore * 0.12 +
    hedgeScore   * 0.13 +
    structureScore * 0.10 +
    burstScore   * 0.17 +
    starterScore * 0.12 +
    passiveScore * 0.08 +
    listScore    * 0.07 +
    whStarterScore * 0.03 +
    adverbScore  * 0.02
  );

  const label =
    score >= 62 ? "Likely AI" :
    score >= 32 ? "Uncertain" :
    "Likely Human";

  return {
    score,
    label,
    buzzwordCount,
    roboticPhraseCount,
    burstinessScore: Math.round(burstiness),
    whStarterCount,
    adverbCount,
  };
}
