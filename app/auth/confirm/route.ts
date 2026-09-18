import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges a Supabase auth code (password recovery, email confirmation,
 * magic link, ...) for a real session, then redirects on to `next`.
 *
 * This MUST be a Route Handler, not a Server Component page: Next.js only
 * allows a response's cookies to be mutated from a Server Action or a Route
 * Handler. `lib/supabase/server.ts`'s `createClient()` wraps its cookie
 * `setAll` in a try/catch specifically because calling it from a Server
 * Component (as the old `/reset-password/confirm` page used to) throws and
 * is silently swallowed there -- the code exchange itself would succeed
 * against Supabase, but the resulting session cookie never actually reached
 * the browser, so the "set a new password" step that followed always failed
 * with no session. Doing the exchange here fixes that: the cookies land on
 * this route's own redirect response.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Only ever redirect to a same-site path -- never follow an absolute/external "next".
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing/invalid/expired code -- send them back to request a fresh link
  // rather than on to a page that will just fail with no session.
  return NextResponse.redirect(`${origin}/reset-password?expired=1`);
}
