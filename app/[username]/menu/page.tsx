import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { dir } from "@/lib/i18n/config";
import { getPublishedBusinessByUsername, getBusinessMenu, logAnalyticsEvent } from "@/lib/data/public";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getMenuItemLikeStates } from "@/lib/actions/likes";
import { readAnonId, hashAnonId } from "@/lib/anon-identity";
import { MenuExperience } from "./menu-experience";

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await params;
  const { locale } = await getServerDictionary();
  const business = await getPublishedBusinessByUsername(username);
  if (!business) return {};
  return { title: `${pick(business.name, locale)} — Menu` };
}

export default async function BusinessMenuPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const { locale, dict } = await getServerDictionary();
  // "viewProfile" (and every other string this page/MenuExperience uses)
  // lives under the "menuPage" namespace in the dictionaries -- see the
  // matching fix + explanation in menu-experience.tsx's own tt() helper.
  const tt = (path: string) => t(dict, `menuPage.${path}`);
  const business = await getPublishedBusinessByUsername(username);
  if (!business || !business.menu_link_enabled) notFound();
  const menuFeatureOn = await isFeatureEnabled("digital_menus", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!menuFeatureOn) notFound();

  const { categories, items } = await getBusinessMenu(business.id);
  await logAnalyticsEvent(business.id, "menu_view", { locale });

  const likesEnabled =
    business.likes_enabled &&
    (await isFeatureEnabled("menu_likes", { businessId: business.id, planId: business.plan_id ?? undefined }));
  let initialLikes: Record<string, { count: number; liked: boolean }> = {};
  if (likesEnabled) {
    const anonId = await readAnonId("vee_like_id");
    const likerHash = anonId ? hashAnonId(anonId, business.id) : null;
    initialLikes = await getMenuItemLikeStates(business.id, likerHash);
  }

  return (
    <div dir={dir(locale)} className="min-h-screen bg-paper">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <Link href={`/${username}`} className="text-sm font-semibold text-accent hover:underline">
              ← {tt("viewProfile")}
            </Link>
            <h1 className="mt-1 text-xl font-extrabold text-ink">{pick(business.name, locale)}</h1>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-muted sm:px-6">
          This business hasn&apos;t published a menu yet.
        </p>
      ) : (
        <MenuExperience
          businessId={business.id}
          likesEnabled={likesEnabled}
          initialLikes={initialLikes}
          categories={categories.map((c) => ({ id: c.id, name: c.name as Record<string, string>, icon: c.icon }))}
          items={items.map((i) => ({
            id: i.id,
            category_id: i.category_id,
            name: i.name as Record<string, string>,
            description: i.description as Record<string, string> | null,
            price: i.price,
            discount_price: i.discount_price,
            image_url: i.image_url,
            tags: i.tags,
            available: i.available,
            labels: (i.menu_item_label_links ?? [])
              .map((l) => l.menu_labels)
              .filter((l): l is NonNullable<typeof l> => Boolean(l))
              .map((l) => ({ id: l.id, name: l.name as Record<string, string> })),
            options: [...(i.product_options ?? [])]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((o) => ({
                id: o.id,
                type: o.type,
                name: o.name as Record<string, string>,
                choices: (o.choices ?? []) as unknown as { id: string; name: Record<string, string>; priceDelta: number }[],
              })),
          }))}
          locale={locale}
          dict={dict}
        />
      )}
    </div>
  );
}
