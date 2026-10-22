import type { ExpoLeadPublicSubmit } from "@/lib/expo-leads";

const API_URL = import.meta.env.VITE_API_URL || "";

export type ExpoConnectPayload = {
  eventCode?: string;
  businessType: string;
  products: string[];
  purposes: string[];
  fullName: string;
  businessEmail: string;
  /** International format, e.g. +85291234567. */
  mobile: string;
  marketingOptIn: boolean;
  submissionKey: string;
  utm?: Record<string, string>;
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
    throw new Error(typeof body.error === "string" ? body.error : "Could not submit enquiry");
  }
  return body as { data: ExpoLeadPublicSubmit };
}
