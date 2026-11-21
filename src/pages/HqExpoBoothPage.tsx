import { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Minus, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstPressCapacity, issueExportDoc, saveBoothLead, type BoothSaveResult, type FirstPressCapacityMonth } from "@/lib/api-v1";
import {
  canHqBooth,
  enqueueBooth,
  isRetryable,
  listOutbox,
  loadCapacitySnapshot,
  newSubmissionKey,
  removeEntry,
  requestPersistentStorage,
  saveCapacitySnapshot,
  subscribeOutbox,
  updateEntry,
  type BoothPayload,
  type OutboxEntry,
} from "@/lib/booth-outbox";
import { BoothOutboxPanel } from "@/components/expo/BoothOutboxPanel";
import { DeliveryMonthStrip } from "@/components/expo/DeliveryMonthStrip";
import { useOnline } from "@/hooks/useOnline";
import { getOfflineStatus, retryOfflineDownload, subscribeOfflineStatus, type OfflineStatus } from "@/lib/offline-status";
import { FIRST_PRESS_MONTHLY_ML, firstPressMl, litresLabel, monthLabel } from "@/lib/first-press-capacity";
import {
  caseFobFromUnit,
  defaultUnitFob,
  listFobCaseUsd,
  priceLines,
  skuMeta,
  unitFobFromCase,
  type ExportSkuCode,
} from "@/lib/export-commercial";
import { HqBtnLink, HqOperatorPage, HqOperatorPageHeader, HqOperatorPill } from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/** Second Bloom is off the expo until its cost is confirmed. Keep in sync with EXPO_SKUS in server/lib/export-orders.mjs. */
const ROWS: { sku: ExportSkuCode; name: string; size: string }[] = [
  { sku: "first_press_750", name: "First Press Coffee Rhum", size: "750 ml" },
  { sku: "first_press_200", name: "First Press Coffee Rhum", size: "200 ml" },
];

type Buyer = {
  company: string;
  contact: string;
  email: string;
  country: string;
  city: string;
  address: string;
  buyerPo: string;
  destination: string;
  importer: string;
};

const EMPTY_BUYER: Buyer = {
  company: "",
  contact: "",
  email: "",
  country: "",
  city: "",
  address: "",
  buyerPo: "",
  destination: "",
  importer: "",
};

function listPrices(): Record<ExportSkuCode, string> {
  return Object.fromEntries(ROWS.map((r) => [r.sku, listFobCaseUsd(r.sku).toFixed(2)])) as Record<ExportSkuCode, string>;
}

function zeroCases(): Record<ExportSkuCode, number> {
  return Object.fromEntries(ROWS.map((r) => [r.sku, 0])) as Record<ExportSkuCode, number>;
}

function hktMonthNow(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 7);
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString([], sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function useOfflineStatus(): OfflineStatus {
  return useSyncExternalStore(subscribeOfflineStatus, getOfflineStatus);
}

const OFFLINE_TEXT: Record<Exclude<OfflineStatus, "checking">, string> = {
  ready: "Ready for offline: the booth opens and saves on this device without a connection.",
  downloading: "Downloading the booth for offline… keep this page open on Wi-Fi.",
  failed: "The offline download didn't finish.",
  unsupported:
    "This browser can't save the booth for offline. Open supply.drinkhajime.jp in Safari (not a Private tab), or use the Home Screen icon. Also check Settings > Apps > Safari > Block All Cookies is off.",
};

function usd(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const stepBtn =
  "flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground disabled:opacity-40";

export default function HqExpoBoothPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<Buyer>(EMPTY_BUYER);
  const [cases, setCases] = useState(zeroCases);
  const [unitText, setUnitText] = useState(listPrices);
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [saved, setSaved] = useState<BoothSaveResult | null>(null);
  const [capacity, setCapacity] = useState<FirstPressCapacityMonth[] | null>(null);
  const [month, setMonth] = useState("");
  const [capacityAt, setCapacityAt] = useState<string | null>(null);
  const [queued, setQueued] = useState<OutboxEntry | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const online = useOnline();
  const offlineStatus = useOfflineStatus();

  const loadCapacity = useCallback(() => {
    const fromSnapshot = () =>
      loadCapacitySnapshot()
        .then((snap) => {
          if (!snap) return setCapacity(null);
          const now = hktMonthNow();
          setCapacity(snap.months.filter((m) => m.deliveryMonth > now));
          setCapacityAt(snap.at);
        })
        .catch(() => setCapacity(null));
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      void fromSnapshot();
      return;
    }
    getFirstPressCapacity()
      .then((r) => {
        setCapacity(r.data);
        setCapacityAt(null);
        void saveCapacitySnapshot(r.data).catch(() => undefined);
      })
      .catch(() => void fromSnapshot());
  }, []);

  useEffect(requestPersistentStorage, []);

  const queuedKey = queued?.key;
  useEffect(() => {
    if (!queuedKey) return;
    return subscribeOutbox(() => {
      void listOutbox().then((entries) => {
        const next = entries.find((e) => e.key === queuedKey);
        if (next) setQueued(next);
      });
    });
  }, [queuedKey]);
  useEffect(loadCapacity, [online, loadCapacity]);

  const priced = useMemo(() => {
    return priceLines(
      ROWS.map((r) => {
        const typed = Number(unitText[r.sku]);
        const meta = skuMeta(r.sku);
        const unit =
          unitText[r.sku].trim() !== "" && Number.isFinite(typed) && typed >= 0 && meta
            ? unitFobFromCase(typed, meta.bottlesPerCase)
            : defaultUnitFob(r.sku);
        return { sku: r.sku, cases: cases[r.sku], unitFobUsd: unit };
      }),
    );
  }, [cases, unitText]);

  const quoteMl = firstPressMl(ROWS.map((r) => ({ sku: r.sku, cases: cases[r.sku] })));
  const overMonth = quoteMl > FIRST_PRESS_MONTHLY_ML;
  const picked = capacity?.find((m) => m.deliveryMonth === month) ?? null;
  const overLeft = picked != null && quoteMl > picked.leftMl;

  if (!user || !canHqBooth(user.role)) return <Navigate to="/" replace />;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(buyer.email.trim());
  const ready =
    buyer.company.trim() &&
    buyer.contact.trim() &&
    emailOk &&
    buyer.country.trim() &&
    buyer.city.trim() &&
    buyer.address.trim() &&
    priced.lines.length > 0 &&
    !overMonth;

  const setField = (key: keyof Buyer) => (e: { target: { value: string } }) =>
    setBuyer((b) => ({ ...b, [key]: e.target.value }));

  function setCaseCount(sku: ExportSkuCode, next: number) {
    setCases((c) => ({ ...c, [sku]: Math.max(0, next) }));
  }

  function reset() {
    setBuyer(EMPTY_BUYER);
    setCases(zeroCases());
    setUnitText(listPrices());
    setEmailed(false);
    setSaved(null);
    setQueued(null);
    setEditingKey(null);
    setMonth("");
    loadCapacity();
  }

  function editEntry(entry: OutboxEntry) {
    const p = entry.payload as Record<string, unknown>;
    setBuyer(Object.fromEntries(Object.keys(EMPTY_BUYER).map((k) => [k, String(p[k] ?? "")])) as Buyer);
    const lines = Array.isArray(p.lines) ? (p.lines as { sku: ExportSkuCode; cases: number; unitFobUsd?: number }[]) : [];
    setCases(Object.fromEntries(ROWS.map((r) => [r.sku, lines.find((l) => l.sku === r.sku)?.cases ?? 0])) as Record<ExportSkuCode, number>);
    setUnitText(
      Object.fromEntries(
        ROWS.map((r) => {
          const u = lines.find((l) => l.sku === r.sku)?.unitFobUsd;
          const meta = skuMeta(r.sku);
          const caseUsd =
            typeof u === "number" && meta ? caseFobFromUnit(u, meta.bottlesPerCase) : listFobCaseUsd(r.sku);
          return [r.sku, caseUsd.toFixed(2)];
        }),
      ) as Record<ExportSkuCode, string>,
    );
    const m = String(p.requestedMonth || "");
    setMonth(m > hktMonthNow() ? m : "");
    setEditingKey(entry.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function emailQuotation(displayId: string) {
    if (emailing) return;
    setEmailing(true);
    try {
      const res = await issueExportDoc(displayId, "quotation");
      setEmailed(true);
      const mail = res.email;
      toast.success(mail?.sent ? "Quotation emailed" : "Quotation issued", {
        description: mail?.sent
          ? "The buyer has the prices, the deposit, and the wire details."
          : mail?.logged
            ? "Mail is not configured here, so the message was logged on the server."
            : "Saved on the file.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not email the quotation";
      if (msg === "BELOW_INTERNAL_FLOOR") {
        toast.error("Under the floor. A founder or brand operator approves the price on the order, then email it.", {
          action: { label: "Open order", onClick: () => navigate(`/export-orders/${displayId}`) },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setEmailing(false);
    }
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    const payload: BoothPayload = {
      ...buyer,
      submissionKey: editingKey ?? newSubmissionKey(),
      requestedMonth: month || undefined,
      lines: ROWS.filter((r) => cases[r.sku] > 0).map((r) => {
        const typed = Number(unitText[r.sku]);
        const meta = skuMeta(r.sku);
        const unit =
          unitText[r.sku].trim() !== "" && Number.isFinite(typed) && typed >= 0 && meta
            ? unitFobFromCase(typed, meta.bottlesPerCase)
            : defaultUnitFob(r.sku);
        return { sku: r.sku, cases: cases[r.sku], unitFobUsd: unit };
      }),
    };
    const keepOnIpad = async () => {
      if (editingKey) {
        await updateEntry(editingKey, { payload, status: "queued", error: undefined });
        setQueued((await listOutbox()).find((e) => e.key === editingKey) ?? null);
      } else {
        setQueued(await enqueueBooth(payload));
      }
      setEditingKey(null);
    };
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        await keepOnIpad();
        return;
      }
      const res = await saveBoothLead(payload);
      if (editingKey) await removeEntry(editingKey);
      setEditingKey(null);
      setSaved(res.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save this buyer";
      if (isRetryable(e)) {
        await keepOnIpad().catch(() => toast.error("Could not save on this iPad either. Keep the details and try again."));
      } else {
        if (editingKey) await updateEntry(editingKey, { payload, status: "attention", error: msg }).catch(() => undefined);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  if (queued) {
    return (
      <HqOperatorPage>
        <HqOperatorPageHeader
          title="Saved on this iPad"
          rawTitle
          description="The server couldn't be reached, so this buyer is stored on the iPad. It uploads by itself when you're back online and gets its lead and order numbers then. Email the quotation from the booth after that."
          rawDescription
        />
        <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HqOperatorPill tone="ink">Booth #{queued.ref}</HqOperatorPill>
            {queued.status === "synced" && queued.result ? (
              <>
                <HqOperatorPill tone="ink">{queued.result.lead.displayId}</HqOperatorPill>
                <HqOperatorPill tone="ink">{queued.result.order.displayId}</HqOperatorPill>
                <HqOperatorPill tone="green">Uploaded</HqOperatorPill>
              </>
            ) : queued.status === "attention" ? (
              <HqOperatorPill tone="red">Needs a fix</HqOperatorPill>
            ) : (
              <HqOperatorPill tone="amber">Waiting to upload</HqOperatorPill>
            )}
          </div>
          <p className="font-medium">{buyer.company}</p>
          <p className="font-display text-3xl tabular-nums">US$ {usd(priced.depositDueUsd)}</p>
          <p className="text-sm text-muted-foreground">
            Deposit due, half of US$ {usd(priced.subtotalUsd)}. Balance US$ {usd(priced.balanceDueUsd)}.
          </p>
          <Button type="button" className="h-12 w-full text-base" onClick={reset}>
            Next buyer
          </Button>
        </div>
      </HqOperatorPage>
    );
  }

  if (saved) {
    const id = saved.order.displayId;
    return (
      <HqOperatorPage>
        <HqOperatorPageHeader
          title="Saved"
          rawTitle
          description={`${saved.lead.displayId} · ${id}. Email uses the order’s issue action. Print opens the quotation and the browser’s save-as-PDF. The deposit stays pending until Record deposit on the order, after the pro forma.`}
          rawDescription
        />
        <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HqOperatorPill tone="ink">{saved.lead.displayId}</HqOperatorPill>
            <HqOperatorPill tone="ink">{id}</HqOperatorPill>
            <HqOperatorPill tone="amber">Deposit pending</HqOperatorPill>
            {emailed ? <HqOperatorPill tone="green">Quotation issued</HqOperatorPill> : null}
          </div>
          <p className="font-display text-3xl tabular-nums">US$ {usd(saved.order.depositDueUsd)}</p>
          <p className="text-sm text-muted-foreground">
            Deposit due, half of US$ {usd(saved.order.subtotalUsd)}. Balance US$ {usd(saved.order.balanceDueUsd)}.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" className="h-12" disabled={emailing} onClick={() => void emailQuotation(id)}>
              {emailing ? <Loader2 className="size-4 animate-spin" /> : null}
              {emailed ? "Email quotation again" : "Email quotation"}
            </Button>
            <HqBtnLink to={`/export-orders/${id}/docs/quotation?print=1`}>Print / Save PDF</HqBtnLink>
            <HqBtnLink to={`/export-orders/${id}#record-deposit`} variant="accent">
              Record deposit
            </HqBtnLink>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <HqBtnLink to={`/export-orders/${id}/docs/po_acceptance`} variant="outline">
              PO acceptance
            </HqBtnLink>
            <HqBtnLink to={`/export-orders/${id}/docs/proforma`} variant="outline">
              Pro forma
            </HqBtnLink>
          </div>
          <Button type="button" className="h-12 w-full text-base" onClick={reset}>
            Next buyer
          </Button>
        </div>
      </HqOperatorPage>
    );
  }

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title="Booth"
        description="One save writes the lead and the quotation-stage export order. Email and PDF use that order. The deposit stays pending until it is recorded there."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/expo-leads">Expo leads</Link>
          </Button>
        }
      />

      <p
        className={cn(
          "mb-4 text-sm",
          online ? "text-muted-foreground" : "rounded-lg border border-[hsl(38_70%_70%)] bg-[hsl(42_90%_96%)] px-3 py-2 text-[hsl(30_80%_28%)]",
        )}
        aria-live="polite"
      >
        {!online
          ? `Offline. Saves stay on this iPad and upload when you're back online.${capacityAt ? ` Capacity as of ${shortTime(capacityAt)}.` : ""}`
          : import.meta.env.DEV || offlineStatus === "checking"
            ? null
            : OFFLINE_TEXT[offlineStatus]}
        {online && !import.meta.env.DEV && offlineStatus === "failed" ? (
          <Button type="button" size="sm" variant="outline" className="ml-2 h-7" onClick={() => void retryOfflineDownload()}>
            Try again
          </Button>
        ) : null}
      </p>

      <BoothOutboxPanel online={online} onEdit={editEntry} />

      {editingKey ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          Editing a booth entry that wasn't accepted. Fix it and save again.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Buyer</h2>
          <Field label="Company" value={buyer.company} onChange={setField("company")} />
          <Field label="Contact" value={buyer.contact} onChange={setField("contact")} />
          <Field label="Email" type="email" value={buyer.email} onChange={setField("email")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Country" value={buyer.country} onChange={setField("country")} />
            <Field label="City" value={buyer.city} onChange={setField("city")} />
          </div>
          <Field label="Address" value={buyer.address} onChange={setField("address")} />
          <Field label="Buyer PO (optional)" value={buyer.buyerPo} onChange={setField("buyerPo")} />
          <Field label="Destination (optional)" value={buyer.destination} onChange={setField("destination")} />
          <Field label="Importer (optional)" value={buyer.importer} onChange={setField("importer")} />
        </div>

        <div className="space-y-3">
          <div
            className={cn(
              "rounded-xl border p-4",
              overMonth
                ? "border-[hsl(0_60%_75%)] bg-[hsl(0_70%_97%)]"
                : overLeft
                  ? "border-[hsl(38_70%_70%)] bg-[hsl(42_90%_96%)]"
                  : "border-border bg-card",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">First Press capacity by delivery month</p>
              <p className="text-sm tabular-nums text-muted-foreground">This quote {litresLabel(quoteMl)}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              7,500 L a month, bottled the month before delivery. Tap the month the buyer wants (optional).
              {capacityAt ? ` Litres as of ${shortTime(capacityAt)}; checked again when the order is confirmed.` : ""}
            </p>
            <DeliveryMonthStrip months={capacity} value={month} onChange={setMonth} quoteMl={quoteMl} />
            <div aria-live="polite">
              {overMonth ? (
                <p className="mt-2 text-sm text-[hsl(0_68%_40%)]">
                  More than one month of production (7,500 L). Split it into monthly orders before saving.
                </p>
              ) : overLeft && picked ? (
                <p className="mt-2 text-sm text-[hsl(30_80%_28%)]">
                  {monthLabel(picked.deliveryMonth)} has {picked.leftLitres.toLocaleString("en-US")} L left (up to{" "}
                  {picked.leftCases750.toLocaleString("en-US")} cases of 750 ml or {picked.leftCases200.toLocaleString("en-US")} of 200 ml).
                  Pick a later month or reduce the cases; the PO acceptance can't go out for a full month.
                </p>
              ) : null}
            </div>
          </div>
          {ROWS.map((row) => {
            const meta = skuMeta(row.sku);
            const n = cases[row.sku];
            const typed = Number(unitText[row.sku]);
            const unit =
              unitText[row.sku].trim() !== "" && Number.isFinite(typed) && typed >= 0 && meta
                ? unitFobFromCase(typed, meta.bottlesPerCase)
                : defaultUnitFob(row.sku);
            const line = priced.lines.find((l) => l.sku === row.sku);
            const below = line?.belowFloor ?? (meta ? unit + 1e-9 < meta.floorFobUsd : false);
            const bottles = n * (meta?.bottlesPerCase ?? 0);
            const caseUsd = line?.caseUsd ?? caseFobFromUnit(unit, meta?.bottlesPerCase ?? 0);
            return (
              <div key={row.sku} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.size} · {meta?.bottlesPerCase} bottles / case
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className={stepBtn} aria-label={`Remove one case of ${row.name} ${row.size}`} disabled={n === 0} onClick={() => setCaseCount(row.sku, n - 1)}>
                      <Minus className="size-5" />
                    </button>
                    <span className="w-10 text-center font-display text-2xl tabular-nums">{n}</span>
                    <button type="button" className={stepBtn} aria-label={`Add one case of ${row.name} ${row.size}`} onClick={() => setCaseCount(row.sku, n + 1)}>
                      <Plus className="size-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Case USD</p>
                    <Input
                      inputMode="decimal"
                      className="mt-1 h-11"
                      value={unitText[row.sku]}
                      aria-label={`Case FOB for ${row.name} ${row.size}`}
                      onChange={(e) => setUnitText((u) => ({ ...u, [row.sku]: e.target.value }))}
                      onBlur={() => {
                        const next = Number(unitText[row.sku]);
                        if (unitText[row.sku].trim() === "" || !Number.isFinite(next) || next < 0) {
                          setUnitText((u) => ({ ...u, [row.sku]: listFobCaseUsd(row.sku).toFixed(2) }));
                        }
                      }}
                    />
                  </div>
                  <Stat label="Bottles" value={String(bottles)} />
                  <Stat label="FOB / case" value={usd(caseUsd)} />
                  <Stat label="Line" value={n > 0 ? usd(line?.lineTotalUsd ?? 0) : "0.00"} />
                </div>
                {below && n > 0 ? (
                  <p className="mt-2 text-sm text-[hsl(0_68%_40%)]">
                    Below the internal floor. A founder or brand operator approves it on the order before the quotation goes out.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <Stat label="Subtotal" value={usd(priced.subtotalUsd)} />
          <Stat label="Deposit due" value={usd(priced.depositDueUsd)} />
          <Stat label="Balance" value={usd(priced.balanceDueUsd)} />
        </div>
        <Button type="button" className="h-12 min-w-44 text-base" disabled={!ready || saving} onClick={() => void save()}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save buyer
        </Button>
      </div>
    </HqOperatorPage>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-12 text-base" type={type} value={value} onChange={onChange} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  );
}
