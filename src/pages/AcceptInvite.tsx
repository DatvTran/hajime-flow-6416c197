import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HajimeLogo } from "@/components/HajimeLogo";
import { homePathForRole, type HajimeRole } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const ROLE_LABELS: Record<string, string> = {
  sales_rep: "Sales Rep",
  retail: "Retail Store",
  distributor: "Distributor",
  manufacturer: "Manufacturer",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
};

type InvitePreview = {
  email: string;
  displayName: string;
  role: string;
  tenantName: string;
  expiresAt: string;
};

function isHajimeRole(r: string): r is HajimeRole {
  const allowed = [
    "manufacturer",
    "brand_operator",
    "distributor",
    "retail",
    "sales_rep",
    "founder_admin",
    "sales",
    "operations",
    "finance",
  ];
  return allowed.includes(r);
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("This link is missing an invitation token. Ask your admin to send a new invite.");
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/invite-preview?token=${encodeURIComponent(token)}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || "Invalid or expired invitation");
        }
        if (cancelled) return;
        setPreview(body as InvitePreview);
        setDisplayName(body.displayName || "");
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load invitation");
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const roleLabel = useMemo(() => {
    if (!preview?.role) return "";
    return ROLE_LABELS[preview.role] || preview.role;
  }, [preview?.role]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!token || !preview) return;

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    const name = displayName.trim();
    if (!name) {
      setSubmitError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: preview.email,
          password,
          displayName: name,
          role: preview.role,
          inviteToken: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("hajime_access_token", data.accessToken);
      localStorage.setItem("hajime_refresh_token", data.refreshToken);

      const r = data.user?.role;
      const dest = isHajimeRole(r) ? homePathForRole(r) : "/";
      window.location.assign(dest);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
        <Alert className="max-w-md">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button asChild variant="link" className="mt-4">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (loadingPreview) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Loading invitation…</p>
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{loadError || "Invitation not found."}</AlertDescription>
        </Alert>
        <Button asChild variant="link" className="mt-4">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--accent) / 0.06), transparent)",
        }}
      />

      <div className="relative z-10 mb-8 flex flex-col items-center text-center">
        <HajimeLogo
          variant="dark"
          className="h-[clamp(5rem,18vw,8rem)] w-auto max-w-[min(85vw,220px)]"
          alt="Hajime logo"
        />
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          Accept invitation
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Join {preview.tenantName}</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;re invited as <span className="font-medium text-foreground">{roleLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-sm">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-muted-foreground">{preview.email}</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Your name</Label>
            <Input
              id="invite-name"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Create password</Label>
            <Input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-confirm">Confirm password</Label>
            <Input
              id="invite-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full touch-manipulation" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Confirm email & sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
