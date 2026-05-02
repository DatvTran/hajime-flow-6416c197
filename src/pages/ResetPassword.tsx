import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HajimeLogo } from "@/components/HajimeLogo";
import { toast } from "@/components/ui/sonner";
import { homePathForRole, useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing token", { description: "Open the link from your reset email." });
      return;
    }
    if (password.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Reset failed");
      }
      toast.success("Password updated", { description: "Sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Could not reset password", {
        description: err instanceof Error ? err.message : "Try requesting a new link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="relative z-10 mb-8 flex flex-col items-center text-center">
        <HajimeLogo variant="dark" className="h-[clamp(5rem,18vw,9rem)] w-auto max-w-[min(85vw,200px)]" alt="Hajime" />
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          New password
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
        <h1 className="font-display text-lg font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password you haven&apos;t used elsewhere.
        </p>

        {!token ? (
          <p className="mt-6 text-sm text-destructive">This link is missing a reset token.</p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp-password">New password</Label>
              <Input
                id="rp-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirm</Label>
              <Input
                id="rp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="touch-manipulation"
              />
            </div>
            <Button type="submit" className="h-11 w-full touch-manipulation" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
