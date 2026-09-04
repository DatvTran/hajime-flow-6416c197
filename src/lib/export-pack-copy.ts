import { expoConnectFormUrl } from "@/lib/expo-connect-url";

export const EXPORT_CONNECT_URL = expoConnectFormUrl("HK26");

export const EXPORT_BUYER_TERMS = [
  "Seller of record: Hajime Ltd., Hong Kong. Production: Thailand.",
  "Working Incoterm: FOB Bangkok, Thailand — named port/terminal must be confirmed before binding shipment documents.",
  "Payment: 50% deposit upon order confirmation; 50% before shipment. Buyer pays bank/wire fees so Hajime Limited receives the full invoiced amount.",
  "USD wires: Hajime Limited, DBS Bank (Hong Kong) Limited, SWIFT DHBKHKHH. Full account details are on the quotation and pro forma.",
  "This file does not grant exclusivity.",
  "Manufacturer is not the buyer’s contracting party.",
];

export const EXPORT_FORMATS = "750 ml (12 bottles / case) and 200 ml (20 bottles / case).";

export const EXPORT_PORTFOLIO = [
  {
    name: "First Press Coffee Rhum Liqueur",
    summary: "Hajime means beginning. First Press explores depth — coffee and rhum in a slow, considered pour.",
  },
  {
    name: "Yuzu Mint Rhum Liqueur",
    summary: "Yuzu Mint explores brightness — citrus lift and mint against the same rhum base.",
  },
];

export const EXPORT_DO_NOT_IMPROVISE = [
  "Do not print working cost or floor FOB on quotations, PIs, sell sheets, or press.",
  "Do not convert Expo Connect registrations into CRM accounts automatically.",
  "Do not imply exclusivity in quotation or PO acceptance language.",
  "Do not authorize production before deposit clearance (or a written exception).",
  "Do not release shipment without cleared final balance, export checklist, and a named FOB point.",
];

export const EXPORT_PRESS_TO_CONFIRM =
  "Press and media contacts in the Expo kit must be confirmed by Brand HQ before any external release.";
