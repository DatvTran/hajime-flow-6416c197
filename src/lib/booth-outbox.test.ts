import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueBooth,
  isRetryable,
  listOutbox,
  newSubmissionKey,
  setOutboxStorage,
  syncOutbox,
  updateEntry,
} from "@/lib/booth-outbox";
import type { BoothSaveResult } from "@/lib/api-v1";

function memoryStorage() {
  const map = new Map<string, unknown>();
  return {
    get: async <T,>(key: string) => map.get(key) as T | undefined,
    set: async (key: string, value: unknown) => {
      map.set(key, structuredClone(value));
    },
  };
}

const result = (n: number): BoothSaveResult => ({
  lead: { id: String(n), displayId: `HK26-0${n}` },
  order: { id: String(n), displayId: `HX-00${n}`, subtotalUsd: 100, depositDueUsd: 50, balanceDueUsd: 50, depositStatus: "pending" },
});

const httpErr = (status: number, message: string) => Object.assign(new Error(message), { status });

beforeEach(() => setOutboxStorage(memoryStorage()));

describe("booth outbox", () => {
  it("queues entries with booth numbers and uploads them with their key", async () => {
    const a = await enqueueBooth({ submissionKey: newSubmissionKey(), company: "A" });
    const b = await enqueueBooth({ submissionKey: newSubmissionKey(), company: "B" });
    expect([a.ref, b.ref]).toEqual([1, 2]);
    expect(a.key).toMatch(/^booth-/);

    const send = vi.fn(async (body: Record<string, unknown>) => ({ data: result(body.company === "A" ? 1 : 2) }));
    expect(await syncOutbox(send)).toEqual({ synced: 2, attention: 0, waiting: 0 });
    expect(send.mock.calls.map((c) => c[0].submissionKey)).toEqual([a.key, b.key]);
    const entries = await listOutbox();
    expect(entries.map((e) => [e.status, e.result?.order.displayId])).toEqual([
      ["synced", "HX-001"],
      ["synced", "HX-002"],
    ]);
    expect(await syncOutbox(send)).toEqual({ synced: 0, attention: 0, waiting: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("stops at a network failure and keeps the rest queued", async () => {
    await enqueueBooth({ submissionKey: "booth-k1", company: "A" });
    await enqueueBooth({ submissionKey: "booth-k2", company: "B" });
    const send = vi.fn(async () => {
      throw new TypeError("Load failed");
    });
    expect(await syncOutbox(send)).toEqual({ synced: 0, attention: 0, waiting: 2 });
    expect(send).toHaveBeenCalledTimes(1);
    const entries = await listOutbox();
    expect(entries.every((e) => e.status === "queued")).toBe(true);
    expect(entries[0].error).toMatch(/No connection/);
  });

  it("a refused save needs attention; a retry after editing sends the same key", async () => {
    await enqueueBooth({ submissionKey: "booth-k1", company: "A", requestedMonth: "2020-01" });
    await enqueueBooth({ submissionKey: "booth-k2", company: "B" });
    const send = vi.fn(async (body: Record<string, unknown>) => {
      if (body.requestedMonth === "2020-01") throw httpErr(422, "Pick a delivery month from next month onwards.");
      return { data: result(2) };
    });
    expect(await syncOutbox(send)).toEqual({ synced: 1, attention: 1, waiting: 0 });
    const [first] = await listOutbox();
    expect(first.status).toBe("attention");
    expect(first.error).toBe("Pick a delivery month from next month onwards.");

    await updateEntry("booth-k1", { status: "queued", payload: { submissionKey: "booth-k1", company: "A" } });
    await syncOutbox(send);
    expect(send.mock.calls.at(-1)?.[0].submissionKey).toBe("booth-k1");
    expect((await listOutbox())[0].status).toBe("synced");
  });

  it("an expired sign-in waits rather than failing", () => {
    expect(isRetryable(new Error("Session expired. Please sign in again."))).toBe(true);
    expect(isRetryable(httpErr(503, "down"))).toBe(true);
    expect(isRetryable(httpErr(422, "bad"))).toBe(false);
  });
});
