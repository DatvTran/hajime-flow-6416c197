/** Must match PO_ACCEPTANCE_TERMS_VERSION in server/lib/po-acceptance.mjs. */
export const PO_ACCEPTANCE_TERMS_VERSION = "Rev. 24 Oct 2026";

export type PoaClause = { n: string; title: string; body: string };

export const PO_ACCEPTANCE_CLAUSES: PoaClause[] = [
  {
    n: "01",
    title: "Contract formation & document priority.",
    body: "Hajime Ltd. (Seller) accepts only the goods and commercial particulars recorded on page 1, subject to these conditions. The order becomes binding when Seller signs and Buyer countersigns or expressly accepts this document in writing. If it changes Buyer's purchase order, it is a counter-offer until Buyer agrees. Conflicting Buyer standard terms are rejected. An existing signed master agreement controls where it expressly governs this order; otherwise priority is: a later amendment signed by both parties; this acceptance and its conditions; the referenced accepted quotation and approved specifications; then the purchase order solely for consistent order particulars.",
  },
  {
    n: "02",
    title: "Prices, payment & charges.",
    body: "Amounts are in USD. Buyer pays a 50% deposit on mutual acceptance and the remaining 50% following Seller's ready-for-shipment notice, before goods are released to a carrier or otherwise dispatched. Production requires cleared funds; credit or letter-of-credit terms apply only if separately agreed in writing. Payment follows the referenced pro forma invoice. Buyer bears transfer/intermediary bank fees so Seller receives the invoiced amount, subject to mandatory withholding law and supporting tax evidence. Accepted prices remain fixed for the agreed quantities and specifications. Extra charges require written agreement and itemization.",
  },
  {
    n: "03",
    title: "Production, approvals & delivery timing.",
    body: "Production scheduling starts only after cleared deposit, manufacturer capacity confirmation, agreed product/packaging specifications, approved label artwork and required regulatory approvals are in place. Buyer provides import requirements and documents promptly. Seller confirms the delivery window in writing before authorizing production. Estimated dates are indicative unless a firm date is expressly agreed; Seller promptly reports material delays and a revised schedule. Substitutions, quantity tolerances and partial shipments require Buyer's prior written agreement.",
  },
  {
    n: "04",
    title: "Delivery rule, costs, risk & title.",
    body: "Before signing, the parties must record the delivery rule and exact named port/place on page 1, with Incoterms® 2020. FOB is for sea/inland-waterway shipment: risk transfers when goods are on board the nominated vessel at the named shipment port. For air freight or pre-vessel container handover, agree FCA at an exact named place. Under FCA, delivery is loaded onto Buyer's collecting vehicle at Seller's premises, or ready for unloading from Seller's vehicle at another agreed place. Seller handles export clearance and costs allocated to it by the selected rule; Buyer handles main carriage, import clearance, duties, destination taxes and onward costs allocated to Buyer. Buyer arranges cargo insurance from risk transfer unless agreed otherwise. Title passes after full cleared payment and delivery, to the extent legally effective; risk is separate. Logistics assistance does not change the agreed rule.",
  },
  {
    n: "05",
    title: "Alcohol compliance & market approvals.",
    body: "Seller is responsible for lawful production/export and conformity with agreed specifications and applicable obligations on Seller. Buyer must hold or appoint the licensed importer of record, disclose destination rules before production, and secure required import, product-registration, excise and label approvals within its responsibility. Buyer may not alter approved labels, make unauthorized claims or resell unlawfully. Each party complies with applicable alcohol, customs, product-safety, sanctions and anti-bribery laws. Dispatch is suspended while a required approval is missing or performance would be unlawful; neither party is relieved of its own statutory duties.",
  },
  {
    n: "06",
    title: "Documents, handling & traceability.",
    body: "Seller supplies an accurate commercial invoice, packing list and delivery/transport evidence required by the agreed rule. Buyer identifies any required origin, analysis, health or other certificates before acceptance; availability, responsibility, cost and timing must be confirmed in writing before production. Each party follows approved transport, handling and storage instructions while goods are in its custody, including refrigeration where specified. Both parties retain lot/batch traceability and promptly cooperate on safety complaints or recalls; responsibility and reasonable costs follow the proven cause and applicable law.",
  },
  {
    n: "07",
    title: "Changes & cancellation.",
    body: "Changes to SKU, case quantity, destination, label, packaging or timing require both parties' written agreement, including revised price and delivery timing. Buyer cancellation requires Seller's written consent. Any cancellation charge is limited to reasonable, documented and unavoidable order-specific costs actually incurred or irrevocably committed, capped at the cancelled portion's price. Seller mitigates loss and credits recovered/resale amounts; no double recovery or automatic forfeiture of the whole deposit applies. Any unused deposit is refunded within 30 calendar days after settlement. Buyer's remedies for Seller breach remain available.",
  },
  {
    n: "08",
    title: "Payment or collection default.",
    body: "For overdue payment or failure to arrange agreed collection, Seller may suspend the affected performance after written notice. If Buyer does not remedy the failure within 7 calendar days of receipt, Seller may terminate the unperformed portion. Reasonable, evidenced storage or demurrage caused by Buyer's delay may be charged after notice; risk follows the agreed Incoterm. Deposits and cancellation costs are reconciled under clause 7. If Seller cancels for its own breach, it refunds payments for undelivered goods without limiting Buyer's other lawful remedies.",
  },
  {
    n: "09",
    title: "Inspection, defects & remedies.",
    body: "Buyer inspects goods as soon as practicable and reports visible damage/shortages within 7 calendar days of receipt, or latent defects within 14 calendar days of discovery, with photos, batch codes and supporting records. These periods do not remove mandatory rights or bar a claim where delayed notice causes no material prejudice. Seller remains responsible for non-conformity existing at risk transfer. For a substantiated Seller-responsible defect, Seller replaces affected goods or refunds their price within a reasonable time; credit requires Buyer's agreement. Failed remedies do not remove other available rights. Preserve evidence and obtain written approval before return, rework or destruction, except urgent safety action or legal requirements. Transit claims follow risk allocation.",
  },
  {
    n: "10",
    title: "Liability limits & preserved rights.",
    body: "Only to the extent lawful and reasonable, neither party is liable for indirect or consequential loss or lost profit, and Seller's aggregate liability for this order is limited to its total price paid or payable. No exclusion or cap applies to fraud, fraudulent misrepresentation, wilful misconduct, gross negligence, death/personal injury caused by negligence, mandatory product liability or liability that cannot legally be limited. These provisions do not reduce payment obligations or agreed refunds.",
  },
  {
    n: "11",
    title: "Events beyond reasonable control.",
    body: "A party prevented by an event outside its reasonable control must promptly notify the other, explain the impact and mitigate delay. Relief lasts only for the affected performance and period; payment already due remains payable. If prevention continues for 60 consecutive calendar days, either party may terminate the unperformed portion by written notice. Seller refunds prepayments for undelivered goods within 30 calendar days; any deduction for unavoidable Buyer-specific costs requires evidence and Buyer's written agreement, subject to mandatory law.",
  },
  {
    n: "12",
    title: "Territory, exclusivity & brand use.",
    body: "An order grants no exclusive territory, distribution appointment, agency or authority to bind Seller. Such rights require a separate signed agreement. Buyer uses only authorized brand materials and complies with applicable advertising and resale laws.",
  },
  {
    n: "13",
    title: "Governing law & dispute resolution.",
    body: "Hong Kong law governs this order. The parties expressly exclude the United Nations Convention on Contracts for the International Sale of Goods (CISG). They will first seek resolution through 30 days of good-faith discussions after written dispute notice, without preventing urgent relief or action to preserve a time limit. Disputes connected with this order, including its validity and related non-contractual duties, are finally decided by HKIAC-administered arbitration using its Administered Arbitration Rules effective when proceedings start. The seat is Hong Kong, the tribunal has one arbitrator and proceedings are in English. Hong Kong law also governs the arbitration agreement. The award binds both parties.",
  },
  {
    n: "14",
    title: "Notices & execution.",
    body: "Notices go to the email addresses on page 1 and take effect on acknowledged or otherwise proven receipt. Amendments require both parties' written assent. Electronic signatures and counterparts may be used where legally valid. An invalid provision is severed only as necessary; the rest remains effective. No third party has enforcement rights unless expressly agreed. English governs any translation to the extent permitted by mandatory law.",
  },
];

/** Page 1 product rows, in the order printed on the acceptance. */
export const PO_ACCEPTANCE_SKUS = [
  { sku: "first_press_750", name: "Hajime First Press", sub: "Coffee Rhum", size: "750 mL", bottlesPerCase: 12 },
  { sku: "yuzu_mint_750", name: "Hajime Second Bloom", sub: "Yuzu Mint Rhum", size: "750 mL", bottlesPerCase: 12 },
  { sku: "first_press_200", name: "Hajime First Press", sub: "Coffee Rhum", size: "200 mL", bottlesPerCase: 24 },
  { sku: "yuzu_mint_200", name: "Hajime Second Bloom", sub: "Yuzu Mint Rhum", size: "200 mL", bottlesPerCase: 24 },
] as const;

export const PO_ACCEPTANCE_PAGE1_NOTE =
  "All three pages form one order acceptance. Complete order fields or mark N/A. The legal label description and transport/storage requirements must match the approved market specifications.";

export const PO_ACCEPTANCE_EXECUTION_NOTE =
  "Complete all order fields before execution. Each signatory confirms authority to bind its legal entity and acceptance of all three pages and the expressly referenced documents.";

export const PO_ACCEPTANCE_LEGAL_REVIEW_NOTE =
  "Legal review required before use: confirm governing law, arbitration and destination-market requirements.";

export type PoaStatus = "draft" | "open" | "signed" | "replaced" | "expired";

export type PoaSummary = {
  docNumber: string;
  revision: number;
  issuedAt: string | null;
  status: PoaStatus;
  linkExpiresAt: string | null;
  termsVersion: string;
  contentHash: string | null;
  seller: {
    legalName: string;
    registrationNo: string;
    registeredAddress: string;
    signedName: string | null;
    signedTitle: string | null;
    signedAt: string | null;
    noticeEmail: string | null;
  };
  buyerSignature: {
    name: string;
    title: string;
    signedAt: string;
    details: { legalName?: string; registrationNo?: string; registeredAddress?: string; noticeEmail?: string };
    ip?: string | null;
    userAgent?: string | null;
  } | null;
  snapshot?: Record<string, unknown>;
};

export function poaDate(v: unknown): string {
  if (!v) return "N/A";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Hong_Kong" });
}

export function poaStatusLabel(poa: PoaSummary | null | undefined): string {
  if (!poa || poa.status === "draft") return "Draft — not yet issued";
  if (poa.status === "signed" && poa.buyerSignature) {
    return `Countersigned by ${poa.buyerSignature.name} on ${poaDate(poa.buyerSignature.signedAt)}`;
  }
  if (poa.status === "expired") return `${poa.docNumber} · signing link expired`;
  if (poa.status === "replaced") return `${poa.docNumber} · replaced by a newer revision`;
  return `${poa.docNumber} · awaiting buyer countersignature`;
}
