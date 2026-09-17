import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Server-side Supabase client (Server Components, Server Actions, Route
 * Handlers). Uses the request's cookies to read the current user's session
 * — reads/writes are still governed by RLS as that user, never as an admin.
 *
 * NOTE: Server Components can't write cookies, so `setAll` is wrapped in a
 * try/catch there; the session refresh in `proxy.ts` covers cookie renewal
 * in that case (see the Next.js + Supabase SSR pattern).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — proxy.ts refreshes the
            // session cookie instead. Safe to ignore here.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS entirely. Server-only, never imported
 * by a Client Component, and only used for operations that must legitimately
 * cross business boundaries under application-level checks (e.g. Super
 * Admin actions that are already gated by a verified `vee_staff` role, or
 * webhook/system jobs). Every call site must justify why RLS can't do the
 * job instead.
 */
export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceRoleClient must never be called in the browser");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Deliberately a distinct, catchable error rather than letting a blank
    // key hit Supabase and produce an opaque 401 — callers (e.g.
    // lib/actions/staff.ts) turn this into a friendly form error instead of
    // a crash. This key is intentionally not always configured: it's only
    // needed for the handful of actions that must create/manage other
    // users' auth accounts (staff invitations), so an environment that
    // doesn't need those can omit it.
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op: service role client never manages a user session
        },
      },
    }
  );
}
