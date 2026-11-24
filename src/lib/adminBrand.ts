import { useLocation } from "react-router-dom";
import { IS_LF_SITE, LF_BASE } from "./brandSite";

/** Canonical brand identifiers used by the shared Supabase project. */
export const SB_BRAND_ID = "11111111-1111-1111-1111-111111111111";
export const LF_BRAND_ID = "22222222-2222-2222-2222-222222222222";

export type AdminBrand = "sb" | "lf";

export const adminBrandId = (brand: AdminBrand): string =>
  brand === "lf" ? LF_BRAND_ID : SB_BRAND_ID;

/**
 * Which admin panel owns a path.
 *
 * The dedicated Lake Fresh deployment keeps its admin at `/admin` (its own
 * deployment is already a separate URL). The SB deployment only ever serves
 * the SB admin. On a dual host, Lake Fresh admin lives at `/lf/admin`.
 */
export const adminBrandFromPath = (pathname: string): AdminBrand => {
  if (IS_LF_SITE) return "lf";
  if (pathname === `${LF_BASE}/admin` || pathname.startsWith(`${LF_BASE}/admin/`)) return "lf";
  return "sb";
};

/** Base path for an admin panel on this host. */
export const adminBase = (brand: AdminBrand): string => {
  if (brand === "lf") return IS_LF_SITE ? "/admin" : `${LF_BASE}/admin`;
  return "/admin";
};

/** Build a path inside the given admin panel. */
export const adminPath = (brand: AdminBrand, subPath = ""): string => {
  const base = adminBase(brand);
  if (!subPath || subPath === "/") return base;
  if (subPath.startsWith("?") || subPath.startsWith("#")) return `${base}${subPath}`;
  return `${base}${subPath.startsWith("/") ? subPath : `/${subPath}`}`;
};

export const useAdminBrand = (): AdminBrand => {
  const location = useLocation();
  return adminBrandFromPath(location.pathname);
};
