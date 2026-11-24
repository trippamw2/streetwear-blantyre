export type Category = string;

export interface ProductType {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  benefit: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  category: Category;
  subcategory?: string;
  collection_name?: string;
  product_type_code?: string | null;
  fit?: string;
  material?: string;
  gender_classification?: "unisex" | "men" | "women" | string;
  status?: "draft" | "active" | "archived" | string;
  featured?: boolean;
  bestseller?: boolean;
  new_arrival?: boolean;
  limited_drop?: boolean;
  release_date?: string | null;
  care_instructions?: string;
  model_fit_note?: string;
  tags?: string[];
  image: string;
  brand?: string;
  types: ProductType[];
  stock?: number;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  is_on_sale?: boolean;
  discount_percent?: number;
  gallery_images?: string[];
  specs?: Record<string, string>;
  reward_points?: number;
  rating?: number;
  culture_pillar?: string;
  culture_pillar_color?: string;
  culture_story?: string;
  culture_context?: string;
}

export const BRANDS = [
  { id: "sb-original", name: "Original", color: "#102C54" },
  { id: "sb-street", name: "Street", color: "#1a1a1a" },
] as const;

const titleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

export const getBrandName = (id?: string | null): string => {
  if (!id) return "SB";
  return BRANDS.find((brand) => brand.id === id)?.name || titleCase(id);
};

export const getCategoryLabel = (id?: string | null): string => {
  if (!id) return "";
  return categories.find((category) => category.id === id)?.label || titleCase(id);
};

// ─── Culture Pillars ────────────────────────────────────────────────

export interface CulturePillar {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const culturePillars: CulturePillar[] = [
  { id: "urban-style", label: "Urban Style", description: "Everyday pieces for campus, the city, weekends, and everything in between.", icon: "Sparkles", color: "#102C54" },
];

// ─── Wearable Categories ────────────────────────────────────────────

export const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "t-shirts", label: "T Shirts" },
  { id: "vests", label: "Vests" },
  { id: "short-sleeve-shirts", label: "Short Sleeve Shirts" },
  { id: "shorts", label: "Shorts" },
];

// ─── Products ───────────────────────────────────────────────────────

const PLACEHOLDER = "https://placehold.co/600x600/1a1a1a/ffffff?text=Streetwear+Blantyre";

export const products: Product[] = [];

// ─── Kits / Combos ──────────────────────────────────────────────────

export interface Kit {
  id: string;
  name: string;
  hook: string;
  lifestyle: "student" | "work" | "travel" | "casual" | "premium";
  tagline: string;
  description: string;
  discountPercent: number;
  productIds: string[];
  image: string;
  vibe: string;
  badge?: string;
  stock?: number;
}

export const kits: Kit[] = [];

export const combos: Kit[] = kits;

// ─── Utilities ──────────────────────────────────────────────────────

const itemImageMap: Record<string, string> = {};

export const getItemImage = (nameOrId: string, productsList: Product[] = products): string => {
  const byProduct = productsList.find(p => p.id === nameOrId || p.name === nameOrId);
  if (byProduct) return byProduct.image;
  return itemImageMap[nameOrId] ?? PLACEHOLDER;
};

export const formatMWK = (n: number) => `MK ${n.toLocaleString("en-US")}`;

export function getKitProducts(kit: Kit, productsList: Product[] = products): Product[] {
  return kit.productIds.map(id => productsList.find(p => p.id === id)).filter((p): p is Product => p !== undefined);
}

export function getKitSeparateTotal(kit: Kit, productsList: Product[] = products): number {
  return getKitProducts(kit, productsList).reduce((sum, p) => sum + p.price, 0);
}

export function getKitPrice(kit: Kit, productsList: Product[] = products): number {
  const total = getKitSeparateTotal(kit, productsList);
  return Math.round(total * (1 - kit.discountPercent / 100));
}

export function getKitRealSaving(kit: Kit, productsList: Product[] = products): number {
  return getKitSeparateTotal(kit, productsList) - getKitPrice(kit, productsList);
}

export function getKitDiscountPercent(kit: Kit): number {
  return kit.discountPercent;
}

export function getKitItemNames(kit: Kit, productsList: Product[] = products): string[] {
  return getKitProducts(kit, productsList).map(p => p.name);
}

export const getRecommendations = (product: Product, allProducts: Product[], limit = 4, combosList: Kit[] = combos): Product[] => {
  const price = product.price;
  const priceMin = price * 0.7;
  const priceMax = price * 1.3;
  
  const scored = allProducts
    .filter(p => p.id !== product.id)
    .map(p => {
      let score = 0;
      
      if (p.brand === product.brand) score += 100;
      
      if (p.price >= priceMin && p.price <= priceMax) score += 50;
      
      if (p.category === product.category) score += 30;
      
      if (product.culture_pillar && p.culture_pillar === product.culture_pillar) score += 40;
      
      const comboMatch = combosList.some(c => 
        c.productIds.some(pid => pid === product.id) &&
        c.productIds.some(pid => pid === p.id)
      );
      if (comboMatch) score += 20;
      
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit).map(s => s.product);
};
