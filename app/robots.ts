import type { MetadataRoute } from "next";

// NEXT_PUBLIC_SITE_URL is required for this to point at the right host --
// see the deployment runbook for setting it to the real staging/production
// domain (it defaults to localhost in .env.local.example, which is
// harmless here but worth confirming before relying on this in production).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /dashboard and /admin are already auth-gated (requireUser /
        // requireStaff in lib/auth/dal.ts) so a crawler can't do anything
        // there anyway -- disallowed too, so search engines don't waste
        // crawl budget hitting redirect-to-login pages.
        disallow: ["/dashboard", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
