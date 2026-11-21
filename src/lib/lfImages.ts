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

/**
 * Ask Supabase Storage for a smaller image when possible. Local brand assets
 * and external URLs are left untouched so signed links never break.
 */
export const lfOptimizedImageUrl = (
  src: string | null | undefined,
  width: number,
  dataSaver = false,
): string | null => {
  const url = cleanUrl(src);
  if (!url || !/^https?:\/\//i.test(url)) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes("/storage/v1/object/public/")) return url;
    parsed.searchParams.set("width", String(Math.max(120, Math.min(1600, Math.round(width)))));
    parsed.searchParams.set("quality", dataSaver ? "55" : "80");
    parsed.searchParams.set("format", "webp");
    return parsed.toString();
  } catch {
    return url;
  }
};
