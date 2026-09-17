import type { NextConfig } from "next";

// Same "deliberately broad rather than hardcoding one project ref" reasoning
// as the images.remotePatterns entry below -- this app talks to Supabase
// directly from the browser (lib/supabase/client.ts, the public anon key),
// for REST/Auth calls and for the same Storage URLs images.remotePatterns
// already allows, so connect-src/img-src need the same wildcard.
const SUPABASE_ORIGIN = "https://*.supabase.co";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (business logos/covers/menu images,
      // catalogue/site media) — project-specific subdomain, so this is
      // deliberately broad rather than hardcoding one project ref.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        // Applies to every route. This was previously entirely absent (see
        // the launch audit) -- no CSP/HSTS/X-Frame-Options/Referrer-Policy
        // configured anywhere. Reasoned through against this app's actual
        // code (no iframes, no inline <script>, no third-party embeds — see
        // the launch audit's grep for sentry/posthog/gtag/etc., all absent)
        // but NOT yet exercised against a running instance: verify nothing
        // is silently blocked during the staging QA pass in Section 5,
        // especially Supabase Storage image loading and the browser-side
        // auth calls in lib/supabase/client.ts.
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // "preload" only expresses intent for the HSTS preload list —
          // submitting the domain to hstspreload.org is a separate, manual,
          // hard-to-reverse step; do that only once staging has proven HTTPS
          // is solid everywhere, not right after this first deploy.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
