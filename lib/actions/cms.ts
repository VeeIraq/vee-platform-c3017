"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean } | undefined;

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/admin/nav");
  revalidatePath("/admin/translations");
  revalidatePath("/admin/pricing");
}

// ---------------------------------------------------------------------------
// Homepage sections (site_content, type='section') — show/hide + reorder
// ---------------------------------------------------------------------------

export async function toggleSectionVisibility(key: string, visible: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("site_content").update({ visible }).eq("key", key);
  revalidateSite();
}

export async function reorderSections(orderedKeys: string[]) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await Promise.all(
    orderedKeys.map((key, index) => supabase.from("site_content").update({ sort_order: index }).eq("key", key))
  );
  revalidateSite();
}

// ---------------------------------------------------------------------------
// FAQ items (site_content, type='faq')
// ---------------------------------------------------------------------------

const faqSchema = z.object({
  key: z.string().trim().min(1).optional(), // present when editing; absent when creating
  qEn: z.string().trim().min(1, "English question is required."),
  qAr: z.string().trim().optional(),
  qKu: z.string().trim().optional(),
  aEn: z.string().trim().min(1, "English answer is required."),
  aAr: z.string().trim().optional(),
  aKu: z.string().trim().optional(),
});

export async function saveFaqItem(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = faqSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const content = {
    q: { en: parsed.data.qEn, ar: parsed.data.qAr || parsed.data.qEn, ku: parsed.data.qKu || parsed.data.qEn },
    a: { en: parsed.data.aEn, ar: parsed.data.aAr || parsed.data.aEn, ku: parsed.data.aKu || parsed.data.aEn },
  };

  if (parsed.data.key) {
    const { error } = await supabase.from("site_content").update({ content }).eq("key", parsed.data.key);
    if (error) return { error: "Could not save the FAQ item." };
  } else {
    const { count } = await supabase
      .from("site_content")
      .select("id", { count: "exact", head: true })
      .eq("type", "faq");
    const key = `faq.item.${Date.now()}`;
    const { error } = await supabase
      .from("site_content")
      .insert({ key, type: "faq", content, visible: true, sort_order: count ?? 0 });
    if (error) return { error: "Could not create the FAQ item." };
  }
  revalidateSite();
  return { success: true };
}

export async function toggleFaqVisibility(key: string, visible: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("site_content").update({ visible }).eq("key", key);
  revalidateSite();
}

export async function deleteFaqItem(key: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("site_content").delete().eq("key", key);
  revalidateSite();
}

export async function reorderFaqItems(orderedKeys: string[]) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await Promise.all(
    orderedKeys.map((key, index) => supabase.from("site_content").update({ sort_order: index }).eq("key", key))
  );
  revalidateSite();
}

// ---------------------------------------------------------------------------
// Homepage SEO (site_content, type='page', key='seo.home')
// ---------------------------------------------------------------------------

const seoSchema = z.object({
  titleEn: z.string().trim().min(1, "English SEO title is required."),
  titleAr: z.string().trim().optional(),
  titleKu: z.string().trim().optional(),
  descriptionEn: z.string().trim().min(1, "English SEO description is required."),
  descriptionAr: z.string().trim().optional(),
  descriptionKu: z.string().trim().optional(),
});

export async function saveHomepageSeo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = seoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const content = {
    title: { en: parsed.data.titleEn, ar: parsed.data.titleAr || parsed.data.titleEn, ku: parsed.data.titleKu || parsed.data.titleEn },
    description: {
      en: parsed.data.descriptionEn,
      ar: parsed.data.descriptionAr || parsed.data.descriptionEn,
      ku: parsed.data.descriptionKu || parsed.data.descriptionEn,
    },
  };
  const { error } = await supabase
    .from("site_content")
    .upsert({ key: "seo.home", type: "page", content, visible: true }, { onConflict: "key" });
  if (error) return { error: "Could not save SEO settings." };
  revalidateSite();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Navigation items (nav_menu_items)
// ---------------------------------------------------------------------------

const navSchema = z.object({
  id: z.string().uuid().optional(),
  labelEn: z.string().trim().min(1, "English label is required."),
  labelAr: z.string().trim().optional(),
  labelKu: z.string().trim().optional(),
  url: z.string().trim().min(1, "URL is required."),
  icon: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  location: z.enum(["header", "footer"]),
  footerGroup: z.enum(["solutions", "company", "legal", ""]).optional(),
  openNewTab: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveNavItem(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = navSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if (parsed.data.location === "footer" && !parsed.data.footerGroup) {
    return { error: "Choose a footer group for a footer link." };
  }

  const supabase = await createClient();
  const row = {
    label: { en: parsed.data.labelEn, ar: parsed.data.labelAr || parsed.data.labelEn, ku: parsed.data.labelKu || parsed.data.labelEn },
    url: parsed.data.url,
    icon: parsed.data.icon || null,
    image_url: parsed.data.imageUrl || null,
    location: parsed.data.location,
    footer_group: parsed.data.location === "footer" ? parsed.data.footerGroup || null : null,
    open_new_tab: parsed.data.openNewTab === "on",
  };

  if (parsed.data.id) {
    const { error } = await supabase.from("nav_menu_items").update(row).eq("id", parsed.data.id);
    if (error) return { error: "Could not save the navigation item." };
  } else {
    const { count } = await supabase
      .from("nav_menu_items")
      .select("id", { count: "exact", head: true })
      .eq("location", parsed.data.location);
    const { error } = await supabase.from("nav_menu_items").insert({ ...row, visible: true, sort_order: count ?? 0 });
    if (error) {
      if (error.code === "23505") return { error: "An identical navigation item already exists." };
      return { error: "Could not create the navigation item." };
    }
  }
  revalidateSite();
  return { success: true };
}

export async function toggleNavVisibility(id: string, visible: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("nav_menu_items").update({ visible }).eq("id", id);
  revalidateSite();
}

export async function deleteNavItem(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("nav_menu_items").delete().eq("id", id);
  revalidateSite();
}

export async function reorderNavItems(orderedIds: string[]) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("nav_menu_items").update({ sort_order: index }).eq("id", id))
  );
  revalidateSite();
}

// ---------------------------------------------------------------------------
// Platform image upload (nav icons, hero/section images, SEO images, etc.)
// Writes to the staff-only-write, publicly-readable `platform-media` bucket.
// ---------------------------------------------------------------------------

export async function uploadPlatformImage(_prevState: ActionState, formData: FormData): Promise<ActionState & { url?: string }> {
  await requireSuperAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (!["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(file.type)) {
    return { error: "Please upload a PNG, JPEG, WEBP, GIF or SVG image." };
  }
  if (file.size > 5 * 1024 * 1024) return { error: "Images must be 5MB or smaller." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `cms/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("platform-media").upload(path, file, { contentType: file.type });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrl } = supabase.storage.from("platform-media").getPublicUrl(path);
  revalidateSite();
  return { success: true, url: publicUrl.publicUrl };
}

// ---------------------------------------------------------------------------
// Translation overrides (translation_overrides)
// ---------------------------------------------------------------------------

const overrideSchema = z.object({
  namespace: z.string().trim().min(1, "Namespace is required (e.g. \"nav\")."),
  key: z.string().trim().min(1, "Key is required (e.g. \"home\")."),
  locale: z.enum(["en", "ar", "ku"]),
  value: z.string().trim().min(1, "Value is required."),
});

export async function saveTranslationOverride(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = overrideSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("translation_overrides")
    .upsert(parsed.data, { onConflict: "namespace,key,locale" });
  if (error) return { error: "Could not save the override." };
  revalidateSite();
  return { success: true };
}

export async function deleteTranslationOverride(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("translation_overrides").delete().eq("id", id);
  revalidateSite();
}

// ---------------------------------------------------------------------------
// Plans / pricing
// ---------------------------------------------------------------------------

const planSchema = z.object({
  id: z.string().trim().min(1),
  nameEn: z.string().trim().min(1, "English name is required."),
  nameAr: z.string().trim().optional(),
  nameKu: z.string().trim().optional(),
  taglineEn: z.string().trim().optional(),
  taglineAr: z.string().trim().optional(),
  taglineKu: z.string().trim().optional(),
  ctaEn: z.string().trim().min(1, "English button text is required."),
  ctaAr: z.string().trim().optional(),
  ctaKu: z.string().trim().optional(),
  priceIqd: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  setupPriceIqd: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  popular: z.union([z.literal("on"), z.literal("")]).optional(),
  featuresEn: z.string().trim().optional(), // one feature per line
  featuresAr: z.string().trim().optional(),
  featuresKu: z.string().trim().optional(),
  active: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function savePlan(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = planSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const linesEn = (parsed.data.featuresEn ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const linesAr = (parsed.data.featuresAr ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const linesKu = (parsed.data.featuresKu ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const features = linesEn.map((en, i) => ({ en, ar: linesAr[i] || en, ku: linesKu[i] || en }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({
      name: { en: parsed.data.nameEn, ar: parsed.data.nameAr || parsed.data.nameEn, ku: parsed.data.nameKu || parsed.data.nameEn },
      tagline: {
        en: parsed.data.taglineEn || "",
        ar: parsed.data.taglineAr || parsed.data.taglineEn || "",
        ku: parsed.data.taglineKu || parsed.data.taglineEn || "",
      },
      cta: { en: parsed.data.ctaEn, ar: parsed.data.ctaAr || parsed.data.ctaEn, ku: parsed.data.ctaKu || parsed.data.ctaEn },
      price_iqd: parsed.data.priceIqd === "" || parsed.data.priceIqd === undefined ? null : parsed.data.priceIqd,
      setup_price_iqd: parsed.data.setupPriceIqd === "" || parsed.data.setupPriceIqd === undefined ? null : parsed.data.setupPriceIqd,
      popular: parsed.data.popular === "on",
      features,
      active: parsed.data.active === "on",
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "Could not save the plan." };
  revalidateSite();
  return { success: true };
}

const newPlanSchema = z.object({
  id: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "A plan ID is required.")
    .regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers and underscores, starting with a letter — e.g. vee_enterprise."),
  nameEn: z.string().trim().min(1, "English name is required."),
});

/**
 * Adds a new row to `plans` with just an id + English name -- everything
 * else (pricing, features, tagline, CTA text, active/popular) is then
 * filled in via the same PlanForm/savePlan every other plan uses, so this
 * is deliberately the smallest possible form. See PlanForm/savePlan above
 * for why plans could only be *edited*, never added, before this.
 */
export async function createPlan(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = newPlanSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { count } = await supabase.from("plans").select("id", { count: "exact", head: true });
  const { error } = await supabase.from("plans").insert({
    id: parsed.data.id,
    name: { en: parsed.data.nameEn, ar: parsed.data.nameEn, ku: parsed.data.nameEn },
    tagline: { en: "", ar: "", ku: "" },
    cta: { en: "Get started", ar: "Get started", ku: "Get started" },
    features: [],
    sort_order: count ?? 0,
    active: false, // starts hidden -- fill in pricing/features below, then check "Active" to publish it
  });
  if (error) {
    return { error: error.code === "23505" ? `A plan with ID "${parsed.data.id}" already exists.` : "Could not create the plan." };
  }
  revalidateSite();
  return { success: true };
}

/**
 * Blocked by the plans.id foreign key (businesses.plan_id, subscriptions.plan_id
 * both `references plans(id)` with no ON DELETE clause, i.e. RESTRICT) whenever
 * a business is still on this plan -- Postgres raises 23503, which we turn
 * into a message telling Super Admin to reassign those businesses first,
 * rather than a raw constraint error.
 */
export async function deletePlan(planId: string): Promise<ActionState> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "This plan is still assigned to at least one business — move them to a different plan first."
          : "Could not delete the plan.",
    };
  }
  revalidateSite();
  return { success: true };
}
