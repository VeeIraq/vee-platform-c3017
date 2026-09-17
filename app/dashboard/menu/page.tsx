import { getActiveBusiness } from "@/lib/data/dashboard";
import { getServerLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getMenuLabelCatalogue } from "@/lib/data/menu-labels";
import type { Database } from "@/lib/supabase/types";
import { MenuManager } from "./menu-manager";

type MenuItemWithOptions = Database["public"]["Tables"]["menu_items"]["Row"] & {
  product_options: Database["public"]["Tables"]["product_options"]["Row"][];
  menu_item_label_links: { menu_labels: Database["public"]["Tables"]["menu_labels"]["Row"] | null }[];
};

export default async function DashboardMenuPage() {
  const { business } = await getActiveBusiness();
  const locale = await getServerLocale();

  const menuOn = await isFeatureEnabled("digital_menus", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!menuOn) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
        Digital menus aren&apos;t enabled for your business right now.
      </p>
    );
  }

  const supabase = await createClient();
  const [{ data: categories }, { data: items }, labelCatalogue] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("business_id", business.id).order("sort_order"),
    // The hand-written Database type has no relationship metadata linking
    // menu_items -> product_options / menu_item_label_links for
    // postgrest-js's embedded-select typing, so the cast below is
    // deliberate (see lib/data/public.ts for the matching public-site read,
    // which explains the same workaround).
    supabase
      .from("menu_items")
      .select("*, product_options(*), menu_item_label_links(menu_labels(id, key, name))")
      .eq("business_id", business.id)
      .order("sort_order"),
    getMenuLabelCatalogue(),
  ]);
  const itemsWithOptions = (items ?? []) as unknown as MenuItemWithOptions[];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Menu</h1>
      <p className="mb-6 text-sm text-ink-muted">Organize categories and items. Changes go live immediately for a published business.</p>
      <MenuManager
        businessId={business.id}
        locale={locale}
        likesEnabled={business.likes_enabled}
        labelCatalogue={labelCatalogue}
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name as Record<string, string>, visible: c.visible }))}
        items={itemsWithOptions.map((i) => ({
          id: i.id,
          category_id: i.category_id,
          name: i.name as Record<string, string>,
          price: i.price,
          discount_price: i.discount_price,
          available: i.available,
          visible: i.visible,
          image_url: i.image_url,
          labelIds: (i.menu_item_label_links ?? []).map((l) => l.menu_labels?.id).filter((id): id is string => Boolean(id)),
          options: [...(i.product_options ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((o) => ({
              id: o.id,
              type: o.type,
              name: o.name as Record<string, string>,
              choices: (o.choices ?? []) as unknown as { id: string; name: Record<string, string>; priceDelta: number }[],
            })),
        }))}
      />
    </div>
  );
}
