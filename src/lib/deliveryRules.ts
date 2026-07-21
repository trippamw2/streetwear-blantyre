/**
 * Delivery Rules Engine for Streetwear Blantyre
 * 
 * Rules:
 * - Orders ≥ MWK 50,000 = FREE delivery (anywhere in Malawi)
 * - Within Blantyre, <50k = Same-day delivery, MWK 5,000 fee
 * - Outside Blantyre, <50k, Standard (5 days) = MWK 5,000 fee
 * - Outside Blantyre, <50k, Express (2-3 days) = MWK 7,000
 * - Outside Blantyre, ≥50k, Express (2-3 days) = MWK 2,000
 */

// Known Blantyre areas/landmarks for location detection
const BLANTYRE_KEYWORDS = [
  "blantyre",
  "chilomoni",
  "chirimba",
  "soche",
  "bangwe",
  "zolliko",
  "limbe",
  "namiwawa",
  "sungututsa",
  "manase",
  "ginnery corner",
  "mandala",
  "idyembere",
  "nathenje",
  "kachere",
  "makata",
  "thyolo",
  "mudi",
  "ndirande",
  "chabada",
  "mpemba",
  "lunzu",
  "machinga",
  "mwanza",
  "phalombe",
  "chiradzulu",
  "blantyre city",
  "blantyre commercial",
  "blantyre industrial",
  "area 1", "area 2", "area 3", "area 4", "area 5",
  "area 6", "area 7", "area 8", "area 9", "area 10",
  "area 11", "area 12", "area 13", "area 14", "area 15",
  "area 23", "area 24", "area 25",
];

export const FREE_DELIVERY_THRESHOLD = 50_000;

export type DeliveryZone = "blantyre" | "outside_blantyre";

export type DeliverySpeed = "same_day" | "standard" | "express";

export interface DeliveryOption {
  id: DeliverySpeed;
  label: string;
  description: string;
  estimatedDays: string;
  fee: number;
  isAvailable: boolean;
  zone: DeliveryZone;
}

/**
 * Detect whether a location string is within Blantyre
 */
export function detectZone(location: string): DeliveryZone {
  const lower = location.toLowerCase().trim();
  return BLANTYRE_KEYWORDS.some(kw => lower.includes(kw)) ? "blantyre" : "outside_blantyre";
}

/**
 * Calculate delivery fee for a given zone, speed, and order subtotal
 */
export function calculateDeliveryFee(
  zone: DeliveryZone,
  speed: DeliverySpeed,
  subtotal: number,
): number {
  // Rule 1: Orders ≥50k = FREE delivery anywhere
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    if (speed === "express") {
      // Express on ≥50k = MWK 2,000 surcharge
      return 2_000;
    }
    return 0;
  }

  // Below 50k threshold
  if (zone === "blantyre") {
    // Within Blantyre: same-day only, MWK 5,000
    return 5_000;
  }

  // Outside Blantyre, below 50k
  switch (speed) {
    case "standard":
      return 5_000;
    case "express":
      return 7_000; // 5000 base + 2000 express surcharge
    default:
      return 5_000;
  }
}

/**
 * Get all available delivery options for a location + subtotal combo
 */
export function getDeliveryOptions(location: string, subtotal: number): DeliveryOption[] {
  const zone = detectZone(location);
  const isFree = subtotal >= FREE_DELIVERY_THRESHOLD;

  if (zone === "blantyre") {
    // Blantyre: same-day delivery only
    return [
      {
        id: "same_day",
        label: "Same-Day Delivery",
        description: isFree
          ? "Delivered today — free on orders over K50,000!"
          : "Delivered today to your door in Blantyre",
        estimatedDays: "Today",
        fee: calculateDeliveryFee(zone, "same_day", subtotal),
        isAvailable: true,
        zone,
      },
    ];
  }

  // Outside Blantyre: standard + express
  const options: DeliveryOption[] = [
    {
      id: "standard",
      label: "Standard Delivery",
      description: isFree
        ? "Free nationwide delivery — delivered within 5 working days"
        : "Delivered within 5 working days anywhere in Malawi",
      estimatedDays: "5 working days",
      fee: calculateDeliveryFee(zone, "standard", subtotal),
      isAvailable: true,
      zone,
    },
    {
      id: "express",
      label: "Express Delivery",
      description: isFree
        ? "Fast delivery — K2,000 express surcharge on orders over K50,000"
        : "Get it fast — delivered in 2-3 working days",
      estimatedDays: "2-3 working days",
      fee: calculateDeliveryFee(zone, "express", subtotal),
      isAvailable: true,
      zone,
    },
  ];

  return options;
}

/**
 * Format the delivery fee for display
 */
export function formatDeliveryFee(fee: number): string {
  if (fee === 0) return "FREE";
  return `K${fee.toLocaleString()}`;
}
