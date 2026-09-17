"use client";

import { trackClientEvent } from "@/lib/actions/analytics";

const LINK_ICONS: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📷",
  maps: "📍",
  reviews: "⭐",
  call: "📞",
  website: "🌐",
  reservation: "📅",
  link: "🔗",
  // Distinct from "reviews" (the external Google Reviews link) on purpose,
  // both visually and in its own analytics event below, so the two aren't
  // conflated in click metrics.
  customReview: "📝",
};

// Only icons with a matching analytics_events "type" get tracked -- website
// and generic custom links have no dedicated metric on the analytics
// dashboard, so a click there is intentionally not logged.
const EVENT_BY_ICON: Record<string, string> = {
  whatsapp: "whatsapp_click",
  instagram: "instagram_click",
  maps: "maps_click",
  reviews: "review_click",
  call: "call_click",
  reservation: "reservation_click",
  customReview: "review_page_click",
};

// The custom review page is internal (/:username/reviews) -- every other
// link here is an external destination, which is why this list otherwise
// always opens in a new tab.
const INTERNAL_ICONS = new Set(["customReview"]);

export function ProfileLinkList({
  businessId,
  locale,
  links,
}: {
  businessId: string;
  locale: string;
  links: { icon: string; label: string; url: string }[];
}) {
  return (
    <ul className="mt-5 flex flex-col gap-2.5">
      {links.map((link, i) => (
        <li key={`${link.url}-${i}`}>
          <a
            href={link.url}
            target={INTERNAL_ICONS.has(link.icon) ? undefined : "_blank"}
            rel={INTERNAL_ICONS.has(link.icon) ? undefined : "noopener noreferrer"}
            className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-3 font-semibold text-ink-soft hover:border-accent hover:text-accent"
            onClick={() => {
              const eventType = EVENT_BY_ICON[link.icon];
              if (eventType) trackClientEvent(businessId, eventType, locale);
            }}
          >
            <span aria-hidden="true">{LINK_ICONS[link.icon] ?? "🔗"}</span>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
