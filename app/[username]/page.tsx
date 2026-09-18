import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { getPublishedBusinessByUsername, getBusinessLinks, logAnalyticsEvent } from "@/lib/data/public";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getPublicReviewPage } from "@/lib/data/reviews";
import { dir } from "@/lib/i18n/config";
import { getThemeStyle } from "@/lib/theme-presets";
import type { ProfileSectionKey } from "@/lib/actions/business";
import { ProfileLinkList } from "./profile-link-list";

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await params;
  const { locale } = await getServerDictionary();
  const business = await getPublishedBusinessByUsername(username);
  if (!business) return {};
  const name = pick(business.name, locale);
  return {
    title: name,
    description: pick(business.description, locale),
    openGraph: { title: name, images: business.cover_image_url ? [business.cover_image_url] : undefined },
  };
}

export default async function BusinessProfilePage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);
  const business = await getPublishedBusinessByUsername(username);
  if (!business) notFound();

  // Platform-wide kill switch: if Super Admin has turned public profiles
  // off entirely, every /:username page disappears (404) rather than
  // staying reachable with a half-working UI.
  const profilesFeatureOn = await isFeatureEnabled("public_profiles", {
    businessId: business.id,
    planId: business.plan_id ?? undefined,
  });
  if (!profilesFeatureOn) notFound();

  const links = await getBusinessLinks(business.id);
  await logAnalyticsEvent(business.id, "profile_view", { locale });

  const [menuFeatureOn, reservationsFeatureOn, reviewsFeatureOn, customLinksFeatureOn, offersFeatureOn, customReviewsFeatureOn] =
    await Promise.all([
      isFeatureEnabled("digital_menus", { businessId: business.id, planId: business.plan_id ?? undefined }),
      isFeatureEnabled("reservations", { businessId: business.id, planId: business.plan_id ?? undefined }),
      isFeatureEnabled("google_reviews", { businessId: business.id, planId: business.plan_id ?? undefined }),
      isFeatureEnabled("custom_links", { businessId: business.id, planId: business.plan_id ?? undefined }),
      isFeatureEnabled("offers_promotions", { businessId: business.id, planId: business.plan_id ?? undefined }),
      isFeatureEnabled("custom_reviews", { businessId: business.id, planId: business.plan_id ?? undefined }),
    ]);
  // getPublicReviewPage already checks review_pages.enabled AND that at
  // least one question exists -- an enabled page with zero questions would
  // otherwise 404 if a visitor followed this link, so it's deliberately
  // excluded from the profile here too rather than just gated on `enabled`.
  const customReviewPage = customReviewsFeatureOn ? await getPublicReviewPage(business.id) : null;

  // Owner-controlled show/hide, independent of (and always narrower than)
  // the plan-level feature flags above -- see lib/actions/business.ts's
  // updateBusinessAppearance and 0022_business_appearance.sql. Missing keys
  // (e.g. a business saved before a given section existed) default to shown.
  const sections = (business.profile_sections ?? {}) as Partial<Record<ProfileSectionKey, boolean>>;
  const sectionOn = (key: ProfileSectionKey) => sections[key] ?? true;

  const fixedLinks: { icon: string; label: string; url: string }[] = [];
  if (business.whatsapp_number && sectionOn("whatsapp")) {
    fixedLinks.push({ icon: "whatsapp", label: "WhatsApp", url: `https://wa.me/${business.whatsapp_number.replace(/\D/g, "")}` });
  }
  if (business.instagram_url && sectionOn("instagram")) fixedLinks.push({ icon: "instagram", label: "Instagram", url: business.instagram_url });
  if (business.google_maps_url && sectionOn("maps")) fixedLinks.push({ icon: "maps", label: "Maps", url: business.google_maps_url });
  if (reviewsFeatureOn && business.google_review_url && sectionOn("reviews")) {
    fixedLinks.push({ icon: "reviews", label: "Google Reviews", url: business.google_review_url });
  }
  if (business.phone && sectionOn("call")) fixedLinks.push({ icon: "call", label: "Call", url: `tel:${business.phone}` });
  if (business.website_url && sectionOn("website")) fixedLinks.push({ icon: "website", label: "Website", url: business.website_url });
  if (reservationsFeatureOn && business.reservation_enabled && business.reservation_url && sectionOn("reservation")) {
    fixedLinks.push({ icon: "reservation", label: "Reserve", url: business.reservation_url });
  }
  if (customReviewPage && sectionOn("customReview")) {
    fixedLinks.push({ icon: "customReview", label: tt("profile.rateUs"), url: `/${username}/reviews` });
  }
  const showMenuLink = menuFeatureOn && business.menu_link_enabled && sectionOn("menu");
  const customLinks = customLinksFeatureOn && sectionOn("customLinks") ? links : [];

  return (
    <div dir={dir(locale)} className="min-h-screen bg-fog pb-16" style={getThemeStyle(business.theme_preset)}>
      <div className="mx-auto max-w-md px-4 pt-8 sm:px-0">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper text-center">
          {business.cover_image_url ? (
            <div className="h-28 w-full">
              <Image src={business.cover_image_url} alt="" width={480} height={160} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-16 w-full [background:var(--accent-grad)]" aria-hidden="true" />
          )}
          <div className="px-6 pb-6">
            <div className="-mt-10 mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border-4 border-paper bg-ink shadow-md">
              {business.logo_url ? (
                <Image src={business.logo_url} alt="" width={72} height={72} className="h-full w-full rounded-[18px] object-cover" />
              ) : (
                <span className="text-2xl text-white" aria-hidden="true">
                  {pick(business.name, locale).slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-xl font-extrabold text-ink">{pick(business.name, locale)}</h1>
            {business.category && <p className="mt-0.5 text-sm font-bold text-accent">{pick(business.category, locale)}</p>}
            {business.description && <p className="mt-2 text-sm text-ink-muted">{pick(business.description, locale)}</p>}

            {offersFeatureOn && sectionOn("offer") && business.offer && pick(business.offer, locale) && (
              <p className="mt-4 rounded-[var(--radius-sm)] bg-gold/30 px-3 py-2 text-sm font-semibold text-canyon">
                {pick(business.offer, locale)}
              </p>
            )}

            {showMenuLink && (
              <a
                href={`/${username}/menu`}
                className="mt-5 block min-h-11 rounded-[var(--radius-sm)] px-4 py-3 text-center font-bold text-white [background:var(--accent-grad)]"
              >
                {tt("nav.menu")}
              </a>
            )}

            <ProfileLinkList
              businessId={business.id}
              locale={locale}
              links={[...fixedLinks, ...customLinks.map((l) => ({ icon: l.icon, label: pick(l.label, locale), url: l.url }))]}
            />

            <p className="mt-8 text-xs text-ink-muted">{tt("profile.poweredBy")} Vee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
