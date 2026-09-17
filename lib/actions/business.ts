"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessMembership, requireUser } from "@/lib/auth/dal";

export type ActionState = { error?: string; success?: boolean } | undefined;

const profileSchema = z.object({
  businessId: z.string().uuid(),
  nameEn: z.string().trim().min(2, "Business name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  categoryEn: z.string().trim().optional(),
  categoryAr: z.string().trim().optional(),
  categoryKu: z.string().trim().optional(),
  descriptionEn: z.string().trim().max(600).optional(),
  descriptionAr: z.string().trim().max(600).optional(),
  descriptionKu: z.string().trim().max(600).optional(),
  whatsappNumber: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  instagramUrl: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  googleMapsUrl: z.string().trim().optional(),
  googleReviewUrl: z.string().trim().optional(),
  orderingMode: z.enum(["menu_only", "whatsapp", "online", "table"]),
  menuLinkEnabled: z.coerce.boolean(),
});

export async function updateBusinessProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse({
    ...raw,
    menuLinkEnabled: formData.get("menuLinkEnabled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { authUser } = await requireUser();
  const membership = await requireBusinessMembership(parsed.data.businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("profile.edit"))) {
    return { error: "You don't have permission to edit the business profile." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
      category: { en: parsed.data.categoryEn ?? "", ar: parsed.data.categoryAr ?? "", ku: parsed.data.categoryKu ?? "" },
      description: { en: parsed.data.descriptionEn ?? "", ar: parsed.data.descriptionAr ?? "", ku: parsed.data.descriptionKu ?? "" },
      whatsapp_number: parsed.data.whatsappNumber || null,
      phone: parsed.data.phone || null,
      instagram_url: parsed.data.instagramUrl || null,
      website_url: parsed.data.websiteUrl || null,
      google_maps_url: parsed.data.googleMapsUrl || null,
      google_review_url: parsed.data.googleReviewUrl || null,
      ordering_mode: parsed.data.orderingMode,
      menu_link_enabled: parsed.data.menuLinkEnabled,
    })
    .eq("id", parsed.data.businessId);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  await supabase.from("audit_log").insert({
    actor_id: authUser.id,
    business_id: parsed.data.businessId,
    entity_type: "business",
    entity_id: parsed.data.businessId,
    action: "updated",
    after: parsed.data,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/${parsed.data.businessId}`);
  return { success: true };
}

export async function setBusinessStatus(businessId: string, status: "draft" | "published") {
  const membership = await requireBusinessMembership(businessId);
  if (membership.role !== "owner") {
    return { error: "Only the business owner can publish or unpublish." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ status }).eq("id", businessId);
  if (error) return { error: "Could not update publish status." };
  revalidatePath("/dashboard");
  return { success: true };
}

const uploadSchema = z.object({
  businessId: z.string().uuid(),
  field: z.enum(["logo_url", "cover_image_url"]),
});

/** Uploads a logo/cover image to the `business-media` bucket and saves the resulting URL on the business. */
export async function uploadBusinessImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = uploadSchema.safeParse({ businessId: formData.get("businessId"), field: formData.get("field") });
  if (!parsed.success) return { error: "Invalid request." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Please upload a PNG, JPEG, WEBP or GIF image." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Images must be 5MB or smaller." };
  }

  const membership = await requireBusinessMembership(parsed.data.businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("media.upload"))) {
    return { error: "You don't have permission to upload images." };
  }

  const supabase = await createClient();
  const folder = parsed.data.field === "logo_url" ? "logo" : "cover";
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${parsed.data.businessId}/${folder}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("business-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { data: publicUrl } = supabase.storage.from("business-media").getPublicUrl(path);
  const update = parsed.data.field === "logo_url" ? { logo_url: publicUrl.publicUrl } : { cover_image_url: publicUrl.publicUrl };
  const { error: updateError } = await supabase.from("businesses").update(update).eq("id", parsed.data.businessId);

  if (updateError) {
    return { error: "Uploaded, but could not save it to your profile. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}
