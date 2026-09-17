import type { NextRequest } from "next/server";
import { updateSessionAndGuard } from "@/lib/supabase/proxy-session";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanics, new
// name/export). This runs before every matched route to refresh the
// Supabase session cookie and perform an optimistic /dashboard + /admin
// auth redirect. See lib/supabase/proxy-session.ts for the real logic.
export async function proxy(request: NextRequest) {
  return updateSessionAndGuard(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, so the session cookie
     * stays fresh everywhere, while skipping anything that doesn't need it.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
