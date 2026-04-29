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

function assertLegacyAppApiAllowed(): void {
  const legacyOverride = import.meta.env.VITE_ENABLE_LEGACY_APP_API === "true";
  if (!legacyOverride) {
    throw new Error(
      "[api-app] Legacy /api/app endpoints are disabled. Use granular API clients instead.",
    );
  }
}

/** @deprecated Legacy-only API. Prefer granular api-v1 data services. */
export async function fetchAppData(): Promise<AppData> {
  assertLegacyAppApiAllowed();
  const headers = getAuthHeaders();

  const res = await fetch(apiUrl("/api/app"), { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data as AppData;
}

/** @deprecated Legacy-only API. Prefer granular api-v1 mutations. */
export async function putAppData(data: AppData): Promise<void> {
  assertLegacyAppApiAllowed();
  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
