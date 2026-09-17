import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ count: businesses }, { count: published }, { count: leads }, { count: newLeads }] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Platform overview</h1>
      <p className="mb-6 text-sm text-ink-muted">Vee, across every business.</p>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Total businesses", businesses ?? 0],
          ["Published", published ?? 0],
          ["Total leads", leads ?? 0],
          ["New leads", newLeads ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
            <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-extrabold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
