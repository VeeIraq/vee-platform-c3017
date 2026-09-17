"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { requireBusinessMembership } from "@/lib/auth/dal";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrCreateAnonId, hashAnonId } from "@/lib/anon-identity";
import type { ActionState } from "./business";
export type { ActionState };

const REVIEW_COOKIE = "vee_review_id";
// A visitor who already submitted for a given review page is blocked from
// submitting again for this long. Not a hard security boundary (clearing
// cookies resets it, same trade-off documented in lib/anon-identity.ts) --
// it stops the obvious repeat-click/refresh case without an account.
const RESUBMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function assertCanManageReviews(businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (!(membership.role === "owner" || membership.permissions.includes("reviews.manage"))) {
    throw new Error("You don't have permission to manage reviews.");
  }
}

/** Fetches the business's review_pages.id, creating a disabled row on first use (business_id is unique, so this is safe to call repeatedly). */
async function ensureReviewPageId(businessId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("review_pages").select("id").eq("business_id", businessId).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("review_pages")
    .insert({ business_id: businessId, enabled: false, title: {}, intro: {} })
    .select("id")
    .single();
  if (error || !created) throw new Error("Could not set up the review page.");
  return created.id;
}

// ---------------------------------------------------------------------------
// Dashboard: page config (enable/disable, title, intro)
// ---------------------------------------------------------------------------
const configSchema = z.object({
  businessId: z.string().uuid(),
  enabled: z.union([z.literal("on"), z.literal("")]).optional(),
  titleEn: z.string().trim().min(1, "English title is required."),
  titleAr: z.string().trim().optional(),
  titleKu: z.string().trim().optional(),
  introEn: z.string().trim().optional(),
  introAr: z.string().trim().optional(),
  introKu: z.string().trim().optional(),
});

export async function saveReviewPageConfig(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = configSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanManageReviews(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("review_pages").upsert(
    {
      business_id: parsed.data.businessId,
      enabled: parsed.data.enabled === "on",
      title: { en: parsed.data.titleEn, ar: parsed.data.titleAr || parsed.data.titleEn, ku: parsed.data.titleKu || parsed.data.titleEn },
      intro: {
        en: parsed.data.introEn ?? "",
        ar: parsed.data.introAr ?? parsed.data.introEn ?? "",
        ku: parsed.data.introKu ?? parsed.data.introEn ?? "",
      },
    },
    { onConflict: "business_id" }
  );
  if (error) return { error: "Could not save the review page settings." };
  revalidatePath("/dashboard/reviews");
  revalidatePath(`/${parsed.data.businessId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Dashboard: questions (create/edit/delete/reorder)
// ---------------------------------------------------------------------------
const questionSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  promptEn: z.string().trim().min(1, "English question text is required."),
  promptAr: z.string().trim().optional(),
  promptKu: z.string().trim().optional(),
});

export async function saveReviewQuestion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = questionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await assertCanManageReviews(parsed.data.businessId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const prompt = {
    en: parsed.data.promptEn,
    ar: parsed.data.promptAr || parsed.data.promptEn,
    ku: parsed.data.promptKu || parsed.data.promptEn,
  };

  if (parsed.data.id) {
    const { error } = await supabase.from("review_questions").update({ prompt }).eq("id", parsed.data.id);
    if (error) return { error: "Could not save the question." };
  } else {
    let reviewPageId: string;
    try {
      reviewPageId = await ensureReviewPageId(parsed.data.businessId);
    } catch (e) {
      return { error: (e as Error).message };
    }
    const { count } = await supabase
      .from("review_questions")
      .select("id", { count: "exact", head: true })
      .eq("review_page_id", reviewPageId);
    const { error } = await supabase
      .from("review_questions")
      .insert({ review_page_id: reviewPageId, prompt, sort_order: count ?? 0 });
    if (error) return { error: "Could not create the question." };
  }
  revalidatePath("/dashboard/reviews");
  return { success: true };
}

export async function deleteReviewQuestion(questionId: string, businessId: string) {
  await assertCanManageReviews(businessId);
  const supabase = await createClient();
  await supabase.from("review_questions").delete().eq("id", questionId);
  revalidatePath("/dashboard/reviews");
}

export async function reorderReviewQuestions(businessId: string, orderedIds: string[]) {
  await assertCanManageReviews(businessId);
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("review_questions").update({ sort_order: index }).eq("id", id))
  );
  revalidatePath("/dashboard/reviews");
}

// ---------------------------------------------------------------------------
// Dashboard: moderation
// ---------------------------------------------------------------------------
export async function setReviewSubmissionStatus(submissionId: string, businessId: string, status: "published" | "hidden") {
  await assertCanManageReviews(businessId);
  const supabase = await createClient();
  await supabase.from("review_submissions").update({ status }).eq("id", submissionId).eq("business_id", businessId);
  revalidatePath("/dashboard/reviews");
}

// ---------------------------------------------------------------------------
// Public: submit a review
// ---------------------------------------------------------------------------
export type SubmitReviewResult = { error?: string; success?: boolean } | undefined;

const submitSchema = z.object({
  businessId: z.string().uuid(),
  reviewPageId: z.string().uuid(),
  // "website" is a honeypot field: real visitors never see or fill it (it's
  // hidden off-screen in the form), so any non-empty value here means a bot
  // filled every field it could find -- reject silently as if it succeeded,
  // so the bot gets no signal to adapt to.
  website: z.string().optional(),
  comment: z.string().trim().max(2000).optional(),
});

export async function submitReview(_prevState: SubmitReviewResult, formData: FormData): Promise<SubmitReviewResult> {
  const parsed = submitSchema.safeParse({
    businessId: formData.get("businessId"),
    reviewPageId: formData.get("reviewPageId"),
    website: formData.get("website"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: "Please check the form." };

  if (parsed.data.website) {
    // Honeypot tripped -- report success so a bot has no way to tell its
    // submission was discarded rather than accepted.
    return { success: true };
  }

  const allowed = await checkRateLimit(`review-submit:${parsed.data.businessId}`, 5, 60_000);
  if (!allowed) return { error: "Too many requests. Please try again in a moment." };

  const supabase = await createClient();

  // Re-derive the live question list server-side rather than trusting
  // whatever question ids the client posted -- an enabled/published check
  // straight from the DB, mirroring getPublicReviewPage's own gate, so a
  // request crafted against a disabled or unpublished page is rejected here
  // even if it also happens to satisfy the RLS insert policy.
  const { data: page } = await supabase
    .from("review_pages")
    .select("id, enabled, business_id, businesses!inner(status)")
    .eq("id", parsed.data.reviewPageId)
    .eq("business_id", parsed.data.businessId)
    .maybeSingle();
  const pageStatus = (page as unknown as { businesses: { status: string } } | null)?.businesses?.status;
  if (!page || !page.enabled || pageStatus !== "published") return { error: "This review page isn't available." };

  const { data: questions } = await supabase
    .from("review_questions")
    .select("id")
    .eq("review_page_id", parsed.data.reviewPageId);
  const questionIds = (questions ?? []).map((q) => q.id);
  if (questionIds.length === 0) return { error: "This review page isn't available." };

  const ratings: Record<string, number> = {};
  for (const questionId of questionIds) {
    const raw = formData.get(`rating_${questionId}`);
    const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < 1 || value > 5) {
      return { error: "Please give a star rating for every question." };
    }
    ratings[questionId] = value;
  }
  const averageRating = Number(
    (Object.values(ratings).reduce((sum, v) => sum + v, 0) / Object.values(ratings).length).toFixed(2)
  );

  const anonId = await getOrCreateAnonId(REVIEW_COOKIE);
  const submitterHash = hashAnonId(anonId, `review:${parsed.data.businessId}`);

  // review_submissions has no anonymous SELECT policy at all (see
  // 0020_review_pages.sql -- it's "never publicly readable", same as
  // orders/nfc_devices), so this cooldown check -- which by definition runs
  // as an anonymous visitor -- can only be done with the service-role
  // client. This bypasses RLS for a read-only, narrowly-scoped lookup
  // (does *this* hash already have a recent row on *this* review page), not
  // for the insert itself, which still goes through the real RLS policy
  // below. If the service-role key isn't configured in this environment,
  // fail open rather than 500ing every review submission -- the rate limit
  // above and the unique-per-visitor-cookie hash still apply either way.
  try {
    const service = createServiceRoleClient();
    const { data: recent } = await service
      .from("review_submissions")
      .select("id, created_at")
      .eq("review_page_id", parsed.data.reviewPageId)
      .eq("submitter_hash", submitterHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESUBMIT_COOLDOWN_MS) {
      return { error: "You've already submitted feedback recently. Thank you!" };
    }
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY_MISSING or a transient error -- see comment above.
  }

  const { error } = await supabase.from("review_submissions").insert({
    business_id: parsed.data.businessId,
    review_page_id: parsed.data.reviewPageId,
    ratings,
    average_rating: averageRating,
    comment: parsed.data.comment || null,
    status: "published",
    submitter_hash: submitterHash,
  });
  if (error) return { error: "Could not submit your feedback. Please try again." };

  return { success: true };
}

// Re-exported for callers that only need the flag check without pulling in lib/data/reviews.ts.
export async function isCustomReviewsEnabled(businessId: string, planId: string | undefined): Promise<boolean> {
  return isFeatureEnabled("custom_reviews", { businessId, planId });
}
