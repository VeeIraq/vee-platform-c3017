import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { NewBusinessForm } from "./new-business-form";

export default async function AdminNewBusinessPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("id, name").eq("active", true).order("sort_order");

  return (
    <div>
      <Link href="/admin/businesses" className="mb-3 inline-block text-sm font-semibold text-accent hover:underline">
        ← All businesses
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">New business</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Creates the business record and its subscription on the plan you choose. It starts as a draft with no owner —
        after creating it, open its Team tab to invite the person who&apos;ll actually run it.
      </p>
      <NewBusinessForm plans={(plans ?? []).map((p) => ({ id: p.id, label: pick(p.name as Record<string, string>, "en") || p.id }))} />
    </div>
  );
}
