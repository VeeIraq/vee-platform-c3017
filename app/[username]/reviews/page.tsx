import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { dir } from "@/lib/i18n/config";
import { getPublishedBusinessByUsername, logAnalyticsEvent } from "@/lib/data/public";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getPublicReviewPage } from "@/lib/data/reviews";
import { ReviewForm } from "./review-form";

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await params;
  const { locale } = await getServerDictionary();
  const business = await getPublishedBusinessByUsername(username);
  if (!business) return {};
  const reviewPage = await getPublicReviewPage(business.id);
  if (!reviewPage) return {};
  return { title: `${pick(reviewPage.title, locale)} — ${pick(business.name, locale)}` };
}

export default async function BusinessReviewsPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, `reviewPage.${path}`);
  const business = await getPublishedBusinessByUsername(username);
  if (!business) notFound();

  const flagOn = await isFeatureEnabled("custom_reviews", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!flagOn) notFound();

  const reviewPage = await getPublicReviewPage(business.id);
  if (!reviewPage) notFound();

  await logAnalyticsEvent(business.id, "review_page_view", { locale });

  return (
    <div dir={dir(locale)} className="min-h-screen bg-paper">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Link href={`/${username}`} className="text-sm font-semibold text-accent hover:underline">
            ← {tt("backToProfile")}
          </Link>
          <h1 className="mt-1 text-xl font-extrabold text-ink">{pick(reviewPage.title, locale)}</h1>
          {pick(reviewPage.intro, locale) && <p className="mt-2 text-sm text-ink-muted">{pick(reviewPage.intro, locale)}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <ReviewForm
          businessId={business.id}
          reviewPageId={reviewPage.id}
          questions={reviewPage.questions.map((q) => ({ id: q.id, prompt: pick(q.prompt, locale) }))}
          dict={dict}
        />
      </main>
    </div>
  );
}
