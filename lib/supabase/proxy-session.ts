import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { buildCsp } from "@/lib/security/csp";

/**
 * Refreshes the Supabase auth session on every request, performs
 * OPTIMISTIC route protection (cookie-based, no DB round trip) for
 * /dashboard and /admin, and issues this request's Content-Security-Policy
 * header with a fresh nonce (see lib/security/csp.ts for why script-src
 * needs a nonce rather than 'unsafe-inline'). The nonce has to be generated
 * per request -- a static CSP header from next.config.ts can't do this --
 * so it's forwarded to Server Components via the `x-nonce` request header
 * and set on every response returned below. Next.js automatically stamps
 * its own internally-injected hydration/streaming <script> tags with the
 * nonce it finds in the response's CSP header; this app has no inline
 * <script> tags of its own, so nothing else needs to read `x-nonce`.
 *
 * This is a fast, non-authoritative auth check — every Server Action and
 * Server Component under /dashboard and /admin must still call the DAL
 * (`lib/auth/dal.ts`) for the real, database-backed authorization check,
 * and Postgres RLS is the true last line of defense. See Next.js's
 * authentication guide: "Proxy should not be your only line of defense."
 */
export async function updateSessionAndGuard(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Forward the current path (used by the language gate's "return to this
  // page after choosing a language" redirect) and this request's nonce to
  // Server Components.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  requestHeaders.set("x-nonce", nonce);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/reset-password");

  if ((isDashboard || isAdmin) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  if (isAuthPage && user) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  return response;
}
