import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CONTENT } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Database, Json } from "@/lib/supabase/types";

/** Simple, dependency-free User-Agent sniff -- good enough to bucket
 *  analytics by device class without pulling in a UA-parsing library. */
function detectDeviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(ua)) return "mobile";
  return "desktop";
}

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type CatalogueProduct = Database["public"]["Tables"]["catalogue_products"]["Row"];
type NavRow = Database["public"]["Tables"]["nav_menu_items"]["Row"];

export type SiteSection = { key: string; visible: boolean; sortOrder: number };

export type FaqItem = {
  key: string;
  q: Record<Locale, string>;
  a: Record<Locale, string>;
};

export type NavItem = {
  id: string;
  label: Record<Locale, string>;
  url: string;
  icon: string | null;
  imageUrl: string | null;
  openNewTab: boolean;
  footerGroup: string | null;
  sortOrder: number;
};

const DEFAULT_HOMEPAGE_SECTIONS: SiteSection[] = [
  { key: "hero", visible: true, sortOrder: 0 },
  { key: "explain", visible: true, sortOrder: 1 },
  { key: "digitalMenu", visible: true, sortOrder: 2 },
  { key: "why", visible: true, sortOrder: 3 },
  { key: "businessTypes", visible: true, sortOrder: 4 },
  { key: "products", visible: true, sortOrder: 5 },
  { key: "how", visible: true, sortOrder: 6 },
  { key: "plans", visible: true, sortOrder: 7 },
  { key: "analyticsStats", visible: true, sortOrder: 8 },
  { key: "faq", visible: true, sortOrder: 9 },
  { key: "contact", visible: true, sortOrder: 10 },
];

/**
 * Every function here degrades gracefully to the static, ported dictionary
 * content when the database isn't reachable yet (e.g. Supabase env vars not
 * configured). Once a real Supabase project is connected and seeded (see
 * supabase/migrations), the DB becomes the live source of truth — that's
 * what lets Super Admin edit pricing/catalogue without a redeploy.
 */

export async function getPlans(): Promise<Plan[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("plans").select("*").eq("active", true).order("sort_order");
    if (error || !data || data.length === 0) throw error ?? new Error("empty");
    return data;
  } catch {
    return CONTENT.PLAN_ITEMS.map((p) => ({
      id: p.id as string,
      name: p.name as Plan["name"],
      tagline: p.tagline as Plan["tagline"],
      price_iqd: (p.monthlyPrice as number) ?? null,
      billing_cycle: "monthly",
      features: p.features as Json,
      max_locations: 1,
      max_staff: 1,
      sort_order: 0,
      active: true,
      setup_price_iqd: (p.setupPrice as number) ?? null,
      popular: Boolean(p.popular),
      cta: (p.cta as Plan["cta"]) ?? {},
    }));
  }
}

export async function getCatalogueProducts(): Promise<CatalogueProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("catalogue_products")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    if (error || !data) throw error ?? new Error("empty");
    return data;
  } catch {
    return [];
  }
}

export async function getCatalogueProductBySku(sku: string): Promise<CatalogueProduct | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalogue_products")
      .select("*")
      .eq("sku", sku)
      .eq("status", "published")
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedBusinessByUsername(username: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("username", username)
      .eq("status", "published")
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

/** For app/sitemap.ts only -- every published business's username + last-updated timestamp, nothing else. */
export async function getPublishedBusinessUsernames(): Promise<{ username: string; updatedAt: string }[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("businesses").select("username, updated_at").eq("status", "published");
    if (error || !data) throw error ?? new Error("empty");
    return data.map((b) => ({ username: b.username, updatedAt: b.updated_at }));
  } catch {
    return [];
  }
}

export async function getBusinessLinks(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_links")
    .select("*")
    .eq("business_id", businessId)
    .eq("enabled", true)
    .order("sort_order");
  return data ?? [];
}

export async function getBusinessMenu(businessId: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("business_id", businessId)
      .eq("visible", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, product_options(*), menu_item_label_links(menu_labels(id, key, name))")
      .eq("business_id", businessId)
      .eq("visible", true)
      .order("sort_order"),
  ]);
  // The hand-written Database type has no relationship metadata for
  // menu_items -> product_options / menu_item_label_links (see
  // lib/supabase/types.ts's TODO), so postgrest-js can't type this embedded
  // select — cast explicitly instead of losing the embed. Regenerating
  // types from a live project resolves this properly.
  type MenuItemWithOptions = Database["public"]["Tables"]["menu_items"]["Row"] & {
    product_options: Database["public"]["Tables"]["product_options"]["Row"][];
    menu_item_label_links: { menu_labels: Database["public"]["Tables"]["menu_labels"]["Row"] | null }[];
  };
  return { categories: categories ?? [], items: (items ?? []) as unknown as MenuItemWithOptions[] };
}

/**
 * Homepage section visibility + order, edited from Super Admin > Content.
 * The section's own text always stays translation-driven (site_content
 * rows here carry no copy) -- this purely controls whether a section
 * renders on the homepage and in what order.
 */
export async function getHomepageSections(): Promise<SiteSection[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key, visible, sort_order")
      .eq("type", "section")
      .like("key", "homepage.%")
      .order("sort_order");
    if (error || !data || data.length === 0) throw error ?? new Error("empty");
    return data.map((row) => ({
      key: row.key.replace(/^homepage\./, ""),
      visible: row.visible,
      sortOrder: row.sort_order,
    }));
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS;
  }
}

export async function getFaqItems(): Promise<FaqItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key, content, visible, sort_order")
      .eq("type", "faq")
      .eq("visible", true)
      .order("sort_order");
    if (error || !data || data.length === 0) throw error ?? new Error("empty");
    return data.map((row) => {
      const content = row.content as { q?: Partial<Record<Locale, string>>; a?: Partial<Record<Locale, string>> };
      return {
        key: row.key,
        q: { en: content.q?.en ?? "", ar: content.q?.ar ?? "", ku: content.q?.ku ?? "" },
        a: { en: content.a?.en ?? "", ar: content.a?.ar ?? "", ku: content.a?.ku ?? "" },
      };
    });
  } catch {
    return (CONTENT.FAQ_ITEMS as Array<{ q: Record<string, string>; a: Record<string, string> }>).map(
      (item, i) => ({
        key: `faq.item.${i}`,
        q: { en: item.q.en ?? "", ar: item.q.ar ?? "", ku: item.q.ku ?? "" },
        a: { en: item.a.en ?? "", ar: item.a.ar ?? "", ku: item.a.ku ?? "" },
      })
    );
  }
}

/**
 * Header/footer navigation links, edited from Super Admin > Navigation.
 * Returns [] (never throws) on any DB issue -- callers already have their
 * own translation-aware hardcoded fallback list and should use that when
 * this comes back empty, rather than duplicating translated strings here.
 */
export async function getNavItems(location: "header" | "footer"): Promise<NavItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nav_menu_items")
      .select("*")
      .eq("location", location)
      .eq("visible", true)
      .order("sort_order");
    if (error || !data) throw error ?? new Error("empty");
    return data.map((row: NavRow) => ({
      id: row.id,
      label: row.label as Record<Locale, string>,
      url: row.url,
      icon: row.icon,
      imageUrl: row.image_url,
      openNewTab: row.open_new_tab,
      footerGroup: row.footer_group,
      sortOrder: row.sort_order,
    }));
  } catch {
    return [];
  }
}

export type PageSeo = { title: Record<Locale, string>; description: Record<Locale, string> };

/** Homepage SEO title/description, edited from Super Admin > Content. */
export async function getHomepageSeo(): Promise<PageSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("key", "seo.home")
      .eq("type", "page")
      .maybeSingle();
    if (error || !data) return null;
    const content = data.content as { title?: Partial<Record<Locale, string>>; description?: Partial<Record<Locale, string>> };
    if (!content.title?.en || !content.description?.en) return null;
    return {
      title: { en: content.title.en, ar: content.title.ar ?? content.title.en, ku: content.title.ku ?? content.title.en },
      description: {
        en: content.description.en,
        ar: content.description.ar ?? content.description.en,
        ku: content.description.ku ?? content.description.en,
      },
    };
  } catch {
    return null;
  }
}

export async function logAnalyticsEvent(
  businessId: string,
  type: string,
  metadata: Record<string, unknown> & { locale?: string; locationId?: string | null } = {}
) {
  try {
    const supabase = await createClient();
    const hdrs = await headers();
    const { locale, locationId, ...rest } = metadata;
    await supabase.from("analytics_events").insert({
      business_id: businessId,
      type,
      metadata: rest as Json,
      session_locale: (locale as Database["public"]["Tables"]["analytics_events"]["Row"]["session_locale"]) ?? null,
      device_type: detectDeviceType(hdrs.get("user-agent")),
      location_id: locationId ?? null,
    });
  } catch {
    // Never let analytics failures break the page.
  }
}
