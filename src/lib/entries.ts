import "server-only";
import type { Entry } from "./db";
import { createClient } from "./supabase/server";

export type EntrySummary = Pick<
  Entry,
  "id" | "title" | "body" | "mood" | "entry_date" | "updated_at"
>;

const SUMMARY_COLUMNS = "id, title, body, mood, entry_date, updated_at";

export type EntryInput = {
  title: string;
  body: string;
  bodyHtml: string;
  mood: string | null;
  entryDate: string;
};

function row(input: EntryInput) {
  return {
    title: input.title,
    body: input.body,
    body_html: input.bodyHtml,
    mood: input.mood,
    entry_date: input.entryDate,
  };
}

/**
 * PostgREST splits an `or` filter on commas and parentheses, and `ilike`
 * reads % and _ as wildcards. Drop those so a search term can only change
 * what is matched, never the shape of the query.
 */
function ilikePattern(search: string) {
  return `%${search.replace(/[,()%_\\]/g, " ").trim()}%`;
}

/*
 * Row Level Security already limits every statement below to the caller's own
 * rows. The explicit user_id filters are kept as a second lock, so a mistake
 * in the policies cannot quietly turn into one person reading another's diary.
 */

export type EntryFilters = {
  search?: string;
  /** Inclusive `YYYY-MM-DD` bounds on entry_date; either may stand alone. */
  from?: string;
  to?: string;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export async function listEntries(
  userId: string,
  filters: EntryFilters = {},
): Promise<EntrySummary[]> {
  const supabase = await createClient();

  let query = supabase.from("entries").select(SUMMARY_COLUMNS).eq("user_id", userId);

  const term = (filters.search ?? "").trim();
  if (term) {
    const pattern = ilikePattern(term);
    query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`);
  }

  // Anything that is not a plain date is ignored rather than handed to
  // PostgREST, which would reject the whole request.
  if (filters.from && DATE_ONLY.test(filters.from)) {
    query = query.gte("entry_date", filters.from);
  }
  if (filters.to && DATE_ONLY.test(filters.to)) {
    query = query.lte("entry_date", filters.to);
  }

  const { data, error } = await query
    .order("entry_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(`Could not load entries: ${error.message}`);
  return data ?? [];
}

export async function getEntry(id: number, userId: string): Promise<Entry | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function createEntry(userId: string, input: EntryInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entries")
    .insert({ user_id: userId, ...row(input) })
    .select("id")
    .single();

  if (error) throw new Error(`Could not save the entry: ${error.message}`);
  return data.id as number;
}

export async function updateEntry(id: number, userId: string, input: EntryInput) {
  const supabase = await createClient();

  // updated_at is left to the database trigger.
  const { data, error } = await supabase
    .from("entries")
    .update(row(input))
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  return !error && (data?.length ?? 0) > 0;
}

export async function deleteEntry(id: number, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  return !error && (data?.length ?? 0) > 0;
}

export async function countEntries(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(`Could not count entries: ${error.message}`);
  return count ?? 0;
}
