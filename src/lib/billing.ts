import type { Account, SalesOrder } from "@/data/mockData";

export function resolveAccountForOrder(order: SalesOrder, accounts: Account[]) {
  return accounts.find((a) => a.tradingName === order.account);
}

export function invoiceMailto(order: SalesOrder, billingEmail: string): string {
  const subject = encodeURIComponent(`Invoice — ${order.id} — Hajime`);
  const body = encodeURIComponent(
    `Hello,\n\nPlease find your invoice for order ${order.id}.\n\nAmount due: $${order.price.toLocaleString()} CAD\nSKU: ${order.sku}\nQuantity: ${order.quantity}\n\nPay by card through Hajime (Stripe) or reply to arrange payment.\n\nThank you,\nHajime B2B`,
  );
  return `mailto:${billingEmail}?subject=${subject}&body=${body}`;
}

/** Email template with a Stripe-hosted “save card” link for the customer. */
export function saveCardLinkMailto(billingEmail: string, accountName: string, checkoutUrl: string): string {
  const subject = encodeURIComponent(`Add your card on file — ${accountName}`);
  const body = encodeURIComponent(
    `Hello,\n\nPlease use this secure link to add a payment card on file for ${accountName}. It is processed by Stripe:\n\n${checkoutUrl}\n\nAfter you finish, you can close the tab — our team will see the card on your account.\n\nThank you,\nHajime B2B`,
  );
  return `mailto:${billingEmail}?subject=${subject}&body=${body}`;
}

export function overdueNoticeMailto(order: SalesOrder, billingEmail: string): string {
  const subject = encodeURIComponent(`OVERDUE — Payment required — ${order.id}`);
  const body = encodeURIComponent(
    `Hello,\n\nOur records show that payment for order ${order.id} is overdue.\n\nAmount due: $${order.price.toLocaleString()} CAD\n\nIf a card is on file with us, we may charge it per your agreement. You can also pay by card through Hajime (Stripe), or reply to this email.\n\nThank you,\nHajime Accounts Receivable`,
  );
  return `mailto:${billingEmail}?subject=${subject}&body=${body}`;
}
