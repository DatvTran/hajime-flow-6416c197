import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HajimeLogo } from "@/components/HajimeLogo";
import { toast } from "@/components/ui/sonner";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/password-reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        delivery?: "none" | "email" | "logged";
        mailIssue?: "no_api_key" | "invalid_resend_key" | "resend_error" | "resend_network";
      };
      const delivery = body.delivery;
      const mailIssue = body.mailIssue;

      if (delivery === "email") {
        toast.success("Check your email", {
          description:
            "If this address has an account, you should receive password reset instructions shortly.",
        });
      } else if (delivery === "logged") {
        const loggedDescriptions: Record<NonNullable<typeof mailIssue>, string> = {
          no_api_key:
            "Email is not configured on the server (RESEND_API_KEY). Your admin can find the reset link in Fly logs after a request, or add a Resend API key and RESEND_FROM_EMAIL to enable mail.",
          invalid_resend_key:
            "Resend rejected the API key (invalid or revoked). In the Resend dashboard, create a new API key, then set it on Fly: fly secrets set RESEND_API_KEY=re_… Also ensure RESEND_FROM_EMAIL uses your verified domain (e.g. noreply@yourdomain.com).",
          resend_error:
            "The email provider returned an error. Check Fly logs for “Resend password-reset failed” and fix RESEND_FROM_EMAIL / domain verification in Resend. The reset URL may still be logged under [Password reset].",
          resend_network:
            "Could not reach the email provider from the server. Try again later or ask your admin to check network/Firewall; the reset URL may be in Fly logs.",
        };
        toast.message("Reset link not emailed", {
          description:
            mailIssue && loggedDescriptions[mailIssue]
              ? loggedDescriptions[mailIssue]
              : "Mail was not sent (Resend misconfiguration or network). Fix: create a new API key in Resend, then run fly secrets set RESEND_API_KEY=re_… and set RESEND_FROM_EMAIL to an address on your verified domain. Until then, copy the reset URL from Fly logs (search for [Password reset]).",
        });
      } else {
        toast.success("Request received", {
          description:
            "If this address has an account, reset instructions were issued. If you do not receive mail, your server may be logging the reset link instead of sending it.",
        });
      }
    } catch {
      toast.error("Request failed", { description: "Try again in a moment." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="relative z-10 mb-8 flex flex-col items-center text-center">
        <HajimeLogo variant="dark" className="h-[clamp(5rem,18vw,9rem)] w-auto max-w-[min(85vw,200px)]" alt="Hajime" />
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          Reset password
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
        <h1 className="font-display text-lg font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your work email — we&apos;ll send a link to choose a new password.
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fp-email">Email</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="touch-manipulation"
            />
          </div>
          <Button type="submit" className="h-11 w-full touch-manipulation" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
