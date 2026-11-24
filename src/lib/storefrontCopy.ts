/**
 * Storefront copy normalisation.
 *
 * Normalises merchandising copy for consistent display: removes hyphens in
 * sentences and em dashes. Slugs, codes, SKUs and payment references are never
 * passed through this helper.
 */

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bWear What Speaks\b/gi, "SB"],
  [/\bSB Streetwear\b/gi, "SB"],
  [/\bSB Street is\b/gi, "SB is"],
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
