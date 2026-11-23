/**
 * Which storefront this build/host is serving.
 *
 * - "lf"   → Lake Fresh only. LF pages live at the root (`/fish`, `/spices`, …).
 * - "sb"   → Streetwear Blantyre only. LF storefront is not mounted.
 * - "dual" → local development / QA. Streetwear Blantyre at `/`, LF at `/lf`.
 *
 * Resolution order: `VITE_BRAND_SITE` → hostname → localhost → Streetwear Blantyre.
 */
export type BrandSite = "sb" | "lf" | "dual";

const forcedSite = (import.meta.env.VITE_BRAND_SITE || "").toString().trim().toLowerCase();

const resolveSite = (): BrandSite => {
  if (forcedSite === "lf" || forcedSite === "lake-fresh" || forcedSite === "lakefresh") return "lf";
  if (forcedSite === "sb" || forcedSite === "streetwear") return "sb";
  if (forcedSite === "dual") return "dual";

  if (typeof window === "undefined") return "sb";

  const host = window.location.hostname.toLowerCase();
  if (host.includes("lakefresh")) return "lf";
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "" ||
    host.endsWith(".local")
  ) {
    return "dual";
  }
  return "sb";
};

export const BRAND_SITE: BrandSite = resolveSite();

/** True when this host is the standalone Lake Fresh storefront. */
export const IS_LF_SITE = BRAND_SITE === "lf";

/** True when this host may render both storefronts (local QA). */
export const IS_DUAL_SITE = BRAND_SITE === "dual";

/** Storefront route trees that should be mounted on this host. */
export const SHOWS_SB = BRAND_SITE !== "lf";
export const SHOWS_LF = BRAND_SITE !== "sb";

/**
 * Prefix for LF storefront routes on this host.
 * `""` on the dedicated LF domain, `"/lf"` on Streetwear Blantyre / dev.
 */
export const LF_BASE = IS_LF_SITE ? "" : "/lf";

/** Home path for the Lake Fresh storefront on this host. */
export const LF_HOME = LF_BASE || "/";

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Turn a canonical LF path (`/lf/fish`) into the correct path for this host.
 * On the LF domain the `/lf` prefix is stripped so pages live at the root.
 * External URLs, hashes and non-LF paths are returned unchanged.
 */
export const lfPath = (path = "/"): string => {
  if (typeof path !== "string") return LF_HOME;
  if (!path) return LF_HOME;
  if (EXTERNAL.test(path)) return path;

  const [rawPath, ...rest] = path.split(/(?=[?#])/);
  const suffix = rest.join("");

  let normalized = rawPath || "/";
  if (normalized === "/lf") normalized = "/";
  else if (normalized.startsWith("/lf/")) normalized = normalized.slice(3);

  if (!normalized.startsWith("/")) normalized = `/${normalized}`;

  if (IS_LF_SITE) return `${normalized}${suffix}`;
  return `${LF_BASE}${normalized === "/" ? "" : normalized}${suffix}`;
};

/** Absolute URL for a canonical LF path on this host. */
export const lfUrl = (path = "/"): string => {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${lfPath(path)}`;
};

/**
 * Where "Back to Store" and other brand-agnostic exits should land.
 * `preferLf` is used by the admin panel when the Lake Fresh brand is active.
 */
export const storefrontHome = (preferLf = false): string => {
  if (IS_LF_SITE) return "/";
  // The LF storefront is only reachable on the LF domain or the local QA host.
  if (preferLf && IS_DUAL_SITE) return lfPath("/");
  return "/";
};
