import { describe, expect, it } from "vitest";
import { lfStoragePathFromUrl } from "../lfStorage";

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
});
