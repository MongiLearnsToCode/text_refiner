import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) setError("Invalid or missing reset token. Please request a new password reset link.");
    else setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) return;

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) setError(error.message ?? "Failed to reset password.");
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Password reset</h1>
            <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
          </div>
          <Button className="w-full" onClick={onComplete}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              disabled={!token}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              disabled={!token}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
