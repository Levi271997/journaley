/**
 * Supabase project credentials from the environment.
 *
 * The dashboard's Connect snippet has changed names over time — older projects
 * get `ANON_KEY`, newer ones `PUBLISHABLE_KEY` — and both refer to the same
 * public key, so either is accepted.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

/** Same, but fails loudly — for code paths that cannot carry on without it. */
export function requireSupabaseEnv() {
  const { url, key } = supabaseEnv();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from " +
        "your project's Connect dialog.",
    );
  }

  return { url, key };
}
