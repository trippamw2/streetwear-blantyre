/**
 * Storefront copy normalisation.
 *
 * Keeps merchandising copy consistent with an international clothing store:
 * no hyphens in sentences, no em dashes, and no abbreviated brand word in
 * customer facing text. Slugs, codes, SKUs and payment references are never
 * passed through this helper.
 */

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSB is a streetwear wardrobe\b/gi, "This is a streetwear wardrobe"],
  [/\bSB Street is\b/gi, "This streetwear label is"],
  [/\bSB Streetwear\b/gi, "Streetwear Blantyre"],
  [/\bSB Original\b/gi, "Original"],
  [/\bSB Collection\b/gi, "Collection"],
  [/\bSB Campaigns\b/gi, "Campaigns"],
  [/\bSB Passport\b/gi, "Passport"],
  [/\bSB Look\b/gi, "Look"],
  [/\bSB Tee\b/gi, "Essential Tee"],
  [/\bSB Street\b/gi, "Street"],
  [/\bSB's\b/gi, "our"],
  [/\bSB\s*\/\s*/gi, ""],
  [/\bSB\b/gi, ""],
];

/** Normalise a single string for display. Never use on identifiers or URLs. */
export const displayCopy = (value?: string | null): string => {
  let copy = (value ?? "").trim();
  if (!copy) return "";

  copy = copy.replace(/[—–]/g, " ");
  copy = copy.replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, "$1 $2");

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    copy = copy.replace(pattern, replacement);
  }

  copy = copy.replace(/\s+/g, " ").trim();
  copy = copy.replace(/^([a-z])/, (letter) => letter.toUpperCase());
  return copy;
};

/** Normalise an optional list of display strings. */
export const displayCopyList = (values?: string[] | null): string[] =>
  (values ?? []).map((value) => displayCopy(value)).filter(Boolean);
