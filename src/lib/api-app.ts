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
  const headers = getAuthHeaders();
  
  // Add cache-busting query param to prevent 304 caching issues
  const cacheBuster = `?_cb=${Date.now()}`;
  
  const res = await fetch(apiUrl(`/api/app${cacheBuster}`), {
    headers,
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  const data = await res.json();
  return data as AppData;
}

export async function putAppData(data: AppData): Promise<void> {
  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}