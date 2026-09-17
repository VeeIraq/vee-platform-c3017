import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export type ReviewQuestion = { id: string; prompt: Record<Locale, string>; sortOrder: number };
export type ReviewPage = {
  id: string;
  businessId: string;
  enabled: boolean;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  questions: ReviewQuestion[];
};

function toLocalized(value: unknown): Record<Locale, string> {
  const v = (value as Partial<Record<Locale, string>>) ?? {};
  return { en: v.en ?? "", ar: v.ar ?? v.en ?? "", ku: v.ku ?? v.en ?? "" };
}

/** For the dashboard config screen: returns the page even when disabled, or null if never configured yet. */
export async function getReviewPageForBusiness(businessId: string): Promise<ReviewPage | null> {
  const supabase = await createClient();
  const { data: page } = await supabase.from("review_pages").select("*").eq("business_id", businessId).maybeSingle();
  if (!page) return null;
  const { data: questions } = await supabase
    .from("review_questions")
    .select("*")
    .eq("review_page_id", page.id)
    .order("sort_order");
  return {
    id: page.id,
    businessId: page.business_id,
    enabled: page.enabled,
    title: toLocalized(page.title),
    intro: toLocalized(page.intro),
    questions: (questions ?? []).map((q) => ({ id: q.id, prompt: toLocalized(q.prompt), sortOrder: q.sort_order })),
  };
}

/** For the public page: only ever returns a page that is actually enabled (relies on RLS as the real gate; this is the defense-in-depth application-layer check). */
export async function getPublicReviewPage(businessId: string): Promise<ReviewPage | null> {
  const page = await getReviewPageForBusiness(businessId);
  if (!page || !page.enabled || page.questions.length === 0) return null;
  return page;
}

export type ReviewResults = {
  totalCount: number;
  overallAverage: number | null;
  questionAverages: { questionId: string; average: number | null; count: number }[];
  submissions: { id: string; ratings: Record<string, number>; averageRating: number; comment: string | null; status: string; createdAt: string }[];
};

/** Owner/staff-only aggregate view -- review_submissions has no public SELECT policy at all. */
export async function getReviewResults(reviewPageId: string, questionIds: string[]): Promise<ReviewResults> {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("review_submissions")
    .select("*")
    .eq("review_page_id", reviewPageId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = submissions ?? [];
  const published = rows.filter((r) => r.status === "published");
  const overallAverage = published.length > 0 ? published.reduce((sum, r) => sum + Number(r.average_rating), 0) / published.length : null;

  const questionAverages = questionIds.map((questionId) => {
    const values = published
      .map((r) => (r.ratings as Record<string, number>)?.[questionId])
      .filter((v): v is number => typeof v === "number");
    return {
      questionId,
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
      count: values.length,
    };
  });

  return {
    totalCount: rows.length,
    overallAverage,
    questionAverages,
    submissions: rows.map((r) => ({
      id: r.id,
      ratings: r.ratings as Record<string, number>,
      averageRating: Number(r.average_rating),
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
    })),
  };
}
