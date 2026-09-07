import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/**
 * A Supabase client bound to the current request's cookies, so every query
 * runs as the signed-in user and Row Level Security applies.
 *
 * Build a new one per request — never cache one across requests, since it
 * carries one caller's session.
 */
export async function createClient() {
  const store = await cookies();
  const { url, key } = requireSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components are not allowed to set cookies. Rendering is
          // still correct using the tokens already on the request; the
          // refreshed ones are written by src/proxy.ts instead.
        }
      },
    },
  });
}
