import { get, set } from "idb-keyval";
import { saveBoothLead, type BoothSaveResult, type FirstPressCapacityMonth } from "@/lib/api-v1";
import { toast } from "@/components/ui/sonner";

/**
 * Booth saves made on an iPad with no signal. Entries live in IndexedDB (kept through sign-out) and upload one at a
 * time with their submissionKey, so a retry after a dropped connection returns the same lead and order.
 */
export type BoothPayload = Record<string, unknown> & { submissionKey: string };

export type OutboxStatus = "queued" | "syncing" | "synced" | "attention";

export type OutboxEntry = {
  key: string;
  /** Booth number shown on the iPad until the upload assigns HK26-xxx and HX-xxxx. */
  ref: number;
  createdAt: string;
  payload: BoothPayload;
  status: OutboxStatus;
  error?: string;
  result?: BoothSaveResult;
  syncedAt?: string;
  emailedAt?: string;
};

export function canHqBooth(role: string | undefined) {
  return role === "brand_operator" || role === "founder_admin" || role === "operations";
}

export type CapacitySnapshot = { at: string; months: FirstPressCapacityMonth[] };

type Storage = {
  get: <T>(key: string) => Promise<T | undefined>;
  set: (key: string, value: unknown) => Promise<void>;
};

const OUTBOX_KEY = "hajime.booth.outbox";
const CAPACITY_KEY = "hajime.booth.capacity";

let storage: Storage = { get, set };

/** Tests swap IndexedDB for memory. */
export function setOutboxStorage(next: Storage) {
  storage = next;
}

const listeners = new Set<() => void>();

export function subscribeOutbox(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notify() {
  for (const fn of listeners) fn();
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  return (await storage.get<OutboxEntry[]>(OUTBOX_KEY)) ?? [];
}

async function write(entries: OutboxEntry[]) {
  await storage.set(OUTBOX_KEY, entries);
  notify();
}

export function newSubmissionKey(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `booth-${id}`;
}

export async function enqueueBooth(payload: BoothPayload): Promise<OutboxEntry> {
  const entries = await listOutbox();
  const entry: OutboxEntry = {
    key: payload.submissionKey,
    ref: entries.reduce((n, e) => Math.max(n, e.ref), 0) + 1,
    createdAt: new Date().toISOString(),
    payload,
    status: "queued",
  };
  await write([...entries, entry]);
  return entry;
}

export async function updateEntry(key: string, patch: Partial<OutboxEntry>): Promise<void> {
  const entries = await listOutbox();
  await write(entries.map((e) => (e.key === key ? { ...e, ...patch } : e)));
}

export async function removeEntry(key: string): Promise<void> {
  await write((await listOutbox()).filter((e) => e.key !== key));
}

/** Network failures, server errors and an expired sign-in wait for the next sync; a refused save needs a person. */
export function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (typeof status !== "number") return true;
  return status === 401 || status === 408 || status === 429 || status >= 500;
}

export function errorText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/session expired|sign in again/i.test(msg)) return "Waiting for you to sign in again.";
  if (typeof (err as { status?: number } | null)?.status !== "number") return "No connection. Will upload when online.";
  return msg;
}

type Send = (body: Record<string, unknown>) => Promise<{ data: BoothSaveResult }>;

export type SyncSummary = { synced: number; attention: number; waiting: number };

let running: Promise<SyncSummary> | null = null;

export function syncOutbox(send: Send = saveBoothLead): Promise<SyncSummary> {
  if (running) return running;
  running = (async () => {
    const summary: SyncSummary = { synced: 0, attention: 0, waiting: 0 };
    const pending = (await listOutbox()).filter((e) => e.status === "queued" || e.status === "syncing");
    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i];
      await updateEntry(entry.key, { status: "syncing" });
      try {
        const res = await send(entry.payload);
        await updateEntry(entry.key, { status: "synced", result: res.data, error: undefined, syncedAt: new Date().toISOString() });
        summary.synced++;
      } catch (err) {
        if (isRetryable(err)) {
          await updateEntry(entry.key, { status: "queued", error: errorText(err) });
          summary.waiting += pending.length - i;
          break;
        }
        await updateEntry(entry.key, { status: "attention", error: errorText(err) });
        summary.attention++;
      }
    }
    return summary;
  })().finally(() => {
    running = null;
  });
  return running;
}

export async function saveCapacitySnapshot(months: FirstPressCapacityMonth[]): Promise<void> {
  await storage.set(CAPACITY_KEY, { at: new Date().toISOString(), months } satisfies CapacitySnapshot);
}

export async function loadCapacitySnapshot(): Promise<CapacitySnapshot | null> {
  return (await storage.get<CapacitySnapshot>(CAPACITY_KEY)) ?? null;
}

/** Asks iPadOS not to clear this site's storage under pressure. */
export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => false);
}

export async function syncAndReport(): Promise<SyncSummary | null> {
  const pending = (await listOutbox()).some((e) => e.status === "queued" || e.status === "syncing");
  if (!pending) return null;
  const r = await syncOutbox();
  if (r.synced) {
    toast.success(`${r.synced} booth ${r.synced === 1 ? "entry" : "entries"} uploaded`, {
      description: "Each now has its lead and order number. Email the quotations from the booth.",
    });
  }
  if (r.attention) toast.error(`${r.attention} booth ${r.attention === 1 ? "entry needs" : "entries need"} a fix on the booth page`);
  return r;
}
