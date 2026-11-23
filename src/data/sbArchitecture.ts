import type { Product, ProductType } from "./products";

export const SB_BRAND_ID = "11111111-1111-1111-1111-111111111111";

export const SB_PRODUCT_TYPES = [
  {
    code: "TEE",
    label: "T Shirts",
    slug: "t-shirts",
    description:
      "Graphic, oversized, statement, essential and limited drop tees. The piece that started the conversation.",
  },
  {
    code: "VEST",
    label: "Vests",
    slug: "vests",
    description: "Graphic, oversized, essential and summer vests. Made for layering or wearing on their own.",
  },
  {
    code: "SHORT_SLEEVE_SHIRT",
    label: "Shirts",
    slug: "short-sleeve-shirts",
    description: "Graphic, printed, relaxed fit and statement shirts for a lighter layer.",
  },
  {
    code: "SHORTS",
    label: "Shorts",
    slug: "shorts",
    description: "Street, graphic, relaxed, utility and matching shorts built to complete every outfit.",
  },
] as const;

export type SbProductTypeCode = (typeof SB_PRODUCT_TYPES)[number]["code"];

export const CORE_CATEGORY_SLUGS = SB_PRODUCT_TYPES.map((type) => type.slug);

export const SB_PRODUCT_TYPE_LABELS: Record<string, string> = {
  TEE: "T Shirts",
  VEST: "Vests",
  SHORT_SLEEVE_SHIRT: "Short Sleeve Shirts",
  SHORTS: "Shorts",
  HOODIES: "Hoodies",
  SWEATSHIRTS: "Sweatshirts",
  JACKETS: "Jackets",
  TROUSERS: "Trousers",
  CAPS: "Caps",
  ACCESSORIES: "Accessories",
  SETS: "Sets",
};

/** Approximate share of campaign imagery by wardrobe category. */
export const SB_CAMPAIGN_IMAGE_MIX: Record<SbProductTypeCode, number> = {
  TEE: 50,
  VEST: 20,
  SHORT_SLEEVE_SHIRT: 15,
  SHORTS: 15,
};

export const SB_COLLECTION_SECTIONS = [
  "home_hero",
  "new_arrivals",
  "sb_tee",
  "complete_look",
  "sb_street",
] as const;

export type SbSectionKey = (typeof SB_COLLECTION_SECTIONS)[number];

export interface SbVariant {
  id: string;
  productId: string;
  sku: string;
  sizeLabel: string;
  color: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockQty: number;
  reservedQty: number;
  weightGrams: number | null;
  availability: "in_stock" | "low_stock" | "out_of_stock" | "disabled";
  isActive: boolean;
}

export interface SbProductType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SbCollection {
  id: string;
  kind: "collection" | "drop";
  name: string;
  slug: string;
  description: string | null;
  heroImage: string | null;
  isActive: boolean;
  isFeatured: boolean;
  releaseDate: string | null;
  limitedDrop: boolean;
  sortOrder: number;
  productIds: string[];
}

export interface SbLookItem {
  id: string;
  productId: string;
  variantId: string | null;
  role: string | null;
  stylingNote: string | null;
  isPurchasable: boolean;
  sortOrder: number;
}

export interface SbLook {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  heroImage: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  items: SbLookItem[];
}

export interface SbCampaign {
  id: string;
  name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  heroImage: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
}

export interface SbPlacement {
  id: string;
  sectionKey: string;
  campaignId: string | null;
  productId: string | null;
  lookId: string | null;
  collectionId: string | null;
  headline: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageOverride: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SbCompleteLookRule {
  sourceTypeCode: string;
  suggestedTypeCode: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SbProductRelation {
  productId: string;
  relatedProductId: string;
  relationType: "related" | "complete_look";
  sortOrder: number;
}

export interface SbMerchandising {
  productTypes: SbProductType[];
  collections: SbCollection[];
  looks: SbLook[];
  campaigns: SbCampaign[];
  placements: SbPlacement[];
  completeLookRules: SbCompleteLookRule[];
  relations: SbProductRelation[];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getProductTypeCode = (product?: Product | null): string => {
  const explicit = (product as (Product & { product_type_code?: string | null }) | undefined | null)
    ?.product_type_code;
  if (explicit) return explicit;
  const category = slugify(product?.category || "");
  if (category === "t-shirts" || category === "tshirts" || category === "t-shirt") return "TEE";
  if (category === "vests" || category === "vest") return "VEST";
  if (
    category === "short-sleeve-shirts" ||
    category === "short-sleeve-shirt" ||
    category === "shirts" ||
    category === "shirt"
  ) {
    return "SHORT_SLEEVE_SHIRT";
  }
  if (category === "shorts" || category === "short") return "SHORTS";
  return "";
};

export const getProductTypeLabel = (product?: Product | null) =>
  SB_PRODUCT_TYPE_LABELS[getProductTypeCode(product)] ||
  (product?.category ? product.category : "Apparel");

const DEFAULT_RULES: SbCompleteLookRule[] = [
  { sourceTypeCode: "TEE", suggestedTypeCode: "SHORTS", sortOrder: 10, isActive: true },
  { sourceTypeCode: "VEST", suggestedTypeCode: "SHORTS", sortOrder: 20, isActive: true },
  { sourceTypeCode: "SHORT_SLEEVE_SHIRT", suggestedTypeCode: "SHORTS", sortOrder: 30, isActive: true },
  { sourceTypeCode: "SHORTS", suggestedTypeCode: "TEE", sortOrder: 40, isActive: true },
  { sourceTypeCode: "TEE", suggestedTypeCode: "SHORT_SLEEVE_SHIRT", sortOrder: 50, isActive: true },
];

export function getCompleteLookProducts(
  product: Product,
  products: Product[],
  rules: SbCompleteLookRule[] = DEFAULT_RULES,
  relations: SbProductRelation[] = [],
  limit = 4,
): Product[] {
  const sourceType = getProductTypeCode(product);
  const curated = relations
    .filter(
      (relation) =>
        relation.productId === product.id && relation.relationType === "complete_look",
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((relation) => products.find((candidate) => candidate.id === relation.relatedProductId))
    .filter((candidate): candidate is Product => Boolean(candidate));

  const curatedIds = new Set(curated.map((item) => item.id));
  const suggestedTypes = rules
    .filter((rule) => rule.isActive && rule.sourceTypeCode === sourceType)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rule) => rule.suggestedTypeCode);

  const automatic = suggestedTypes.flatMap((typeCode) =>
    products.filter(
      (candidate) =>
        candidate.id !== product.id &&
        !curatedIds.has(candidate.id) &&
        getProductTypeCode(candidate) === typeCode &&
        candidate.stock !== 0,
    ),
  );

  const seen = new Set<string>();
  return [...curated, ...automatic]
    .filter((candidate) => {
      if (seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return true;
    })
    .slice(0, limit);
}

export function getRelatedProducts(
  product: Product,
  products: Product[],
  relations: SbProductRelation[] = [],
  limit = 4,
): Product[] {
  const curated = relations
    .filter((relation) => relation.productId === product.id && relation.relationType === "related")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((relation) => products.find((candidate) => candidate.id === relation.relatedProductId))
    .filter((candidate): candidate is Product => Boolean(candidate));

  if (curated.length > 0) return curated.slice(0, limit);

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && getProductTypeCode(candidate) === getProductTypeCode(product),
    )
    .slice(0, limit);
}

export function pickBalancedNewArrivals(products: Product[], perType = 1): Product[] {
  const picked: Product[] = [];
  const used = new Set<string>();

  for (const type of SB_PRODUCT_TYPES) {
    const candidates = products
      .filter(
        (product) =>
          product.is_new_arrival &&
          !used.has(product.id) &&
          getProductTypeCode(product) === type.code,
      )
      .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)));
    const batch = candidates.slice(0, perType);
    batch.forEach((product) => used.add(product.id));
    picked.push(...batch);
  }

  if (picked.length < 4) {
    const remaining = products
      .filter((product) => !used.has(product.id))
      .sort(
        (a, b) =>
          Number(Boolean(b.is_new_arrival)) - Number(Boolean(a.is_new_arrival)) ||
          Number(Boolean(b.image)) - Number(Boolean(a.image)),
      );
    for (const product of remaining) {
      if (picked.length >= 4) break;
      picked.push(product);
      used.add(product.id);
    }
  }

  return picked.slice(0, 4);
}

export function getTypeOptions(variants: SbVariant[], type: ProductType[] = []): ProductType[] {
  if (variants.length > 0) {
    const seen = new Set<string>();
    return variants
      .filter((variant) => variant.isActive && variant.availability !== "disabled")
      .flatMap((variant) => {
        if (seen.has(variant.sizeLabel)) return [];
        seen.add(variant.sizeLabel);
        return [{ id: variant.id, name: variant.sizeLabel }];
      });
  }
  return type;
}

export function getVariantColorOptions(variants: SbVariant[], sizeLabel?: string): string[] {
  const scoped = sizeLabel ? variants.filter((variant) => variant.sizeLabel === sizeLabel) : variants;
  return [...new Set(scoped.filter((variant) => variant.isActive).map((variant) => variant.color))];
}
