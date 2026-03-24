import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Check, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  onClose: () => void;
}

const FREE_FEATURES = [
  "20 refinements / month",
  "3 modes",
  "30-day history",
];

const FREE_MISSING = [
  "Export (txt, md, pdf)",
  "Readability scores",
  "All 7 modes",
  "Full history",
];

const PRO_FEATURES = [
  "Unlimited refinements",
  "All 7 modes",
  "Full history (no limit)",
  "Export to txt, md & pdf",
  "Readability scores",
];

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const createCheckout = useAction(api.polarActions.createCheckoutSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckout({});
      window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Upgrade to Pro</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Unlock everything, no limits.</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground/50 hover:text-foreground transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Free */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Free</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">$0</p>
              <p className="text-xs text-muted-foreground">forever</p>
            </div>
            <div className="space-y-1.5">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground/70">
                  <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {f}
                </div>
              ))}
              {FREE_MISSING.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground/40 line-through">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <div className="w-full text-center text-xs text-muted-foreground py-2 rounded-lg border border-border bg-background/50">
                Current plan
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                Recommended
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Pro</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">$12</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
            <div className="space-y-1.5">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <Button
                className="w-full gap-2"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                  : <><Zap className="w-4 h-4" /> Upgrade to Pro</>
                }
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <p className="px-6 pb-4 text-sm text-destructive text-center">{error}</p>
        )}

        <p className="px-6 pb-5 text-center text-xs text-muted-foreground/60">
          Secure payment via Stripe · Cancel anytime from account settings
        </p>
      </div>
    </div>
  );
}
