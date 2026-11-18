import { describe, expect, it } from "vitest";
import {
  LF_PILOT_DELIVERY_PROMISE,
  LF_PILOT_FISH_NAMES,
  isPilotSpeciesSlug,
  sortPilotProducts,
} from "../lfPilot";

describe("Lake Fresh pilot limits", () => {
  it("uses the pilot delivery promise", () => {
    expect(LF_PILOT_DELIVERY_PROMISE).toBe("Order by 8 PM, delivered tomorrow");
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

  it("sorts products in the pilot order", () => {
    const products = [
      { name: "Usipa", pilotOption: "fresh_usipa" },
      { name: "Chambo", pilotOption: "fresh_chambo" },
      { name: "Micheni", pilotOption: "fresh_micheni" },
    ];

    expect(sortPilotProducts(products).map((product) => product.name)).toEqual([
      "Chambo",
      "Micheni",
      "Usipa",
    ]);
  });
});
