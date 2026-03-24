import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { ArrowLeft, Zap, Check, Loader2, LogOut, Sparkles, Shield, Activity, X } from "lucide-react";
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
  const usageData = useQuery(api.usage.getUsage) ?? { count: 0, limit: 20 };
  const cancelSubscription = useAction(api.polarActions.cancelSubscription);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isPro = planData.plan === "pro";
  const cancelAtPeriodEnd = isPro && (planData as any).cancelAtPeriodEnd;
  const limit = usageData.limit ?? 20;
  const usagePercent = usageData.limit ? Math.min(Math.round((usageData.count / limit) * 100), 100) : 0;

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription({});
      setShowCancelConfirm(false);
    } catch {
      alert("Could not cancel subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (session.user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to editor
        </button>

        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Account</h1>

        {/* Profile */}
        <section className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                {initials}
              </div>
              <div>
                {session.user.name && (
                  <p className="text-sm font-semibold text-foreground">{session.user.name}</p>
                )}
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => authClient.signOut()}
              className="flex items-center gap-2 px-3 py-2 text-destructive text-sm font-medium hover:bg-destructive/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </section>

        {/* Bento grid: Subscription + Usage */}
        <div className="grid grid-cols-5 gap-5">
          {/* Subscription card */}
          <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-muted rounded-xl">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-muted text-muted-foreground rounded-full uppercase tracking-wider">
                  Current Plan
                </span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">{isPro ? "Pro Plan" : "Free Plan"}</h3>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  {isPro
                    ? "You have full access to all refinement modes and unlimited usage."
                    : "Unlock advanced AI tools and unlimited refinements to elevate your writing."}
                </p>
              </div>
              {cancelAtPeriodEnd && (
                <p className="text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
                  Your subscription will cancel at the end of the current billing period.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <ul className="space-y-2">
                {(isPro
                  ? ["Unlimited refinements", "All 7 modes", "Full history", "Export & readability scores"]
                  : ["20 refinements / month", "3 standard modes", "30-day history"]
                ).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <>
                  {showCancelConfirm ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                      <p className="text-xs text-foreground font-medium">
                        Your subscription will remain active until the end of the billing period, then will not renew.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                        >
                          {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Yes, cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={cancelLoading}
                        >
                          <X className="w-3.5 h-3.5" />
                          Keep plan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-destructive hover:text-destructive hover:border-destructive/40"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      Cancel subscription
                    </Button>
                  )}
                </>
              ) : (
                <Button className="w-full gap-2" onClick={onUpgrade}>
                  <Zap className="w-4 h-4" />
                  Upgrade to Pro — $12/mo
                </Button>
              )}
            </div>
          </div>

          {/* Usage card */}
          <div className="col-span-2 bg-muted/40 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-sm">Usage</h3>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Monthly Refinements</span>
                  <span className="text-primary">
                    {isPro ? `${usageData.count} used` : `${usageData.count} / ${limit}`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isPro ? "bg-primary/40 w-full" : "bg-primary"}`}
                    style={!isPro ? { width: `${usagePercent}%` } : undefined}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {isPro ? "Unlimited on Pro" : `${limit - usageData.count} refinements remaining this month`}
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{isPro ? "7 modes active" : "3 modes active"}</p>
                    <p className="text-[10px] text-muted-foreground">{isPro ? "All modes unlocked" : "Standard modes only"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-xs">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{isPro ? "Full history" : "30-day history"}</p>
                    <p className="text-[10px] text-muted-foreground">Stored securely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
