import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { ArrowLeft, Zap, Check, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AuthSession } from "../App";

interface ProfilePageProps {
  session: AuthSession;
  onBack: () => void;
  onUpgrade: () => void;
}

export function ProfilePage({ session, onBack, onUpgrade }: ProfilePageProps) {
  const planData = useQuery(api.subscriptions.getUserPlan) ?? { plan: "free" as const };
  const getPortalUrl = useAction(api.polarActions.getPortalUrl);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = planData.plan === "pro";
  const cancelAtPeriodEnd = isPro && (planData as any).cancelAtPeriodEnd;

  const handleManagePlan = async () => {
    setPortalLoading(true);
    try {
      const { url } = await getPortalUrl({});
      window.open(url, "_blank");
    } catch {
      alert("Could not open subscription portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to editor
      </button>

      <h2 className="text-lg font-semibold text-foreground mb-6">Account</h2>

      {/* Profile info */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profile</p>
        <div className="space-y-1">
          {session.user.name && (
            <p className="text-sm font-medium text-foreground">{session.user.name}</p>
          )}
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground px-0"
          onClick={() => authClient.signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subscription</p>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPro
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        {isPro ? (
          <div className="space-y-3">
            {cancelAtPeriodEnd && (
              <p className="text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
                Your subscription will cancel at the end of the current billing period.
              </p>
            )}
            <div className="space-y-1.5">
              {["Unlimited refinements", "All 7 modes", "Full history", "Export & readability scores"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleManagePlan}
              disabled={portalLoading}
            >
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Manage subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              20 refinements / month · 3 modes · 30-day history
            </p>
            <Button className="w-full gap-2" onClick={onUpgrade}>
              <Zap className="w-4 h-4" />
              Upgrade to Pro — $12/mo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
