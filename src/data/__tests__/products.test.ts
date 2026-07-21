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
  products,
  kits,
  type Product,
  type Kit,
} from "../products";

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
    const kit = kits[0]; // Daily Essential Kit
    const result = getKitProducts(kit);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => typeof p.id === "string")).toBe(true);
  });

  it("filters out missing products", () => {
    const kit: Kit = {
      id: "test",
      name: "Test Kit",
      hook: "test",
      lifestyle: "student",
      tagline: "test",
      description: "test",
      discountPercent: 10,
      productIds: ["nonexistent-id", products[0].id],
      image: "",
      vibe: "test",
    };
    const result = getKitProducts(kit);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(products[0].id);
  });
});

describe("getKitSeparateTotal", () => {
  it("calculates sum of product prices in a kit", () => {
    const kit = kits[0];
    const kitProducts = getKitProducts(kit);
    const expected = kitProducts.reduce((sum, p) => sum + p.price, 0);
    expect(getKitSeparateTotal(kit)).toBe(expected);
  });

  it("returns 0 for a kit with no valid products", () => {
    const kit: Kit = {
      id: "empty",
      name: "Empty Kit",
      hook: "test",
      lifestyle: "student",
      tagline: "test",
      description: "test",
      discountPercent: 10,
      productIds: ["nonexistent"],
      image: "",
      vibe: "test",
    };
    expect(getKitSeparateTotal(kit)).toBe(0);
  });
});

describe("getKitPrice", () => {
  it("applies discount to separate total", () => {
    const kit = kits[0];
    const total = getKitSeparateTotal(kit);
    const expected = Math.round(total * (1 - kit.discountPercent / 100));
    expect(getKitPrice(kit)).toBe(expected);
  });

  it("returns discounted price lower than separate total", () => {
    const kit = kits.find((k) => k.discountPercent > 0)!;
    expect(getKitPrice(kit)).toBeLessThan(getKitSeparateTotal(kit));
  });
});

describe("getKitRealSaving", () => {
  it("calculates positive savings for discounted kits", () => {
    const kit = kits.find((k) => k.discountPercent > 0)!;
    expect(getKitRealSaving(kit)).toBeGreaterThan(0);
  });

  it("savings equals total minus discounted price", () => {
    const kit = kits[0];
    expect(getKitRealSaving(kit)).toBe(
      getKitSeparateTotal(kit) - getKitPrice(kit)
    );
  });
});

describe("getKitDiscountPercent", () => {
  it("returns the kit discount percent", () => {
    const kit = kits[0];
    expect(getKitDiscountPercent(kit)).toBe(kit.discountPercent);
  });
});

describe("getKitItemNames", () => {
  it("returns names of products in a kit", () => {
    const kit = kits[0];
    const names = getKitItemNames(kit);
    const kitProducts = getKitProducts(kit);
    expect(names).toEqual(kitProducts.map((p) => p.name));
  });
});

describe("getRecommendations", () => {
  const testProduct: Product = {
    id: "test-prod",
    name: "Test Product",
    benefit: "Test",
    price: 50000,
    category: "t-shirts",
    image: "",
    types: [],
    brand: "sb-original",
  };

  it("returns at most limited products", () => {
    const result = getRecommendations(testProduct, products, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("excludes the input product", () => {
    const result = getRecommendations(testProduct, [testProduct, ...products], 5);
    expect(result.find((p) => p.id === testProduct.id)).toBeUndefined();
  });

  it("prefers same-brand products", () => {
    const otherBrandProduct: Product = {
      ...testProduct,
      id: "other-brand",
      brand: "sb-street",
    };
    const result = getRecommendations(testProduct, [otherBrandProduct, products[0]], 5);
    const first = result[0];
    expect(first.brand).toBe(testProduct.brand);
  });

  it("returns empty array for empty product list", () => {
    const result = getRecommendations(testProduct, [], 4);
    expect(result).toEqual([]);
  });
});

describe("getItemImage", () => {
  it("returns product image for a valid product ID", () => {
    const img = getItemImage(products[0].id);
    expect(img).toBe(products[0].image);
  });

  it("returns product image for a valid product name", () => {
    const img = getItemImage(products[0].name);
    expect(img).toBe(products[0].image);
  });

  it("returns fallback for unknown name", () => {
    const img = getItemImage("completely-unknown-product");
    expect(img).toBeTruthy();
    expect(img).toContain("placehold.co");
  });
});
