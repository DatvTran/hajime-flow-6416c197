import type {
  ManufacturerProfile,
  ManufacturerProfileCertification,
} from "@/types/app-data";

const DEFAULT_BOTTLES_PER_CASE = 12;

export function emptyProfile(): ManufacturerProfile {
  return {
    companyName: "",
    legalName: "",
    address: {
      street: "",
      city: "",
      region: "",
      country: "",
      postalCode: "",
    },
    primaryContact: {
      name: "",
      role: "",
      email: "",
      phone: "",
    },
    backupContact: {
      name: "",
      role: "",
      email: "",
      phone: "",
    },
    productionCapacity: {
      monthlyCases: 0,
      peakCapacity: 0,
      currentUtilization: 0,
    },
    certifications: [],
    equipment: [],
    taxId: "",
    website: "",
    description: "",
  };
}

export function mapApiRowToProfile(row: Record<string, unknown>): ManufacturerProfile {
  const certificationsRaw = String(row.certifications ?? "").trim();
  const certifications: ManufacturerProfileCertification[] = certificationsRaw
    ? certificationsRaw.split(",").map((name, i) => ({
        id: `cert-import-${i}`,
        name: name.trim(),
        issuer: "",
        issuedAt: "",
        expiresAt: "",
        status: "active" as const,
      }))
    : [];

  return {
    id: String(row.id ?? ""),
    manufacturerId: String(row.manufacturer_id ?? ""),
    companyName: String(row.company_name ?? ""),
    legalName: "",
    address: {
      street: String(row.address ?? ""),
      city: String(row.city ?? ""),
      region: String(row.region ?? ""),
      country: String(row.country ?? ""),
      postalCode: String(row.postal_code ?? ""),
    },
    primaryContact: {
      name: String(row.contact_name ?? ""),
      role: "",
      email: String(row.email ?? ""),
      phone: String(row.phone ?? ""),
    },
    backupContact: {
      name: "",
      role: "",
      email: "",
      phone: "",
    },
    productionCapacity: {
      monthlyCases: Math.max(
        0,
        Math.round(Number(row.capacity_bottles_per_month ?? 0) / DEFAULT_BOTTLES_PER_CASE),
      ),
      peakCapacity: 0,
      currentUtilization: 0,
    },
    certifications,
    equipment: [],
    taxId: String(row.tax_id ?? ""),
    website: String(row.website ?? ""),
    description: String(row.notes ?? ""),
  };
}
