import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/i18n/server";
import { getMenuLabelCatalogue } from "@/lib/data/menu-labels";
import { MenuManager } from "@/app/dashboard/menu/menu-manager";
import type { Database } from "@/lib/supabase/types";

type MenuItemWithOptions = Database["public"]["Tables"]["menu_items"]["Row"] & {
  product_options: Database["public"]["Tables"]["product_options"]["Row"][];
  menu_item_label_links: { menu_labels: Database["public"]["Tables"]["menu_labels"]["Row"] | null }[];
};

export default async function BusinessAdminMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const locale = await getServerLocale();
  const supabase = await createClient();

  const { data: business } = await supabase.from("businesses").select("id, likes_enabled").eq("id", businessId).maybeSingle();
  if (!business) notFound();

  const [{ data: categories }, { data: items }, labelCatalogue] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("business_id", businessId).order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, product_options(*), menu_item_label_links(menu_labels(id, key, name))")
      .eq("business_id", businessId)
      .order("sort_order"),
    getMenuLabelCatalogue(),
  ]);
  const itemsWithOptions = (items ?? []) as unknown as MenuItemWithOptions[];

  return (
    <MenuManager
      businessId={businessId}
      locale={locale}
      likesEnabled={business.likes_enabled}
      labelCatalogue={labelCatalogue}
      categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name as Record<string, string>, visible: c.visible }))}
      items={itemsWithOptions.map((i) => ({
        id: i.id,
        category_id: i.category_id,
        name: i.name as Record<string, string>,
        description: (i.description ?? {}) as Record<string, string>,
        price: i.price,
        discount_price: i.discount_price,
        tags: i.tags ?? [],
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
  );
}
