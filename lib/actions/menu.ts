"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessMembership } from "@/lib/auth/dal";
import type { ActionState } from "./business";
export type { ActionState };

async function assertCanEditMenu(businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("menu.edit"))) {
    throw new Error("You don't have permission to edit the menu.");
  }
}

// Image uploads are gated by their own "media.upload" permission (see
// staff-manager.tsx), matching the storage.objects RLS policy on the
// business-media bucket (0005_storage.sql), which checks media.upload --
// not menu.edit. A staff member can be granted one without the other, so
// this must be checked separately from assertCanEditMenu: otherwise someone
// with menu.edit but not media.upload passes this check yet has their
// upload silently rejected by RLS, and someone with only media.upload
// (exactly the permission meant for this) gets turned away here first.
async function assertCanUploadMenuMedia(businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("media.upload"))) {
    throw new Error("You don't have permission to upload images.");
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const categorySchema = z.object({
  businessId: z.string().uuid(),
  nameEn: z.string().trim().min(1, "Category name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  icon: z.string().trim().default("grid"),
});

export async function createMenuCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanEditMenu(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("business_id", parsed.data.businessId);

  const { error } = await supabase.from("menu_categories").insert({
    business_id: parsed.data.businessId,
    name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
    icon: parsed.data.icon,
    visible: true,
    sort_order: count ?? 0,
  });
  if (error) return { error: "Could not create the category." };
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function toggleMenuCategory(categoryId: string, businessId: string, visible: boolean) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("menu_categories").update({ visible }).eq("id", categoryId);
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuCategory(categoryId: string, businessId: string) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("menu_categories").delete().eq("id", categoryId);
  revalidatePath("/dashboard/menu");
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
const itemSchema = z.object({
  businessId: z.string().uuid(),
  categoryId: z.string().uuid(),
  nameEn: z.string().trim().min(1, "Item name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  descriptionKu: z.string().trim().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more."),
  discountPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  tags: z.string().optional(), // comma-separated: popular,new,featured
  labelIds: z.array(z.string().uuid()).optional(),
});

export async function createMenuItem(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = itemSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    // FormData collapses repeated keys to the last value under
    // Object.fromEntries -- getAll() is required to keep every checked
    // "labelIds" checkbox rather than silently dropping all but one.
    labelIds: formData.getAll("labelIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanEditMenu(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", parsed.data.categoryId);

  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is "popular" | "new" | "featured" => ["popular", "new", "featured"].includes(s));

  const { data: created, error } = await supabase
    .from("menu_items")
    .insert({
      business_id: parsed.data.businessId,
      category_id: parsed.data.categoryId,
      name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
      description: {
        en: parsed.data.descriptionEn ?? "",
        ar: parsed.data.descriptionAr ?? "",
        ku: parsed.data.descriptionKu ?? "",
      },
      price: parsed.data.price,
      discount_price: parsed.data.discountPrice === "" || parsed.data.discountPrice === undefined ? null : parsed.data.discountPrice,
      tags,
      available: true,
      visible: true,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();
  if (error || !created) return { error: "Could not create the item." };

  if (parsed.data.labelIds && parsed.data.labelIds.length > 0) {
    // Best-effort: an invalid/stale label id here would fail the whole
    // insert on the FK constraint, but the item itself is already created
    // successfully above, so a label-link failure is reported as a softer
    // partial-success message rather than losing the new item.
    const { error: labelError } = await supabase
      .from("menu_item_label_links")
      .insert(parsed.data.labelIds.map((labelId) => ({ menu_item_id: created.id, label_id: labelId })));
    if (labelError) {
      revalidatePath("/dashboard/menu");
      return { error: "Item added, but its labels couldn't be saved. Edit the item to add them." };
    }
  }

  revalidatePath("/dashboard/menu");
  return { success: true };
}

const labelsUpdateSchema = z.object({
  itemId: z.string().uuid(),
  businessId: z.string().uuid(),
  labelIds: z.array(z.string().uuid()),
});

/**
 * Replaces the full set of labels on one item -- used by the inline label
 * editor on the existing item row (there is no general "edit item" form in
 * this dashboard yet; labels are editable both at creation, via ItemForm
 * above, and afterward, via this action, matching how availability/
 * visibility are already toggled inline rather than through a full edit
 * form).
 */
export async function setMenuItemLabels(itemId: string, businessId: string, labelIds: string[]): Promise<ActionState> {
  const parsed = labelsUpdateSchema.safeParse({ itemId, businessId, labelIds });
  if (!parsed.success) return { error: "Invalid request." };
  try {
    await assertCanEditMenu(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error: deleteError } = await supabase.from("menu_item_label_links").delete().eq("menu_item_id", parsed.data.itemId);
  if (deleteError) return { error: "Could not update labels." };

  if (parsed.data.labelIds.length > 0) {
    const { error: insertError } = await supabase
      .from("menu_item_label_links")
      .insert(parsed.data.labelIds.map((labelId) => ({ menu_item_id: parsed.data.itemId, label_id: labelId })));
    if (insertError) return { error: "Could not update labels." };
  }

  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function toggleMenuItemAvailability(itemId: string, businessId: string, available: boolean) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("menu_items").update({ available }).eq("id", itemId);
  revalidatePath("/dashboard/menu");
}

export async function toggleMenuItemVisibility(itemId: string, businessId: string, visible: boolean) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("menu_items").update({ visible }).eq("id", itemId);
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(itemId: string, businessId: string) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("menu_items").delete().eq("id", itemId);
  revalidatePath("/dashboard/menu");
}

// ---------------------------------------------------------------------------
// Product options (sizes, required choices, optional add-ons)
// ---------------------------------------------------------------------------
// A product_options row is one option *group* on a menu item (e.g. "Size",
// "Extras"). Its individual choices (e.g. "Large", "Extra cheese", each with
// its own price difference) live as a jsonb array on that same row -- there
// is no separate choices table -- so adding/removing a choice is a
// read-modify-write of that array rather than an insert/delete on a child
// table.
type OptionChoiceRow = { id: string; name: { en: string; ar: string; ku: string }; priceDelta: number };

const optionSchema = z.object({
  businessId: z.string().uuid(),
  itemId: z.string().uuid(),
  nameEn: z.string().trim().min(1, "Option name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  type: z.enum(["single", "multi"]),
});

export async function createProductOption(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = optionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanEditMenu(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("product_options")
    .select("id", { count: "exact", head: true })
    .eq("menu_item_id", parsed.data.itemId);

  const { error } = await supabase.from("product_options").insert({
    menu_item_id: parsed.data.itemId,
    type: parsed.data.type,
    name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
    choices: [],
    sort_order: count ?? 0,
  });
  if (error) return { error: "Could not create the option group." };
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function deleteProductOption(optionId: string, businessId: string) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  await supabase.from("product_options").delete().eq("id", optionId);
  revalidatePath("/dashboard/menu");
}

const choiceSchema = z.object({
  businessId: z.string().uuid(),
  optionId: z.string().uuid(),
  nameEn: z.string().trim().min(1, "Choice name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  priceDelta: z.coerce.number().default(0),
});

export async function addOptionChoice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = choiceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanEditMenu(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { data: option, error: fetchError } = await supabase
    .from("product_options")
    .select("choices")
    .eq("id", parsed.data.optionId)
    .single();
  if (fetchError || !option) return { error: "Option group not found." };

  const choices = (Array.isArray(option.choices) ? option.choices : []) as unknown as OptionChoiceRow[];
  const newChoice: OptionChoiceRow = {
    id: crypto.randomUUID(),
    name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
    priceDelta: parsed.data.priceDelta,
  };
  const { error } = await supabase
    .from("product_options")
    .update({ choices: [...choices, newChoice] })
    .eq("id", parsed.data.optionId);
  if (error) return { error: "Could not add the choice." };
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function removeOptionChoice(optionId: string, choiceId: string, businessId: string) {
  await assertCanEditMenu(businessId);
  const supabase = await createClient();
  const { data: option } = await supabase.from("product_options").select("choices").eq("id", optionId).single();
  if (!option) return;
  const choices = (Array.isArray(option.choices) ? option.choices : []) as unknown as OptionChoiceRow[];
  const next = choices.filter((c) => c.id !== choiceId);
  await supabase.from("product_options").update({ choices: next }).eq("id", optionId);
  revalidatePath("/dashboard/menu");
}

// ---------------------------------------------------------------------------
// Likes (menu_likes feature) -- business owner's own on/off switch, see
// supabase/migrations/0018_menu_likes.sql. Only the "profile.edit"
// permission (the same one that gates the rest of the business's public
// profile presentation) is required, not "menu.edit" -- turning likes on or
// off changes what's *shown* on the public page, it isn't a menu content
// edit, so it's checked the same way menuLinkEnabled is in
// lib/actions/business.ts.
// ---------------------------------------------------------------------------
export async function setMenuLikesEnabled(businessId: string, enabled: boolean): Promise<ActionState> {
  const membership = await requireBusinessMembership(businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("profile.edit"))) {
    return { error: "You don't have permission to change this setting." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ likes_enabled: enabled }).eq("id", businessId);
  if (error) return { error: "Could not save this setting." };
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function uploadMenuItemImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const businessId = formData.get("businessId");
  const itemId = formData.get("itemId");
  const file = formData.get("file");
  if (typeof businessId !== "string" || typeof itemId !== "string") return { error: "Invalid request." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return { error: "Please upload a PNG, JPEG, WEBP or GIF image." };
  }
  if (file.size > 5 * 1024 * 1024) return { error: "Images must be 5MB or smaller." };

  try {
    await assertCanUploadMenuMedia(businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${businessId}/menu/${itemId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("business-media").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrl } = supabase.storage.from("business-media").getPublicUrl(path);
  const { error } = await supabase.from("menu_items").update({ image_url: publicUrl.publicUrl }).eq("id", itemId);
  if (error) return { error: "Uploaded, but could not attach it to the item." };

  revalidatePath("/dashboard/menu");
  return { success: true };
}
