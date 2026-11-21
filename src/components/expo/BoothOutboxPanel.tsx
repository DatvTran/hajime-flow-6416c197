import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { HqBtnLink, HqOperatorPill } from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { issueExportDoc } from "@/lib/api-v1";
import { listOutbox, removeEntry, subscribeOutbox, syncAndReport, updateEntry, type OutboxEntry } from "@/lib/booth-outbox";

function company(e: OutboxEntry) {
  return String(e.payload.company || "Buyer");
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function useOutbox(): OutboxEntry[] {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  useEffect(() => {
    let live = true;
    const load = () => void listOutbox().then((e) => live && setEntries(e));
    load();
    const off = subscribeOutbox(load);
    return () => {
      live = false;
      off();
    };
  }, []);
  return entries;
}

/** Booth entries saved on this iPad: waiting to upload, uploaded (with numbers), or refused and needing a fix. */
export function BoothOutboxPanel({ online, onEdit }: { online: boolean; onEdit: (entry: OutboxEntry) => void }) {
  const entries = useOutbox();
  const [syncing, setSyncing] = useState(false);
  const [emailing, setEmailing] = useState<string | null>(null);

  const waiting = entries.filter((e) => e.status === "queued" || e.status === "syncing");
  const attention = entries.filter((e) => e.status === "attention");
  const synced = entries.filter((e) => e.status === "synced");
  if (!entries.length) return null;

  async function syncNow() {
    setSyncing(true);
    try {
      const r = await syncAndReport();
      if (r?.waiting) toast.message("Still offline. Entries will upload when the connection is back.");
    } finally {
      setSyncing(false);
    }
  }

  async function email(e: OutboxEntry) {
    const id = e.result?.order.displayId;
    if (!id) return;
    setEmailing(e.key);
    try {
      const res = await issueExportDoc(id, "quotation");
      await updateEntry(e.key, { emailedAt: new Date().toISOString() });
      toast.success(res.email?.sent ? "Quotation emailed" : "Quotation issued", { description: `${company(e)} · ${id}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not email the quotation";
      toast.error(
        msg === "BELOW_INTERNAL_FLOOR"
          ? "Under the floor. A founder or brand operator approves the price on the order, then email it."
          : msg,
      );
    } finally {
      setEmailing(null);
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          Saved on this iPad
          {waiting.length ? ` · ${waiting.length} waiting to upload` : ""}
        </p>
        <div className="flex gap-2">
          {waiting.length ? (
            <Button type="button" size="sm" variant="outline" disabled={!online || syncing} onClick={() => void syncNow()}>
              {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Sync now
            </Button>
          ) : null}
          {synced.length ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void Promise.all(synced.map((e) => removeEntry(e.key)))}
            >
              Clear uploaded
            </Button>
          ) : null}
        </div>
      </div>

      <ul className="divide-y divide-border/60 text-sm">
        {waiting.map((e) => (
          <li key={e.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              Booth #{e.ref} · {company(e)} <span className="text-muted-foreground">· saved {time(e.createdAt)}</span>
            </span>
            <span className="flex items-center gap-2">
              {e.error ? <span className="text-[12px] text-muted-foreground">{e.error}</span> : null}
              <HqOperatorPill tone="amber">{e.status === "syncing" ? "Uploading" : "Waiting"}</HqOperatorPill>
            </span>
          </li>
        ))}
        {attention.map((e) => (
          <li key={e.key} className="space-y-1 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Booth #{e.ref} · {company(e)}
              </span>
              <HqOperatorPill tone="red">Needs a fix</HqOperatorPill>
            </div>
            <p className="text-[13px] text-[hsl(0_68%_40%)]">{e.error}</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onEdit(e)}>
                Edit and retry
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(`Delete booth #${e.ref} (${company(e)}) from this iPad? It was never uploaded.`)) void removeEntry(e.key);
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
        {synced.map((e) => {
          const id = e.result?.order.displayId ?? "";
          return (
            <li key={e.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {company(e)} · {e.result?.lead.displayId} · {id}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {e.emailedAt ? <HqOperatorPill tone="green">Quotation issued</HqOperatorPill> : null}
                <Button type="button" size="sm" variant="outline" disabled={!online || emailing === e.key} onClick={() => void email(e)}>
                  {emailing === e.key ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {e.emailedAt ? "Email again" : "Email quotation"}
                </Button>
                <HqBtnLink to={`/export-orders/${id}`} variant="outline" size="sm">
                  Open order
                </HqBtnLink>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
