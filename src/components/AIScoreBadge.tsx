import type { AIDetectionScore } from "@/utils/aiDetection";

interface AIScoreBadgeProps {
  score: AIDetectionScore;
  showDetails?: boolean;
}

function scoreColor(score: number): string {
  if (score < 35) return "text-green-700 bg-green-100";
  if (score < 65) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}

export function AIScoreBadge({ score, showDetails }: AIScoreBadgeProps) {
  const flagCount = score.flags?.length ?? 0;
  const highFlags = score.flags?.filter(f => f.severity === 'high').length ?? 0;

  const tooltipParts = [
    `AI likelihood: ${score.score}/100`,
    `${score.buzzwordCount} buzzwords`,
    `${score.roboticPhraseCount} robotic phrases`,
    `burstiness: ${score.burstinessScore}`,
    `${score.whStarterCount} Wh-starters`,
    `${score.adverbCount} filler adverbs`,
  ];
  if (flagCount > 0) {
    tooltipParts.push(`${flagCount} flags (${highFlags} high)`);
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor(score.score)}`}
      title={tooltipParts.join(" · ")}
    >
      AI {score.score} · {score.label}
      {flagCount > 0 && (
        <span className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-current/20 text-[9px] font-bold">
          {flagCount}
        </span>
      )}
    </span>
  );
}
