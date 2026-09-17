import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { NavList, type NavListItem } from "./nav-list";
import type { Database } from "@/lib/supabase/types";

type NavRow = Database["public"]["Tables"]["nav_menu_items"]["Row"];

function toListItem(row: NavRow): NavListItem {
  return {
    id: row.id,
    label: {
      en: (row.label as Record<string, string>).en ?? "",
      ar: (row.label as Record<string, string>).ar ?? "",
      ku: (row.label as Record<string, string>).ku ?? "",
    },
    url: row.url,
    icon: row.icon,
    imageUrl: row.image_url,
    openNewTab: row.open_new_tab,
    visible: row.visible,
    sortOrder: row.sort_order,
  };
}

export default async function AdminNavPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("nav_menu_items").select("*").order("sort_order");
  const all = (rows ?? []).map(toListItem);
  const headerItems = all.filter((_, i) => (rows ?? [])[i].location === "header");
  const bySortRows = rows ?? [];
  const footerItems = all.filter((_, i) => bySortRows[i].location === "footer");
  const footerGroupOf = (id: string) => bySortRows.find((r) => r.id === id)?.footer_group ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold text-ink">Navigation</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Add, remove, reorder, show or hide header and footer links. Each link can carry an emoji icon or an
          uploaded image.
        </p>
      </div>

      <NavList title="Header" location="header" items={headerItems} />

      <div>
        <h2 className="mb-3 text-xl font-extrabold text-ink">Footer</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <NavList
            title="Solutions"
            location="footer"
            footerGroup="solutions"
            items={footerItems.filter((item) => footerGroupOf(item.id) === "solutions")}
          />
          <NavList
            title="Company"
            location="footer"
            footerGroup="company"
            items={footerItems.filter((item) => footerGroupOf(item.id) === "company")}
          />
          <NavList
            title="Legal"
            location="footer"
            footerGroup="legal"
            items={footerItems.filter((item) => footerGroupOf(item.id) === "legal")}
          />
        </div>
      </div>
    </div>
  );
}
