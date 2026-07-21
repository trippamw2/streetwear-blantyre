export type Category = "all" | "t-shirts" | "hoodies" | "caps" | "sneakers" | "pants" | "jackets" | "accessories";

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
}

export const BRANDS = [
  { id: "sb-original", name: "SB Original", color: "#FF6B00" },
  { id: "sb-street", name: "SB Street", color: "#1a1a1a" },
] as const;

export const categoryGroups = {
  tops: {
    label: "Tops",
    description: "T-shirts, hoodies & jackets",
    categories: ["t-shirts", "hoodies", "jackets"] as Category[],
  },
  bottoms: {
    label: "Bottoms",
    description: "Pants & sneakers",
    categories: ["pants", "sneakers"] as Category[],
  },
  accessories: {
    label: "Accessories",
    description: "Caps & accessories",
    categories: ["caps", "accessories"] as Category[],
  },
};

export const categories: { id: Category; label: string; parent?: string }[] = [
  { id: "all", label: "All Products" },
  { id: "t-shirts", label: "T-Shirts", parent: "Tops" },
  { id: "hoodies", label: "Hoodies", parent: "Tops" },
  { id: "jackets", label: "Jackets", parent: "Tops" },
  { id: "pants", label: "Pants", parent: "Bottoms" },
  { id: "sneakers", label: "Sneakers", parent: "Bottoms" },
  { id: "caps", label: "Caps", parent: "Accessories" },
  { id: "accessories", label: "Accessories", parent: "Accessories" },
];

const PLACEHOLDER = "https://placehold.co/600x600/1a1a1a/ffffff?text=Streetwear+Blantyre";

export const products: Product[] = [
  // T-SHIRTS
  { id: "sb-tee-001", name: "SB Classic Logo Tee", benefit: "100% cotton. Oversized fit. Iconic SB branding across the chest.", price: 12000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 20, is_featured: true, is_best_seller: true },
  { id: "sb-tee-002", name: "SB Street Graphic Tee", benefit: "Premium cotton blend. Street art print. Relaxed fit.", price: 15000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "olive", name: "Olive" }], stock: 15, is_featured: true },
  { id: "sb-tee-003", name: "SB Minimalist Tee", benefit: "Clean design. Soft-touch cotton. Embroidered logo.", price: 14000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "navy", name: "Navy" }, { id: "grey", name: "Grey" }], stock: 12 },
  { id: "sb-tee-004", name: "SB Malawi Pride Tee", benefit: "Celebrate the culture. Cotton. Regular fit.", price: 13000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "green", name: "Green" }, { id: "red", name: "Red" }], stock: 18, is_featured: true },
  { id: "sb-tee-005", name: "SB Tie-Dye Tee", benefit: "Hand-dyed. One-of-a-kind pattern. 100% cotton.", price: 16000, category: "t-shirts", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "multi", name: "Multi" }], stock: 8 },

  // HOODIES
  { id: "sb-hood-001", name: "SB Classic Pullover Hoodie", benefit: "Heavyweight cotton. Kangaroo pocket. Ribbed cuffs.", price: 28000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "grey", name: "Grey" }], stock: 15, is_featured: true, is_best_seller: true },
  { id: "sb-hood-002", name: "SB Zip-Up Hoodie", benefit: "Full zip. Brushed fleece interior. Two side pockets.", price: 32000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "navy", name: "Navy" }], stock: 10, is_featured: true },
  { id: "sb-hood-003", name: "SB Street Oversized Hoodie", benefit: "Drop shoulder. Heavy 380gsm. Oversized fit.", price: 35000, category: "hoodies", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "charcoal", name: "Charcoal" }, { id: "sand", name: "Sand" }], stock: 8 },
  { id: "sb-hood-004", name: "SB Crop Hoodie", benefit: "Cropped silhouette. Soft fleece. Embroidered logo.", price: 26000, category: "hoodies", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "pink", name: "Pink" }, { id: "white", name: "White" }], stock: 12 },

  // JACKETS
  { id: "sb-jack-001", name: "SB Bomber Jacket", benefit: "Lightweight bomber. Snap-button closure. Ribbed hem.", price: 45000, category: "jackets", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "olive", name: "Olive" }], stock: 6, is_featured: true },
  { id: "sb-jack-002", name: "SB Windbreaker", benefit: "Water-resistant. Packable. Lightweight layering.", price: 38000, category: "jackets", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "orange", name: "Orange" }], stock: 5 },

  // PANTS
  { id: "sb-pant-001", name: "SB Cargo Joggers", benefit: "Relaxed fit. Cargo pockets. Elastic cuffs.", price: 22000, category: "pants", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "khaki", name: "Khaki" }], stock: 14, is_featured: true, is_best_seller: true },
  { id: "sb-pant-002", name: "SB Classic Sweatpants", benefit: "French terry cotton. Tapered fit. Drawstring waist.", price: 20000, category: "pants", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "grey", name: "Grey" }, { id: "black", name: "Black" }], stock: 18 },
  { id: "sb-pant-003", name: "SB Wide Leg Denim", benefit: "Premium denim. Wide leg. High waist.", price: 30000, category: "pants", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "indigo", name: "Indigo" }, { id: "washed", name: "Washed Blue" }], stock: 8 },

  // SNEAKERS
  { id: "sb-snk-001", name: "SB Classic Low", benefit: "Canvas upper. Vulcanised sole. Clean silhouette.", price: 25000, category: "sneakers", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 12, is_featured: true, is_best_seller: true },
  { id: "sb-snk-002", name: "SB Chunky Runner", benefit: "Chunky sole. Mesh and leather upper. Cushioned insole.", price: 35000, category: "sneakers", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "grey", name: "Grey" }, { id: "black", name: "Black" }], stock: 7, is_featured: true },
  { id: "sb-snk-003", name: "SB Slip-On", benefit: "Easy on/off. Memory foam insole. Canvas.", price: 18000, category: "sneakers", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "check", name: "Checkered" }], stock: 10 },

  // CAPS
  { id: "sb-cap-001", name: "SB Logo Snapback", benefit: "Structured fit. Flat brim. Embroidered logo.", price: 8000, category: "caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "white", name: "White" }], stock: 25, is_featured: true, is_best_seller: true },
  { id: "sb-cap-002", name: "SB Dad Hat", benefit: "Unstructured. Curved brim. Adjustable strap.", price: 7500, category: "caps", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "navy", name: "Navy" }, { id: "khaki", name: "Khaki" }], stock: 20, is_featured: true },
  { id: "sb-cap-003", name: "SB Trucker Cap", benefit: "Mesh back. Foam front. Snapback closure.", price: 8500, category: "caps", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }, { id: "camo", name: "Camo" }], stock: 15 },

  // ACCESSORIES
  { id: "sb-acc-001", name: "SB Tote Bag", benefit: "Heavy canvas. Reinforced handles. Large pocket.", price: 6000, category: "accessories", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "natural", name: "Natural" }, { id: "black", name: "Black" }], stock: 30, is_featured: true },
  { id: "sb-acc-002", name: "SB Beanie", benefit: "Knit acrylic. One size fits all. Folded cuff.", price: 5500, category: "accessories", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "black", name: "Black" }, { id: "orange", name: "Orange" }], stock: 22 },
  { id: "sb-acc-003", name: "SB Backpack", benefit: "Water-resistant. Laptop sleeve. Multiple pockets.", price: 18000, category: "accessories", image: PLACEHOLDER, brand: "sb-street", types: [{ id: "black", name: "Black" }], stock: 8 },
  { id: "sb-acc-004", name: "SB Socks (3-Pack)", benefit: "Cushioned sole. Ribbed cuff. Premium cotton blend.", price: 5000, category: "accessories", image: PLACEHOLDER, brand: "sb-original", types: [{ id: "classic", name: "Classic Mix" }, { id: "dark", name: "Dark Mix" }], stock: 40 },
];

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
    hook: "Tee, cap, tote. Ready for class.",
    lifestyle: "student",
    tagline: "The everyday essentials. Clean and fresh.",
    description: "Classic logo tee, dad hat, and a tote bag. Everything you need to look right on campus. Affordable, versatile, and always in style.",
    discountPercent: 15,
    productIds: ["sb-tee-001", "sb-cap-002", "sb-acc-001"],
    image: PLACEHOLDER,
    vibe: "Look fresh. Spend less.",
    badge: "Best for Students",
    stock: 15,
  },
  {
    id: "k2",
    name: "Office Flex Kit",
    hook: "Hoodie, joggers, sneakers. Work to weekend.",
    lifestyle: "work",
    tagline: "Professional comfort. Streetwear edge.",
    description: "Zip-up hoodie, cargo joggers, and classic low sneakers. Clean enough for the office, comfortable enough for after hours.",
    discountPercent: 15,
    productIds: ["sb-hood-002", "sb-pant-001", "sb-snk-001"],
    image: PLACEHOLDER,
    vibe: "Work hard. Dress harder.",
    badge: "Most Popular",
    stock: 10,
  },
  {
    id: "k3",
    name: "Weekend Wanderer Kit",
    hook: "Jacket, tee, sneakers. Out the door.",
    lifestyle: "travel",
    tagline: "Pack light. Look right.",
    description: "Bomber jacket, graphic tee, and chunky runners. Built for movement. From Blantyre to wherever you're headed.",
    discountPercent: 15,
    productIds: ["sb-jack-001", "sb-tee-002", "sb-snk-002"],
    image: PLACEHOLDER,
    vibe: "Explore in style.",
    badge: "Best Value",
    stock: 8,
  },
  {
    id: "k4",
    name: "Full Fit Kit",
    hook: "Head to toe. The complete look.",
    lifestyle: "premium",
    tagline: "The whole outfit. No compromises.",
    description: "Oversized hoodie, wide leg denim, snapback cap, and beanie. The full Streetwear Blantyre look. Premium pieces, bundle price.",
    discountPercent: 15,
    productIds: ["sb-hood-003", "sb-pant-003", "sb-cap-001", "sb-acc-002"],
    image: PLACEHOLDER,
    vibe: "The full culture upgrade.",
    badge: "Premium",
    stock: 5,
  },
];

export const combos: Kit[] = kits;

const itemImageMap: Record<string, string> = {};

export const getItemImage = (nameOrId: string): string => {
  const byProduct = products.find(p => p.id === nameOrId || p.name === nameOrId);
  if (byProduct) return byProduct.image;
  return itemImageMap[nameOrId] ?? PLACEHOLDER;
};

export const formatMWK = (n: number) => `MK ${n.toLocaleString("en-US")}`;

export function getKitProducts(kit: Kit): Product[] {
  return kit.productIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined);
}

export function getKitSeparateTotal(kit: Kit): number {
  return getKitProducts(kit).reduce((sum, p) => sum + p.price, 0);
}

export function getKitPrice(kit: Kit): number {
  const total = getKitSeparateTotal(kit);
  return Math.round(total * (1 - kit.discountPercent / 100));
}

export function getKitRealSaving(kit: Kit): number {
  return getKitSeparateTotal(kit) - getKitPrice(kit);
}

export function getKitDiscountPercent(kit: Kit): number {
  return kit.discountPercent;
}

export function getKitItemNames(kit: Kit): string[] {
  return getKitProducts(kit).map(p => p.name);
}

export const getRecommendations = (product: Product, allProducts: Product[], limit = 4): Product[] => {
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
      
      const comboMatch = combos.some(c => 
        c.productIds.some(pid => pid === product.id) &&
        c.productIds.some(pid => pid === p.id)
      );
      if (comboMatch) score += 20;
      
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit).map(s => s.product);
};
