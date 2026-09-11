// Client-safe: imported by the editor and the sidebar as well as by server code.
//
// A category is the one shelf an entry sits on. The app ships a short list to
// start from; anything a writer adds on top lives in the `categories` table
// and is merged in by lib/user-categories.ts. Both shapes are the same here,
// so the editor and the sidebar never need to know which is which.

import { normalizeTag } from "./tags";

export type CategoryOption = {
  /** The slug stored in entries.category. */
  value: string;
  emoji: string;
  label: string;
};

export const CATEGORIES: readonly CategoryOption[] = [
  { value: "personal", emoji: "\u{1F331}", label: "Personal" },
  { value: "work", emoji: "\u{1F4BC}", label: "Work" },
  { value: "travel", emoji: "\u{2708}\u{FE0F}", label: "Travel" },
  { value: "health", emoji: "\u{1F3C3}", label: "Health" },
  { value: "ideas", emoji: "\u{1F4A1}", label: "Ideas" },
  { value: "gratitude", emoji: "\u{1F64F}", label: "Gratitude" },
  { value: "dreams", emoji: "\u{1F319}", label: "Dreams" },
];

export const MAX_CATEGORY_LABEL_LENGTH = 24;

/** What a custom category shows when the writer did not pick an emoji. */
export const DEFAULT_CATEGORY_EMOJI = "\u{1F5C2}\u{FE0F}";

/**
 * The slug a label is stored under — the same normaliser tags use, so
 * "Side Projects" and "side-projects" cannot become two categories.
 */
export function categoryValue(label: string) {
  return normalizeTag(label.slice(0, MAX_CATEGORY_LABEL_LENGTH));
}

/**
 * The first grapheme of whatever was typed into the emoji box, so a pasted
 * "🎸🎸" or a stray word cannot widen every chip in the sidebar.
 */
export function categoryEmoji(raw: string) {
  const text = raw.trim();
  if (!text) return DEFAULT_CATEGORY_EMOJI;

  const [first] = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text);
  return first?.segment ?? DEFAULT_CATEGORY_EMOJI;
}

export function findCategory(options: readonly CategoryOption[], value: string) {
  return options.find((option) => option.value === value);
}
