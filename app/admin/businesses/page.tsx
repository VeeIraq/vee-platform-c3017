import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { BusinessRowActions } from "./business-row-actions";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-success-bg text-success",
  draft: "bg-warning-bg text-warning",
  suspended: "bg-danger-bg text-danger",
};

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.ilike("username", `%${q}%`);
  const { data: businesses } = await query;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Businesses</h1>
      <p className="mb-6 text-sm text-ink-muted">Every business on the platform.</p>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by username…"
          className="w-full max-w-xs rounded-[var(--radius-sm)] border border-line bg-paper px-3.5 py-2.5 text-sm"
        />
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-paper">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase text-ink-muted">
              <th className="p-3 text-start">Business</th>
              <th className="p-3 text-start">Username</th>
              <th className="p-3 text-start">Plan</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Manage</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(businesses ?? []).map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold text-ink">{pick(b.name as Record<string, string>, "en")}</td>
                <td className="p-3 text-ink-muted">{b.username}</td>
                <td className="p-3 text-ink-muted">{b.plan_id}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                </td>
                <td className="p-3">
                  <Link href={`/admin/businesses/${b.id}`} className="text-sm font-semibold text-accent hover:underline">
                    Manage →
                  </Link>
                </td>
                <td className="p-3">
                  <BusinessRowActions businessId={b.id} status={b.status} />
                </td>
              </tr>
            ))}
            {(businesses ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  No businesses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
