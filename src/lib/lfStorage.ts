import { supabase } from "@/integrations/supabase/client";

export const LF_STORAGE_BUCKET = "product-images";

const PUBLIC_MARKER = `/storage/v1/object/public/${LF_STORAGE_BUCKET}/`;

type ReferenceColumn = {
  table: string;
  column: string;
  json?: boolean;
};

// Only Lake Fresh records that can store a public product-images URL.
// Check every place before deleting so a shared photo is never broken.
const LF_ASSET_REFERENCES: ReferenceColumn[] = [
  { table: "fish_species", column: "image" },
  { table: "fish_products", column: "image" },
  { table: "fish_products", column: "images", json: true },
  { table: "lf_spices", column: "image" },
  { table: "lf_spices", column: "images", json: true },
  { table: "lf_recipes", column: "image" },
  { table: "lf_recipes", column: "pdf_url" },
  { table: "lf_marinades", column: "image" },
  { table: "lf_ready_to_cook", column: "image" },
  { table: "lf_meal_kits", column: "image" },
];

/** Resolve a public product-images URL to its storage object path. */
export const lfStoragePathFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://example.invalid");
    const markerIndex = parsed.pathname.indexOf(PUBLIC_MARKER);
    if (markerIndex < 0) return null;
    const rawPath = parsed.pathname.slice(markerIndex + PUBLIC_MARKER.length);
    const path = decodeURIComponent(rawPath).replace(/^\/+/, "");
    return path.startsWith("lf/") ? path : null;
  } catch {
    return null;
  }
};

/** True when another Lake Fresh record still points to this public URL. */
export const lfStorageAssetIsReferenced = async (url: string | null | undefined): Promise<boolean> => {
  if (!lfStoragePathFromUrl(url)) return false;

  const checks = await Promise.all(
    LF_ASSET_REFERENCES.map(async ({ table, column, json }) => {
      const query = (supabase as any)
        .from(table)
        .select("id")
        .limit(1);
      const { data, error } = json
        ? await query.contains(column, [url])
        : await query.eq(column, url);
      if (error) throw new Error(error.message);
      return (data?.length || 0) > 0;
    })
  );

  return checks.some(Boolean);
};

/**
 * Delete an uploaded LF asset. External links, other brands' paths, and files
 * still used by another record are left alone.
 */
export const deleteLfStorageAsset = async (url: string | null | undefined): Promise<boolean> => {
  const path = lfStoragePathFromUrl(url);
  if (!path) return false;
  if (await lfStorageAssetIsReferenced(url)) return false;

  const { error } = await supabase.storage.from(LF_STORAGE_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
  return true;
};
