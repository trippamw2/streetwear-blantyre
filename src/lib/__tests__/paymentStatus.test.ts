import { describe, expect, it } from "vitest";
import {
  isOrderPaid,
  isOrderPayable,
  isProviderFailure,
  isProviderSuccess,
  normalizeOrderPaymentStatus,
  normalizeProviderStatus,
} from "../paymentStatus";

describe("normalizeProviderStatus", () => {
  it("lowercases and trims provider values", () => {
    expect(normalizeProviderStatus("  SUCCESS ")).toBe("success");
    expect(normalizeProviderStatus(null)).toBe("");
    expect(normalizeProviderStatus(undefined)).toBe("");
  });
});

describe("provider status classification", () => {
  it("accepts every PayChangu success spelling", () => {
    for (const value of ["success", "SUCCESSFUL", "completed", "Paid"]) {
      expect(isProviderSuccess(value)).toBe(true);
      expect(isProviderFailure(value)).toBe(false);
    }
  });

  it("accepts every PayChangu failure spelling", () => {
    for (const value of ["failed", "cancelled", "canceled", "expired", "declined", "refused"]) {
      expect(isProviderFailure(value)).toBe(true);
      expect(isProviderSuccess(value)).toBe(false);
    }
  });

  it("treats unknown statuses as neither success nor failure", () => {
    expect(isProviderSuccess("processing")).toBe(false);
    expect(isProviderFailure("processing")).toBe(false);
  });
});

describe("order payment status", () => {
  it("keeps the five known states", () => {
    expect(normalizeOrderPaymentStatus("pending")).toBe("pending");
    expect(normalizeOrderPaymentStatus("paid")).toBe("paid");
    expect(normalizeOrderPaymentStatus("failed")).toBe("failed");
    expect(normalizeOrderPaymentStatus("refunded")).toBe("refunded");
    expect(normalizeOrderPaymentStatus("cancelled")).toBe("cancelled");
  });

  it("never defaults an unknown value to paid", () => {
    expect(normalizeOrderPaymentStatus("garbage")).toBe("pending");
    expect(normalizeOrderPaymentStatus(null)).toBe("pending");
    expect(normalizeOrderPaymentStatus(undefined)).toBe("pending");
  });

  it("only allows retry while pending or failed", () => {
    expect(isOrderPayable("pending")).toBe(true);
    expect(isOrderPayable("failed")).toBe(true);
    expect(isOrderPayable("paid")).toBe(false);
    expect(isOrderPayable("refunded")).toBe(false);
    expect(isOrderPayable("cancelled")).toBe(false);
    expect(isOrderPayable(null)).toBe(true);
  });

  it("recognises a paid order case-insensitively", () => {
    expect(isOrderPaid("PAID")).toBe(true);
    expect(isOrderPaid("paid")).toBe(true);
    expect(isOrderPaid("pending")).toBe(false);
  });
});
