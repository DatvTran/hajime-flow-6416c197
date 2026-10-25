import type { PoaSummary } from "@/lib/po-acceptance-terms";

const API_URL = import.meta.env.VITE_API_URL || "";

export type PoaCountersignFields = {
  legalName: string;
  registrationNo: string;
  registeredAddress: string;
  noticeEmail: string;
  signatoryName: string;
  signatoryTitle: string;
};

export type PoaSigningView = PoaSummary & {
  displayId: string;
  replacedBy: { docNumber: string; revision: number } | null;
  prefill: Partial<PoaCountersignFields> | null;
};

export class PoaApiError extends Error {
  status: number;
  code?: string;
  fields?: Partial<Record<keyof PoaCountersignFields | "authority", string>>;
  constructor(status: number, body: { error?: string; code?: string; fields?: PoaApiError["fields"] }) {
    super(body.error || "Something went wrong. Please try again.");
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1/po-acceptance/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new PoaApiError(res.status, body);
  return (body as { data: T }).data;
}

export function getPoaForSigning(token: string): Promise<PoaSigningView> {
  return call(encodeURIComponent(token));
}

export function countersignPoa(
  token: string,
  body: PoaCountersignFields & { authority: boolean; fax?: string },
): Promise<PoaSigningView> {
  return call(`${encodeURIComponent(token)}/accept`, { method: "POST", body: JSON.stringify(body) });
}
