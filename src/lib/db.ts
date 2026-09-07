/**
 * Row shapes for the Supabase `public` schema, plus the signed-in user.
 *
 * Types only — safe to import from Client Components. The queries themselves
 * live in lib/auth.ts and lib/entries.ts.
 */

/** The signed-in user, flattened from Supabase's `auth.users` record. */
export type User = {
  id: string;
  email: string;
  /** Display name from signup, kept in the account's user metadata. */
  username: string;
  created_at: string;
};

export type Entry = {
  id: number;
  user_id: string;
  title: string;
  body: string;
  /** Rich text from the editor; `body` is its plain-text mirror. */
  body_html: string;
  mood: string | null;
  /** Date only, `YYYY-MM-DD`. */
  entry_date: string;
  created_at: string;
  updated_at: string;
};
