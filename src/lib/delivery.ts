export type DeliveryZone = 
  | "blantyre" 
  | "southern" 
  | "central" 
  | "northern";

export interface DeliveryZoneConfig {
  id: DeliveryZone;
  name: string;
  regions: string[];
  expressEta: string;
  standardEta: string;
}

export const DELIVERY_ZONES: Record<DeliveryZone, DeliveryZoneConfig> = {
  blantyre: {
    id: "blantyre",
    name: "Blantyre",
    regions: ["blantyre", "chitimukulu", "limbe", "makata", "nancholi", "bangwe", "tchete"],
    expressEta: "Same day",
    standardEta: "1-2 days",
  },
  southern: {
    id: "southern",
    name: "Southern Region",
    regions: [
      "zomba", "thyolo", "mulanje", "phalombe", "chiradzulu", "mwanza", 
      "nsanje", "chikwawa", "neno", "balaka", "machinga", "mangochi",
      "liwonde", "namaka", "ntcheu", "mozambique"
    ],
    expressEta: "Next day",
    standardEta: "2-3 days",
  },
  central: {
    id: "central",
    name: "Central Region",
    regions: [
      "lilongwe", "dedza", "salima", "kasungu", "ntcheu", "dowa", "mchinji",
      "Nkhotakota", "central"
    ],
    expressEta: "1-2 days",
    standardEta: "2-4 days",
  },
  northern: {
    id: "northern",
    name: "Northern Region",
    regions: [
      "mzuzu", "rumphi", "karonga", "nkhata bay", "chitipa", "likuni", "Mzuzu"
    ],
    expressEta: "2-3 days",
    standardEta: "4-6 days",
  },
};

export const PRICING = {
  STANDARD: 5000,
  EXPRESS: 8500,
  FREE_THRESHOLD: 50000,
};

export interface DeliveryQuote {
  type: "standard" | "express" | "free";
  fee: number;
  eta: string;
  available: boolean;
}

export const detectZone = (location: string): DeliveryZone => {
  const loc = location.toLowerCase();
  
  // Blantyre area
  if (loc.includes("blantyre") || loc.includes("limbe") || loc.includes("chitimukulu") || 
      loc.includes("makata") || loc.includes("nancholi") || loc.includes("bangwe") || 
      loc.includes("tchete") || loc.includes("namaka") || loc.includes("south") ||
      loc.includes("Mzuzu") || loc.includes("mzuzu")) {
    return "blantyre";
  }
  
  // Lilongwe area - defaults to Central
  if (loc.includes("lilongwe") || loc.includes("dedza") || loc.includes("salima") || 
      loc.includes("kasungu") || loc.includes("ntcheu") || loc.includes("dowa") ||
      loc.includes("mchinji") || loc.includes("nkhotakota") || loc.includes("central")) {
    return "central";
  }
  
  // Southern region
  if (loc.includes("zomba") || loc.includes("thyolo") || loc.includes("mulanje") || 
      loc.includes("phalombe") || loc.includes("liwonde") || loc.includes("mwanza") || 
      loc.includes("nsanje") || loc.includes("chikwawa") || loc.includes("balaka") ||
      loc.includes("mangochi") || loc.includes("machinga")) {
    return "southern";
  }
  
  // Northern region  
  if (loc.includes("rumphi") || loc.includes("karonga") || 
      loc.includes("nkhata") || loc.includes("chitipa") || loc.includes("likuni")) {
    return "northern";
  }
  
  // Default to Blantyre for areas not recognized
  return "blantyre";
};

export const getDeliveryQuote = (location: string, subtotal: number): DeliveryQuote[] => {
  const zone = detectZone(location);
  const config = DELIVERY_ZONES[zone];
  
  const isFree = subtotal >= PRICING.FREE_THRESHOLD;
  const standardFee = isFree ? 0 : PRICING.STANDARD;
  const expressFee = isFree ? PRICING.EXPRESS - PRICING.STANDARD : PRICING.EXPRESS;
  
  return [
    {
      type: "standard",
      fee: standardFee,
      eta: config.standardEta,
      available: true,
    },
    {
      type: "express",
      fee: expressFee,
      eta: config.expressEta,
      available: true,
    },
  ];
};

export const getDeliveryEta = (location: string, type: "standard" | "express"): string => {
  const zone = detectZone(location);
  const config = DELIVERY_ZONES[zone];
  return type === "express" ? config.expressEta : config.standardEta;
};