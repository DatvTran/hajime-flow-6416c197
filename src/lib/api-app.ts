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
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Ignore localStorage errors
  }
  
  return headers;
}

function assertLegacyAppApiEnabled(): void {
  const isLocalDev =
    Boolean(import.meta.env?.DEV) &&
    (import.meta.env.VITE_ENABLE_LEGACY_APP_API === "true" ||
      import.meta.env.VITE_ENABLE_LEGACY_APP_API === "1");

  if (!isLocalDev) {
    throw new Error(
      "Legacy app API is disabled. Use src/lib/api-v1.ts and src/lib/api-v1-mutations.ts.",
    );
  }
}

/**
 * @deprecated Internal-only legacy API. Do not use in normal app flow.
 * @internal
 */
export async function fetchAppData(): Promise<AppData> {
  assertLegacyAppApiEnabled();
  const headers = getAuthHeaders();

  const res = await fetch(apiUrl("/api/app"), { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data as AppData;
}

/**
 * @deprecated Internal-only legacy API. Do not use in normal app flow.
 * @internal
 */
export async function putAppData(data: AppData): Promise<void> {
  assertLegacyAppApiEnabled();
  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
