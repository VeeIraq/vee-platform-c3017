import Image from "next/image";
import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerDictionary } from "@/lib/i18n/server";
import { CONTENT, t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { getCatalogueProducts, getPlans, getHomepageSections, getFaqItems, getHomepageSeo } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth/dal";
import { buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { DigitalMenuSection } from "@/components/public/digital-menu-section";
import { BusinessTypesSection } from "@/components/public/business-types-section";
import { AnalyticsStatsSection } from "@/components/public/analytics-stats-section";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getServerDictionary();
  const seo = await getHomepageSeo();
  return {
    title: seo?.title[locale] || t(dict, "hero.title"),
    description: seo?.description[locale] || t(dict, "meta.description"),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);
  const { preview } = await searchParams;
  const [products, plans, sections, faqItems, currentUser] = await Promise.all([
    getCatalogueProducts(),
    getPlans(),
    getHomepageSections(),
    getFaqItems(),
    preview === "1" ? getCurrentUser() : Promise.resolve(null),
  ]);
  // Super Admin > Content's "Preview" link appends ?preview=1 so staff can
  // see draft (hidden) sections before publishing -- everyone else always
  // sees only what's actually visible.
  const isPreviewing = preview === "1" && !!currentUser?.profile?.internal_role;
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

  const journeySteps = [1, 2, 3, 4, 5, 6, 7].map((n) => tt(`explain.step${n}`));

  // Every homepage section is built once here, keyed by its Super
  // Admin > Content section key, then rendered in the order (and
  // visibility) that Super Admin has configured in site_content. Section
  // copy itself always stays translation-driven -- this purely controls
  // show/hide + order.
  const sectionNodes: Record<string, ReactNode> = {
    hero: (
      <section key="hero" className="relative overflow-hidden bg-ink px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Image src="/brand/vee-logo-white.png" alt="Vee" width={112} height={38} priority className="mx-auto mb-4" />
          <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{tt("hero.title")}</h1>
          <p className="mt-4 text-lg font-semibold text-paper-muted">{tt("hero.tagline")}</p>
          <p className="mx-auto mt-4 max-w-xl text-paper-muted">{tt("hero.desc")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className={buttonClass("primary", "md")}>
              {tt("hero.ctaPrimary")}
            </Link>
            <Link
              href="/products"
              className={buttonClass(
                "outline",
                "md",
                "!border-white/40 !bg-transparent !text-white hover:!border-white hover:!bg-white/10"
              )}
            >
              {tt("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    ),

    explain: (
      <section key="explain" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("explain.eyebrow")}</p>
          <h2 className="max-w-xl text-3xl font-extrabold text-ink">{tt("explain.title")}</h2>
          <p className="mt-3 max-w-xl text-ink-muted">{tt("explain.sub")}</p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="font-semibold text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-xl text-sm text-ink-muted">{tt("explain.note")}</p>
        </div>
      </section>
    ),

    digitalMenu: (
      <DigitalMenuSection
        key="digitalMenu"
        eyebrow={tt("menuTeaser.eyebrow")}
        title={tt("menuTeaser.title")}
        desc={tt("menuTeaser.desc")}
        points={[tt("menuTeaser.point1"), tt("menuTeaser.point2"), tt("menuTeaser.point3")]}
        journey={[
          tt("menuTeaser.journeyTap"),
          tt("menuTeaser.journeyOpen"),
          tt("menuTeaser.journeyExplore"),
          tt("menuTeaser.journeyOrder"),
          tt("menuTeaser.journeyReview"),
        ]}
        cta={tt("menuTeaser.cta")}
        demoHref="/products"
      />
    ),

    why: (
      <section key="why" className="bg-fog px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("why.eyebrow")}</p>
          <h2 className="max-w-xl text-3xl font-extrabold text-ink">{tt("why.title")}</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {CONTENT.WHY_ITEMS.map((item, i) => {
              const it = item as { title: Record<string, string>; desc: Record<string, string> };
              return (
                <Reveal key={pick(it.title, locale)} as="li" delayMs={(i % 5) * 60}>
                  <div className="hover-lift rounded-[var(--radius-md)] bg-paper p-5 shadow-sm">
                    <h3 className="font-bold text-ink">{pick(it.title, locale)}</h3>
                    <p className="mt-1.5 text-sm text-ink-muted">{pick(it.desc, locale)}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>
    ),

    businessTypes: (
      <BusinessTypesSection key="businessTypes" eyebrow={tt("businessTypesSection.eyebrow")} title={tt("businessTypesSection.title")} locale={locale} />
    ),

    products: (
      <section key="products" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("products.eyebrow")}</p>
              <h2 className="max-w-xl text-3xl font-extrabold text-ink">{tt("products.title")}</h2>
              <p className="mt-3 max-w-xl text-ink-muted">{tt("products.sub")}</p>
            </div>
            <Link href="/products" className={buttonClass("outline", "sm")}>
              {tt("nav.products")}
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <li key={product.id} className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper">
                  <div className="flex aspect-square items-center justify-center bg-fog">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt="" width={260} height={260} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl" aria-hidden="true">📇</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-ink">{pick(product.name, locale)}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{pick(product.description, locale)}</p>
                    <Link href={`/products/${product.sku.toLowerCase()}`} className="mt-3 inline-block text-sm font-bold text-accent hover:underline">
                      {tt("products.cta")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-ink-muted">
              Connect a Supabase project and run the migrations in <code>supabase/migrations</code> to see the live
              catalogue here.
            </p>
          )}
        </div>
      </section>
    ),

    how: (
      <section key="how" id="how" className="bg-fog px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("how.eyebrow")}</p>
          <h2 className="max-w-xl text-3xl font-extrabold text-ink">{tt("how.title")}</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="rounded-[var(--radius-md)] bg-paper p-5 shadow-sm">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {n}
                </span>
                <h3 className="font-bold text-ink">{tt(`how.step${n}Title`)}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{tt(`how.step${n}Desc`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),

    plans: (
      <section key="plans" id="plans" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("plans.eyebrow")}</p>
          <h2 className="max-w-xl text-3xl font-extrabold text-ink">{tt("plans.title")}</h2>
          <p className="mt-3 max-w-xl text-ink-muted">{tt("plans.sub")}</p>
          <ul className="mt-10 grid gap-5 lg:grid-cols-4">
            {plans.map((plan) => {
              const popular = Boolean(plan.popular);
              const ctaText = pick(plan.cta, locale) || tt("nav.cta");
              return (
                <li
                  key={plan.id}
                  className={`flex flex-col rounded-[var(--radius-lg)] border p-6 ${popular ? "border-accent shadow-lg" : "border-line"}`}
                >
                  {popular && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
                      {tt("plans.mostPopular")}
                    </span>
                  )}
                  <h3 className="text-lg font-extrabold text-ink">{pick(plan.name, locale)}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{pick(plan.tagline, locale)}</p>
                  <p className="mt-4 text-3xl font-extrabold text-ink">
                    {plan.price_iqd ? (
                      <>
                        {plan.price_iqd.toLocaleString()} <span className="text-base font-semibold text-ink-muted">{tt("plans.iqd")}</span>
                      </>
                    ) : (
                      tt("plans.contactForPrice")
                    )}
                  </p>
                  {plan.price_iqd && <p className="text-xs text-ink-muted">{tt("plans.perMonth")}</p>}
                  {plan.setup_price_iqd ? (
                    <p className="text-xs text-ink-muted">
                      + {plan.setup_price_iqd.toLocaleString()} {tt("plans.iqd")} {tt("plans.setup")}
                    </p>
                  ) : null}
                  <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-ink-soft">
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 6).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-0.5 text-accent-3">✓</span>
                        <span>{typeof f === "object" && f ? pick(f as Record<string, string>, locale) : String(f)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/contact?plan=${plan.id}`} className={buttonClass(popular ? "primary" : "outline", "md", "mt-6 justify-center")}>
                    {ctaText}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    ),

    analyticsStats: (
      <AnalyticsStatsSection
        key="analyticsStats"
        eyebrow={tt("analyticsTeaser.eyebrow")}
        title={tt("analyticsTeaser.title")}
        desc={tt("analyticsTeaser.desc")}
        cta={tt("analyticsTeaser.cta")}
        kpiLabels={{
          profileVisits: tt("analyticsTeaser.kpi.profileVisits"),
          menuViews: tt("analyticsTeaser.kpi.menuViews"),
          whatsappClicks: tt("analyticsTeaser.kpi.whatsappClicks"),
          nfcTaps: tt("analyticsTeaser.kpi.nfcTaps"),
          orders: tt("analyticsTeaser.kpi.orders"),
        }}
      />
    ),

    faq: (
      <section key="faq" className="bg-fog px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("faq.eyebrow")}</p>
          <h2 className="text-3xl font-extrabold text-ink">{tt("faq.title")}</h2>
          <FaqAccordion
            items={faqItems.map((item) => ({
              key: item.key,
              question: item.q[locale] || item.q.en,
              answer: item.a[locale] || item.a.en,
            }))}
          />
        </div>
      </section>
    ),

    contact: (
      <section key="contact" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-ink px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">{tt("contact.title")}</h2>
          <p className="max-w-md text-paper-muted">{tt("contact.sub")}</p>
          <Link href="/contact" className={buttonClass("primary", "md")}>
            {tt("contact.ctaSecondary")}
          </Link>
        </div>
      </section>
    ),
  };

  const orderedSections = sections
    .filter((s) => (s.visible || isPreviewing) && sectionNodes[s.key])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => (
      <div key={s.key} className={!s.visible ? "relative outline outline-2 -outline-offset-2 outline-dashed outline-gold" : undefined}>
        {!s.visible && (
          <span className="absolute start-2 top-2 z-10 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
            Draft — hidden from visitors
          </span>
        )}
        {sectionNodes[s.key]}
      </div>
    ));

  return <>{orderedSections}</>;
}
