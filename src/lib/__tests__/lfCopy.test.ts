import { describe, expect, it } from "vitest";
import { lfDisplayCopy } from "../lfCopy";

describe("Lake Fresh display copy", () => {
  it("uses plain words for letter-to-letter hyphens", () => {
    expect(lfDisplayCopy("LakeFresh Peri-Peri Marinade")).toBe("LakeFresh Peri Peri spice blends");
    expect(lfDisplayCopy("Marinate in peri-peri 30 min.")).toBe("Marinate in peri peri 30 min.");
    expect(lfDisplayCopy("well-known fish")).toBe("well known fish");
  });

  it("removes long dashes and middle dots", () => {
    expect(lfDisplayCopy("Lake Fresh — fresh fish · daily")).toBe("Lake Fresh   fresh fish   daily");
  });

  it("removes hyphenated forbidden phrases", () => {
    expect(lfDisplayCopy("ready-to-cook fish")).toBe("ready for your pan fish");
    expect(lfDisplayCopy("meal-kits and cold-chain")).toBe("fish and spices and cold packing");
    expect(lfDisplayCopy("preparations and prepped fish")).toBe("getting ready and getting ready fish");
  });

  it("keeps payment refs readable", () => {
    expect(lfDisplayCopy("LF-SUB-123")).toBe("LF SUB 123");
    expect(lfDisplayCopy("LF-123")).toBe("LF 123");
  });
});
