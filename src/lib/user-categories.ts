import "server-only";
import { CATEGORIES, type CategoryOption } from "./categories";
import { createClient } from "./supabase/server";

const BUILT_IN_VALUES = new Set(CATEGORIES.map((category) => category.value));

/*
 * Row Level Security already limits every statement below to the caller's own
 * rows; the explicit user_id filters are the same second lock lib/entries.ts
 * keeps.
 */

/**
 * Every category the user can file an entry under: the built-in list first,
 * then their own in the order they were added.
 */
export async function listCategories(userId: string): Promise<CategoryOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("value, label, emoji")
    .eq("user_id", userId)
    .order("id", { ascending: true });

  if (error) throw new Error(`Could not load categories: ${error.message}`);

  return [...CATEGORIES, ...(data ?? [])];
}

export type AddCategoryResult =
  | { category: CategoryOption }
  | { error: string };

/**
 * Adds one custom category. Its `value` is expected to be a slug already
 * (see categoryValue in lib/categories.ts); a clash with a built-in or with
 * one the user already has comes back as a message rather than a throw, since
 * both are ordinary typos.
 */
export async function addCategory(
  userId: string,
  input: CategoryOption,
): Promise<AddCategoryResult> {
  if (BUILT_IN_VALUES.has(input.value)) {
    return { error: `“${input.label}” is already one of the built-in categories.` };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, ...input })
    .select("value, label, emoji")
    .single();

  if (error) {
    // 23505 is Postgres for a unique-constraint violation: the (user, value)
    // pair already exists.
    if (error.code === "23505") {
      return { error: `You already have a category called “${input.label}”.` };
    }
    throw new Error(`Could not add the category: ${error.message}`);
  }

  return { category: data };
}
