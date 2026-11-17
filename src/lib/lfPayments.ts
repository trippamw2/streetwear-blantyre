/**
 * Lake Fresh payment helpers.
 * Payment references are generated server-side in `lf_place_order`; this keeps
 * the storefront and the webhook aligned on the same deterministic value.
 */
export const LAKE_FRESH_PAYMENT_PREFIX = "LF";

export const buildLakeFreshPaymentRef = (orderId: string): string =>
  `${LAKE_FRESH_PAYMENT_PREFIX}-${orderId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;

/** Display only. Payment references stay hyphenated in the database and at PayChangu. */
export const formatLakeFreshPaymentRef = (reference?: string | null): string =>
  reference ? reference.replace(/^LF-/i, "LF ") : "";

/** Turn a displayed reference back into the value stored by the order engine. */
export const normalizeLakeFreshPaymentRef = (reference: string): string =>
  reference.trim().replace(/^LF\s+/i, "LF-").replace(/\s+/g, "");
