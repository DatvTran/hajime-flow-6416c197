import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getExpoLead, getExpoLeads, patchExpoLead, createExportOrder } from "@/lib/api-v1";
import {
  EXPO_SCORES,
  EXPO_STATUSES,
  formatExpoLeadHeadline,
  optionLabel,
  slaForScore,
  type ExpoLead,
} from "@/lib/expo-leads";
import {
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function canHqExpo(role: string | undefined) {
  return role === "brand_operator" || role === "founder_admin" || role === "operations";
}

function scoreTone(score: ExpoLead["score"]): "red" | "amber" | "green" | "ink" | "neutral" {
  if (score === "A") return "red";
  if (score === "B") return "ink";
  if (score === "C") return "amber";
  if (score === "D") return "green";
  return "neutral";
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HqExpoLeadsPage() {
  const { user } = useAuth();
  const { leadId } = useParams();
  if (!user || !canHqExpo(user.role)) return <Navigate to="/" replace />;
  if (leadId) return <HqExpoLeadDetail leadId={leadId} />;
  return <HqExpoLeadList />;
}

function HqExpoLeadList() {
  const [q, setQ] = useState("");
  const [score, setScore] = useState("");
  const [rows, setRows] = useState<ExpoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExpoLeads({
        limit: 100,
        q: q.trim() || undefined,
        score: score || undefined,
      });
      setRows(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load leads");
    } finally {
      setLoading(false);
    }
  }, [q, score]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title="Expo leads"
        description="Buyer registrations from the Connect QR. Score A–D after the conversation — never shown to the buyer."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name, company, market, ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScore("")}
            className={cn("rounded-full border px-3 py-1 text-xs", !score ? "border-accent bg-accent/10" : "border-border")}
          >
            All
          </button>
          {EXPO_SCORES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setScore(s.value)}
              className={cn("rounded-full border px-3 py-1 text-xs", score === s.value ? "border-accent bg-accent/10" : "border-border")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading leads
        </div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">
          No registrations yet. Open{" "}
          <Link to="/connect" className="text-accent underline-offset-2 hover:underline">
            /connect
          </Link>{" "}
          or print the sign at{" "}
          <Link to="/connect-sign" className="text-accent underline-offset-2 hover:underline">
            /connect-sign
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Buyer</th>
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Volume</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
                  onClick={() => navigate(`/expo-leads/${row.displayId}`)}
                >
                  <td className="px-3 py-2.5 font-mono text-[12px]">{row.displayId}</td>
                  <td className="px-3 py-2.5">
                    {row.score ? (
                      <HqOperatorPill tone={scoreTone(row.score)}>{optionLabel("score", row.score)}</HqOperatorPill>
                    ) : (
                      <HqOperatorPill tone="neutral">Unscored</HqOperatorPill>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{row.fullName}</div>
                    <div className="text-muted-foreground">{row.companyName}</div>
                  </td>
                  <td className="px-3 py-2.5">{row.countryMarket}</td>
                  <td className="px-3 py-2.5">{optionLabel("business", row.businessType)}</td>
                  <td className="px-3 py-2.5">{optionLabel("volume", row.volume)}</td>
                  <td className="px-3 py-2.5">{optionLabel("status", row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HqOperatorPage>
  );
}

function HqExpoLeadDetail({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<ExpoLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const res = await getExpoLead(leadId);
    setLead(res.data);
  }, [leadId]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [reload]);

  async function save(partial: Record<string, unknown>) {
    if (!lead) return;
    setSaving(true);
    setError(null);
    try {
      const res = await patchExpoLead(lead.displayId, {
        staffName: user?.displayName,
        staffUserId: user?.id,
        ...partial,
      });
      setLead(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!lead && !error) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading
      </div>
    );
  }

  if (!lead) {
    return (
      <HqOperatorPage>
        <Alert variant="destructive">
          <AlertDescription>{error ?? "Lead not found"}</AlertDescription>
        </Alert>
        <Link to="/expo-leads" className="mt-4 inline-block text-sm text-accent">
          Back to leads
        </Link>
      </HqOperatorPage>
    );
  }

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title={lead.displayId}
        rawTitle
        description={formatExpoLeadHeadline(lead)}
        rawDescription
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={async () => {
                if (!lead) return;
                setSaving(true);
                try {
                  const res = await createExportOrder({
                    expoLeadId: lead.displayId,
                    buyerName: lead.fullName,
                    buyerCompany: lead.companyName,
                    buyerEmail: lead.businessEmail,
                    territory: lead.countryMarket,
                    destinationCountry: lead.countryMarket,
                    lines: [{ sku: "first_press_750", cases: 25 }],
                  });
                  toast.success("Export file opened", { description: res.data.displayId });
                  navigate(`/export-orders/${res.data.displayId}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not open file");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Open export file
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/expo-leads">All leads</Link>
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-medium">Buyer</h2>
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{lead.fullName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium">{lead.companyName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Title</dt>
              <dd>{lead.jobTitle}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>
                <a className="text-accent underline-offset-2 hover:underline" href={`mailto:${lead.businessEmail}`}>
                  {lead.businessEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mobile</dt>
              <dd>{lead.mobile || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Market</dt>
              <dd>{lead.countryMarket}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Website</dt>
              <dd>{lead.companyWebsite || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd>{optionLabel("business", lead.businessType)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expression</dt>
              <dd>{optionLabel("expression", lead.expression)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Format</dt>
              <dd>{optionLabel("format", lead.bottleFormat)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Volume</dt>
              <dd>{optionLabel("volume", lead.volume)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Territory</dt>
              <dd>{optionLabel("territory", lead.territory)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timing</dt>
              <dd>{optionLabel("timing", lead.timing)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Interests</dt>
              <dd>{lead.interests.map((i) => optionLabel("interest", i)).join(" · ") || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Notes from buyer</dt>
              <dd className="whitespace-pre-wrap">{lead.message || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-medium">Booth / follow-up</h2>
          <p className="text-[12px] text-muted-foreground">{slaForScore(lead.score)}</p>

          <div className="space-y-1.5">
            <Label>Score</Label>
            <div className="flex flex-wrap gap-2">
              {EXPO_SCORES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={saving}
                  onClick={() => void save({ score: s.value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px]",
                    lead.score === s.value ? "border-accent bg-accent/10" : "border-border",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {EXPO_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={saving}
                  onClick={() => void save({ status: s.value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px]",
                    lead.status === s.value ? "border-accent bg-accent/10" : "border-border",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="metAt">Date / time met</Label>
            <Input
              id="metAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(lead.metAt || lead.submittedAt)}
              onBlur={(e) => {
                if (e.target.value) void save({ metAt: new Date(e.target.value).toISOString() });
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staffName">Staff member</Label>
            <Input
              id="staffName"
              defaultValue={lead.staffName || user?.displayName || ""}
              onBlur={(e) => void save({ staffName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            {(
              [
                ["tastingCompleted", "Tasting completed", lead.tastingCompleted],
                ["sampleRequested", "Sample requested", lead.sampleRequested],
                ["pricingRequested", "Pricing requested", lead.pricingRequested],
                ["distributorDeckSent", "Distributor deck sent", lead.distributorDeckSent],
              ] as const
            ).map(([key, label, checked]) => (
              <label key={key} className="flex items-center gap-2 text-[13px]">
                <Checkbox checked={checked} onCheckedChange={(v) => void save({ [key]: v === true })} disabled={saving} />
                {label}
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="followUpOn">Follow-up date</Label>
            <Input
              id="followUpOn"
              type="date"
              defaultValue={lead.followUpOn ? String(lead.followUpOn).slice(0, 10) : ""}
              onBlur={(e) => void save({ followUpOn: e.target.value || null })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nextAction">Next action</Label>
            <Textarea
              id="nextAction"
              defaultValue={lead.nextAction ?? ""}
              rows={3}
              onBlur={(e) => void save({ nextAction: e.target.value })}
            />
          </div>
        </div>
      </div>
    </HqOperatorPage>
  );
}
