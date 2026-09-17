import { getActiveBusiness } from "@/lib/data/dashboard";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getReviewPageForBusiness, getReviewResults } from "@/lib/data/reviews";
import { ReviewPageForm } from "./review-page-form";
import { QuestionList } from "./question-list";
import { ReviewResultsPanel } from "./results";

export default async function DashboardReviewsPage() {
  const { business, membership } = await getActiveBusiness();
  const canManage = membership.role === "owner" || membership.permissions.includes("reviews.manage");

  const flagOn = await isFeatureEnabled("custom_reviews", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!flagOn) {
    return (
      <div>
        <h1 className="mb-1 text-2xl font-extrabold text-ink">Reviews</h1>
        <p className="text-sm text-ink-muted">This feature isn&apos;t enabled for your account yet. Contact Vee support to turn it on.</p>
      </div>
    );
  }

  const page = await getReviewPageForBusiness(business.id);
  const results = page ? await getReviewResults(page.id, page.questions.map((q) => q.id)) : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold text-ink">Reviews</h1>
        <p className="text-sm text-ink-muted">
          Collect star-rating feedback directly on your Vee profile, separate from Google Reviews.
        </p>
      </div>

      <ReviewPageForm businessId={business.id} page={page} canManage={canManage} />

      <QuestionList businessId={business.id} questions={page?.questions ?? []} canManage={canManage} />

      {page && results && (
        <ReviewResultsPanel businessId={business.id} results={results} questions={page.questions} canManage={canManage} />
      )}
    </div>
  );
}
