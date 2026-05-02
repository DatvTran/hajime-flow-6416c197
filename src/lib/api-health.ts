/** Ungated health check — same origin as API (VITE_API_URL or legacy VITE_API_BASE_URL). */

function getApiBase(): string {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";
  return String(raw).replace(/\/$/, "");
}

export type ApiHealthResponse = {
  ok: boolean;
  database: "up" | "down";
  dbNow?: string;
  error?: string;
};

export async function fetchApiHealth(): Promise<ApiHealthResponse> {
  const base = getApiBase();
  const path = "/api/health";
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, { method: "GET" });
  const body = (await res.json().catch(() => ({}))) as ApiHealthResponse;
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Health check failed (${res.status})`);
  }
  return body;
}
