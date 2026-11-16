import { describe, expect, it } from "vitest";
import { buildSbGiftPaymentRef, buildSbPaymentRef } from "../paymentRefs";
import { buildLakeFreshPaymentRef } from "../lfPayments";

describe("payment references", () => {
  it("derives an SB order reference from the first 8 hex characters", () => {
    expect(buildSbPaymentRef("846c5729-873e-4de4-9454-fe589fcf8613")).toBe("SB-846C5729");
  });

  it("derives an SB gift reference from the first 8 hex characters", () => {
    expect(buildSbGiftPaymentRef("abcdef01-2345-6789-abcd-ef0123456789")).toBe("SB-GIFT-ABCDEF01");
  });

  it("derives a Lake Fresh reference from the first 12 hex characters", () => {
    expect(buildLakeFreshPaymentRef("846c5729-873e-4de4-9454-fe589fcf8613")).toBe("LF-846C5729873E");
  });

  it("is deterministic so retries reuse the same tx_ref", () => {
    const id = "0f0e0d0c-0b0a-4908-8706-050403020100";
    expect(buildSbPaymentRef(id)).toBe(buildSbPaymentRef(id));
    expect(buildLakeFreshPaymentRef(id)).toBe(buildLakeFreshPaymentRef(id));
  });

  it("normalizes braces and keeps references within PayChangu limits", () => {
    const refs = [
      buildSbPaymentRef("846c5729-873e-4de4-9454-fe589fcf8613"),
      buildSbGiftPaymentRef("846c5729-873e-4de4-9454-fe589fcf8613"),
      buildLakeFreshPaymentRef("846c5729-873e-4de4-9454-fe589fcf8613"),
    ];

    for (const ref of refs) {
      expect(ref).not.toMatch(/[^A-Z0-9-]/);
      expect(ref.length).toBeLessThanOrEqual(50);
    }
  });
});
