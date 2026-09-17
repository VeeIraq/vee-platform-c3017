import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PlanForm } from "./plan-form";
import { NewPlanForm } from "./new-plan-form";

export default async function AdminPricingPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Pricing</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Edit each plan&apos;s name, tagline, price, setup fee, button text and feature list in English, Arabic and
        Kurdish. Unchecking &quot;Active&quot; hides a plan from the public site without deleting it.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {(plans ?? []).map((plan) => (
          <PlanForm key={plan.id} plan={plan} />
        ))}
        <NewPlanForm />
      </div>
    </div>
  );
}
