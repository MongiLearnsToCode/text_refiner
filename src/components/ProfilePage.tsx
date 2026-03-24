import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import {
  ArrowLeft, Zap, Check, Loader2, LogOut,
  BarChart2, ChevronRight, Sparkles, Shield, Activity,
} from "lucide-react";
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
  const getPortalUrl = useAction(api.polarActions.getPortalUrl);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = planData.plan === "pro";
  const cancelAtPeriodEnd = isPro && (planData as any).cancelAtPeriodEnd;
  const limit = usageData.limit ?? 20;
  const usagePercent = usageData.limit ? Math.min(Math.round((usageData.count / limit) * 100), 100) : 0;

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

  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (session.user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-border bg-muted/20 flex flex-col p-4 gap-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 px-2 py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to editor
        </button>

        {/* User info block */}
        <div className="px-2 py-3 mb-2 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              {session.user.name && (
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {session.user.name}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              isPro ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {isPro && <Zap className="w-2.5 h-2.5" />}
            {isPro ? "Pro" : "Free Plan"}
          </span>
          {!isPro && (
            <button
              onClick={onUpgrade}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {[
            { label: "Profile Details", icon: <Sparkles className="w-4 h-4" /> },
            { label: "Subscription", icon: <Zap className="w-4 h-4" /> },
            { label: "Usage Metrics", icon: <BarChart2 className="w-4 h-4" /> },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                i === 0
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:translate-x-0.5 cursor-default"
              }`}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => authClient.signOut()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-destructive hover:translate-x-0.5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile Details</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your personal information and subscription settings.
            </p>
          </div>

          {/* Profile card */}
          <section className="bg-card rounded-xl border border-border shadow-sm p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 ring-4 ring-muted">
                  {initials}
                </div>
                <div className="space-y-1">
                  {session.user.name && (
                    <h2 className="text-base font-bold text-foreground">{session.user.name}</h2>
                  )}
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                    Verified Account
                  </span>
                </div>
              </div>
              <button
                onClick={() => authClient.signOut()}
                className="flex items-center gap-2 px-3 py-2 text-destructive text-sm font-semibold hover:bg-destructive/5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </section>

          {/* Bento grid: Subscription + Usage */}
          <div className="grid grid-cols-5 gap-5">
            {/* Subscription card — 3 cols */}
            <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-muted rounded-xl">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-muted text-muted-foreground rounded-full uppercase tracking-wider">
                    Current Status
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleManagePlan}
                    disabled={portalLoading}
                  >
                    {portalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Manage subscription
                  </Button>
                ) : (
                  <Button className="w-full gap-2" onClick={onUpgrade}>
                    <Zap className="w-4 h-4" />
                    Upgrade to Pro — $12/mo
                  </Button>
                )}
              </div>
            </div>

            {/* Right column — 2 cols */}
            <div className="col-span-2 space-y-4">
              {/* Usage card */}
              <div className="bg-muted/40 rounded-xl border border-border p-5">
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
                      {isPro
                        ? "Unlimited on Pro"
                        : `${limit - usageData.count} refinements remaining this month`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {isPro ? "7 modes active" : "3 modes active"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isPro ? "All modes unlocked" : "Standard modes only"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-xs">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {isPro ? "Full history" : "30-day history"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Stored securely</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Go Pro CTA for free users */}
              {!isPro && (
                <button
                  onClick={onUpgrade}
                  className="w-full bg-card rounded-xl border border-border hover:border-primary/30 p-4 text-left transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Go Pro</p>
                        <p className="text-[10px] text-muted-foreground">Unlock everything for $12/mo</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
              Text Refiner • Powered by AI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
