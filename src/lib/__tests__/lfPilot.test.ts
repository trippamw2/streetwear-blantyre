import { describe, expect, it } from "vitest";
import {
  LF_PILOT_DELIVERY_PROMISE,
  LF_PILOT_ZONE_NAMES,
  isPilotZoneSlug,
  sortPilotProducts,
  sortPilotZones,
} from "../lfPilot";

describe("Lake Fresh pilot limits", () => {
  it("uses the pilot delivery promise and areas", () => {
    expect(LF_PILOT_DELIVERY_PROMISE).toBe("Order by 8 PM, delivered tomorrow");
    expect(LF_PILOT_ZONE_NAMES).toBe("Nkolokosa, Soche East and Chitawira");
  });

  it("allows only the three pilot zones", () => {
    expect(isPilotZoneSlug("nkolokosa")).toBe(true);
    expect(isPilotZoneSlug("soche-east")).toBe(true);
    expect(isPilotZoneSlug("chitawira")).toBe(true);
    expect(isPilotZoneSlug("naperi")).toBe(false);
    expect(isPilotZoneSlug(null)).toBe(false);
  });

  it("sorts zones and products in the pilot order", () => {
    const zones = [
      { slug: "chitawira" },
      { slug: "nkolokosa" },
      { slug: "soche-east" },
    ];
    const products = [
      { name: "Family Fish Box", pilotOption: "family_box" },
      { name: "Fresh Chambo", pilotOption: "fresh_chambo" },
      { name: "Chambo Cuts", pilotOption: "fish_cuts" },
    ];

    expect(sortPilotZones(zones).map((zone) => zone.slug)).toEqual([
      "nkolokosa",
      "soche-east",
      "chitawira",
    ]);
    expect(sortPilotProducts(products).map((product) => product.name)).toEqual([
      "Fresh Chambo",
      "Chambo Cuts",
      "Family Fish Box",
    ]);
  });
});
