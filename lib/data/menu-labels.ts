import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export type MenuLabel = { id: string; key: string; name: Record<Locale, string> };

/**
 * The assignable label catalogue (Chef's Choice, Best Seller, ...) --
 * Vee-staff-managed, see supabase/migrations/0019_menu_item_labels.sql.
 * Used both by the dashboard's item label picker and (indirectly, via the
 * embedded select in lib/data/public.ts) the public menu page.
 */
export async function getMenuLabelCatalogue(): Promise<MenuLabel[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("menu_labels")
      .select("id, key, name")
      .eq("active", true)
      .order("sort_order");
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      key: row.key,
      name: { en: row.name.en ?? row.key, ar: row.name.ar ?? row.name.en ?? row.key, ku: row.name.ku ?? row.name.en ?? row.key },
    }));
  } catch {
    return [];
  }
}
