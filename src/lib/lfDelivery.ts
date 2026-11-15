/**
 * Lake Fresh Fish Mart — Next-Day Delivery Engine (Stage 5, core logic)
 *
 * Default fulfilment model:
 * - Orders placed before the configured daily cut-off qualify for next delivery day.
 * - Orders placed after the cut-off schedule for the following eligible delivery day.
 *
 * Malawi (Africa/Blantyre) has no DST, so a fixed UTC+2 offset is used for local
 * time calculations until a full timezone-aware library is adopted.
 */

export const DEFAULT_LF_CUTOFF = { hour: 14, minute: 0 };
export const DEFAULT_LF_DELIVERY_FEE_MWK = 2000;
export const DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK = 15000;
export const DEFAULT_LF_DELIVERY_DAYS = 1;

export interface LFCutoffConfig {
  hour: number;
  minute: number;
}

export interface LFDeliveryConfig {
  cutoff: LFCutoffConfig;
  deliveryFeeMwk: number;
  freeDeliveryThresholdMwk: number;
  deliveryDays: number;
}

export const DEFAULT_LF_DELIVERY_CONFIG: LFDeliveryConfig = {
  cutoff: DEFAULT_LF_CUTOFF,
  deliveryFeeMwk: DEFAULT_LF_DELIVERY_FEE_MWK,
  freeDeliveryThresholdMwk: DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK,
  deliveryDays: DEFAULT_LF_DELIVERY_DAYS,
};

export const LF_TIMEZONE_OFFSET_MINUTES = 120;

export const parseCutoff = (cutoffTime: string): LFCutoffConfig => {
  const [hourStr = "14", minuteStr = "0"] = (cutoffTime || "14:00").split(":");
  return {
    hour: parseInt(hourStr, 10) || DEFAULT_LF_CUTOFF.hour,
    minute: parseInt(minuteStr, 10) || DEFAULT_LF_CUTOFF.minute,
  };
};

export const getCutoffMinutes = (cutoff: LFCutoffConfig): number => cutoff.hour * 60 + cutoff.minute;

export const getNextDeliveryDate = (
  placedAtUtc: Date,
  cutoff: LFCutoffConfig,
  config: LFDeliveryConfig = DEFAULT_LF_DELIVERY_CONFIG,
  nowUtc: Date = new Date()
): string => {
  const placedMinutes = placedAtUtc.getUTCHours() * 60 + placedAtUtc.getUTCMinutes();
  const cutoffMinutes = getCutoffMinutes(cutoff);
  const afterCutoff = placedMinutes > cutoffMinutes;

  const offsetDays = afterCutoff ? config.deliveryDays + 1 : config.deliveryDays;
  const d = new Date(nowUtc);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const isSlotAvailable = (
  slot: { is_open: boolean; booked_orders: number; capacity_orders: number; booked_weight_kg: number; capacity_weight_kg: number },
  weightKg: number
): boolean => {
  if (!slot.is_open) return false;
  if (slot.booked_orders >= slot.capacity_orders) return false;
  const projectedWeight = slot.booked_weight_kg + weightKg;
  if (projectedWeight > slot.capacity_weight_kg) return false;
  return true;
};

export const getEffectiveWeightKg = (weightKg: number, minOrderQtyKg: number): number =>
  Math.max(weightKg || 0, minOrderQtyKg || 0);

export const calculateFinalPrice = (pricePerKgMwk: number, weightKg: number, minOrderQtyKg: number): number =>
  Math.round(pricePerKgMwk * getEffectiveWeightKg(weightKg, minOrderQtyKg));

export const isFreeDelivery = (subtotalMwk: number, config: LFDeliveryConfig): boolean =>
  subtotalMwk >= config.freeDeliveryThresholdMwk;
