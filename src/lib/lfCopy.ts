/** Keep catalogue text in the Lake Fresh voice even when an admin edits it. */
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bLF-SUB-/g, "LF SUB "],
  [/\bLF-/g, "LF "],
  [/[—–·]/g, " "],
  // Plain words first, so "ready-to-cook" cannot turn into "ready to cook".
  [/([A-Za-z])-([A-Za-z])/g, "$1 $2"],
  [/\bLF\s+SUB-/g, "LF SUB "],
  [/\bsignature spices\b/gi, "spice blends"],
  [/\bsignature spice\b/gi, "spice blend"],
  [/\bsignature\b/gi, "spice blend"],
  [/\bportioned\b/gi, "cleaned and cut"],
  [/\bpacked cold\b/gi, "cleaned and packed"],
  [/\bchilled\b/gi, "fresh"],
  [/\bacross Blantyre\b/gi, "in our three areas"],
  [/\bprepared\b/gi, "cut"],
  [/\bcold chain\b/gi, "cold packing"],
  [/\bguarantees?\b/gi, "promise"],
  [/\bguaranteed\b/gi, "promised"],
  [/\bmarinades?\b/gi, "spice blends"],
  [/\bready to cook\b/gi, "ready for your pan"],
  [/\bmeal kits?\b/gi, "fish and spices"],
  [/\bprep(?:p?ed|ping|arations?|ared|aring|s)?\b/gi, "getting ready"],
];

export const lfDisplayCopy = (value?: string | null): string => {
  let copy = (value ?? "").trim();
  for (const [pattern, replacement] of REPLACEMENTS) {
    copy = copy.replace(pattern, replacement);
  }
  return copy;
};
