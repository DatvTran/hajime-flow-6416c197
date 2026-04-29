import type { AppData } from "@/types/app-data";

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const token = localStorage.getItem("hajime_access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore localStorage errors
  }

  return headers;
}

function assertLegacyApiAppEnabled() {
  if (import.meta.env.VITE_ENABLE_LEGACY_API_APP === "true") {
    return;
  }
  throw new Error(
    "Legacy /api/app endpoint is disabled in DB-primary mode. Use /api/v1/* endpoints instead."
  );
}

export async function fetchAppData(): Promise<AppData> {
  assertLegacyApiAppEnabled();

  const headers = getAuthHeaders();
  const res = await fetch(apiUrl("/api/app"), { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data as AppData;
}

export async function putAppData(data: AppData): Promise<void> {
  assertLegacyApiAppEnabled();

  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
