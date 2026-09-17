import { requireStaff } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { CatalogueManager } from "./catalogue-manager";

export default async function AdminCataloguePage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: products } = await supabase.from("catalogue_products").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Catalogue</h1>
      <CatalogueManager products={products ?? []} />
    </div>
  );
}
