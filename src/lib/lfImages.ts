/** Shared product photo handling for Lake Fresh catch and seasonings. */

export const LF_MAX_PRODUCT_IMAGES = 12;

const cleanUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Build the photo list used by product carousels.
 * The legacy single image stays first so the cover never changes by accident.
 */
export const lfGalleryImages = (primary?: string | null, gallery?: unknown): string[] => {
  const images: string[] = [];
  const add = (value: unknown) => {
    const url = cleanUrl(value);
    if (url && !images.includes(url) && images.length < LF_MAX_PRODUCT_IMAGES) {
      images.push(url);
    }
  };

  add(primary);
  if (Array.isArray(gallery)) gallery.forEach(add);
  return images;
};

export const lfCoverImage = (primary?: string | null, gallery?: unknown): string | null =>
  lfGalleryImages(primary, gallery)[0] ?? null;

export const lfHasGallery = (primary?: string | null, gallery?: unknown): boolean =>
  lfGalleryImages(primary, gallery).length > 1;
