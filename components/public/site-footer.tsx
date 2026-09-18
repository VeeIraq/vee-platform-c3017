"use client";

import Image from "next/image";
import { Link } from "next-view-transitions";
import { useLocale } from "@/components/i18n/locale-provider";
import type { NavItem } from "@/lib/data/public";

type FooterLink = { key: string; href: string; label: string; icon: string | null; imageUrl: string | null; openNewTab: boolean };
type FooterGroup = { key: string; heading: string; links: FooterLink[] };

export function SiteFooter({ navItems = [] }: { navItems?: NavItem[] }) {
  const { t, locale } = useLocale();

  // Keyed by the CMS row's own id -- see the matching note in
  // site-header.tsx -- rather than by href, which two differently-labeled
  // links in the same footer group are allowed to share.
  const dbGroups: FooterGroup[] = ["solutions", "company", "legal"]
    .map((key) => ({
      key,
      heading: t(`footer.${key}`),
      links: navItems
        .filter((item) => item.footerGroup === key)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          key: item.id,
          href: item.url,
          label: item.label[locale] || item.label.en || item.url,
          icon: item.icon,
          imageUrl: item.imageUrl,
          openNewTab: item.openNewTab,
        })),
    }))
    .filter((group) => group.links.length > 0);

  // Falls back to the hardcoded, translation-driven groups only when Super
  // Admin hasn't seeded (or has emptied) footer nav_menu_items rows.
  const groups: FooterGroup[] =
    dbGroups.length > 0
      ? dbGroups
      : [
          {
            key: "solutions",
            heading: t("footer.solutions"),
            links: [
              { key: "products", href: "/products", label: t("nav.products"), icon: null, imageUrl: null, openNewTab: false },
              { key: "plans", href: "/#plans", label: t("nav.plans"), icon: null, imageUrl: null, openNewTab: false },
              { key: "how", href: "/#how", label: t("nav.how"), icon: null, imageUrl: null, openNewTab: false },
            ],
          },
          {
            key: "company",
            heading: t("footer.company"),
            links: [
              { key: "contact", href: "/contact", label: t("nav.contact"), icon: null, imageUrl: null, openNewTab: false },
              { key: "signin", href: "/login", label: t("auth.signIn"), icon: null, imageUrl: null, openNewTab: false },
            ],
          },
          {
            key: "legal",
            heading: t("footer.legal"),
            links: [
              { key: "privacy", href: "/privacy", label: t("footer.privacy"), icon: null, imageUrl: null, openNewTab: false },
              { key: "terms", href: "/terms", label: t("footer.terms"), icon: null, imageUrl: null, openNewTab: false },
            ],
          },
        ];

  return (
    <footer className="border-t border-line bg-ink text-paper-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Image src="/brand/vee-logo-white.png" alt="Vee" width={96} height={33} />
          </div>
          <p className="max-w-xs text-sm">{t("footer.tagline")}</p>
        </div>

        {groups.map((group) => (
          <nav key={group.key} aria-label={group.heading}>
            <h2 className="mb-3 text-sm font-bold text-white">{group.heading}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {group.links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    target={link.openNewTab ? "_blank" : undefined}
                    rel={link.openNewTab ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    {link.imageUrl ? (
                      <Image src={link.imageUrl} alt="" width={14} height={14} className="rounded-sm" />
                    ) : link.icon ? (
                      <span aria-hidden="true">{link.icon}</span>
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line-dark px-4 py-5 text-center text-xs sm:px-6">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
