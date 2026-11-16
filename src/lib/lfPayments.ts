/**
 * Lake Fresh payment helpers.
 * Payment references are generated server-side in `lf_place_order`; this keeps
 * the storefront and the webhook aligned on the same deterministic value.
 */
export const LAKE_FRESH_PAYMENT_PREFIX = "LF";

export const buildLakeFreshPaymentRef = (orderId: string): string =>
  `${LAKE_FRESH_PAYMENT_PREFIX}-${orderId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
