import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { getCatalogueProducts } from "@/lib/data/public";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { buttonClass } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerDictionary();
  return { title: t(dict, "products.title"), description: t(dict, "products.sub") };
}

export default async function ProductsPage() {
  const { locale, dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);
  const catalogueOn = await isFeatureEnabled("product_catalogue");
  const products = catalogueOn ? await getCatalogueProducts() : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("products.eyebrow")}</p>
        <h1 className="text-4xl font-extrabold text-ink">{tt("products.title")}</h1>
        <p className="mt-3 text-ink-muted">{tt("products.sub")}</p>
      </header>

      {!catalogueOn ? (
        <p className="mt-10 max-w-lg rounded-[var(--radius-md)] border border-line bg-fog p-5 text-sm text-ink-muted">
          The product catalogue isn&apos;t available right now. Please check back later.
        </p>
      ) : products.length === 0 ? (
        <p className="mt-10 max-w-lg rounded-[var(--radius-md)] border border-line bg-fog p-5 text-sm text-ink-muted">
          The product catalogue is empty because this preview isn&apos;t connected to a Supabase project yet. Once
          connected and migrated (<code>supabase/migrations</code>), the 8 Vee products seeded in{" "}
          <code>0004_seed_data.sql</code> will appear here, editable from Super Admin → Catalogue.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id} className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper">
              <div className="flex aspect-[4/3] items-center justify-center bg-fog">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt="" width={320} height={240} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl" aria-hidden="true">📇</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-bold text-ink">{pick(product.name, locale)}</h2>
                <p className="mt-1.5 flex-1 text-sm text-ink-muted">{pick(product.description, locale)}</p>
                {!product.request_quote && (product.price_iqd != null || product.discount_price_iqd != null) && (
                  <p className="mt-2 flex items-center gap-1.5">
                    <span className="font-bold text-ink">
                      {(product.discount_price_iqd ?? product.price_iqd)!.toLocaleString()} {product.currency}
                    </span>
                    {product.discount_price_iqd != null && product.price_iqd != null && (
                      <span className="text-xs text-ink-muted line-through">
                        {product.price_iqd.toLocaleString()} {product.currency}
                      </span>
                    )}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-1.5" aria-label="Available colors">
                      {product.colors.map((c) => (
                        <span
                          key={c}
                          className="h-4 w-4 rounded-full border border-line"
                          style={{ background: c === "black" ? "#241F1B" : c === "white" ? "#FCFAF5" : c === "steel" ? "#B7BCC2" : "#e4d7be" }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                  <Link href={`/products/${product.sku.toLowerCase()}`} className={buttonClass("outline", "sm")}>
                    {tt("products.cta")}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
