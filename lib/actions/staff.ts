"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { requireBusinessMembership } from "@/lib/auth/dal";
import type { ActionState } from "./business";
export type { ActionState };

const PERMISSIONS = ["profile.edit", "menu.edit", "locations.edit", "devices.edit", "orders.view", "analytics.view", "media.upload"] as const;

const inviteSchema = z.object({
  businessId: z.string().uuid(),
  email: z.string().email("Enter a valid email address."),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

/**
 * Invites a staff member by email. Uses the service-role client ONLY for
 * `auth.admin.inviteUserByEmail` (creating an auth account for someone who
 * doesn't have one yet is an operation no anon/authenticated key can do) —
 * every other step goes through the normal RLS-governed client, and the
 * caller's ownership is verified up front, before the service-role call.
 */
export async function inviteStaffMember(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inviteSchema.safeParse({
    businessId: formData.get("businessId"),
    email: formData.get("email"),
    permissions: formData.getAll("permissions"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const membership = await requireBusinessMembership(parsed.data.businessId);
  if (membership.role !== "owner") {
    return { error: "Only the business owner can invite staff." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (err) {
    if (err instanceof Error && err.message === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return { error: "Staff invitations aren't configured yet — this server is missing its Supabase service-role key." };
    }
    throw err;
  }
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password/confirm`,
  });
  if (inviteError || !invited.user) {
    return { error: inviteError?.message.includes("already been registered") ? "This person already has a Vee account — ask them to accept from their dashboard." : "Could not send the invitation." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("business_members").insert({
    business_id: parsed.data.businessId,
    user_id: invited.user.id,
    role: "staff",
    permissions: parsed.data.permissions,
    invited_email: parsed.data.email,
  });
  if (error) return { error: "Invited, but could not attach them to this business. Please try again." };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function removeStaffMember(memberId: string, businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (membership.role !== "owner") throw new Error("Only the business owner can remove staff.");
  const supabase = await createClient();
  await supabase.from("business_members").delete().eq("id", memberId).eq("business_id", businessId);
  revalidatePath("/dashboard/settings");
}
