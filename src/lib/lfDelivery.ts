/**
 * Lake Fresh Fish Mart — Next-Day Delivery Engine (Stage 5, core logic)
 *
 * Default fulfilment model:
 * - Orders placed before the configured daily cutoff qualify for next delivery day.
 * - Orders placed after the cutoff schedule for the following eligible delivery day.
 *
 * Malawi (Africa/Blantyre) has no DST, so a fixed UTC+2 offset is used for local
 * wall-clock calculations. Dates are handled as YYYY-MM-DD strings in the
 * Blantyre calendar, never as browser-local dates.
 */

export const DEFAULT_LF_CUTOFF = { hour: 14, minute: 0 };
export const DEFAULT_LF_DELIVERY_FEE_MWK = 2000;
export const DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK = 15000;
export const DEFAULT_LF_DELIVERY_DAYS = 1;
export const DEFAULT_LF_MAX_ADVANCE_DAYS = 7;

export interface LFCutoffConfig {
  hour: number;
  minute: number;
}

export interface LFDeliveryConfig {
  cutoff: LFCutoffConfig;
  deliveryFeeMwk: number;
  freeDeliveryThresholdMwk: number;
  deliveryDays: number;
  maxAdvanceDays: number;
}

export const DEFAULT_LF_DELIVERY_CONFIG: LFDeliveryConfig = {
  cutoff: DEFAULT_LF_CUTOFF,
  deliveryFeeMwk: DEFAULT_LF_DELIVERY_FEE_MWK,
  freeDeliveryThresholdMwk: DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK,
  deliveryDays: DEFAULT_LF_DELIVERY_DAYS,
  maxAdvanceDays: DEFAULT_LF_MAX_ADVANCE_DAYS,
};

/** Malawi is UTC+2 (no DST). */
export const LF_TIMEZONE_OFFSET_MINUTES = 120;

const pad = (n: number) => String(n).padStart(2, "0");

export const parseCutoff = (cutoffTime: string | null | undefined): LFCutoffConfig => {
  const [hourStr = "14", minuteStr = "0"] = (cutoffTime || "14:00").split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return {
    hour: Number.isFinite(hour) ? hour : DEFAULT_LF_CUTOFF.hour,
    minute: Number.isFinite(minute) ? minute : DEFAULT_LF_CUTOFF.minute,
  };
};

export const getCutoffMinutes = (cutoff: LFCutoffConfig): number => cutoff.hour * 60 + cutoff.minute;

const readNumber = (value: unknown, fallback: number): number => {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Map the public `lf_public_config()` payload onto a typed config. */
export const parseDeliveryConfig = (settings: Record<string, unknown> | null | undefined): LFDeliveryConfig => {
  const s = settings || {};
  return {
    cutoff: parseCutoff(typeof s["delivery.cutoff"] === "string" ? (s["delivery.cutoff"] as string) : "14:00"),
    deliveryFeeMwk: readNumber(s["delivery.fee_mwk"], DEFAULT_LF_DELIVERY_FEE_MWK),
    freeDeliveryThresholdMwk: readNumber(
      s["delivery.free_threshold_mwk"],
      DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK
    ),
    deliveryDays: Math.max(1, readNumber(s["delivery.delivery_days"], DEFAULT_LF_DELIVERY_DAYS)),
    maxAdvanceDays: Math.max(1, readNumber(s["delivery.max_advance_days"], DEFAULT_LF_MAX_ADVANCE_DAYS)),
  };
};

export const addDaysISO = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** Current date and wall-clock minutes in the Blantyre calendar. */
export const getBlantyreNow = (now: Date = new Date()): { dateISO: string; minutes: number } => {
  const local = new Date(now.getTime() + LF_TIMEZONE_OFFSET_MINUTES * 60_000);
  return {
    dateISO: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
};

/** Alias kept for callers that only need the local ISO date. */
export const toBlantyreDateISO = (date: Date = new Date()): string => getBlantyreNow(date).dateISO;

export const isBeforeCutoff = (now: Date, cutoff: LFCutoffConfig): boolean =>
  getBlantyreNow(now).minutes < getCutoffMinutes(cutoff);

/**
 * First date a customer ordering now can receive on.
 * Before cutoff → today + deliveryDays; after cutoff → one extra eligible day.
 */
export const getEarliestDeliveryDate = (
  now: Date,
  config: LFDeliveryConfig = DEFAULT_LF_DELIVERY_CONFIG
): string => {
  const { dateISO, minutes } = getBlantyreNow(now);
  const offset = minutes < getCutoffMinutes(config.cutoff)
    ? config.deliveryDays
    : config.deliveryDays + 1;
  return addDaysISO(dateISO, offset);
};

/** Ordered list of selectable delivery dates (earliest first). */
export const getEligibleDeliveryDates = (
  now: Date = new Date(),
  config: LFDeliveryConfig = DEFAULT_LF_DELIVERY_CONFIG
): string[] => {
  const earliest = getEarliestDeliveryDate(now, config);
  return Array.from({ length: config.maxAdvanceDays }, (_, i) => addDaysISO(earliest, i));
};

/**
 * Calculate the next eligible delivery date for an order.
 * `placedAtUtc` decides cutoff eligibility; `nowUtc` supplies the calendar base.
 */
export const getNextDeliveryDate = (
  placedAtUtc: Date,
  cutoff: LFCutoffConfig,
  config: LFDeliveryConfig = DEFAULT_LF_DELIVERY_CONFIG,
  nowUtc: Date = new Date()
): string => {
  const { dateISO, minutes } = getBlantyreNow(nowUtc);
  const placedLocalMinutes = (() => {
    const local = new Date(placedAtUtc.getTime() + LF_TIMEZONE_OFFSET_MINUTES * 60_000);
    return local.getUTCHours() * 60 + local.getUTCMinutes();
  })();
  const afterCutoff = placedLocalMinutes >= getCutoffMinutes(cutoff);
  const offset = afterCutoff ? config.deliveryDays + 1 : config.deliveryDays;
  return addDaysISO(dateISO, offset);
};

/** Human-readable delivery date, e.g. "Tue, 17 Nov 2026". */
export const formatDeliveryDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((v) => parseInt(v, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Blantyre",
  }).format(date);
};

export const formatCutoff = (cutoff: LFCutoffConfig): string =>
  `${pad(cutoff.hour)}:${pad(cutoff.minute)}`;

export const isSlotAvailable = (
  slot: {
    is_open: boolean;
    booked_orders: number;
    capacity_orders: number;
    booked_weight_kg: number;
    capacity_weight_kg: number;
  },
  weightKg: number
): boolean => {
  if (!slot.is_open) return false;
  if (slot.booked_orders >= slot.capacity_orders) return false;
  if (slot.booked_weight_kg + weightKg > slot.capacity_weight_kg) return false;
  return true;
};

/** Effective billable weight, respecting the product's minimum order weight. */
export const getEffectiveWeightKg = (weightKg: number, minOrderQtyKg: number): number =>
  Math.max(weightKg || 0, minOrderQtyKg || 0);

/** Line total for weight-based selling: price_per_kg × effective weight. */
export const calculateFinalPrice = (pricePerKgMwk: number, weightKg: number, minOrderQtyKg: number): number =>
  Math.round(pricePerKgMwk * getEffectiveWeightKg(weightKg, minOrderQtyKg));

export const isFreeDelivery = (subtotalMwk: number, config: LFDeliveryConfig): boolean =>
  subtotalMwk >= config.freeDeliveryThresholdMwk;

export const getDeliveryFee = (
  zoneFeeMwk: number | null | undefined,
  subtotalMwk: number,
  config: LFDeliveryConfig = DEFAULT_LF_DELIVERY_CONFIG
): number => {
  if (subtotalMwk <= 0) return 0;
  if (isFreeDelivery(subtotalMwk, config)) return 0;
  return zoneFeeMwk && zoneFeeMwk > 0 ? zoneFeeMwk : config.deliveryFeeMwk;
};

export const getSlotCutoffISO = (deliveryDateISO: string, cutoff: LFCutoffConfig): string => {
  const [year, month, day] = deliveryDateISO.split("-").map((v) => parseInt(v, 10));
  // 14:00 Blantyre == 12:00 UTC on the previous day.
  const cutoffUtc = Date.UTC(year, month - 1, day - 1, cutoff.hour - 2, cutoff.minute, 0);
  return new Date(cutoffUtc).toISOString();
};
