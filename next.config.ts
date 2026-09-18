import type { NextConfig } from "next";

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
        // the launch audit) -- no HSTS/X-Frame-Options/Referrer-Policy
        // configured anywhere.
        //
        // Content-Security-Policy is deliberately NOT set here: it used to
        // be a static value in this array, but a static script-src can only
        // ever be 'self' or 'unsafe-inline' -- it can't carry a nonce, and
        // without a nonce the browser blocks the small inline <script> tags
        // Next.js itself injects to hydrate the page. That's exactly what
        // broke every client-side interaction on the live site (language
        // buttons included) after this header was first added. CSP now
        // lives in lib/supabase/proxy-session.ts (invoked from proxy.ts),
        // which generates a fresh nonce per request -- something this
        // static config function has no way to do -- via lib/security/csp.ts.
        source: "/(.*)",
        headers: [
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
