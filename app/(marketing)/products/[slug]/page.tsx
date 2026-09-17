import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { getCatalogueProductBySku } from "@/lib/data/public";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { buttonClass } from "@/components/ui/button";
import { COMPANY_WHATSAPP_NUMBER } from "@/lib/company";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerDictionary();
  const product = await getCatalogueProductBySku(slug.toUpperCase());
  if (!product) return {};
  return {
    title: pick(product.seo_title?.en ? product.seo_title : product.name, locale) || pick(product.name, locale),
    description: pick(product.seo_description?.en ? product.seo_description : product.description, locale),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);
  const catalogueOn = await isFeatureEnabled("product_catalogue");
  if (!catalogueOn) notFound();
  const product = await getCatalogueProductBySku(slug.toUpperCase());
  if (!product) notFound();

  const waMessage = encodeURIComponent(`Hello Vee, I'm interested in the ${pick(product.name, locale)}.`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <Link href="/products" className="hover:text-accent">
          {tt("nav.products")}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{pick(product.name, locale)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-[var(--radius-lg)] bg-fog">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt="" width={480} height={480} className="h-full w-full rounded-[var(--radius-lg)] object-cover" />
          ) : (
            <span className="text-7xl" aria-hidden="true">📇</span>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-ink">{pick(product.name, locale)}</h1>

          {!product.request_quote && (product.price_iqd != null || product.discount_price_iqd != null) ? (
            <p className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-ink">
                {(product.discount_price_iqd ?? product.price_iqd)!.toLocaleString()} {product.currency}
              </span>
              {product.discount_price_iqd != null && product.price_iqd != null && (
                <span className="text-sm text-ink-muted line-through">
                  {product.price_iqd.toLocaleString()} {product.currency}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-accent">Contact us for pricing</p>
          )}

          <p className="mt-3 text-ink-muted">{pick(product.description, locale)}</p>

          {product.specifications && Object.keys(product.specifications as Record<string, string>).length > 0 && (
            <dl className="mt-5 flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-line bg-fog p-4 text-sm">
              {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="font-semibold text-ink-soft">{key}</dt>
                  <dd className="text-end text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.colors && product.colors.length > 0 && (
            <p className="mt-4 text-sm font-semibold text-ink-soft">
              Available in: {product.colors.join(", ")}
            </p>
          )}

          {Array.isArray(product.features) && product.features.length > 0 && (
            <ul className="mt-6 flex flex-col gap-2">
              {(product.features as unknown as string[]).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span aria-hidden="true" className="mt-0.5 text-accent-3">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "md")}
            >
              {product.request_quote ? "Request a quote" : tt("products.cta")}
            </a>
            <Link href="/contact" className={buttonClass("outline", "md")}>
              {tt("nav.contact")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
