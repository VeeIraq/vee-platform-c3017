import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { OverridesList } from "./overrides-list";

export default async function AdminTranslationsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("translation_overrides")
    .select("id, namespace, key, locale, value")
    .order("namespace")
    .order("key")
    .order("locale");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Translations</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Override any English, Arabic or Kurdish text used across the site without a code deploy. Changes apply
        immediately for new page loads.
      </p>
      <OverridesList overrides={data ?? []} />
    </div>
  );
}
