import type { LicenseeApplicationFormData } from "@/types/licensee-application";

export const LICENSEE_STEP_LABELS = [
  "Business info",
  "Shipping & contact",
  "Accounting & payment",
  "Delivery",
  "Terms & sign",
] as const;

export const CA_PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

export const PAYMENT_METHODS = ["Credit Card", "EFT", "E-Transfer", "Cheque"] as const;

export function defaultLicenseeForm(partial?: Partial<LicenseeApplicationFormData>): LicenseeApplicationFormData {
  const today = new Date().toLocaleDateString("en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return {
    businessName: "",
    affiliatedGroup: "",
    licenseeNum: "",
    hstNum: "",
    shippingAddr: "",
    city: "",
    province: "ON",
    postalCode: "",
    phone: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
    acctName: "",
    acctTitle: "",
    acctPhone: "",
    acctEmail: "",
    paymentMethod: "Credit Card",
    cardExpiry: "",
    cardInitial: "",
    billingSame: true,
    billingAddr: "",
    billingCity: "",
    billingPostal: "",
    billingPhone: "",
    frontDoor: true,
    loadingDock: false,
    poRequired: false,
    signatureRequired: true,
    operatingDays: "",
    receivingHours: "",
    receiverName: "",
    receiverPhone: "",
    doorCode: "",
    deliveryNotes: "",
    printName: "",
    signature: "",
    date: today,
    agreed: false,
    ...partial,
  };
}

export const LICENSEE_TERMS_EXCERPT = `Eligibility. You must be 19 years of age or older to place an order. Currently we are licensed to deliver in Ontario only.

Orders. All orders are subject to acceptance and product availability. Pricing is as quoted at time of order confirmation.

Payment. Payment terms follow the method selected on this application. Credit card authorizations apply to agreed purchases.

Delivery. Delivery windows depend on route scheduling; we accommodate reasonable instructions where access permits.

Returns. Return and credit policies are governed by your wholesaler agreement and applicable law.

By signing below, you confirm the information provided is accurate and you are authorized to bind the business named in this application.`;

export function validateLicenseeStep(step: number, data: LicenseeApplicationFormData): string | null {
  switch (step) {
    case 0:
      if (!data.businessName.trim()) return "Business name is required.";
      if (!data.licenseeNum.trim()) return "Licensee number is required.";
      if (!data.hstNum.trim()) return "HST registration number is required.";
      return null;
    case 1:
      if (!data.shippingAddr.trim()) return "Shipping address is required.";
      if (!data.city.trim()) return "City is required.";
      if (!data.postalCode.trim()) return "Postal code is required.";
      if (!data.phone.trim()) return "Phone number is required.";
      if (!data.contactName.trim()) return "Contact name is required.";
      if (!data.contactTitle.trim()) return "Contact title is required.";
      if (!data.contactEmail.trim()) return "Contact email is required.";
      return null;
    case 2:
      if (!data.acctName.trim()) return "Accounting contact name is required.";
      if (!data.acctTitle.trim()) return "Accounting contact title is required.";
      if (!data.acctEmail.trim()) return "Accounting email is required.";
      if (data.paymentMethod === "Credit Card" && !data.cardInitial.trim()) {
        return "Initials are required to authorize credit card payment.";
      }
      return null;
    case 3:
      if (!data.operatingDays.trim()) return "Operating days are required.";
      if (!data.receivingHours.trim()) return "Receiving hours are required.";
      return null;
    case 4:
      if (!data.printName.trim()) return "Printed name is required.";
      if (!data.signature.trim()) return "Signature is required.";
      if (!data.agreed) return "You must accept the terms and conditions.";
      return null;
    default:
      return null;
  }
}
