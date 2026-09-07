import "server-only";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "./db";
import { createClient } from "./supabase/server";

/**
 * Signup asks for a display name and stores it in the account's user
 * metadata. Accounts created without one fall back to the local part of the
 * email so the journal still has something to greet you by.
 */
function displayName(user: SupabaseUser) {
  const name = user.user_metadata?.username;
  if (typeof name === "string" && name.trim()) return name.trim();
  return (user.email ?? "").split("@")[0] || "you";
}

/** The signed-in user for this request, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  // getUser() checks the token against the auth server, unlike getSession(),
  // which trusts whatever is in the cookie.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    username: displayName(data.user),
    created_at: data.user.created_at,
  };
}

/** Signs in with email and password. Returns an error message, or null. */
export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? "Wrong email or password." : null;
}

export type SignUpResult =
  /** The account is ready and the session cookie is set. */
  | { status: "signed-in" }
  /** The project requires email confirmation before the first sign-in. */
  | { status: "confirm-email" }
  | { status: "error"; message: string };

export async function signUp(
  email: string,
  password: string,
  username: string,
): Promise<SignUpResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { status: "error", message: error.message };

  // With email confirmation on, signing up with an address that already exists
  // returns a decoy user with no identities rather than an error, so that the
  // form cannot be used to discover who has an account.
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", message: "That email is already registered." };
  }

  return data.session ? { status: "signed-in" } : { status: "confirm-email" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
