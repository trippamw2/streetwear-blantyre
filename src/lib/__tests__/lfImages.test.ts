import { describe, expect, it } from "vitest";
import { LF_MAX_PRODUCT_IMAGES, lfCoverImage, lfGalleryImages, lfHasGallery } from "../lfImages";

describe("Lake Fresh product photos", () => {
  it("keeps the cover image first and removes duplicates", () => {
    const images = lfGalleryImages("/cover.jpg", ["/cover.jpg", "/side.jpg", null, "/back.jpg"]);
    expect(images).toEqual(["/cover.jpg", "/side.jpg", "/back.jpg"]);
    expect(lfCoverImage("/cover.jpg", images)).toBe("/cover.jpg");
    expect(lfHasGallery("/cover.jpg", images)).toBe(true);
  });

  it("uses the gallery when there is no legacy image", () => {
    expect(lfGalleryImages(null, ["/one.jpg", "/two.jpg"])).toEqual(["/one.jpg", "/two.jpg"]);
    expect(lfCoverImage(null, [])).toBeNull();
    expect(lfHasGallery(null, ["/one.jpg"])).toBe(false);
  });

  it("caps the gallery at the supported maximum", () => {
    const all = Array.from({ length: 20 }, (_, index) => `/photo-${index}.jpg`);
    expect(lfGalleryImages(null, all)).toHaveLength(LF_MAX_PRODUCT_IMAGES);
  });
});
