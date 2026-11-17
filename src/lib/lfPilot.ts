/**
 * Lake Fresh pilot limits.
 *
 * The pilot sells five fish options in three areas only. Keep these values in
 * one place so the storefront, checkout and subscription forms stay in step.
 */

export const LF_PILOT_ZONE_SLUGS = ["nkolokosa", "soche-east", "chitawira"] as const;

export const LF_PILOT_SPECIES_SLUGS = ["chambo", "usipa", "chisense"] as const;

export const LF_PILOT_ZONE_NAMES = "Nkolokosa, Soche East and Chitawira";

export const LF_PILOT_DELIVERY_PROMISE = "Order by 8 PM, delivered tomorrow";

export const LF_PILOT_OPTION_ORDER = [
  "fresh_chambo",
  "fresh_usipa",
  "fresh_chisense",
  "fish_cuts",
  "family_box",
] as const;

export const LF_PILOT_OFFER = [
  { label: "Fresh fish", detail: "Chambo, Usipa, Chisense, cuts or a family box." },
  { label: "Cleaned and cut", detail: "We clean your fish and cut it the way you like." },
  { label: "Choice of seasoning", detail: "Five seasonings to choose from." },
  { label: "Properly packed", detail: "Clean box, clear weight and clear price." },
  { label: "Delivered to your home", detail: LF_PILOT_DELIVERY_PROMISE },
] as const;

export const isPilotZoneSlug = (slug: string | null | undefined): boolean =>
  !!slug && (LF_PILOT_ZONE_SLUGS as readonly string[]).includes(slug);

export const isPilotSpeciesSlug = (slug: string | null | undefined): boolean =>
  !!slug && (LF_PILOT_SPECIES_SLUGS as readonly string[]).includes(slug);

export const sortPilotZones = <T extends { slug: string }>(zones: T[]): T[] => {
  const order = new Map<string, number>(LF_PILOT_ZONE_SLUGS.map((slug, index) => [slug, index]));
  return [...zones].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
};

export const sortPilotProducts = <T extends { pilotOption: string | null }>(products: T[]): T[] => {
  const order = new Map<string, number>(LF_PILOT_OPTION_ORDER.map((key, index) => [key, index]));
  return [...products].sort((a, b) => {
    const left = a.pilotOption ? order.get(a.pilotOption) ?? 99 : 99;
    const right = b.pilotOption ? order.get(b.pilotOption) ?? 99 : 99;
    return left - right;
  });
};
