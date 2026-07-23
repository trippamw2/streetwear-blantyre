export type Category = "all" | "t-shirts" | "bracelets" | "caps" | "stickers" | "earbuds" | "hoodies" | "hut-caps" | "socks";

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
  { id: "music", label: "Music Culture", description: "Express through sound and rhythm", icon: "Music", color: "#8B5CF6" },
  { id: "sports", label: "Sports Culture", description: "Rep your team, rep your city", icon: "Trophy", color: "#F59E0B" },
  { id: "faith", label: "Faith Culture", description: "Wear your beliefs with pride", icon: "Heart", color: "#10B981" },
  { id: "hustle", label: "Hustle Culture", description: "Grind never stops. Dress like it.", icon: "Zap", color: "#EF4444" },
];

// ─── Wearable Categories ────────────────────────────────────────────

export const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "t-shirts", label: "T-Shirts" },
  { id: "hoodies", label: "Hoodies" },
  { id: "caps", label: "Caps" },
  { id: "hut-caps", label: "Hut Caps" },
  { id: "bracelets", label: "Bracelets" },
  { id: "socks", label: "Socks" },
  { id: "stickers", label: "Stickers" },
  { id: "earbuds", label: "Earbuds" },
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

  // ── HOODIES ──
  { id: "sb-hood-001", name: "SB Classic Pullover Hoodie", benefit: "Heavyweight cotton. Kangaroo pocket. Ribbed cuffs.", price: 28000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "grey", name: "Grey" }], stock: 15, is_featured: true, is_best_seller: true, culture_pillar: "hustle" },
  { id: "sb-hood-002", name: "SB Zip-Up Hoodie", benefit: "Full zip. Brushed fleece interior. Two side pockets.", price: 32000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "navy", name: "Navy" }], stock: 10, is_featured: true, culture_pillar: "sports" },
  { id: "sb-hood-003", name: "SB Street Oversized Hoodie", benefit: "Drop shoulder. Heavy 380gsm. Oversized fit.", price: 35000, category: "hoodies", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "charcoal", name: "Charcoal" }, { id: "sand", name: "Sand" }], stock: 8, culture_pillar: "music" },
  { id: "sb-hood-004", name: "SB Crop Hoodie", benefit: "Cropped silhouette. Soft fleece. Embroidered logo.", price: 26000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "pink", name: "Pink" }, { id: "white", name: "White" }], stock: 12, culture_pillar: "faith" },

  // ── CAPS ──
  { id: "sb-cap-001", name: "SB Logo Snapback", benefit: "Structured fit. Flat brim. Embroidered logo.", price: 8000, category: "caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 25, is_featured: true, is_best_seller: true, culture_pillar: "hustle" },
  { id: "sb-cap-002", name: "SB Dad Hat", benefit: "Unstructured. Curved brim. Adjustable strap.", price: 7500, category: "caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "navy", name: "Navy" }, { id: "khaki", name: "Khaki" }], stock: 20, is_featured: true, culture_pillar: "sports" },
  { id: "sb-cap-003", name: "SB Trucker Cap", benefit: "Mesh back. Foam front. Snapback closure.", price: 8500, category: "caps", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "camo", name: "Camo" }], stock: 15, culture_pillar: "music" },

  // ── HUT CAPS ──
  { id: "sb-hut-001", name: "SB Knit Beanie", benefit: "Knit acrylic. One size fits all. Folded cuff.", price: 5500, category: "hut-caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "blue", name: "Blue" }], stock: 22, is_featured: true, culture_pillar: "hustle" },
  { id: "sb-hut-002", name: "SB Malawi Kufi Cap", benefit: "Traditional embroidered design. Premium cotton.", price: 8000, category: "hut-caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "white", name: "White" }, { id: "gold", name: "Gold" }], stock: 12, is_featured: true, culture_pillar: "faith" },
  { id: "sb-hut-003", name: "SB Fleece Trapper", benefit: "Warm fleece lining. Ear flaps. Snap-button chin.", price: 10000, category: "hut-caps", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "olive", name: "Olive" }], stock: 8, culture_pillar: "sports" },
  { id: "sb-hut-004", name: "SB Corduroy Bucket Hat", benefit: "Soft corduroy. Wide brim. Relaxed fit.", price: 7000, category: "hut-caps", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "sand", name: "Sand" }, { id: "brown", name: "Brown" }], stock: 10, culture_pillar: "music" },

  // ── BRACELETS ──
  { id: "sb-brac-001", name: "SB Woven Festival Band", benefit: "Hand-woven cotton. Adjustable tie. Waterproof.", price: 3500, category: "bracelets", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "blue", name: "Blue" }, { id: "red", name: "Red" }], stock: 40, is_featured: true, is_best_seller: true, culture_pillar: "music" },
  { id: "sb-brac-002", name: "SB Leather Cuff", benefit: "Genuine leather. Embossed SB logo. Snap closure.", price: 6000, category: "bracelets", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "brown", name: "Brown" }], stock: 18, is_featured: true, culture_pillar: "hustle" },
  { id: "sb-brac-003", name: "SB Faith Bead Set", benefit: "Wooden beads. Cross charm. Stretch fit.", price: 4000, category: "bracelets", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "natural", name: "Natural" }, { id: "black", name: "Black" }], stock: 25, culture_pillar: "faith" },
  { id: "sb-brac-004", name: "SB Silicone Sports Band", benefit: "Soft silicone. Debossed logo. One size.", price: 3000, category: "bracelets", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "blue", name: "Blue" }, { id: "green", name: "Green" }], stock: 35, culture_pillar: "sports" },
  { id: "sb-brac-005", name: "SB Chain Link Bracelet", benefit: "Stainless steel. Adjustable clasp. Tarnish-free.", price: 7500, category: "bracelets", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "silver", name: "Silver" }, { id: "gold", name: "Gold" }], stock: 12, culture_pillar: "hustle" },

  // ── SOCKS ──
  { id: "sb-sock-001", name: "SB Logo Crew Socks", benefit: "Cushioned sole. Ribbed cuff. Premium cotton blend.", price: 3500, category: "socks", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "classic", name: "Classic Mix" }, { id: "dark", name: "Dark Mix" }], stock: 40, is_featured: true, is_best_seller: true, culture_pillar: "hustle" },
  { id: "sb-sock-002", name: "SB Stripe Athletic Socks", benefit: "Moisture-wicking. Arch support. 3-pack.", price: 4500, category: "socks", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "white", name: "White" }, { id: "black", name: "Black" }], stock: 30, culture_pillar: "sports" },
  { id: "sb-sock-003", name: "SB Ankle No-Show Socks", benefit: "Invisible fit. Anti-slip grip. Breathable mesh.", price: 2500, category: "socks", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "white", name: "White" }, { id: "black", name: "Black" }], stock: 35, culture_pillar: "music" },
  { id: "sb-sock-004", name: "SB Thick Wool Winter Socks", benefit: "Merino wool blend. Thermal. Knee-high.", price: 5000, category: "socks", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "charcoal", name: "Charcoal" }, { id: "navy", name: "Navy" }], stock: 15, culture_pillar: "hustle" },

  // ── STICKERS ──
  { id: "sb-stk-001", name: "SB Logo Die-Cut Sticker", benefit: "Vinyl. Weatherproof. 3-inch. Glossy finish.", price: 1500, category: "stickers", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "blue", name: "Blue" }, { id: "white", name: "White" }], stock: 100, is_featured: true, is_best_seller: true, culture_pillar: "hustle" },
  { id: "sb-stk-002", name: "SB Culture Pack (6 Stickers)", benefit: "6 unique designs. Vinyl. Weatherproof.", price: 4000, category: "stickers", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "mixed", name: "Mixed" }], stock: 50, is_featured: true, culture_pillar: "music" },
  { id: "sb-stk-003", name: "SB Malawi Map Sticker", benefit: "Oversized vinyl. Malawi outline with SB logo.", price: 2000, category: "stickers", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "blue", name: "Blue" }, { id: "green", name: "Green" }], stock: 60, culture_pillar: "sports" },
  { id: "sb-stk-004", name: "SB Faith Collection Sticker", benefit: "Inspirational designs. Vinyl. 4-pack.", price: 3000, category: "stickers", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "gold", name: "Gold" }, { id: "white", name: "White" }], stock: 40, culture_pillar: "faith" },

  // ── EARBUDS ──
  { id: "sb-ear-001", name: "SB Wireless Earbuds", benefit: "Bluetooth 5.0. 8hr battery. IPX4 water resistant.", price: 15000, category: "earbuds", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 20, is_featured: true, is_best_seller: true, culture_pillar: "music" },
  { id: "sb-ear-002", name: "SB Sport Earbuds", benefit: "Secure fit. Sweatproof. Built-in mic.", price: 12000, category: "earbuds", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "blue", name: "Blue" }, { id: "black", name: "Black" }], stock: 15, is_featured: true, culture_pillar: "sports" },
  { id: "sb-ear-003", name: "SB Bass Pro Earbuds", benefit: "Deep bass. ANC. 12hr battery. Fast charge.", price: 22000, category: "earbuds", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "silver", name: "Silver" }], stock: 10, culture_pillar: "music" },
  { id: "sb-ear-004", name: "SB Kids Earbuds", benefit: "Volume-limited. Fun colors. Durable cable.", price: 8000, category: "earbuds", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "blue", name: "Blue" }, { id: "pink", name: "Pink" }], stock: 20, culture_pillar: "faith" },
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
