"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/pick";
import { t, type Dictionary } from "@/lib/i18n/dictionaries";
import { toggleMenuItemLike } from "@/lib/actions/likes";

type OptionChoice = { id: string; name: Record<string, string>; priceDelta: number };
type ProductOption = { id: string; type: "single" | "multi"; name: Record<string, string>; choices: OptionChoice[] };
type MenuLabel = { id: string; name: Record<string, string> };

type MenuItem = {
  id: string;
  category_id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  tags: string[];
  available: boolean;
  labels: MenuLabel[];
  options: ProductOption[];
};
type MenuCategory = { id: string; name: Record<string, string>; icon: string };

// The menu is browse-only: there is no cart, no checkout, and no WhatsApp
// ordering handoff (that flow was removed -- see the "MenuExperience"
// entry in the project notes). This component just lists items so a
// customer can see what a business offers and its prices; placing an
// order happens outside the app (in person, by phone, etc.).
export function MenuExperience({
  businessId,
  categories,
  items,
  locale,
  dict,
  likesEnabled,
  initialLikes,
}: {
  businessId: string;
  categories: MenuCategory[];
  items: MenuItem[];
  locale: Locale;
  dict: Dictionary;
  likesEnabled: boolean;
  initialLikes: Record<string, { count: number; liked: boolean }>;
}) {
  // All strings this component uses live under the "menuPage" namespace in
  // the dictionaries (see lib/i18n/dictionaries/*.json) -- prefix it here so
  // callers can keep using short keys like tt("unavailable").
  const tt = (path: string) => t(dict, `menuPage.${path}`);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category_id !== activeCategory) return false;
      if (query.trim()) {
        const name = pick(item.name, locale).toLowerCase();
        if (!name.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [items, activeCategory, query, locale]);

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
        <label htmlFor="menu-search" className="sr-only">
          {tt("search")}
        </label>
        <input
          id="menu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt("searchPh")}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-fog px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline"
        />
        <div role="tablist" aria-label={tt("allCategories")} className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={`min-h-9 shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              activeCategory === "all" ? "border-accent bg-accent text-white" : "border-line text-ink-soft"
            }`}
          >
            {tt("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-9 shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${
                activeCategory === cat.id ? "border-accent bg-accent text-white" : "border-line text-ink-soft"
              }`}
            >
              {pick(cat.name, locale)}
            </button>
          ))}
        </div>
      </div>

      <ul className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-5 sm:px-6">
        {filteredItems.map((item) => {
          const price = item.discount_price ?? item.price;
          return (
            <li key={item.id} className="rounded-[var(--radius-md)] border border-line bg-paper p-3">
              <div className="flex gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-fog">
                  {item.image_url ? (
                    <Image src={item.image_url} alt="" width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">🍽️</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-ink">{pick(item.name, locale)}</h3>
                    <div className="text-end">
                      {item.discount_price && (
                        <span className="me-1.5 text-xs text-ink-muted line-through">{item.price.toLocaleString()}</span>
                      )}
                      <span className="font-bold text-ink">
                        {price.toLocaleString()}
                        {item.options.length > 0 && <span className="text-xs font-normal text-ink-muted">+</span>}
                      </span>
                    </div>
                  </div>
                  {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{pick(item.description, locale)}</p>}
                  {(item.labels.length > 0 || item.tags?.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1.5" role="list" aria-label={tt("labels")}>
                      {item.labels.map((label) => (
                        <span key={label.id} role="listitem" className="rounded-full bg-gold/30 px-2 py-0.5 text-[11px] font-semibold text-canyon">
                          {pick(label.name, locale)}
                        </span>
                      ))}
                      {item.tags.map((tag) => (
                        <span key={tag} role="listitem" className="rounded-full bg-fog px-2 py-0.5 text-[11px] font-semibold text-accent-3">
                          {tt(tag) || tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-3">
                    {!item.available && <p className="text-xs font-semibold text-danger">{tt("unavailable")}</p>}
                    {likesEnabled && (
                      <LikeButton
                        businessId={businessId}
                        itemId={item.id}
                        initial={initialLikes[item.id] ?? { count: 0, liked: false }}
                        label={tt("like")}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Options are informational only -- no cart, so this just tells a
                  browsing customer what's available and what it costs, e.g. Size:
                  Small, Medium (+1,000), Large (+2,000). */}
              {item.options.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-1.5 border-t border-line pt-2.5">
                  {item.options.map((opt) => (
                    <p key={opt.id} className="text-xs text-ink-muted">
                      <span className="font-semibold text-ink-soft">{pick(opt.name, locale)}: </span>
                      {opt.choices
                        .map((choice) => {
                          const label = pick(choice.name, locale);
                          return choice.priceDelta !== 0
                            ? `${label} (${choice.priceDelta > 0 ? "+" : ""}${choice.priceDelta.toLocaleString()})`
                            : label;
                        })
                        .join(", ")}
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {filteredItems.length === 0 && <p className="py-10 text-center text-ink-muted">—</p>}
      </ul>
    </div>
  );
}

// No account needed -- toggleMenuItemLike identifies "the same browser" via
// an httpOnly cookie set server-side (see lib/anon-identity.ts), so this
// component only ever needs to hold the count/liked state it was given and
// whatever the action call returns; it never reads or writes the identity
// cookie itself.
function LikeButton({
  businessId,
  itemId,
  initial,
  label,
}: {
  businessId: string;
  itemId: string;
  initial: { count: number; liked: boolean };
  label: string;
}) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={state.liked}
      aria-label={label}
      onClick={() =>
        startTransition(async () => {
          // Optimistic flip so the tap feels instant; reconciled with the
          // server's authoritative count (the only place a count is ever
          // actually computed) once the action resolves.
          const prev = state;
          setState({ liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) });
          const result = await toggleMenuItemLike(itemId, businessId);
          if (result.error || result.count === undefined) {
            setState(prev);
            return;
          }
          setState({ liked: result.liked ?? false, count: result.count });
        })
      }
      className={`flex min-h-7 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        state.liked ? "border-danger bg-danger-bg text-danger" : "border-line text-ink-muted hover:border-danger hover:text-danger"
      }`}
    >
      <span aria-hidden="true">{state.liked ? "♥" : "♡"}</span>
      <span>{state.count}</span>
    </button>
  );
}
