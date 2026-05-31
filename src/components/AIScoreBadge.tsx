import type { AIDetectionScore } from "@/utils/aiDetection";

interface AIScoreBadgeProps {
  score: AIDetectionScore;
}

function scoreColor(score: number): string {
  if (score < 35) return "text-green-700 bg-green-100";
  if (score < 65) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}

export function AIScoreBadge({ score }: AIScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor(score.score)}`}
      title={`AI likelihood: ${score.score}/100 · ${score.buzzwordCount} buzzwords · ${score.roboticPhraseCount} robotic phrases · burstiness: ${score.burstinessScore} · ${score.whStarterCount} Wh-starters · ${score.adverbCount} adverbs`}
    >
      AI {score.score} · {score.label}
    </span>
  );
}
