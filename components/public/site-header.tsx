"use client";

import Image from "next/image";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { buttonClass } from "@/components/ui/button";
import type { NavItem } from "@/lib/data/public";

export function SiteHeader({ navItems = [] }: { navItems?: NavItem[] }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A <Link href="/"> to the page you're already on doesn't trigger a
  // navigation at all (same URL, nothing for Next to do), so clicking
  // "Home" while already on the homepage -- scrolled down -- silently did
  // nothing. Scroll to top ourselves in that one case instead; every other
  // path still gets a normal Link navigation to "/".
  function goHome(e: MouseEvent, href: string) {
    if (href === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Falls back to the hardcoded, translation-driven list only when Super
  // Admin hasn't seeded (or has emptied) the nav_menu_items table -- this
  // keeps the header working even before the CMS is configured.
  // Keyed by the CMS row's own id (falling back to href for the hardcoded
  // list, which has genuinely unique hrefs) rather than by href/url --
  // Super Admin > Navigation doesn't enforce unique URLs across items, only
  // unique (label, url, location) combos (see 0011_fix_nav_menu_duplicates.sql),
  // so two differently-labeled links to the same url are a valid CMS
  // configuration and keying by href alone would collide.
  const links =
    navItems.length > 0
      ? navItems.map((item) => ({
          key: item.id,
          href: item.url,
          label: item.label[locale] || item.label.en || item.url,
          icon: item.icon,
          imageUrl: item.imageUrl,
          openNewTab: item.openNewTab,
        }))
      : [
          { key: "home", href: "/", label: t("nav.home"), icon: null, imageUrl: null, openNewTab: false },
          { key: "products", href: "/products", label: t("nav.products"), icon: null, imageUrl: null, openNewTab: false },
          { key: "how", href: "/#how", label: t("nav.how"), icon: null, imageUrl: null, openNewTab: false },
          { key: "plans", href: "/#plans", label: t("nav.plans"), icon: null, imageUrl: null, openNewTab: false },
          { key: "contact", href: "/contact", label: t("nav.contact"), icon: null, imageUrl: null, openNewTab: false },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" onClick={(e) => goHome(e, "/")} className="flex items-center" aria-label="Vee">
          <Image src="/brand/vee-logo-black.png" alt="Vee" width={96} height={33} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={(e) => goHome(e, link.href)}
              target={link.openNewTab ? "_blank" : undefined}
              rel={link.openNewTab ? "noopener noreferrer" : undefined}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-accent"
            >
              {link.imageUrl ? (
                <Image src={link.imageUrl} alt="" width={16} height={16} className="rounded-sm" />
              ) : link.icon ? (
                <span aria-hidden="true">{link.icon}</span>
              ) : null}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-accent">
            {t("auth.signIn")}
          </Link>
          <Link href="/contact" className={buttonClass("primary", "sm")}>
            {t("nav.cta")}
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={t("meta.openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-line bg-paper px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  target={link.openNewTab ? "_blank" : undefined}
                  rel={link.openNewTab ? "noopener noreferrer" : undefined}
                  className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 py-3 text-base font-semibold text-ink-soft hover:bg-fog"
                  onClick={(e) => {
                    goHome(e, link.href);
                    setOpen(false);
                  }}
                >
                  {link.imageUrl ? (
                    <Image src={link.imageUrl} alt="" width={18} height={18} className="rounded-sm" />
                  ) : link.icon ? (
                    <span aria-hidden="true">{link.icon}</span>
                  ) : null}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm font-semibold text-ink-soft">
              {t("auth.signIn")}
            </Link>
          </div>
          <Link href="/contact" className={`${buttonClass("primary", "md")} mt-4 w-full`}>
            {t("nav.cta")}
          </Link>
        </nav>
      )}
    </header>
  );
}
