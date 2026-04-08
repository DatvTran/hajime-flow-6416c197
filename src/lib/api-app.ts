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

export async function fetchAppData(): Promise<AppData> {
  console.log("[api-app] Fetching app data...");
  const headers = getAuthHeaders();
  console.log("[api-app] Headers:", { ...headers, Authorization: headers.Authorization ? "Bearer ***" : "missing" });
  
  const res = await fetch(apiUrl("/api/app"), {
    headers,
  });
  
  console.log("[api-app] Response status:", res.status);
  
  if (!res.ok) {
    const text = await res.text();
    console.error("[api-app] Error response:", text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  return res.json() as Promise<AppData>;
}

export async function putAppData(data: AppData): Promise<void> {
  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
