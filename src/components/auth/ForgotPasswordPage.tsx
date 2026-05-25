import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

interface ForgotPasswordPageProps {
  onBackToSignIn: () => void;
}

export function ForgotPasswordPage({ onBackToSignIn }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.forgotPassword({ email });
    if (error) setError(error.message ?? "Failed to send reset email.");
    else setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={onBackToSignIn}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <button
          onClick={onBackToSignIn}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      </div>
    </div>
  );
}
