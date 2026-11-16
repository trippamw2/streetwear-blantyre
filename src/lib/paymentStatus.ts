/**
 * Payment status helpers shared by the storefront and admin.
 *
 * `orders.payment_status` is the source of truth for whether money arrived;
 * `orders.status` only describes fulfilment. Keep the mapping in one place so
 * every surface shows the same thing.
 */
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export const PAYCHANGU_SUCCESS_STATUSES = ["success", "successful", "completed", "paid"] as const;
export const PAYCHANGU_FAILURE_STATUSES = [
  "failed",
  "cancelled",
  "canceled",
  "expired",
  "declined",
  "refused",
] as const;

export function normalizeProviderStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isProviderSuccess(value: unknown): boolean {
  return (PAYCHANGU_SUCCESS_STATUSES as readonly string[]).includes(normalizeProviderStatus(value));
}

export function isProviderFailure(value: unknown): boolean {
  return (PAYCHANGU_FAILURE_STATUSES as readonly string[]).includes(normalizeProviderStatus(value));
}

/** Unknown/null values default to `pending`, never `paid`. */
export function normalizeOrderPaymentStatus(value: unknown): OrderPaymentStatus {
  const normalized = normalizeProviderStatus(value);

  if (
    normalized === "paid" ||
    normalized === "failed" ||
    normalized === "refunded" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }

  return "pending";
}

/** Customers can retry while a payment is pending or has failed. */
export function isOrderPayable(paymentStatus: unknown): boolean {
  const normalized = normalizeOrderPaymentStatus(paymentStatus);
  return normalized === "pending" || normalized === "failed";
}

export function isOrderPaid(paymentStatus: unknown): boolean {
  return normalizeOrderPaymentStatus(paymentStatus) === "paid";
}
