import { Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessPageProps {
  onContinue: () => void;
}

const PRO_FEATURES = [
  "Unlimited refinements",
  "All 7 modes including De-AI & Email Polish",
  "Full refinement history",
  "Export to txt, md & pdf",
  "Readability scores",
];

export function SuccessPage({ onContinue }: SuccessPageProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">You're now on Pro</h1>
          <p className="text-muted-foreground text-sm">
            Pro is active. Everything is unlocked.
          </p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5 text-left space-y-2.5">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Button className="w-full gap-2" onClick={onContinue}>
          Start refining
        </Button>
      </div>
    </div>
  );
}
