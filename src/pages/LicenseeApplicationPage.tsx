import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HajimeLogo } from "@/components/HajimeLogo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LicenseeApplicationWizard } from "@/components/licensee/LicenseeApplicationWizard";
import { fetchLicenseeApplicationContext } from "@/lib/licensee-application-api";
import { defaultLicenseeForm } from "@/lib/licensee-application-form";
import type { LicenseeApplicationContext, LicenseeApplicationFormData } from "@/types/licensee-application";

export default function LicenseeApplicationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [context, setContext] = useState<LicenseeApplicationContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<{ storeName: string; salesRepName: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError("This link is missing an invitation token. Ask your sales representative to send a new invite.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchLicenseeApplicationContext(token);
        if (cancelled) return;
        setContext(res.data);
        if (res.data.alreadySubmitted) {
          setSubmitted({
            storeName: res.data.storeName,
            salesRepName: res.data.salesRepName,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load application");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const initialData = useMemo((): LicenseeApplicationFormData | null => {
    if (!context) return null;
    return defaultLicenseeForm({
      businessName: context.storeName || context.tradingName || "",
      contactEmail: context.email || "",
    });
  }, [context]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <HajimeLogo className="h-7 w-auto" />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">New Licensee Application</p>
              <p className="text-xs text-muted-foreground">{context?.wholesalerName ?? "Hajime"}</p>
            </div>
          </div>
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <p className="text-sm">Loading your application…</p>
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : submitted ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-success/25 bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Application submitted</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thank you. Your New Licensee Application for{" "}
              <strong className="text-foreground">{submitted.storeName}</strong> has been received.{" "}
              <strong className="text-foreground">{submitted.salesRepName}</strong> and your wholesaler will review it
              — usually within one business day. You will receive an email when your account is activated for ordering.
            </p>
            <Button type="button" variant="outline" className="mt-8" asChild>
              <Link to="/login">Return to sign in</Link>
            </Button>
          </div>
        ) : context && initialData ? (
          <>
            <div className="mb-8 border-b border-border/60 pb-6">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {context.storeName || "Your store"}
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Complete your application
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Assigned rep: <strong className="text-foreground">{context.salesRepName}</strong> · Invitation for{" "}
                <strong className="text-foreground">{context.email}</strong>
              </p>
            </div>
            <LicenseeApplicationWizard
              context={context}
              initialData={initialData}
              onSubmitted={(s) => setSubmitted(s)}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
