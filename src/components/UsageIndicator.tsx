import { Zap } from "lucide-react";

interface UsageIndicatorProps {
  count: number;
  limit: number | null; // null = Pro (unlimited)
  onUpgrade?: () => void;
}

export function UsageIndicator({ count, limit, onUpgrade }: UsageIndicatorProps) {
  // Pro badge
  if (limit === null) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border text-primary bg-primary/8 border-primary/25"
        title="Pro plan · unlimited refinements"
      >
        <Zap className="w-3 h-3" />
        Pro
      </div>
    );
  }

  const isNearLimit = count >= limit - 2;
  const isAtLimit = count >= limit;
  const pct = Math.min(100, (count / limit) * 100);

  return (
    <button
      onClick={isAtLimit ? onUpgrade : undefined}
      className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
        isAtLimit
          ? "text-red-700 bg-red-50 border-red-200 cursor-pointer hover:bg-red-100"
          : isNearLimit
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-muted-foreground bg-muted border-border"
      }`}
      title={`${count} of ${limit} free refinements used this month`}
    >
      <span>{count}/{limit}</span>
      <div className="w-14 h-1.5 rounded-full bg-current/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
