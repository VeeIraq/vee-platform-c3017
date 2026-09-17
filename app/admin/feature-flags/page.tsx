import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { FlagToggle } from "./flag-toggle";
import { FlagOverrides } from "./flag-overrides";

export default async function AdminFeatureFlagsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const [{ data: flags }, { data: overrides }, { data: planRows }, { data: businessRows }] = await Promise.all([
    supabase.from("feature_flags").select("*").order("key"),
    supabase.from("feature_flag_overrides").select("*"),
    supabase.from("plans").select("id, name").order("sort_order"),
    supabase.from("businesses").select("id, username, name").order("username"),
  ]);

  const plans = (planRows ?? []).map((p) => ({ id: p.id, label: pick(p.name as Record<string, string>, "en") || p.id }));
  const businesses = (businessRows ?? []).map((b) => ({
    id: b.id,
    label: `${pick(b.name as Record<string, string>, "en") || b.username} (@${b.username})`,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Feature flags</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Global on/off switches for platform features. Each toggle saves immediately. Add a per-plan or per-business
        override below a flag to turn it on or off for just that plan or business — an override always wins over the
        global default.
      </p>

      <div className="flex flex-col gap-2.5">
        {(flags ?? []).map((flag) => {
          const flagOverrides = (overrides ?? []).filter((o) => o.flag_id === flag.id);
          return (
            <div key={flag.id} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-ink">{flag.label}</p>
                  <p className="text-xs text-ink-muted">{flag.description}</p>
                </div>
                <FlagToggle flagId={flag.id} value={flag.default_value} />
              </div>
              <FlagOverrides
                flagId={flag.id}
                overrides={flagOverrides.map((o) => ({ id: o.id, scopeType: o.scope_type as "plan" | "business", scopeId: o.scope_id, value: o.value }))}
                plans={plans}
                businesses={businesses}
              />
            </div>
          );
        })}
        {(flags ?? []).length === 0 && (
          <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
            No feature flags yet — run supabase/migrations/0004_seed_data.sql against your project.
          </p>
        )}
      </div>
    </div>
  );
}
