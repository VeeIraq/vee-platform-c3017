"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function setBusinessStatusAsAdmin(businessId: string, status: Database["public"]["Tables"]["businesses"]["Row"]["status"]) {
  const { authUser } = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ status }).eq("id", businessId);
  if (!error) {
    await supabase.from("audit_log").insert({
      actor_id: authUser.id,
      business_id: businessId,
      entity_type: "business",
      entity_id: businessId,
      action: `status_set_${status}`,
    });
  }
  revalidatePath("/admin/businesses");
}

export async function updateLeadStatus(leadId: string, status: Database["public"]["Tables"]["leads"]["Row"]["status"]) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/admin/leads");
}

export async function setFeatureFlagDefault(flagId: string, value: boolean): Promise<{ success: boolean; error?: string }> {
  const { authUser } = await requireSuperAdmin();
  const supabase = await createClient();
  const { data: before } = await supabase.from("feature_flags").select("default_value").eq("id", flagId).single();
  const { error } = await supabase.from("feature_flags").update({ default_value: value }).eq("id", flagId);
  if (error) {
    return { success: false, error: "Couldn't save — please try again." };
  }
  await supabase.from("feature_flag_audit_log").insert({
    flag_id: flagId,
    actor_id: authUser.id,
    action: "updated",
    previous_value: { default_value: before?.default_value },
    new_value: { default_value: value },
  });
  revalidatePath("/admin/feature-flags");
  return { success: true };
}

/** Per-plan or per-business override for a feature flag: beats the global default when present. */
export async function setFeatureFlagOverride(
  flagId: string,
  scopeType: "plan" | "business",
  scopeId: string,
  value: boolean
): Promise<{ success: boolean; error?: string }> {
  const { authUser } = await requireSuperAdmin();
  if (!scopeId) return { success: false, error: "Choose a plan or business first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_flag_overrides")
    .upsert({ flag_id: flagId, scope_type: scopeType, scope_id: scopeId, value }, { onConflict: "flag_id,scope_type,scope_id" });
  if (error) {
    return { success: false, error: "Couldn't save — please try again." };
  }
  await supabase.from("feature_flag_audit_log").insert({
    flag_id: flagId,
    actor_id: authUser.id,
    action: "override_set",
    previous_value: null,
    new_value: { scope_type: scopeType, scope_id: scopeId, value },
  });
  revalidatePath("/admin/feature-flags");
  return { success: true };
}

export async function removeFeatureFlagOverride(overrideId: string): Promise<{ success: boolean; error?: string }> {
  const { authUser } = await requireSuperAdmin();
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("feature_flag_overrides")
    .select("flag_id, scope_type, scope_id, value")
    .eq("id", overrideId)
    .single();
  const { error } = await supabase.from("feature_flag_overrides").delete().eq("id", overrideId);
  if (error) {
    return { success: false, error: "Couldn't remove — please try again." };
  }
  if (before) {
    await supabase.from("feature_flag_audit_log").insert({
      flag_id: before.flag_id,
      actor_id: authUser.id,
      action: "override_removed",
      previous_value: { scope_type: before.scope_type, scope_id: before.scope_id, value: before.value },
      new_value: null,
    });
  }
  revalidatePath("/admin/feature-flags");
  return { success: true };
}
