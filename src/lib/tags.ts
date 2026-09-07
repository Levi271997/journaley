// Client-safe: the editor normalises as you type, the server action normalises
// again on the way in. Both go through here so they cannot disagree.

export const MAX_TAGS = 12;
export const MAX_TAG_LENGTH = 32;

/**
 * One tag, as a lowercase slug: letters, numbers and single hyphens.
 *
 * Everything else is dropped rather than escaped. That keeps "Slow Morning"
 * and "slow-morning" from becoming two tags, and it keeps commas, braces and
 * quotes — the characters PostgREST reads as array syntax — out of the column
 * entirely. Returns "" for anything that normalises away to nothing.
 */
export function normalizeTag(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TAG_LENGTH)
    .replace(/-+$/, "");
}

/** Splits user input on commas or whitespace, then normalises and de-dupes. */
export function parseTags(raw: string) {
  const seen: string[] = [];

  for (const piece of raw.split(",")) {
    const tag = normalizeTag(piece);
    if (tag && !seen.includes(tag)) seen.push(tag);
    if (seen.length === MAX_TAGS) break;
  }

  return seen;
}
