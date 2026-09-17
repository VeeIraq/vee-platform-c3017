"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessMembership } from "@/lib/auth/dal";
import type { ActionState } from "./business";
export type { ActionState };

async function assertCanEditProfile(businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("profile.edit"))) {
    throw new Error("You don't have permission to edit links.");
  }
}

const linkSchema = z.object({
  businessId: z.string().uuid(),
  icon: z.string().trim().min(1).default("link"),
  labelEn: z.string().trim().min(1, "Label is required."),
  labelAr: z.string().trim().optional(),
  labelKu: z.string().trim().optional(),
  url: z.string().trim().url("Enter a valid URL."),
});

export async function createProfileLink(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = linkSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  try {
    await assertCanEditProfile(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_links")
    .select("id", { count: "exact", head: true })
    .eq("business_id", parsed.data.businessId);

  const { error } = await supabase.from("profile_links").insert({
    business_id: parsed.data.businessId,
    type: "custom",
    icon: parsed.data.icon,
    label: { en: parsed.data.labelEn, ar: parsed.data.labelAr || parsed.data.labelEn, ku: parsed.data.labelKu || parsed.data.labelEn },
    url: parsed.data.url,
    enabled: true,
    sort_order: count ?? 0,
  });
  if (error) return { error: "Could not add the link." };

  revalidatePath("/dashboard/links");
  return { success: true };
}

export async function toggleProfileLink(linkId: string, businessId: string, enabled: boolean) {
  await assertCanEditProfile(businessId);
  const supabase = await createClient();
  await supabase.from("profile_links").update({ enabled }).eq("id", linkId);
  revalidatePath("/dashboard/links");
}

export async function deleteProfileLink(linkId: string, businessId: string) {
  await assertCanEditProfile(businessId);
  const supabase = await createClient();
  await supabase.from("profile_links").delete().eq("id", linkId);
  revalidatePath("/dashboard/links");
}

export async function reorderProfileLinks(businessId: string, orderedIds: string[]) {
  await assertCanEditProfile(businessId);
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("profile_links").update({ sort_order: index }).eq("id", id))
  );
  revalidatePath("/dashboard/links");
}
