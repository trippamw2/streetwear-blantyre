/**
 * Lake Fresh Fish Mart — storefront data layer (Stage 4)
 * Brand-scoped defaults for the independent fresh-fish business.
 */
import { getBrandConfig, normalizeBrandSlug, type BrandSlug } from "@/lib/brands";

export const LAKE_FRESH_BRAND: BrandSlug = "lake-fresh";

export interface FishSpecies {
  id: string;
  name: string;
  slug: string;
  description: string;
  storageInfo: string;
  handlingInfo: string;
  sortOrder: number;
}

export const FISH_SPECIES: FishSpecies[] = [
  {
    id: "fish-chambo",
    name: "Chambo",
    slug: "chambo",
    description: "Fresh Chambo from Lake Malawi.",
    storageInfo: "Keep refrigerated at 0-4°C. Consume within 2 days of delivery.",
    handlingInfo: "Handle with clean hands; rinse before cooking.",
    sortOrder: 1,
  },
  {
    id: "fish-ncheni-micheni",
    name: "Ncheni / Micheni",
    slug: "ncheni-micheni",
    description: "Fresh Ncheni / Micheni from Lake Malawi.",
    storageInfo: "Keep refrigerated at 0-4°C. Consume within 2 days of delivery.",
    handlingInfo: "Handle with clean hands; rinse before cooking.",
    sortOrder: 2,
  },
  {
    id: "fish-usipa",
    name: "Usipa",
    slug: "usipa",
    description: "Fresh Usipa from Lake Malawi.",
    storageInfo: "Keep refrigerated at 0-4°C. Consume within 2 days of delivery.",
    handlingInfo: "Handle with clean hands; rinse before cooking.",
    sortOrder: 3,
  },
];

export interface FishProduct {
  id: string;
  speciesId: string;
  name: string;
  description: string;
  pricePerKgMwk: number;
  minOrderQtyKg: number;
  preparationOptions: string[];
  availabilityStatus: "available" | "sold_out";
  image: string;
}

export const FISH_PRODUCTS: FishProduct[] = [
  {
    id: "fish-prod-chambo",
    speciesId: "fish-chambo",
    name: "Lake Fresh Chambo",
    description: "Whole, cleaned or portioned Chambo. Priced per kilogram.",
    pricePerKgMwk: 4500,
    minOrderQtyKg: 0.5,
    preparationOptions: ["whole", "cleaned", "portioned"],
    availabilityStatus: "available",
    image: "",
  },
];

export interface DeliveryZone {
  id: string;
  name: string;
  slug: string;
  baseFeeMwk: number;
  minOrderMwk: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "lf-zone-chimwankhunda", name: "Chimwankhunda", slug: "chimwankhunda", baseFeeMwk: 2000, minOrderMwk: 0 },
  { id: "lf-zone-chilobwe", name: "Chilobwe", slug: "chilobwe", baseFeeMwk: 2000, minOrderMwk: 0 },
  { id: "lf-zone-zingwangwa", name: "Zingwangwa", slug: "zingwangwa", baseFeeMwk: 2000, minOrderMwk: 0 },
  { id: "lf-zone-mkolokosa", name: "Mkolokosa", slug: "mkolokosa", baseFeeMwk: 2500, minOrderMwk: 0 },
  { id: "lf-zone-naperi", name: "Naperi", slug: "naperi", baseFeeMwk: 2000, minOrderMwk: 0 },
  { id: "lf-zone-chitawira", name: "Chitawira", slug: "chitawira", baseFeeMwk: 2000, minOrderMwk: 0 },
  { id: "lf-zone-surrounding", name: "Surrounding areas", slug: "surrounding-areas", baseFeeMwk: 3000, minOrderMwk: 0 },
];

export const DEFAULT_LF_DELIVERY_FEE_MWK = 2000;
export const DEFAULT_LF_FREE_DELIVERY_THRESHOLD_MWK = 15000;
export const DEFAULT_LF_DELIVERY_DAYS = 1;

export const getFishPriceForWeight = (
  pricePerKgMwk: number,
  weightKg: number,
  minOrderQtyKg: number
): number => {
  const effectiveWeight = Math.max(weightKg, minOrderQtyKg);
  return Math.round(pricePerKgMwk * effectiveWeight);
};

export const getLakeFreshStoreConfig = () => getBrandConfig(LAKE_FRESH_BRAND);
export const getResolvedBrand = () => normalizeBrandSlug(LAKE_FRESH_BRAND);
