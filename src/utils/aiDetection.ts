export interface AIDetectionScore {
  score: number;
  label: string;
  buzzwordCount: number;
  roboticPhraseCount: number;
  burstinessScore: number;
  whStarterCount: number;
  adverbCount: number;
  flags: DiagnosticFlag[];
}

export interface DiagnosticFlag {
  category: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

const AI_BUZZWORDS = new Set([
  "delve","delves","delved","tapestry","testament","beacon","seamless","robust",
  "crucial","foster","fostering","fosters","leverage","leverages","leveraging",
  "leveraged","navigate","navigating","landscape","synergy","paradigm","holistic",
  "transformative","innovative","cutting-edge","game-changer","empower","empowers",
  "empowering","empowered","dynamic","streamline","streamlines","streamlining",
  "utilize","utilise","multifaceted","nuanced","comprehensive","pivotal",
  "groundbreaking","revolutionary","unprecedented","elevate","elevates","elevating",
  "reimagine","ecosystem","impactful","actionable","scalable","bespoke","vibrant",
  "thriving",
  "harness","harnessing","harnessed","unlock","unlocking","unleash","unleashing",
  "spearhead","catalyze","catalyse","expedite","facilitate","facilitates",
  "facilitating","iterate","iterating","synthesize","synthesise","orchestrate",
  "orchestrating","proactive","proactively","granular","robust","tangible",
  "deliverable","bandwidth","synergize","synergise","ideate","ideation",
  "disruptive","disruption","agile","iterative","stakeholder","stakeholders",
  "alignment","cadence","bandwidth","touchpoint","touchpoints","takeaway",
  "takeaways","mindset","skillset","toolset","reimagined","reimagining",
  "redefine","redefines","redefining","reshape","reshaping","reshaped",
  "underscore","underscores","underscoring","exemplify",
  "exemplifies","exemplifying","epitomize","epitomises",
  "demystify","demystifies","unpack","unpacking","deep-dive","deep dive",
  "curate","curates","curating","curated","tailored","bespoke","tailor",
  "drives","driven","drive","fuel","fuels","fueling","propel",
  "propels","propelling","prioritize","prioritise","optimize","optimise",
  "maximize","maximise","minimize","minimise",
  "intricate","intricacies","showcasing","showcases","advancements",
  "realm","aligns","aligning","garnered","comprehending","increasingly",
]);

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
  "full stop","let that sink in","make no mistake","here's why that matters",
  "this matters because","additionally","ultimately",
];

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
  "here's the problem","here is the problem","here's what i find interesting",
  "here's what i mean","here is what i mean","the uncomfortable truth",
  "it turns out","let me be clear","i'm going to be honest","i'll say it again",
  "can we talk about","here's why","here's what",
  "plot twist","spoiler alert","let me walk you through",
  "the rest of this","in this section we'll","as we'll see",
  "i want to explore","hint:",
  "this article explores","this post explores","this guide explores",
  "in an era of innovation","now more than ever",
];

const COMMON_ADVERBS = new Set([
  "really","just","literally","genuinely","honestly","simply","actually",
  "deeply","truly","fundamentally","inherently","inevitably","interestingly",
  "importantly","crucially","essentially","basically","practically","virtually",
  "absolutely","utterly","totally","completely","entirely","highly",
  "significantly","remarkably","notably","particularly","increasingly",
  "ultimately","undoubtedly","certainly","surely","definitely","indeed",
]);

const WH_STARTERS = new Set(["what","when","where","which","who","why","how"]);

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

function getSentenceLengths(sentences: string[]): number[] {
  return sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
}

function computeBurstiness(lengths: number[]): number {
  if (lengths.length < 3) return 50;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 50;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const cv = (Math.sqrt(variance) / mean) * 100;
  return Math.max(0, Math.min(100, cv));
}

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

function computePassiveVoiceRatio(sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const passiveRe = /\b(is|are|was|were|been|being)\s+\w+(?:ed|en)\b/gi;
  const passive = sentences.filter((s) => passiveRe.test(s)).length;
  return (passive / sentences.length) * 100;
}

function computeListRatio(text: string): number {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 3) return 0;
  const listLines = lines.filter((l) => /^\s*[-*•]\s|^\s*\d+[.)]\s/.test(l)).length;
  return (listLines / lines.length) * 100;
}

function countWhStarters(sentences: string[]): number {
  let count = 0;
  for (const s of sentences) {
    const first = s.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
    if (WH_STARTERS.has(first)) count++;
  }
  return count;
}

function countAdverbs(words: string[]): number {
  let count = 0;
  for (const word of words) {
    const w = word.replace(/[^a-z]/g, "");
    if (COMMON_ADVERBS.has(w)) count++;
  }
  return count;
}

function countPhrases(clean: string, phrases: string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    if (clean.includes(phrase)) count++;
  }
  return count;
}

function detectWeakIntro(clean: string): DiagnosticFlag | null {
  const introPatterns = [
    { pattern: /\bin today's rapidly evolving\b/i, detail: "Opens with 'in today's rapidly evolving' — generic time formula" },
    { pattern: /\bin today's fast-paced\b/i, detail: "Opens with 'in today's fast-paced' — cliché opener" },
    { pattern: /^(this article|this post|this guide|this video|this essay)\s+(explores|delves|examines|discusses|covers|aims|seeks)/i, detail: "Announces topic instead of entering through a problem or claim" },
    { pattern: /^let's dive into\b/i, detail: "Opens with 'let's dive into' — filler transition instead of concrete start" },
    { pattern: /^(in an era of|in a world of|in the modern|now more than ever)\b/i, detail: "Opens with broad era/world framing — generic" },
    { pattern: /\bhas become increasingly (important|crucial|essential|relevant)\b/i, detail: "Claims importance instead of showing it" },
  ];

  const firstSentence = clean.split(/[.!?]/)[0].trim();
  for (const { pattern, detail } of introPatterns) {
    if (pattern.test(firstSentence)) {
      return { category: "Weak Intro", detail, severity: 'medium' };
    }
  }
  return null;
}

function detectWeakConclusion(clean: string): DiagnosticFlag | null {
  const conclusionPatterns = [
    { pattern: /in conclusion,?\s/i, detail: "Opens conclusion with 'In conclusion' — formulaic" },
    { pattern: /ultimately,?\s/i, detail: "Ends with 'Ultimately' — can be replaced with a concrete consequence" },
    { pattern: /these findings highlight the importance of\b/i, detail: "'These findings highlight the importance of…' — vague significance" },
    { pattern: /the possibilities are endless\b/i, detail: "'The possibilities are endless' — unsupported claim" },
    { pattern: /only time will tell\b/i, detail: "'Only time will tell' — ends with placeholder instead of actual position" },
    { pattern: /as we move forward\b/i, detail: "'As we move forward' — generic future framing" },
    { pattern: /this underscores the importance of\b/i, detail: "'This underscores the importance of…' — tells significance instead of showing it" },
    { pattern: /could have implications for\b/i, detail: "'Could have implications for…' — vague implication instead of named outcome" },
    { pattern: /holds promise for\b/i, detail: "'Holds promise for…' — unsupported optimism" },
  ];

  const lastSentence = clean.split(/[.!?]+/).filter(Boolean).pop()?.trim() || "";
  for (const { pattern, detail } of conclusionPatterns) {
    if (pattern.test(lastSentence)) {
      return { category: "Weak Conclusion", detail, severity: 'medium' };
    }
  }
  return null;
}

function detectNotOnlyButAlso(clean: string): number {
  const matches = clean.match(/\bnot only\b.+\bbut also\b/gi);
  return matches ? matches.length : 0;
}

function detectBalancedLists(sentences: string[]): DiagnosticFlag | null {
  const threePartRe = /\b\w+,\s+\w+,\s+and\s+\w+/gi;
  for (const s of sentences) {
    const matches = s.match(threePartRe);
    if (matches && matches.length >= 2) {
      return {
        category: "Balanced List",
        detail: "Multiple three-part lists — AI hallmark rhythm",
        severity: 'medium',
      };
    }
  }
  return null;
}

function detectSentenceTypeVariety(sentences: string[]): { variety: number; fragments: number } {
  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const shorts = lengths.filter(l => l <= 5).length;
  const longs = lengths.filter(l => l >= 25).length;
  const mediums = lengths.filter(l => l > 5 && l < 25).length;

  const total = sentences.length;
  if (total < 5) return { variety: 60, fragments: 0 };

  const hasShort = shorts / total >= 0.1;
  const hasLong = longs / total >= 0.1;
  const hasMedium = mediums / total >= 0.3;

  const varietyScore = (hasShort ? 25 : 0) + (hasLong ? 25 : 0) + (hasMedium ? 25 : 0);
  const fragments = sentences.filter(s => {
    const words = s.split(/\s+/).filter(Boolean).length;
    return words >= 1 && words <= 2 && !s.match(/[.!?]$/);
  }).length;

  return { variety: varietyScore, fragments };
}

function detectClaimImplicationChains(sentences: string[]): number {
  let chains = 0;
  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i].toLowerCase();
    const next = sentences[i + 1].toLowerCase();
    const hasClaim = /\bis\b|\bmeans\b|\bshows\b|\breveals\b|\bdemonstrates\b/.test(current);
    const hasImplication = /\bhas implications\b|\bthis means\b|\bthis suggests\b|\bthis highlights\b|\bthis underscores\b|\bthis is why\b/.test(next);
    if (hasClaim && hasImplication) chains++;
  }
  return chains;
}

function detectScaffoldedParagraph(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  let scaffolded = 0;
  for (const p of paragraphs) {
    const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
      const first = sentences[0].toLowerCase();
      const last = sentences[sentences.length - 1].toLowerCase();
      const opensWithClaim = /\bis\b|\bare\b|\bplays\b|\brepresents\b|\bserves\b/.test(first);
      const closesWithSignificance = /\bimportant\b|\bcrucial\b|\bessential\b|\bsignificant\b|\bkey\b|\bvital\b|\bunderscores\b|\bhighlights\b/.test(last);
      if (opensWithClaim && closesWithSignificance) scaffolded++;
    }
  }
  return scaffolded;
}

function detectSpecificity(clean: string, words: string[]): number {
  const hasNumbers = /\b\d+\b/.test(clean);
  const hasNames = /[A-Z][a-z]+ [A-Z][a-z]+/.test(clean);
  const hasDates = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i.test(clean);
  const hasSpecificVerbs = /\b(replaced|installed|shipped|launched|canceled|interviewed|debugged|wrote|designed|built|shipped|sold|negotiated|hired|fired|patched|migrated|deployed)\b/i.test(clean);
  const vagueAdjectives = words.filter(w => /\b(every|always|never|everyone|nobody|everything|nothing)\b/i.test(w)).length;

  let specificScore = 0;
  if (hasNumbers) specificScore += 25;
  if (hasNames) specificScore += 20;
  if (hasDates) specificScore += 20;
  if (hasSpecificVerbs) specificScore += 25;
  if (vagueAdjectives > 2) specificScore -= 15;

  return Math.max(0, Math.min(100, specificScore));
}

export function scoreAILikelihood(text: string): AIDetectionScore {
  const clean = text.toLowerCase().replace(/[#*`_>~[\]()]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const flags: DiagnosticFlag[] = [];

  if (wordCount < 20) {
    return { score: 0, label: "Too short", buzzwordCount: 0, roboticPhraseCount: 0, burstinessScore: 50, whStarterCount: 0, adverbCount: 0, flags: [] };
  }

  const sentences = getSentences(text);
  const lengths = getSentenceLengths(sentences);

  let buzzwordCount = 0;
  const foundBuzzwords: string[] = [];
  for (const word of words) {
    const w = word.replace(/[^a-z]/g, "");
    if (AI_BUZZWORDS.has(w)) {
      buzzwordCount++;
      if (!foundBuzzwords.includes(w)) foundBuzzwords.push(w);
    }
  }
  const buzzScore = Math.min(100, (buzzwordCount / wordCount) * 100 * 18);

  if (foundBuzzwords.length >= 2) {
    flags.push({
      category: "Focal Words",
      detail: `AI-pattern words found: ${foundBuzzwords.slice(0, 5).join(", ")}${foundBuzzwords.length > 5 ? ` +${foundBuzzwords.length - 5} more` : ""}`,
      severity: foundBuzzwords.length >= 5 ? 'high' : 'medium',
    });
  }

  const roboticPhraseCount = countPhrases(clean, ROBOTIC_TRANSITIONS);
  const roboticScore = Math.min(100, roboticPhraseCount * 12);

  if (roboticPhraseCount >= 2) {
    flags.push({
      category: "Transitions",
      detail: `${roboticPhraseCount} robotic transitions — text may be over-scaffolded`,
      severity: roboticPhraseCount >= 4 ? 'high' : 'medium',
    });
  }

  const hedgeCount = countPhrases(clean, HEDGE_PHRASES);
  const hedgeScore = Math.min(100, hedgeCount * 14);

  if (hedgeCount >= 2) {
    flags.push({
      category: "Hedging",
      detail: `${hedgeCount} hedge/qualifier phrases — reads as overly cautious`,
      severity: hedgeCount >= 4 ? 'high' : 'medium',
    });
  }

  const structureCount = countPhrases(clean, AI_STRUCTURAL_MARKERS);
  const structureScore = Math.min(100, structureCount * 20);

  if (structureCount >= 1) {
    flags.push({
      category: "Framing",
      detail: `AI structural framing detected (${structureCount} markers) — e.g., "in this article", "let's explore"`,
      severity: structureCount >= 3 ? 'high' : 'medium',
    });
  }

  const burstiness = computeBurstiness(lengths);
  const burstScore = Math.max(0, 100 - burstiness);

  if (burstScore > 60 && sentences.length >= 5) {
    flags.push({
      category: "Rhythm",
      detail: "Sentence lengths are unusually uniform — lacks human rhythm variety",
      severity: 'high',
    });
  }

  const starterRepetition = computeStarterRepetition(sentences);
  const starterScore = Math.min(100, Math.max(0, (starterRepetition - 20) * 2));

  if (starterScore > 50 && sentences.length >= 5) {
    flags.push({
      category: "Repetition",
      detail: "Many sentences start the same way — repetitive structure",
      severity: 'medium',
    });
  }

  const passiveRatio = computePassiveVoiceRatio(sentences);
  const passiveScore = Math.min(100, passiveRatio * 1.8);

  const listRatio = computeListRatio(text);
  const listScore = Math.min(100, listRatio * 1.5);

  const whStarterCount = countWhStarters(sentences);
  const whStarterProportion = sentences.length > 0 ? whStarterCount / sentences.length : 0;
  const whStarterScore = Math.min(100, whStarterProportion * 100 * 3);

  if (whStarterCount >= 3) {
    flags.push({
      category: "Wh- Starters",
      detail: `${whStarterCount} sentences start with What/When/Where/Which/Who/Why/How — AI rhetorical crutch`,
      severity: whStarterCount >= 6 ? 'high' : 'low',
    });
  }

  const adverbCount = countAdverbs(words);
  const adverbScore = Math.min(100, (adverbCount / wordCount) * 100 * 15);

  const weakIntro = detectWeakIntro(clean);
  if (weakIntro) flags.push(weakIntro);

  const weakConclusion = detectWeakConclusion(clean);
  if (weakConclusion) flags.push(weakConclusion);

  const notOnlyButAlsoCount = detectNotOnlyButAlso(clean);
  if (notOnlyButAlsoCount > 0) {
    flags.push({
      category: "Formula",
      detail: `"Not only X but also Y" used ${notOnlyButAlsoCount} time(s) — state the two things directly`,
      severity: 'low',
    });
  }

  const balancedList = detectBalancedLists(sentences);
  if (balancedList) flags.push(balancedList);

  const { variety, fragments } = detectSentenceTypeVariety(sentences);
  const varietyScore = Math.max(0, 100 - variety);

  if (variety < 50 && sentences.length >= 6) {
    flags.push({
      category: "Variety",
      detail: "Low sentence type variety — missing short, long, or fragmented sentences",
      severity: 'medium',
    });
  }

  const claimChains = detectClaimImplicationChains(sentences);
  if (claimChains >= 2) {
    flags.push({
      category: "Structure",
      detail: `Claim → implication chain detected (${claimChains} instances) — "X is true. This means Y."`,
      severity: 'medium',
    });
  }

  const scaffolded = detectScaffoldedParagraph(text);
  if (scaffolded >= 2) {
    flags.push({
      category: "Structure",
      detail: `${scaffolded} paragraphs follow claim → support → significance pattern — over-scaffolded`,
      severity: 'medium',
    });
  }

  const specificity = detectSpecificity(clean, words);
  if (specificity < 40 && sentences.length >= 5) {
    flags.push({
      category: "Specificity",
      detail: "Low specificity — lacks numbers, names, dates, or concrete verbs",
      severity: 'medium',
    });
  }

  if (specificity < 20 && sentences.length >= 5) {
    flags[flags.length - 1].severity = 'high';
  }

  const score = Math.round(
    buzzScore    * 0.16 +
    roboticScore * 0.12 +
    hedgeScore   * 0.13 +
    structureScore * 0.10 +
    burstScore   * 0.14 +
    starterScore * 0.10 +
    passiveScore * 0.06 +
    listScore    * 0.05 +
    whStarterScore * 0.03 +
    adverbScore  * 0.02 +
    varietyScore * 0.04 +
    Math.max(0, 100 - specificity) * 0.05
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
    flags,
  };
}
