import { describe, expect, it } from "vitest";
import { BRANDS } from "../brands";
import { LF_BRAND_ID } from "@/hooks/useLakeFresh";
import { buildLakeFreshPaymentRef } from "../lfPayments";
import { buildSbPaymentRef } from "../paymentRefs";

describe("brand isolation invariants", () => {
  it("SB and Lake Fresh have distinct brand IDs", () => {
    expect(BRANDS.sb.id).not.toBe(BRANDS["lake-fresh"].id);
  });

  it("LF_BRAND_ID matches the Lake Fresh brand registry entry", () => {
    expect(LF_BRAND_ID).toBe(BRANDS["lake-fresh"].id);
  });

  it("payment references are brand-prefixed and distinct", () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    const sb = buildSbPaymentRef(id);
    const lf = buildLakeFreshPaymentRef(id);
    expect(sb.startsWith("SB-")).toBe(true);
    expect(lf.startsWith("LF-")).toBe(true);
    expect(sb).not.toBe(lf);
  });

  it("brand slugs are stable", () => {
    expect(BRANDS.sb.slug).toBe("sb");
    expect(BRANDS["lake-fresh"].slug).toBe("lake-fresh");
  });

  it("brand storefront paths do not collide", () => {
    expect(BRANDS.sb.storefrontPath).not.toBe(BRANDS["lake-fresh"].storefrontPath);
  });
});
