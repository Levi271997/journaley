import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function backToLogin(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

/**
 * Where the confirmation email lands. Supabase's default template uses the
 * implicit flow, which puts the token in the URL fragment where the server
 * cannot see it — so the template is pointed here with a `token_hash` instead,
 * which this handler trades for a session cookie.
 *
 * Covers signup confirmation, password recovery and email changes; the `type`
 * comes from the link itself.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    backToLogin("That confirmation link is incomplete. Try the link in your email again.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    backToLogin("That confirmation link has expired or was already used. Sign in, or create the account again.");
  }

  redirect("/journal");
}
