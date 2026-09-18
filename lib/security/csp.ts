// Shared with next.config.ts's images.remotePatterns reasoning: this app
// talks to Supabase Storage directly from the browser (lib/supabase/client.ts,
// the public anon key), so img-src/connect-src need this origin too.
// Deliberately broad rather than hardcoding one project ref.
const SUPABASE_ORIGIN = "https://*.supabase.co";

/**
 * Builds this request's Content-Security-Policy header value.
 *
 * script-src carries only 'self' plus a per-request nonce -- no
 * 'unsafe-inline'. Next.js injects a handful of small inline <script> tags
 * at runtime to stream and hydrate server-rendered content; those are
 * framework internals, not anything in this app's own code (which has no
 * inline <script> tags -- see style-src's comment below for the one
 * deliberate 'unsafe-inline' exception, which is unrelated to script-src).
 * Without a nonce, the browser correctly refuses to run Next's own
 * bootstrap scripts, hydration silently fails, and every client-side
 * interaction on the page goes dead -- which is exactly what happened in
 * production before this file existed. See lib/supabase/proxy-session.ts
 * for where the nonce is generated per-request and where Next picks it up
 * automatically for its own injected scripts.
 */
export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    // 'unsafe-inline' here covers React's style="" attribute usage (e.g.
    // app/global-error.tsx, which can't depend on globals.css by design --
    // see its own comment) -- it does not affect script-src above.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${SUPABASE_ORIGIN}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SUPABASE_ORIGIN}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
