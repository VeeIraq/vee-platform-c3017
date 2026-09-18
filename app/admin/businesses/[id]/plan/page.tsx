import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { getBusinessFeatureFlags } from "@/lib/data/feature-flags";
import { PlanForm } from "./plan-form";
import { FeatureList } from "./feature-list";

export default async function BusinessAdminPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const supabase = await createClient();
  const [{ data: business }, { data: planRows }] = await Promise.all([
    supabase.from("businesses").select("id, plan_id").eq("id", businessId).maybeSingle(),
    supabase.from("plans").select("id, name").eq("active", true).order("sort_order"),
  ]);
  if (!business) notFound();

  const plans = (planRows ?? []).map((p) => ({ id: p.id, label: pick(p.name as Record<string, string>, "en") || p.id }));
  const flags = await getBusinessFeatureFlags(businessId, business.plan_id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-1 font-bold text-ink">Subscription plan</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Changing the plan changes every feature below that this business doesn&apos;t already have its own override for.
        </p>
        <PlanForm businessId={businessId} currentPlanId={business.plan_id} plans={plans} />
      </div>

      <div>
        <h2 className="mb-1 font-bold text-ink">Features</h2>
        <p className="mb-3 max-w-2xl text-sm text-ink-muted">
          &quot;Plan default&quot; is whatever the current plan gives this business. Overriding a feature here affects only
          this business — the plan, and every other business on it, stay exactly as they were.
        </p>
        <FeatureList businessId={businessId} flags={flags} />
      </div>
    </div>
  );
}
