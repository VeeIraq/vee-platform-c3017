import type { MetadataRoute } from "next";
import { getCatalogueProducts, getPublishedBusinessUsernames } from "@/lib/data/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = ["", "/products", "/contact", "/privacy", "/terms"];

// Dynamic sitemap: re-queries published businesses/products on every
// request (Next.js caches this route's output like any other page, so it's
// not hitting the DB on every single crawler request). Deliberately lists
// only each business's root profile URL, not /menu or /reviews beneath it
// -- those are reachable from the profile page itself and gating them here
// correctly would mean duplicating the menu_link_enabled / likes_enabled /
// review_pages.enabled checks that already live in each route; out of
// scope for "add a sitemap," not a functional gap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, businesses] = await Promise.all([getCatalogueProducts(), getPublishedBusinessUsernames()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.sku.toLowerCase()}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const businessEntries: MetadataRoute.Sitemap = businesses.map((b) => ({
    url: `${SITE_URL}/${b.username}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries, ...businessEntries];
}
