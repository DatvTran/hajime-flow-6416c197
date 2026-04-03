import type { AppData } from "@/types/app-data";

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

export async function fetchAppData(): Promise<AppData> {
  const res = await fetch(apiUrl("/api/app"));
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<AppData>;
}

export async function putAppData(data: AppData): Promise<void> {
  const res = await fetch(apiUrl("/api/app"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
