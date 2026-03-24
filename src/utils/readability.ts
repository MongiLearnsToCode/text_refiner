function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/e$/, "");
  const matches = word.match(/[aeiou]+/g);
  return matches ? matches.length : 1;
}

function countSentences(text: string): number {
  const matches = text.match(/[.!?]+/g);
  return matches ? matches.length : 1;
}

export interface ReadabilityScore {
  score: number;
  label: string;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}

export function fleschKincaid(text: string): ReadabilityScore {
  // Strip markdown syntax for cleaner scoring
  const clean = text.replace(/[#*`_>~\[\]()]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) {
    return { score: 0, label: "N/A", wordCount: 0, sentenceCount: 0, avgWordsPerSentence: 0 };
  }

  const sentenceCount = countSentences(clean);
  const syllableCount = words.reduce((n, w) => n + countSyllables(w), 0);

  const score = Math.max(
    0,
    Math.min(
      100,
      206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
    )
  );

  const label =
    score >= 90 ? "Very Easy" :
    score >= 80 ? "Easy" :
    score >= 70 ? "Fairly Easy" :
    score >= 60 ? "Standard" :
    score >= 50 ? "Fairly Difficult" :
    score >= 30 ? "Difficult" :
    "Very Confusing";

  return {
    score: Math.round(score * 10) / 10,
    label,
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round((wordCount / sentenceCount) * 10) / 10,
  };
}
