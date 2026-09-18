"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireSuperAdmin } from "@/lib/auth/dal";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ActionState = { error?: string; success?: boolean } | undefined;

// Same reserved-word / slugify approach as createBusinessForCurrentUser
// (lib/actions/dashboard-context.ts) -- duplicated rather than imported
// because that version ends in a `redirect("/dashboard")` tied to the
// self-signup flow, which doesn't apply here.
const RESERVED_USERNAMES = new Set([
  "login", "signup", "dashboard", "admin", "api", "products", "product", "contact",
  "privacy", "terms", "about", "menu", "pricing", "plans", "faq", "reset-password",
  "_next", "public", "brand", "vee", "www",
]);

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
  revalidatePath("/admin/businesses/[id]/plan", "page");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Business creation, plan assignment, and owner invitation -- all Super
// Admin-only (requireSuperAdmin). Business owners have no code path to any
// of these: there is no owner-facing action that writes businesses.plan_id
// or feature_flag_overrides, so "owners can never change their own plan or
// permissions" holds structurally, not just by UI omission.
// ---------------------------------------------------------------------------

const createBusinessSchema = z.object({
  nameEn: z.string().trim().min(2, "Enter a business name."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  username: z.string().trim().optional(),
  planId: z.string().trim().min(1, "Choose a plan."),
});

export async function createBusinessAsAdmin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createBusinessSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    nameKu: formData.get("nameKu"),
    username: formData.get("username"),
    planId: formData.get("planId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const { authUser } = await requireSuperAdmin();
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("id").eq("id", parsed.data.planId).maybeSingle();
  if (!plan) return { error: "That plan doesn't exist." };

  const base =
    (parsed.data.username || parsed.data.nameEn)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "business";
  let candidate = RESERVED_USERNAMES.has(base) ? `${base}-vee` : base;
  let suffix = 0;
  while (suffix < 50) {
    if (!RESERVED_USERNAMES.has(candidate)) {
      const { data } = await supabase.from("businesses").select("id").eq("username", candidate).maybeSingle();
      if (!data) break;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      username: candidate,
      name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
      status: "draft",
      plan_id: parsed.data.planId,
    })
    .select("id")
    .single();
  if (error || !business) return { error: "Could not create the business. Please try again." };

  await supabase.from("subscriptions").insert({ business_id: business.id, plan_id: parsed.data.planId, status: "trial" });
  await supabase.from("audit_log").insert({
    actor_id: authUser.id,
    business_id: business.id,
    entity_type: "business",
    entity_id: business.id,
    action: "created_by_admin",
  });

  revalidatePath("/admin/businesses");
  redirect(`/admin/businesses/${business.id}`);
}

const setPlanSchema = z.object({ businessId: z.string().uuid(), planId: z.string().trim().min(1, "Choose a plan.") });

export async function setBusinessPlan(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = setPlanSchema.safeParse({ businessId: formData.get("businessId"), planId: formData.get("planId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const { authUser } = await requireSuperAdmin();
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("id").eq("id", parsed.data.planId).maybeSingle();
  if (!plan) return { error: "That plan doesn't exist." };

  const { data: before } = await supabase.from("businesses").select("plan_id").eq("id", parsed.data.businessId).single();

  const { error } = await supabase.from("businesses").update({ plan_id: parsed.data.planId }).eq("id", parsed.data.businessId);
  if (error) return { error: "Could not change the plan. Please try again." };

  // Keep the separate `subscriptions` record (billing status/cycle) in sync
  // with the plan businesses.plan_id now says is active -- gating code only
  // reads businesses.plan_id, but subscriptions.plan_id diverging silently
  // would make the billing side of the admin lie about what's active.
  await supabase
    .from("subscriptions")
    .upsert({ business_id: parsed.data.businessId, plan_id: parsed.data.planId, status: "active" }, { onConflict: "business_id" });

  await supabase.from("audit_log").insert({
    actor_id: authUser.id,
    business_id: parsed.data.businessId,
    entity_type: "business",
    entity_id: parsed.data.businessId,
    action: "plan_changed",
    before: { plan_id: before?.plan_id ?? null },
    after: { plan_id: parsed.data.planId },
  });

  revalidatePath("/admin/businesses");
  revalidatePath("/admin/businesses/[id]/plan", "page");
  return { success: true };
}

/**
 * Grants or removes ONE feature for ONE business, independent of its plan --
 * a thin, business-scoped wrapper around the existing generic
 * setFeatureFlagOverride/removeFeatureFlagOverride actions above (same
 * table, same precedence engine), so the Plan & Features tab under
 * Admin > Businesses and the standalone /admin/feature-flags page both write
 * through the identical, already-audited path.
 */
export async function setBusinessFeatureOverride(flagId: string, businessId: string, value: boolean): Promise<{ success: boolean; error?: string }> {
  return setFeatureFlagOverride(flagId, "business", businessId, value);
}

export async function clearBusinessFeatureOverride(overrideId: string): Promise<{ success: boolean; error?: string }> {
  return removeFeatureFlagOverride(overrideId);
}

const inviteOwnerSchema = z.object({ businessId: z.string().uuid(), email: z.string().email("Enter a valid email address.") });

/**
 * Assigns the real owner to a business Super Admin just created (or one that
 * somehow has none). Mirrors inviteStaffMember's service-role
 * auth.admin.inviteUserByEmail pattern exactly, but writes role "owner" and
 * is gated on requireSuperAdmin rather than "caller is already this
 * business's owner" -- there is no owner yet for this call to make sense
 * otherwise. Refuses if the business already has an owner, so this can't be
 * used to silently add a second one.
 */
export async function inviteBusinessOwnerAsAdmin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inviteOwnerSchema.safeParse({ businessId: formData.get("businessId"), email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: existingOwner } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", parsed.data.businessId)
    .eq("role", "owner")
    .maybeSingle();
  if (existingOwner) return { error: "This business already has an owner. Remove them first if you need to replace them." };

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (err) {
    if (err instanceof Error && err.message === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return { error: "Owner invitations aren't configured yet — this server is missing its Supabase service-role key." };
    }
    throw err;
  }
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password/confirm`,
  });
  if (inviteError || !invited.user) {
    return {
      error: inviteError?.message.includes("already been registered")
        ? "This person already has a Vee account — ask them to accept from their email, or add them as a member manually."
        : "Could not send the invitation.",
    };
  }

  const { error } = await supabase.from("business_members").insert({
    business_id: parsed.data.businessId,
    user_id: invited.user.id,
    role: "owner",
    permissions: [],
    invited_email: parsed.data.email,
  });
  if (error) return { error: "Invited, but could not attach them to this business. Please try again." };

  revalidatePath("/admin/businesses/[id]/team", "page");
  return { success: true };
}
