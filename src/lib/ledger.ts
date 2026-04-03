/**
 * Simulated distributed ledger / network commit for PO and fulfillment flows.
 * Replace with real API + chain attestation when backend is available.
 */
export type LedgerPayload =
  | { type: "po_create"; poId: string; sku: string; quantity: number }
  | { type: "po_fulfill"; poId: string; sku: string; quantity: number; status: string };

function randomHex(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function simulateLedgerCommit(payload: LedgerPayload): Promise<{ txHash: string }> {
  await new Promise((r) => setTimeout(r, 380 + Math.floor(Math.random() * 220)));
  const txHash = `0x${randomHex(16)}`;
  if (import.meta.env.DEV) {
    console.info("[ledger]", payload.type, txHash, payload);
  }
  return { txHash };
}
