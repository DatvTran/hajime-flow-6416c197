import type { LicenseeApplicationContext, LicenseeApplicationFormData } from "@/types/licensee-application";

const API_URL = import.meta.env.VITE_API_URL || "";

export async function fetchLicenseeApplicationContext(
  token: string,
): Promise<{ data: LicenseeApplicationContext }> {
  const res = await fetch(
    `${API_URL}/api/v1/licensee-application/context?token=${encodeURIComponent(token)}`,
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Could not load application");
  }
  return body as { data: LicenseeApplicationContext };
}

export async function submitLicenseeApplication(
  token: string,
  formData: LicenseeApplicationFormData,
): Promise<{
  data: {
    storeName: string;
    email: string;
    salesRepName: string;
    submittedAt: string;
  };
}> {
  const res = await fetch(`${API_URL}/api/v1/licensee-application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, formData }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Could not submit application");
  }
  return body as {
    data: { storeName: string; email: string; salesRepName: string; submittedAt: string };
  };
}
