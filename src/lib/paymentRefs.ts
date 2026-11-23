/**
 * Merchant payment references for Wear What Speaks / gifts.
 *
 * PayChangu requires a unique `tx_ref`. We derive it deterministically from
 * the row id so a retry (from the order page) reuses the same reference, and
 * the server can resolve it without a fuzzy search.
 *
 * Keep this in sync with the `set_order_payment_reference` and
 * `set_gift_payment_reference` triggers in Supabase.
 */
export const buildSbPaymentRef = (orderId: string): string =>
  `SB-${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const buildSbGiftPaymentRef = (giftId: string): string =>
  `SB-GIFT-${giftId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
