import type { ReadabilityScore } from "@/utils/readability";

interface ReadabilityBadgeProps {
  score: ReadabilityScore;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-700 bg-green-100";
  if (score >= 50) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}

export function ReadabilityBadge({ score }: ReadabilityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor(score.score)}`}
      title={`Readability: ${score.label} (Flesch-Kincaid score ${score.score}/100) · ${score.wordCount} words · ${score.sentenceCount} sentences · avg ${score.avgWordsPerSentence} words/sentence`}
    >
      {score.label}
    </span>
  );
}
