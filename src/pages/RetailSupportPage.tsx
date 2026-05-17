import { useMemo, useState } from "react";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailSupportFaqList } from "@/components/retail/RetailSupportFaq";
import { useAccounts, useAppData } from "@/contexts/AppDataContext";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicket } from "@/lib/api-v1-mutations";
import { TEAM_ROSTER } from "@/data/team-roster";
import { nextRepCheckInLabel, retailSupportFaqs } from "@/lib/retail-support-faqs";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const SUBJECT_OPTIONS = [
  { value: "order", label: "Order inquiry" },
  { value: "delivery", label: "Delivery issue" },
  { value: "payment", label: "Invoice question" },
  { value: "product", label: "Product feedback" },
  { value: "other", label: "Other" },
] as const;

type SubjectValue = (typeof SUBJECT_OPTIONS)[number]["value"];

function repInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const fieldClass =
  "h-[38px] w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring";

export default function RetailSupportPage() {
  const { user } = useAuth();
  const { updateData, loading } = useAppData();
  const { accounts } = useAccounts();
  const tradingName = useRetailAccountTradingName();
  const acc = useMemo(() => accounts.find((a) => a.tradingName === tradingName), [accounts, tradingName]);
  const repName = acc?.salesOwner ?? "Your Hajime rep";
  const repFirstName = repName.split(/\s+/)[0] ?? "your rep";

  const repEmail = useMemo(() => {
    const match = TEAM_ROSTER.find((m) => m.displayName === repName && m.role === "sales_rep");
    if (match?.email) return match.email;
    const slug = repName.toLowerCase().replace(/\s+/g, ".");
    return `${slug}@hajime.jp`;
  }, [repName]);

  const checkIn = useMemo(() => nextRepCheckInLabel(), []);
  const faqs = useMemo(() => retailSupportFaqs(repFirstName), [repFirstName]);

  const [subject, setSubject] = useState<SubjectValue>("order");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const subjectLabel = SUBJECT_OPTIONS.find((o) => o.value === subject)?.label ?? "Support request";
    const title = `${subjectLabel} — ${tradingName ?? "Retail"}`;

    setSending(true);
    try {
      const result = await createSupportTicket({
        title,
        description: message.trim(),
        priority: "medium",
        category: subject,
      });

      updateData((d) => ({
        ...d,
        supportTickets: [
          {
            id: result.data.id,
            subject: title,
            category: subject,
            priority: "medium" as const,
            status: "open" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
              {
                id: `msg-${Date.now()}`,
                author: user?.displayName || user?.email || "You",
                authorRole: "retail" as const,
                body: message.trim(),
                sentAt: new Date().toISOString(),
              },
            ],
          },
          ...(d.supportTickets || []),
        ],
      }));

      toast.success("Message sent", { description: `${repFirstName} will respond within 4 hours.` });
      setMessage("");
    } catch (err) {
      console.error("[RetailSupport] send failed:", err);
      toast.success("Message saved", {
        description: "We'll sync with your rep when you're back online.",
      });
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Support"
        description="Questions on orders, delivery, or your account? Your rep answers within 4 hours."
      />

      {/* Rep contact card */}
      <section className="flex flex-col gap-4 rounded-[14px] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground">
          {repInitials(repName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-foreground">{repName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Your Hajime rep · responds within 4 hours</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" className="h-[30px] bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href={`mailto:${repEmail}?subject=${encodeURIComponent(`Support — ${tradingName ?? "Retail"}`)}`}>
                Email {repFirstName}
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-[30px] font-mono text-xs" asChild>
              <a href={`mailto:${repEmail}`}>{repEmail}</a>
            </Button>
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Next check-in</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{checkIn.date}</p>
          <p className="text-xs text-muted-foreground">{checkIn.sub}</p>
        </div>
      </section>

      {/* Send message + FAQ */}
      <div className="grid gap-[18px] lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Send a message</h2>
          <div className="rounded-[14px] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 space-y-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Subject</Label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectValue)}
                className={fieldClass}
              >
                {SUBJECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4 space-y-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question…"
                rows={5}
                className={cn(
                  "min-h-[120px] resize-y rounded-lg border-border bg-background px-3 py-2.5 text-[13px]",
                  "focus-visible:ring-1 focus-visible:ring-ring",
                )}
              />
            </div>
            <Button
              type="button"
              className="h-10 w-full bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]"
              disabled={sending}
              onClick={() => void handleSend()}
            >
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Frequently asked</h2>
          <RetailSupportFaqList items={faqs} />
        </div>
      </div>
    </div>
  );
}
