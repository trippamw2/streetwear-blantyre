import { describe, it, expect } from "vitest";
import {
  DEFAULT_LF_DELIVERY_CONFIG,
  getCutoffMinutes,
  getNextDeliveryDate,
  isFreeDelivery,
  isSlotAvailable,
  calculateFinalPrice,
  getEffectiveWeightKg,
  parseCutoff,
} from "../lfDelivery";

const DAY = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

describe("Lake Fresh delivery engine (Stage 5 core)", () => {
  it("schedules next day delivery when order is placed before the cut-off", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T09:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), DEFAULT_LF_DELIVERY_CONFIG, now);
    expect(next).toBe(DAY(new Date("2026-11-17T00:00:00Z")));
  });

  it("schedules following day when order is placed after the cut-off", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T16:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), DEFAULT_LF_DELIVERY_CONFIG, now);
    expect(next).toBe(DAY(new Date("2026-11-18T00:00:00Z")));
  });

  it("respects a custom delivery day count", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T09:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), { ...DEFAULT_LF_DELIVERY_CONFIG, deliveryDays: 2 }, now);
    expect(next).toBe(DAY(new Date("2026-11-18T00:00:00Z")));
  });

  it("uses default cut-off of 14:00 when unparseable", () => {
    expect(parseCutoff("bogus").hour).toBe(14);
    expect(getCutoffMinutes(parseCutoff("08:30"))).toBe(8 * 60 + 30);
  });

  it("checks slot availability for capacity", () => {
    const slot = { is_open: true, booked_orders: 0, capacity_orders: 5, booked_weight_kg: 0, capacity_weight_kg: 10 };
    expect(isSlotAvailable(slot, 1)).toBe(true);
    expect(isSlotAvailable({ ...slot, booked_orders: 5 }, 1)).toBe(false);
    expect(isSlotAvailable({ ...slot, booked_weight_kg: 9.5, capacity_weight_kg: 10 }, 0.6)).toBe(false);
    expect(isSlotAvailable({ ...slot, is_open: false }, 1)).toBe(false);
  });

  it("resolves effective weight against minimum order quantity", () => {
    expect(getEffectiveWeightKg(0.2, 0.5)).toBe(0.5);
    expect(getEffectiveWeightKg(2, 0.5)).toBe(2);
  });

  it("calculates final price from price per kg times effective weight", () => {
    expect(calculateFinalPrice(4500, 0.5, 0.5)).toBe(2250);
    expect(calculateFinalPrice(4500, 2, 0.5)).toBe(9000);
  });

  it("checks free delivery against the brand threshold", () => {
    expect(isFreeDelivery(14999, DEFAULT_LF_DELIVERY_CONFIG)).toBe(false);
    expect(isFreeDelivery(15000, DEFAULT_LF_DELIVERY_CONFIG)).toBe(true);
  });
});
