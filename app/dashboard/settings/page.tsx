import { getActiveBusiness } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { StaffManager } from "./staff-manager";

export default async function DashboardSettingsPage() {
  const { business, membership } = await getActiveBusiness();
  const supabase = await createClient();

  const [{ data: subscription }, { data: plan }, { data: members }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("plans").select("*").eq("id", business.plan_id ?? "vee_start").maybeSingle(),
    supabase.from("business_members").select("*").eq("business_id", business.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-ink-muted">Plan</p>
            <p className="font-bold text-ink">{(plan?.name as Record<string, string>)?.en ?? business.plan_id ?? "Vee Start"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted">Subscription status</p>
            <p className="font-bold capitalize text-ink">{subscription?.status ?? "trial"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted">Public URL</p>
            <p className="font-bold text-ink">vee.iq/{business.username}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-extrabold text-ink">Team</h2>
        <p className="mb-4 text-sm text-ink-muted">Invite staff with scoped permissions — they&apos;ll only see what you grant them.</p>
        <StaffManager
          businessId={business.id}
          canManage={membership.role === "owner"}
          members={(members ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            permissions: m.permissions,
            invited_email: m.invited_email,
            accepted_at: m.accepted_at,
          }))}
        />
      </section>
    </div>
  );
}
