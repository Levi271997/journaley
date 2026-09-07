import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Supabase access tokens are short-lived. This runs before every page render,
 * refreshes the token when it has expired, and writes the new cookies onto the
 * response — Server Components are not allowed to set cookies themselves, so
 * without this the session would quietly expire mid-use.
 *
 * (In Next.js 16 this file is `proxy.ts`; it was called `middleware.ts` in
 * earlier versions, which is what the Supabase guides still show.)
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { url, key } = supabaseEnv();

  // Let the page render and report the missing configuration properly rather
  // than failing every request with an opaque proxy error.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
        // Responses that carry auth cookies must not be cached by a CDN, or
        // one visitor's session could be served to somebody else.
        for (const [header, headerValue] of Object.entries(headers)) {
          response.headers.set(header, headerValue);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, which never need a session.
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
