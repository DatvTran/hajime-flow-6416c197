import { Fragment, useEffect, useMemo, useState } from "react";
import type { Account } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { HajimeLogo } from "@/components/HajimeLogo";
import { sendStoreInvitation } from "@/lib/api-v1-mutations";
import {
  defaultStoreInviteMessage,
  formatInviteExpiry,
  INVITE_LINK_TTL_DAYS,
} from "@/lib/account-setup-invite";
import { Check, Info, Loader2, Send, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/AppDataContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

type SentSummary = {
  storeName: string;
  email: string;
  expiresLabel: string;
  repName: string;
  pendingApproval: boolean;
  inviteUrl?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Distributor retail accounts vs sales rep territory accounts */
  variant: "distributor" | "sales_rep";
  wholesalerLabel?: string;
  onAccountCreated?: (account: Account) => void;
};

function mapServerAccount(row: Record<string, unknown>, contactName: string, contactRole: string): Account {
  const id = String(row.id ?? "");
  const tradingName = String(row.trading_name ?? row.name ?? "");
  const legalName = String(row.name ?? tradingName);
  const market = String(row.market ?? "");
  const [city = "", country = "Canada"] = market.includes(",")
    ? market.split(",").map((s) => s.trim())
    : [market, "Canada"];
  return {
    id,
    legalName,
    tradingName,
    country,
    city,
    type: (row.type as Account["type"]) || "retail",
    contactName,
    contactRole,
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    salesOwner: String(row.sales_owner ?? "Unassigned"),
    paymentTerms: String(row.payment_terms ?? "Net 30"),
    firstOrderDate: "",
    lastOrderDate: "",
    avgOrderSize: 0,
    status: (row.status as Account["status"]) || "prospect",
    tags: ["onboarding", "invite-sent"],
    onboardingPipeline: "sales_intake",
  };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function AccountSetupInviteDialog({
  open,
  onOpenChange,
  variant,
  wholesalerLabel,
  onAccountCreated,
}: Props) {
  const { user } = useAuth();
  const { data } = useAppData();
  const orgLabel =
    wholesalerLabel?.trim() ||
    data.operationalSettings?.companyName?.trim() ||
    (variant === "distributor" ? user?.displayName : null) ||
    "your wholesaler";

  const [step, setStep] = useState<"invite" | "sent">("invite");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<SentSummary | null>(null);

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  /** Distributor: CRM email of assigned rep, or "" for unassigned (wholesaler only). */
  const [assignedRepEmail, setAssignedRepEmail] = useState("");

  const distributorReps = useMemo(() => {
    if (variant !== "distributor" || !user?.id) return [];
    const distId = String(user.id);
    return (data.teamMembers ?? [])
      .filter(
        (m) =>
          m.role === "sales_rep" &&
          m.isActive !== false &&
          (!m.managedByUserId || m.managedByUserId === distId),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [variant, user?.id, data.teamMembers]);

  const selectedRep = useMemo(
    () => distributorReps.find((r) => r.email === assignedRepEmail),
    [distributorReps, assignedRepEmail],
  );

  const repLabel = useMemo(() => {
    if (!user) return "—";
    if (variant === "sales_rep") {
      return resolveSalesRepLabelForSession(user.email, user.displayName ?? "");
    }
    if (selectedRep) return selectedRep.displayName;
    return user.displayName?.trim() || user.email;
  }, [user, variant, selectedRep]);

  useEffect(() => {
    if (open) {
      setMessage(defaultStoreInviteMessage(orgLabel, repLabel));
    }
  }, [open, orgLabel, repLabel]);

  useEffect(() => {
    if (!open) {
      setStep("invite");
      setSent(null);
      setSubmitting(false);
      setStoreName("");
      setEmail("");
      setMessage("");
      setAssignedRepEmail("");
    }
  }, [open]);

  const ready = Boolean(storeName.trim() && email.trim());

  const emailGreeting = useMemo(() => {
    const store = storeName.trim();
    return store ? store.split(/\s+/)[0] : "";
  }, [storeName]);

  const handleDiscard = () => onOpenChange(false);

  const handleSend = async () => {
    if (!ready) {
      toast.error("Store name and invitation email are required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await sendStoreInvitation({
        storeName: storeName.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim() || undefined,
        type: "retail",
        salesOwner: repLabel,
        ...(variant === "distributor" &&
          assignedRepEmail.trim() !== "" && {
            assignedSalesRepEmail: assignedRepEmail.trim().toLowerCase(),
          }),
      });

      const accountRow = result.data?.account as Record<string, unknown>;
      const mapped = mapServerAccount(accountRow, storeName.trim(), "—");
      onAccountCreated?.(mapped);

      const pending = Boolean(result.pendingApproval);
      const resent = Boolean((result as { invitationResent?: boolean }).invitationResent);
      const inv = result.invite;
      let detail = resent
        ? "Invitation resent for this prospect account."
        : "Invitation processed.";
      if (inv?.status === "sent" || inv?.status === "logged") {
        detail = inv.emailDispatched
          ? resent
            ? "Invitation email resent — they can open the link to complete the application."
            : "Invitation email sent — they can open the link to complete setup."
          : "Invite created — check server logs for the link if email is not configured.";
      } else if (pending) {
        detail =
          inv?.reason ||
          "Application link sent — wholesaler must approve before ordering is enabled.";
      } else if (inv?.status === "delivery_failed") {
        detail = "Account saved but the invitation email failed. Resend from account detail.";
      }

      if (inv?.inviteUrl) {
        console.info("[Hajime store invite URL]", inv.inviteUrl);
      }

      toast.success(
        pending ? "Application submitted" : resent ? "Invitation resent" : "Invitation sent",
        { description: detail },
      );

      setSent({
        storeName: storeName.trim(),
        email: email.trim().toLowerCase(),
        expiresLabel: formatInviteExpiry(inv?.expiresAt),
        repName: repLabel,
        pendingApproval: pending,
        inviteUrl: inv?.inviteUrl,
      });
      setStep("sent");
    } catch (e) {
      toast.error("Could not send invitation", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumb =
    variant === "distributor" ? "Retail accounts › New account" : "Accounts › New account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "!flex !max-w-none flex-col gap-0 overflow-hidden p-0",
          "left-[50%] top-[max(0.75rem,2vh)] max-h-[min(96vh,920px)] w-[min(calc(100vw-1.5rem),56rem)] max-w-[min(calc(100vw-1.5rem),56rem)] translate-x-[-50%] translate-y-0",
          step === "sent" &&
            "top-[50%] w-[min(calc(100vw-1.5rem),32rem)] max-w-lg translate-y-[-50%]",
        )}
      >
        {step === "invite" ? (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/80 bg-card/80 px-4 py-3 pr-12 backdrop-blur-sm sm:gap-3 sm:px-6 sm:pr-14">
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                {breadcrumb.split("›").map((part, i, arr) => (
                  <span key={part}>
                    {i > 0 ? (
                      <span className="mx-1.5 text-border">›</span>
                    ) : null}
                    {i === arr.length - 1 ? (
                      <strong className="font-medium text-foreground">{part.trim()}</strong>
                    ) : (
                      part.trim()
                    )}
                  </span>
                ))}
              </p>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={handleDiscard}>
                  Discard
                </Button>
                <Button type="button" size="sm" disabled={!ready || submitting} onClick={() => void handleSend()}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Send invitation
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto max-w-[820px]">
                <header className="mb-7 border-b border-border/60 pb-6">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    New account
                  </p>
                  <DialogTitle className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
                    Send store invitation
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-relaxed">
                    {variant === "distributor"
                      ? "An email will be sent to the store contact with a secure link to complete the New Licensee Application. You'll be notified when they submit."
                      : "An email will be sent to the store contact. Their application is routed to your wholesaler for approval before ordering is enabled."}
                  </DialogDescription>
                </header>

                <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                  <div className="flex flex-col gap-5">
                    <SectionCard title="Invitation">
                      <div className="flex flex-col gap-4">
                        {variant === "distributor" ? (
                          <div className="space-y-2">
                            <Label htmlFor="asi-rep">Assigned sales rep</Label>
                            <Select
                              value={assignedRepEmail || "__unassigned__"}
                              onValueChange={(v) =>
                                setAssignedRepEmail(v === "__unassigned__" ? "" : v)
                              }
                              disabled={submitting}
                            >
                              <SelectTrigger id="asi-rep" className="touch-manipulation">
                                <SelectValue placeholder="Select a rep (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__unassigned__">
                                  Unassigned — wholesaler only
                                </SelectItem>
                                {distributorReps.map((rep) => (
                                  <SelectItem key={rep.id} value={rep.email}>
                                    {rep.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {selectedRep
                                ? `${selectedRep.displayName} will own this account in their territory and appear as the contact in the email.`
                                : "Optional. Assign a field rep so the store appears on their account list."}
                            </p>
                            {distributorReps.length === 0 ? (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                No sales reps on your team yet. Add reps under CRM → Sales reps, then assign
                                them here.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/40 px-3.5 py-3">
                            <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                                Assigned sales rep
                              </p>
                              <p className="font-medium text-foreground">{repLabel}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Listed on the account and shown in the invitation email.
                              </p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Business name, licensee number, HST registration, shipping, and contacts are collected on
                          the licensee application after they open the link — you only need the store label and email
                          here.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="asi-store">Store / business name *</Label>
                          <Input
                            id="asi-store"
                            placeholder="e.g. Album Hair"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            disabled={submitting}
                            autoComplete="organization"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="asi-email">Invitation email *</Label>
                          <Input
                            id="asi-email"
                            type="email"
                            placeholder="contact@store.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={submitting}
                            autoComplete="email"
                          />
                          <p className="text-xs text-muted-foreground">
                            The secure application link is sent to this address.
                          </p>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Invitation message">
                      <div className="flex flex-col gap-3.5">
                        <div className="space-y-2">
                          <Label htmlFor="asi-message">Personal note</Label>
                          <p className="text-xs text-muted-foreground">Appended to the standard email</p>
                          <Textarea
                            id="asi-message"
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={submitting}
                            className="resize-none font-sans text-sm leading-relaxed"
                          />
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3.5 py-2.5">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                          <p className="text-xs text-foreground/90">
                            Link expires in <strong>{INVITE_LINK_TTL_DAYS} days</strong>. One click opens the secure
                            application form.
                          </p>
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Email preview
                    </p>
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
                      <div className="flex flex-col gap-1 border-b border-border bg-muted/60 px-4 py-2.5 text-[11px] text-muted-foreground">
                        <div>
                          To: <span className="text-foreground">{email || "contact@store.com"}</span>
                        </div>
                        <div>
                          From: <span className="text-foreground">noreply@hajimeops.com</span>
                        </div>
                        <div>
                          Subject:{" "}
                          <span className="font-medium text-foreground">
                            Complete your {orgLabel} account setup
                          </span>
                        </div>
                      </div>
                      <div className="px-5 py-6">
                        <div className="mb-5 flex items-center gap-2.5 border-b border-border pb-4">
                          <HajimeLogo className="h-[22px] w-auto" />
                          <span className="font-display text-base font-semibold">Hajime</span>
                        </div>
                        <p className="mb-1 text-sm text-muted-foreground">Hi{emailGreeting ? ` ${emailGreeting}` : ""},</p>
                        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {message || "—"}
                        </p>
                        <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-4">
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                            Your application
                          </p>
                          <p className="font-display text-lg font-medium">{storeName || "Your store"}</p>
                          <p className="mb-3 text-xs text-muted-foreground">
                            {orgLabel} · New Licensee Application
                          </p>
                          <span className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                            Complete application →
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Questions? Reply to this email or contact your Hajime representative,{" "}
                          {repLabel}.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        What happens next
                      </p>
                      <ul className="divide-y divide-border text-sm">
                        {[
                          ["Store receives email", "Instant"],
                          ["Business info & licensee form", "~5 min"],
                          [
                            variant === "sales_rep" ? "Wholesaler reviews" : "You review & approve",
                            "1 business day",
                          ],
                          ["Account activated", "Ordering enabled"],
                        ].map(([label, timing]) => (
                          <li key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                            <span className="text-foreground">{label}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{timing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-5 py-3 sm:px-6">
              <Button type="button" variant="outline" onClick={handleDiscard} disabled={submitting}>
                Discard
              </Button>
              <Button type="button" disabled={!ready || submitting} onClick={() => void handleSend()}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send invitation
              </Button>
            </DialogFooter>
          </>
        ) : sent ? (
          <div className="flex flex-col items-center px-6 py-10 text-center sm:py-14">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-success/25 bg-success/10">
              <Check className="h-6 w-6 text-success" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Invitation sent</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {sent.pendingApproval ? (
                <>
                  An email with the New Licensee Application link was sent to{" "}
                  <strong className="text-foreground">{sent.email}</strong>. They can complete the form now; ordering
                  activates after wholesaler approval.
                </>
              ) : (
                <>
                  An email has been sent to <strong className="text-foreground">{sent.email}</strong> with a secure link
                  to complete the New Licensee Application. You&apos;ll receive a notification when they submit.
                </>
              )}
            </p>
            <div className="mt-6 w-full max-w-md rounded-xl border border-border bg-card p-4 text-left shadow-[var(--shadow-soft)]">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {[
                  ["Store", sent.storeName],
                  ["Sent to", sent.email],
                  ["Link expires", sent.expiresLabel],
                  ["Assigned rep", sent.repName],
                ].map(([k, v]) => (
                  <Fragment key={k}>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="text-foreground">{v}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
            {sent.inviteUrl ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  void navigator.clipboard.writeText(sent.inviteUrl!).then(() => {
                    toast.success("Invite link copied");
                  });
                }}
              >
                Copy invite link (dev)
              </Button>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Back to accounts
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
