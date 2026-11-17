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
  parseDeliveryConfig,
  getEarliestDeliveryDate,
  getEligibleDeliveryDates,
  getDeliveryFee,
  getBlantyreNow,
  getSlotCutoffISO,
  formatDeliveryDate,
  addDaysISO,
} from "../lfDelivery";

describe("Lake Fresh delivery engine (Stage 5 core)", () => {
  it("schedules next day delivery when order is placed before the cutoff", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T09:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), DEFAULT_LF_DELIVERY_CONFIG, now);
    expect(next).toBe("2026-11-17");
  });

  it("schedules following day when order is placed after the cutoff", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T16:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), DEFAULT_LF_DELIVERY_CONFIG, now);
    expect(next).toBe("2026-11-18");
  });

  it("treats the exact cutoff minute as after the cutoff", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T12:00:00Z"); // 14:00 Blantyre
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), DEFAULT_LF_DELIVERY_CONFIG, now);
    expect(next).toBe("2026-11-18");
  });

  it("uses the Blantyre calendar across the UTC date boundary", () => {
    // 23:00 UTC on the 16th = 01:00 on the 17th in Blantyre, before cutoff.
    const now = new Date("2026-11-16T23:00:00Z");
    expect(getBlantyreNow(now).dateISO).toBe("2026-11-17");
    expect(getEarliestDeliveryDate(now)).toBe("2026-11-18");
  });

  it("respects a custom delivery day count", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const placed = new Date("2026-11-16T09:30:00Z");
    const next = getNextDeliveryDate(placed, parseCutoff("14:00"), { ...DEFAULT_LF_DELIVERY_CONFIG, deliveryDays: 2 }, now);
    expect(next).toBe("2026-11-18");
  });

  it("lists selectable delivery dates from the earliest eligible date", () => {
    const now = new Date("2026-11-16T09:00:00Z");
    const dates = getEligibleDeliveryDates(now, { ...DEFAULT_LF_DELIVERY_CONFIG, maxAdvanceDays: 3 });
    expect(dates).toEqual(["2026-11-17", "2026-11-18", "2026-11-19"]);
  });

  it("uses default cutoff of 8 PM when unparseable", () => {
    expect(parseCutoff("bogus").hour).toBe(20);
    expect(getCutoffMinutes(parseCutoff("08:30"))).toBe(8 * 60 + 30);
  });

  it("parses public brand settings without trusting malformed values", () => {
    const config = parseDeliveryConfig({
      "delivery.cutoff": "08:15",
      "delivery.fee_mwk": 2500,
      "delivery.free_threshold_mwk": "20000",
      "delivery.delivery_days": 2,
      "delivery.max_advance_days": "nope",
    });
    expect(config.cutoff).toEqual({ hour: 8, minute: 15 });
    expect(config.deliveryFeeMwk).toBe(2500);
    expect(config.freeDeliveryThresholdMwk).toBe(20000);
    expect(config.deliveryDays).toBe(2);
    expect(config.maxAdvanceDays).toBe(7);
    expect(parseDeliveryConfig(null).cutoff).toEqual({ hour: 20, minute: 0 });
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

  it("applies the delivery zone fee unless the order is free", () => {
    expect(getDeliveryFee(2500, 5000)).toBe(2500);
    expect(getDeliveryFee(2500, 15000)).toBe(0);
    expect(getDeliveryFee(0, 5000)).toBe(2000);
    expect(getDeliveryFee(2500, 0)).toBe(0);
  });

  it("derives the slot cutoff timestamp from the delivery date", () => {
    expect(getSlotCutoffISO("2026-11-17", { hour: 14, minute: 0 })).toBe("2026-11-16T12:00:00.000Z");
    expect(getSlotCutoffISO("2026-11-17", { hour: 8, minute: 30 })).toBe("2026-11-16T06:30:00.000Z");
  });

  it("formats delivery dates in the Blantyre calendar", () => {
    expect(formatDeliveryDate("2026-11-17")).toBe("Tue, 17 Nov 2026");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
  });
});
