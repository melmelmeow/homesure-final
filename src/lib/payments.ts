/** What a payment can be for. `purpose` on the payments row is limited to these. */
export const PAYMENT_PURPOSES = ["rent", "security", "both", "reservation", "sale"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

/** How the money moved. Anything but QRPH is confirmed by the seller, not by a webhook. */
export const MANUAL_METHODS = ["GCash", "Maya", "Bank Transfer", "InstaPay", "Cash"] as const;

/**
 * What this payment should cost, from the listing price and the purpose.
 *
 * The amount is always computed on the server. A client that could name its own price could pay ₱1
 * for a ₱15,000 month and the seller would see a confirmed payment.
 */
export function amountFor(price: number, purpose: PaymentPurpose, depositMonths = 1): number {
  switch (purpose) {
    case "security": return price * depositMonths;
    case "both":     return price + price * depositMonths;
    default:         return price;        // rent, reservation, sale
  }
}

export function isValidDueDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
