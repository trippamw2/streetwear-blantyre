export type Category = string;

export interface ProductType {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  benefit: string;
  price: number;
  category: Category;
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
  { id: "sb-original", name: "SB Original", color: "#102C54" },
  { id: "sb-street", name: "SB Street", color: "#1a1a1a" },
] as const;

const titleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

export const getBrandName = (id?: string | null): string => {
  if (!id) return "SB Streetwear";
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
  { id: "street", label: "Street Culture", description: "Proud of where you come from. Your neighbourhood, your city, your story.", icon: "MapPin", color: "#102C54" },
  { id: "music", label: "Music & Entertainment", description: "Feel the rhythm of the city in every stitch. Beats, lyrics, style.", icon: "Music", color: "#7C3AED" },
  { id: "sports", label: "Football & Sport", description: "Match day energy, discipline and the love of the game.", icon: "Trophy", color: "#0F766E" },
  { id: "hustle", label: "Everyday Hustle", description: "Build what matters. Wear what you earned. Discipline, vision, legacy.", icon: "Zap", color: "#B45309" },
  { id: "faith", label: "Faith Culture", description: "Walk by purpose, not by sight. Quiet confidence in every step.", icon: "Heart", color: "#059669" },
];

// ─── Wearable Categories ────────────────────────────────────────────

export const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "t-shirts", label: "T Shirts" },
  { id: "jerseys", label: "Jerseys" },
  { id: "short-sleeve-shirts", label: "Short Sleeve Shirts" },
  { id: "vests", label: "Vests" },
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
