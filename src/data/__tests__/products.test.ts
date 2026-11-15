import { describe, it, expect } from "vitest";
import {
  formatMWK,
  getKitProducts,
  getKitSeparateTotal,
  getKitPrice,
  getKitRealSaving,
  getKitDiscountPercent,
  getKitItemNames,
  getRecommendations,
  getItemImage,
  type Product,
  type Kit,
} from "../products";

const tee: Product = {
  id: "test-tee",
  name: "Test Tee",
  benefit: "Test",
  price: 20000,
  category: "t-shirts",
  image: "https://example.com/tee.jpg",
  types: [],
  brand: "sb-original",
};

const jersey: Product = {
  id: "test-jersey",
  name: "Test Jersey",
  benefit: "Test",
  price: 30000,
  category: "jerseys",
  image: "https://example.com/jersey.jpg",
  types: [],
  brand: "sb-original",
};

const shirt: Product = {
  id: "test-shirt",
  name: "Test Shirt",
  benefit: "Test",
  price: 25000,
  category: "short-sleeve-shirts",
  image: "https://example.com/shirt.jpg",
  types: [],
  brand: "sb-street",
};

const fixtureProducts: Product[] = [tee, jersey, shirt];

const kit: Kit = {
  id: "test-kit",
  name: "Test Kit",
  hook: "test",
  lifestyle: "student",
  tagline: "test",
  description: "test",
  discountPercent: 10,
  productIds: [tee.id, jersey.id],
  image: "",
  vibe: "test",
};

describe("formatMWK", () => {
  it("formats whole numbers with commas", () => {
    expect(formatMWK(43500)).toBe("MK 43,500");
  });

  it("formats zero", () => {
    expect(formatMWK(0)).toBe("MK 0");
  });

  it("formats small numbers", () => {
    expect(formatMWK(500)).toBe("MK 500");
  });

  it("formats large numbers", () => {
    expect(formatMWK(100000)).toBe("MK 100,000");
  });
});

describe("getKitProducts", () => {
  it("returns products for a valid kit", () => {
    const result = getKitProducts(kit, fixtureProducts);
    expect(result).toHaveLength(2);
    expect(result.every((p) => typeof p.id === "string")).toBe(true);
  });

  it("filters out missing products", () => {
    const partialKit: Kit = { ...kit, productIds: ["nonexistent-id", tee.id] };
    const result = getKitProducts(partialKit, fixtureProducts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(tee.id);
  });
});

describe("getKitSeparateTotal", () => {
  it("calculates sum of product prices in a kit", () => {
    const kitProducts = getKitProducts(kit, fixtureProducts);
    const expected = kitProducts.reduce((sum, p) => sum + p.price, 0);
    expect(getKitSeparateTotal(kit, fixtureProducts)).toBe(expected);
  });

  it("returns 0 for a kit with no valid products", () => {
    const emptyKit: Kit = { ...kit, productIds: ["nonexistent"] };
    expect(getKitSeparateTotal(emptyKit, fixtureProducts)).toBe(0);
  });
});

describe("getKitPrice", () => {
  it("applies discount to separate total", () => {
    const total = getKitSeparateTotal(kit, fixtureProducts);
    const expected = Math.round(total * (1 - kit.discountPercent / 100));
    expect(getKitPrice(kit, fixtureProducts)).toBe(expected);
  });

  it("returns discounted price lower than separate total", () => {
    expect(getKitPrice(kit, fixtureProducts)).toBeLessThan(
      getKitSeparateTotal(kit, fixtureProducts),
    );
  });
});

describe("getKitRealSaving", () => {
  it("calculates positive savings for discounted kits", () => {
    expect(getKitRealSaving(kit, fixtureProducts)).toBeGreaterThan(0);
  });

  it("savings equals total minus discounted price", () => {
    expect(getKitRealSaving(kit, fixtureProducts)).toBe(
      getKitSeparateTotal(kit, fixtureProducts) - getKitPrice(kit, fixtureProducts),
    );
  });
});

describe("getKitDiscountPercent", () => {
  it("returns the kit discount percent", () => {
    expect(getKitDiscountPercent(kit)).toBe(kit.discountPercent);
  });
});

describe("getKitItemNames", () => {
  it("returns names of products in a kit", () => {
    const names = getKitItemNames(kit, fixtureProducts);
    const kitProducts = getKitProducts(kit, fixtureProducts);
    expect(names).toEqual(kitProducts.map((p) => p.name));
  });
});

describe("getRecommendations", () => {
  it("returns at most limited products", () => {
    const result = getRecommendations(tee, fixtureProducts, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("excludes the input product", () => {
    const result = getRecommendations(tee, fixtureProducts, 5);
    expect(result.find((p) => p.id === tee.id)).toBeUndefined();
  });

  it("prefers same-brand products", () => {
    const otherBrandProduct: Product = {
      ...tee,
      id: "other-brand",
      brand: "sb-street",
    };
    const result = getRecommendations(tee, [otherBrandProduct, jersey], 5);
    expect(result[0].brand).toBe(tee.brand);
  });

  it("returns empty array for empty product list", () => {
    expect(getRecommendations(tee, [], 4)).toEqual([]);
  });
});

describe("getItemImage", () => {
  it("returns product image for a valid product ID", () => {
    expect(getItemImage(tee.id, fixtureProducts)).toBe(tee.image);
  });

  it("returns product image for a valid product name", () => {
    expect(getItemImage(tee.name, fixtureProducts)).toBe(tee.image);
  });

  it("returns fallback for unknown name", () => {
    const img = getItemImage("completely-unknown-product");
    expect(img).toBeTruthy();
    expect(img).toContain("placehold.co");
  });
});
