/**
 * Lake Fresh pilot limits.
 *
 * The pilot sells three fish options: Chambo, Micheni and Usipa. Delivery
 * areas are managed in the admin and loaded from the database, so they are
 * deliberately not hard-coded here.
 */

export const LF_PILOT_SPECIES_SLUGS = ["chambo", "micheni", "usipa"] as const;

export const LF_PILOT_FISH_NAMES = "Chambo, Micheni and Usipa";

export const LF_PILOT_DELIVERY_PROMISE = "Order by 8 PM, delivered tomorrow";

export const LF_PILOT_OPTION_ORDER = [
  "fresh_chambo",
  "fresh_micheni",
  "fresh_usipa",
] as const;

export const LF_PILOT_OFFER = [
  { label: "Fresh fish", detail: LF_PILOT_FISH_NAMES },
  { label: "Cleaned and cut", detail: "We clean your fish and cut it the way you like." },
  { label: "Choice of seasoning", detail: "Five seasonings to choose from." },
  { label: "Properly packed", detail: "Clean box, clear weight and clear price." },
  { label: "Delivered to your home", detail: LF_PILOT_DELIVERY_PROMISE },
] as const;

export const isPilotSpeciesSlug = (slug: string | null | undefined): boolean =>
  !!slug && (LF_PILOT_SPECIES_SLUGS as readonly string[]).includes(slug);

export const sortPilotProducts = <T extends { pilotOption: string | null; speciesSlug?: string | null }>(
  products: T[]
): T[] => {
  const order = new Map<string, number>(LF_PILOT_OPTION_ORDER.map((key, index) => [key, index]));
  const key = (product: T) =>
    product.pilotOption ||
    (isPilotSpeciesSlug(product.speciesSlug) ? `fresh_${product.speciesSlug}` : null);
  return [...products].sort((a, b) => {
    const left = key(a) ? order.get(key(a) as string) ?? 99 : 99;
    const right = key(b) ? order.get(key(b) as string) ?? 99 : 99;
    return left - right;
  });
};
