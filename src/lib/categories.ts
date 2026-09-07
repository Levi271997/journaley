// Client-safe: imported by the editor and the sidebar as well as by server code.
//
// A category is the one shelf an entry sits on, so the list is fixed and short.
// Anything more personal than this belongs in tags, which the writer invents.
export const CATEGORIES = [
  { value: "personal", emoji: "\u{1F331}", label: "Personal" },
  { value: "work", emoji: "\u{1F4BC}", label: "Work" },
  { value: "travel", emoji: "\u{2708}\u{FE0F}", label: "Travel" },
  { value: "health", emoji: "\u{1F3C3}", label: "Health" },
  { value: "ideas", emoji: "\u{1F4A1}", label: "Ideas" },
  { value: "gratitude", emoji: "\u{1F64F}", label: "Gratitude" },
  { value: "dreams", emoji: "\u{1F319}", label: "Dreams" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label]),
);

export const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.emoji]),
);
