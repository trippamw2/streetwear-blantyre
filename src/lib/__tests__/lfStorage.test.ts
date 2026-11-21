import { describe, expect, it } from "vitest";
import {
  buildLfProofPath,
  isLfProofPath,
  lfStoragePathFromUrl,
} from "../lfStorage";

describe("Lake Fresh storage paths", () => {
  it("resolves a Lake Fresh public URL to a storage path", () => {
    const url =
      "https://qhpemjwrnnuqhfgifxnh.supabase.co/storage/v1/object/public/product-images/lf/fish/chambo/chambo-01.jpg";
    expect(lfStoragePathFromUrl(url)).toBe("lf/fish/chambo/chambo-01.jpg");
  });

  it("decodes spaced and special file names", () => {
    const url =
      "https://example.supabase.co/storage/v1/object/public/product-images/lf/files/menu%20june.pdf";
    expect(lfStoragePathFromUrl(url)).toBe("lf/files/menu june.pdf");
  });

  it("does not resolve other brands or external links", () => {
    expect(
      lfStoragePathFromUrl(
        "https://example.supabase.co/storage/v1/object/public/product-images/sb/products/jacket.jpg"
      )
    ).toBeNull();
    expect(lfStoragePathFromUrl("https://example.com/photo.jpg")).toBeNull();
    expect(lfStoragePathFromUrl("/brand/lake-fresh/fish-chambo.jpg")).toBeNull();
    expect(lfStoragePathFromUrl(null)).toBeNull();
  });

  it("accepts only private delivery proof paths", () => {
    expect(isLfProofPath("lf/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg")).toBe(true);
    expect(isLfProofPath("lf/11111111-1111-4111-8111-111111111111/proof.jpg")).toBe(false);
    expect(isLfProofPath("https://example.com/proof.jpg")).toBe(false);
  });

  it("builds a proof path under the order folder", () => {
    const path = buildLfProofPath(
      "11111111-1111-4111-8111-111111111111",
      "delivery.PNG",
    );
    expect(path).toMatch(/^lf\/11111111-1111-4111-8111-111111111111\/[0-9a-f-]{36}\.png$/i);
    expect(buildLfProofPath("not-an-order", "proof.jpg")).toBeNull();
    expect(buildLfProofPath("11111111-1111-4111-8111-111111111111", "proof.pdf")).toBeNull();
  });
});
