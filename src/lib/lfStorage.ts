import { supabase } from "@/integrations/supabase/client";

export const LF_STORAGE_BUCKET = "product-images";
export const LF_PROOF_BUCKET = "lf-delivery-proof";

const PUBLIC_MARKER = `/storage/v1/object/public/${LF_STORAGE_BUCKET}/`;

const PROOF_PATH = /^lf\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

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

/** Private proof paths are stored in orders, not public URLs. */
export const isLfProofPath = (path: string | null | undefined): boolean =>
  Boolean(path && PROOF_PATH.test(path.trim()));

export const buildLfProofPath = (orderId: string, fileName: string): string | null => {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext) || !isUuid(orderId)) return null;
  return `lf/${orderId}/${randomUuid()}.${ext}`;
};

export const lfProofSignedUrl = async (path: string, expiresIn = 60): Promise<string> => {
  if (!isLfProofPath(path)) throw new Error("Invalid delivery proof path");
  const { data, error } = await supabase.storage
    .from(LF_PROOF_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

/** Customer-safe proof URL. The server checks order ownership before signing. */
export const lfDeliveryProofUrl = async (
  orderId: string,
  accessToken?: string | null,
): Promise<string> => {
  const { data: session } = await supabase.auth.getSession();
  const jwt = session.session?.access_token;
  const response = await fetch("/api/lf/delivery-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({
      order_id: orderId,
      access_token: accessToken || null,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload?.url !== "string") {
    throw new Error(payload?.error || "We could not open the delivery photo.");
  }
  return payload.url;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

const randomUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const digit = char === "x" ? value : (value & 0x3) | 0x8;
    return digit.toString(16);
  });
};
