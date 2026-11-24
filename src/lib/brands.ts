/**
 * Brand registry for the multi-brand commerce platform.
 * Add new brands here as they are introduced.
 * IDs must match Supabase `brands.id`.
 */
export const BRANDS = {
  sb: {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "sb",
    name: "SB",
    domain: "wearsb.com",
    tagline: "Your Style. Your Everyday.",
    currency: "MWK" as const,
    storefrontPath: "/",
    envPrefix: "STB",
  },
  "lake-fresh": {
    id: "22222222-2222-2222-2222-222222222222",
    slug: "lake-fresh",
    name: "Lake Fresh Fish Mart",
    domain: "lakefreshmw.com",
    tagline: "Fresh fish from Lake Malawi, made for your table.",
    currency: "MWK" as const,
    storefrontPath: "/lf",
    envPrefix: "LF",
  },
} as const;

export type BrandSlug = keyof typeof BRANDS;

export interface BrandConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  domain: string;
  currency: string;
  storefrontPath: string;
  envPrefix: string;
}

export const getBrandConfig = (slug: BrandSlug = "sb"): BrandConfig => BRANDS[slug];

export const isBrandSlug = (value: string): value is BrandSlug =>
  value in BRANDS;

export const normalizeBrandSlug = (value?: string | null): BrandSlug => {
  const slug = (value || "sb").toLowerCase();
  return slug in BRANDS ? (slug as BrandSlug) : "sb";
};
