import type { ExpoLeadPublicSubmit } from "@/lib/expo-leads";

const API_URL = import.meta.env.VITE_API_URL || "";

export type ExpoConnectPayload = {
  eventCode?: string;
  fullName: string;
  companyName: string;
  jobTitle: string;
  businessEmail: string;
  mobile?: string;
  countryMarket: string;
  companyWebsite?: string;
  businessType: string;
  expression: string;
  interests: string[];
  bottleFormat?: string;
  volume?: string;
  territory?: string;
  timing?: string;
  message?: string;
  consent: boolean;
  fax?: string;
};

export async function submitExpoConnect(payload: ExpoConnectPayload): Promise<{ data: ExpoLeadPublicSubmit }> {
  const res = await fetch(`${API_URL}/api/v1/expo-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Could not submit registration");
  }
  return body as { data: ExpoLeadPublicSubmit };
}
