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
