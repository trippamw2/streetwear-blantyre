/** Keep catalogue text in the Lake Fresh voice even when an admin edits it. */
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsignature spices\b/gi, "spice blends"],
  [/\bsignature spice\b/gi, "spice blend"],
  [/\bsignature\b/gi, "spice blend"],
  [/\bportioned\b/gi, "cut in pieces"],
  [/\bcold chain\b/gi, "cold packing"],
  [/\bguarantees?\b/gi, "promise"],
  [/\bguaranteed\b/gi, "promised"],
  [/\bmarinades?\b/gi, "spice blends"],
  [/\bready to cook\b/gi, "ready for your pan"],
  [/\bmeal kits?\b/gi, "fish and spices"],
  [/\bprep(?:ping|aration|ared|aring)?\b/gi, "getting ready"],
  [/\bLF-/g, "LF "],
];

export const lfDisplayCopy = (value?: string | null): string => {
  let copy = (value ?? "").trim();
  for (const [pattern, replacement] of REPLACEMENTS) {
    copy = copy.replace(pattern, replacement);
  }
  return copy;
};
