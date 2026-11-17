import { describe, expect, it } from "vitest";
import {
  LF_PILOT_DELIVERY_PROMISE,
  LF_PILOT_FISH_NAMES,
  LF_PILOT_ZONE_NAMES,
  isPilotSpeciesSlug,
  isPilotZoneSlug,
  sortPilotProducts,
  sortPilotZones,
} from "../lfPilot";

describe("Lake Fresh pilot limits", () => {
  it("uses the pilot delivery promise and areas", () => {
    expect(LF_PILOT_DELIVERY_PROMISE).toBe("Order by 8 PM, delivered tomorrow");
    expect(LF_PILOT_ZONE_NAMES).toBe("Nkolokosa, Soche East and Chitawira");
  });

  it("offers Chambo, Micheni and Usipa only", () => {
    expect(LF_PILOT_FISH_NAMES).toBe("Chambo, Micheni and Usipa");
    expect(isPilotSpeciesSlug("chambo")).toBe(true);
    expect(isPilotSpeciesSlug("micheni")).toBe(true);
    expect(isPilotSpeciesSlug("usipa")).toBe(true);
    expect(isPilotSpeciesSlug("chisense")).toBe(false);
    expect(isPilotSpeciesSlug("ncheni-micheni")).toBe(false);
    expect(isPilotSpeciesSlug(null)).toBe(false);
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
      { name: "Usipa", pilotOption: "fresh_usipa" },
      { name: "Chambo", pilotOption: "fresh_chambo" },
      { name: "Micheni", pilotOption: "fresh_micheni" },
    ];

    expect(sortPilotZones(zones).map((zone) => zone.slug)).toEqual([
      "nkolokosa",
      "soche-east",
      "chitawira",
    ]);
    expect(sortPilotProducts(products).map((product) => product.name)).toEqual([
      "Chambo",
      "Micheni",
      "Usipa",
    ]);
  });
});
