"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ActionState = { success: boolean; error?: string };
type ProductRow = Database["public"]["Tables"]["catalogue_products"]["Row"];
type LocalizedText = Record<string, string>;

function localizedFromForm(formData: FormData, prefix: string): LocalizedText {
  return {
    en: String(formData.get(`${prefix}_en`) ?? "").trim(),
    ar: String(formData.get(`${prefix}_ar`) ?? "").trim(),
    ku: String(formData.get(`${prefix}_ku`) ?? "").trim(),
  };
}

function parsePriceField(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseSpecifications(raw: string): Record<string, string> {
  // One "key: value" pair per line -- simple, no-JS-required editing for a
  // field that's stored as free-form jsonb.
  const specs: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) specs[key] = value;
  }
  return specs;
}

function fieldsFromForm(formData: FormData) {
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const category = String(formData.get("category") ?? "").trim() || "nfc";
  const currency = String(formData.get("currency") ?? "IQD").trim().toUpperCase() || "IQD";
  const status = String(formData.get("status") ?? "draft") as ProductRow["status"];
  const featured = formData.get("featured") === "on";
  const colorsRaw = String(formData.get("colors") ?? "").trim();
  const colors = colorsRaw ? colorsRaw.split(",").map((c) => c.trim()).filter(Boolean) : [];

  if (!sku) return { error: "SKU is required." } as const;
  if (!localizedFromForm(formData, "name").en) return { error: "English name is required." } as const;

  return {
    fields: {
      sku,
      category,
      name: localizedFromForm(formData, "name"),
      description: localizedFromForm(formData, "description"),
      specifications: parseSpecifications(String(formData.get("specifications") ?? "")),
      price_iqd: parsePriceField(formData, "price"),
      discount_price_iqd: parsePriceField(formData, "discountPrice"),
      currency,
      status,
      featured,
      colors,
    } satisfies Partial<ProductRow>,
  } as const;
}

export async function createCatalogueProduct(_prevState: ActionState | undefined, formData: FormData): Promise<ActionState & { id?: string }> {
  await requireStaff();
  const parsed = fieldsFromForm(formData);
  if ("error" in parsed) return { success: false, error: parsed.error };

  const supabase = await createClient();
  const { data: maxRow } = await supabase.from("catalogue_products").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("catalogue_products")
    .insert({ ...parsed.fields, images: [], sort_order })
    .select("id")
    .single();

  if (error) {
    const message = error.code === "23505" ? "A product with that SKU already exists." : "Couldn't create the product.";
    return { success: false, error: message };
  }

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true, id: data.id };
}

export async function updateCatalogueProduct(productId: string, _prevState: ActionState | undefined, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = fieldsFromForm(formData);
  if ("error" in parsed) return { success: false, error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("catalogue_products").update(parsed.fields).eq("id", productId);
  if (error) {
    const message = error.code === "23505" ? "A product with that SKU already exists." : "Couldn't save the product.";
    return { success: false, error: message };
  }

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  revalidatePath(`/products/${parsed.fields.sku?.toLowerCase()}`);
  return { success: true };
}

export async function deleteCatalogueProduct(productId: string): Promise<ActionState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("catalogue_products").delete().eq("id", productId);
  if (error) return { success: false, error: "Couldn't delete the product." };
  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true };
}

export async function moveCatalogueProduct(productId: string, direction: "up" | "down"): Promise<ActionState> {
  await requireStaff();
  const supabase = await createClient();
  const { data: products } = await supabase.from("catalogue_products").select("id, sort_order").order("sort_order");
  if (!products) return { success: false, error: "Couldn't load products." };

  const index = products.findIndex((p) => p.id === productId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= products.length) return { success: true };

  const a = products[index];
  const b = products[swapWith];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("catalogue_products").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabase.from("catalogue_products").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  if (e1 || e2) return { success: false, error: "Couldn't reorder." };

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true };
}

export async function uploadCatalogueProductImage(_prevState: ActionState | undefined, formData: FormData): Promise<ActionState & { url?: string }> {
  await requireStaff();
  const productId = formData.get("productId");
  const file = formData.get("file");
  if (typeof productId !== "string") return { success: false, error: "Invalid request." };
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Choose an image file." };
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return { success: false, error: "Please upload a PNG, JPEG, WEBP or GIF image." };
  }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: "Images must be 5MB or smaller." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `catalogue/${productId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("platform-media").upload(path, file, { contentType: file.type });
  if (uploadError) return { success: false, error: "Upload failed. Please try again." };

  const { data: publicUrl } = supabase.storage.from("platform-media").getPublicUrl(path);
  const { data: product } = await supabase.from("catalogue_products").select("images").eq("id", productId).single();
  const images = [...((product?.images as string[] | undefined) ?? []), publicUrl.publicUrl];
  const { error } = await supabase.from("catalogue_products").update({ images }).eq("id", productId);
  if (error) return { success: false, error: "Uploaded, but couldn't attach it to the product." };

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true, url: publicUrl.publicUrl };
}

export async function removeCatalogueProductImage(productId: string, imageUrl: string): Promise<ActionState> {
  await requireStaff();
  const supabase = await createClient();
  const { data: product } = await supabase.from("catalogue_products").select("images").eq("id", productId).single();
  const images = ((product?.images as string[] | undefined) ?? []).filter((u) => u !== imageUrl);
  const { error } = await supabase.from("catalogue_products").update({ images }).eq("id", productId);
  if (error) return { success: false, error: "Couldn't remove the image." };

  // Best-effort storage cleanup -- the product record is already updated
  // either way, so a failure here doesn't need to surface to the user.
  const path = imageUrl.split("/platform-media/")[1];
  if (path) await supabase.storage.from("platform-media").remove([path]);

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true };
}

export async function setCatalogueProductMainImage(productId: string, imageUrl: string): Promise<ActionState> {
  await requireStaff();
  const supabase = await createClient();
  const { data: product } = await supabase.from("catalogue_products").select("images").eq("id", productId).single();
  const images = (product?.images as string[] | undefined) ?? [];
  const reordered = [imageUrl, ...images.filter((u) => u !== imageUrl)];
  const { error } = await supabase.from("catalogue_products").update({ images: reordered }).eq("id", productId);
  if (error) return { success: false, error: "Couldn't update the main image." };

  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return { success: true };
}
