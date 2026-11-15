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
  is_on_sale?: boolean;
  discount_percent?: number;
  gallery_images?: string[];
  specs?: Record<string, string>;
  reward_points?: number;
  rating?: number;
  culture_pillar?: string;
  culture_pillar_color?: string;
}

export const BRANDS = [
  { id: "sb-original", name: "SB Original", color: "#2563eb" },
  { id: "sb-street", name: "SB Street", color: "#1a1a1a" },
] as const;

// ─── Culture Pillars ────────────────────────────────────────────────

export interface CulturePillar {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const culturePillars: CulturePillar[] = [
  { id: "street", label: "Street Culture", description: "Proud of where you come from. Your neighborhood, your city, your story.", icon: "MapPin", color: "#6366f1" },
  { id: "music", label: "Music Culture", description: "Feel the rhythm of Malawi in every stitch. Beats, lyrics, style.", icon: "Music", color: "#8B5CF6" },
  { id: "hustle", label: "Hustle Culture", description: "Build what matters. Wear what you earned. Discipline, vision, legacy.", icon: "Zap", color: "#F59E0B" },
  { id: "faith", label: "Faith Culture", description: "Faithfully crafted. Walk by purpose, not by sight.", icon: "Heart", color: "#10B981" },
];

// ─── Wearable Categories ────────────────────────────────────────────

export const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "t-shirts", label: "T-Shirts" },
  { id: "jerseys", label: "Jerseys" },
  { id: "short-sleeve-shirts", label: "Short Sleeve Shirts" },
];

// ─── Products ───────────────────────────────────────────────────────

const PLACEHOLDER = "https://placehold.co/600x600/1a1a1a/ffffff?text=Streetwear+Blantyre";

export const products: Product[] = [
  // ── T-SHIRTS ──
  { id: "sb-tee-001", name: "SB Classic Logo Tee", benefit: "100% cotton. Oversized fit. Iconic SB branding across the chest.", price: 12000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 20, is_featured: true, is_best_seller: true, culture_pillar: "hustle" },
  { id: "sb-tee-002", name: "SB Street Graphic Tee", benefit: "Premium cotton blend. Street art print. Relaxed fit.", price: 15000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "olive", name: "Olive" }], stock: 15, is_featured: true, culture_pillar: "music" },
  { id: "sb-tee-003", name: "SB Minimalist Tee", benefit: "Clean design. Soft-touch cotton. Embroidered logo.", price: 14000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "navy", name: "Navy" }, { id: "grey", name: "Grey" }], stock: 12, culture_pillar: "faith" },
  { id: "sb-tee-004", name: "SB Malawi Pride Tee", benefit: "Celebrate the culture. Cotton. Regular fit.", price: 13000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "green", name: "Green" }, { id: "red", name: "Red" }], stock: 18, is_featured: true, culture_pillar: "sports" },
  { id: "sb-tee-005", name: "SB Tie-Dye Tee", benefit: "Hand-dyed. One-of-a-kind pattern. 100% cotton.", price: 16000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "multi", name: "Multi" }], stock: 8, culture_pillar: "music" },

  // ── JERSEYS ──
  { id: "sb-jersey-001", name: "SB Classic Jersey", benefit: "Breathable mesh. Athletic cut. Embroidered SB crest.", price: 25000, category: "jerseys", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "home", name: "Home" }, { id: "away", name: "Away" }], stock: 15, is_featured: true, is_best_seller: true, culture_pillar: "sports" },
  { id: "sb-jersey-002", name: "SB Street Jersey", benefit: "Lightweight fabric. Relaxed fit. Bold graphic print.", price: 28000, category: "jerseys", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 12, is_featured: true, culture_pillar: "music" },

  // ── SHORT SLEEVE SHIRTS ──
  { id: "sb-ss-001", name: "SB Short Sleeve Shirt", benefit: "Button-up. Breathable cotton. Relaxed collar.", price: 22000, category: "short-sleeve-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "white", name: "White" }, { id: "blue", name: "Blue" }], stock: 18, is_featured: true, culture_pillar: "hustle" },
  { id: "sb-ss-002", name: "SB Patterned Short Sleeve", benefit: "All-over print. Soft touch. Chest pocket.", price: 24000, category: "short-sleeve-shirts", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "pattern", name: "Pattern" }], stock: 10, culture_pillar: "music" },
];

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

export const kits: Kit[] = [
  {
    id: "k1",
    name: "Campus Starter Kit",
    hook: "Tee, cap, stickers. Ready for class.",
    lifestyle: "student",
    tagline: "The everyday essentials. Clean and fresh.",
    description: "Classic logo tee, snapback cap, and logo stickers. Everything you need to look right on campus. Affordable, versatile, and always in style.",
    discountPercent: 15,
    productIds: ["sb-tee-001", "sb-cap-001", "sb-stk-001"],
    image: PLACEHOLDER,
    vibe: "Look fresh. Spend less.",
    badge: "Best for Students",
    stock: 15,
  },
  {
    id: "k2",
    name: "Studio Sessions Kit",
    hook: "Hoodie, earbuds, bracelet. Create in comfort.",
    lifestyle: "work",
    tagline: "Music meets style. Studio ready.",
    description: "Oversized hoodie, wireless earbuds, and woven band. Built for creators who live for the beat. Comfort and sound in one bundle.",
    discountPercent: 15,
    productIds: ["sb-hood-003", "sb-ear-001", "sb-brac-001"],
    image: PLACEHOLDER,
    vibe: "Create. Repeat. Drip.",
    badge: "Most Popular",
    stock: 10,
  },
  {
    id: "k3",
    name: "Match Day Kit",
    hook: "Cap, socks, bracelet. Rep the team.",
    lifestyle: "travel",
    tagline: "Game day ready. Head to toe.",
    description: "Dad hat, athletic socks, and sports band. Show up for your team looking fresh. Light, comfortable, and ready for anything.",
    discountPercent: 15,
    productIds: ["sb-cap-002", "sb-sock-002", "sb-brac-004"],
    image: PLACEHOLDER,
    vibe: "Rep your team. Rep your city.",
    badge: "Best Value",
    stock: 8,
  },
  {
    id: "k4",
    name: "Full Culture Kit",
    hook: "Hoodie, hut cap, earbuds, socks. The whole look.",
    lifestyle: "premium",
    tagline: "The full culture upgrade. No compromises.",
    description: "Street oversized hoodie, knit beanie, bass pro earbuds, and crew socks. The complete Streetwear Blantyre experience. Premium pieces, bundle price.",
    discountPercent: 15,
    productIds: ["sb-hood-003", "sb-hut-001", "sb-ear-003", "sb-sock-001"],
    image: PLACEHOLDER,
    vibe: "The full culture upgrade.",
    badge: "Premium",
    stock: 5,
  },
];

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
