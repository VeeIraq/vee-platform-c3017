import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves whether a feature is enabled for a given business: business-level
 * override > plan-level override > global default. Falls back to `true`
 * when flags can't be read (e.g. no Supabase project connected yet) so the
 * app keeps working rather than hiding everything.
 */
export async function isFeatureEnabled(key: string, opts?: { businessId?: string; planId?: string }): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: flag } = await supabase.from("feature_flags").select("id, default_value").eq("key", key).maybeSingle();
    if (!flag) return true;

    if (opts?.businessId) {
      const { data: businessOverride } = await supabase
        .from("feature_flag_overrides")
        .select("value")
        .eq("flag_id", flag.id)
        .eq("scope_type", "business")
        .eq("scope_id", opts.businessId)
        .maybeSingle();
      if (businessOverride) return businessOverride.value;
    }

    if (opts?.planId) {
      const { data: planOverride } = await supabase
        .from("feature_flag_overrides")
        .select("value")
        .eq("flag_id", flag.id)
        .eq("scope_type", "plan")
        .eq("scope_id", opts.planId)
        .maybeSingle();
      if (planOverride) return planOverride.value;
    }

    return flag.default_value;
  } catch {
    return true;
  }
}

export async function getAllFeatureFlags() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("feature_flags").select("*");
    return data ?? [];
  } catch {
    return [];
  }
}

export type BusinessFeatureFlag = {
  id: string;
  key: string;
  label: string;
  description: string;
  /** What this business gets today if no business-level override exists: the plan's override value, or the global default. */
  inherited: boolean;
  inheritedFromPlan: boolean;
  /** Present only when this specific business has its own override. */
  businessOverrideId: string | null;
  businessOverrideValue: boolean | null;
  /** business override > plan override > global default -- same precedence isFeatureEnabled uses. */
  effective: boolean;
};

/**
 * Same data isFeatureEnabled resolves, but for every flag at once and framed
 * around one business -- backs the Plan & Features tab under
 * Admin > Businesses (app/admin/businesses/[id]/plan), so Super Admin can
 * grant or remove any feature for just this business without leaving the
 * page, using the same feature_flags/feature_flag_overrides tables and
 * precedence the standalone /admin/feature-flags page and the live app both
 * already rely on.
 */
export async function getBusinessFeatureFlags(businessId: string, planId: string | null): Promise<BusinessFeatureFlag[]> {
  try {
    const supabase = await createClient();
    const [{ data: flags }, { data: overrides }] = await Promise.all([
      supabase.from("feature_flags").select("*").order("key"),
      supabase.from("feature_flag_overrides").select("*"),
    ]);

    return (flags ?? []).map((flag) => {
      const businessOverride = (overrides ?? []).find((o) => o.flag_id === flag.id && o.scope_type === "business" && o.scope_id === businessId) ?? null;
      const planOverride = planId ? (overrides ?? []).find((o) => o.flag_id === flag.id && o.scope_type === "plan" && o.scope_id === planId) ?? null : null;
      const inherited = planOverride ? planOverride.value : flag.default_value;
      const effective = businessOverride ? businessOverride.value : inherited;
      return {
        id: flag.id,
        key: flag.key,
        label: flag.label,
        description: flag.description,
        inherited,
        inheritedFromPlan: Boolean(planOverride),
        businessOverrideId: businessOverride?.id ?? null,
        businessOverrideValue: businessOverride?.value ?? null,
        effective,
      };
    });
  } catch {
    return [];
  }
}
