"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";
import { setActiveBusiness } from "@/lib/actions/dashboard-context";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/config";
import { useLocale } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/public/language-switcher";

type NavItem = { href: string; labelKey: string; icon: string; flag?: keyof EnabledNav };
type EnabledNav = { menu: boolean; orders: boolean; analytics: boolean; links: boolean; reviews: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "navOverview", icon: "📊" },
  { href: "/dashboard/profile", labelKey: "navProfile", icon: "🏪" },
  { href: "/dashboard/links", labelKey: "navLinks", icon: "🔗", flag: "links" },
  { href: "/dashboard/menu", labelKey: "navMenu", icon: "📋", flag: "menu" },
  { href: "/dashboard/reviews", labelKey: "navReviews", icon: "⭐", flag: "reviews" },
  { href: "/dashboard/orders", labelKey: "navOrders", icon: "🧾", flag: "orders" },
  { href: "/dashboard/analytics", labelKey: "navAnalytics", icon: "📈", flag: "analytics" },
  { href: "/dashboard/settings", labelKey: "navSettings", icon: "⚙️" },
];

export function DashboardShell({
  children,
  businessName,
  businessUsername,
  businessStatus,
  locale,
  memberships,
  activeBusinessId,
  enabledNav,
}: {
  children: React.ReactNode;
  businessName: Record<string, string>;
  businessUsername: string;
  businessStatus: string;
  locale: Locale;
  memberships: { business_id: string; businesses: { name: Record<string, string> } }[];
  activeBusinessId: string;
  enabledNav: EnabledNav;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();
  const dt = (key: string) => t(`dashboard.${key}`);

  const visibleNav = NAV.filter((item) => !item.flag || enabledNav[item.flag]);

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {visibleNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-semibold ${
              active ? "bg-accent text-white" : "text-ink-soft hover:bg-fog"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {dt(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-fog">
      <aside className="hidden w-64 shrink-0 border-e border-line bg-paper p-4 md:flex md:flex-col">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <Image src="/brand/vee-mark-square.png" alt="Vee" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-extrabold text-ink">Vee</span>
        </Link>
        {nav}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          {memberships.length > 1 && (
            <form>
              <label htmlFor="business-switch" className="mb-1 block text-xs font-semibold text-ink-muted">
                {dt("switchBusiness")}
              </label>
              <select
                id="business-switch"
                name="businessId"
                defaultValue={activeBusinessId}
                onChange={(e) => {
                  const fd = new FormData();
                  fd.set("businessId", e.target.value);
                  setActiveBusiness(fd);
                }}
                className="w-full rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-2 text-sm"
              >
                {memberships.map((m) => (
                  <option key={m.business_id} value={m.business_id}>
                    {pick(m.businesses.name, locale)}
                  </option>
                ))}
              </select>
            </form>
          )}
          <LanguageSwitcher />
          <form action={logout}>
            <button type="submit" className="min-h-11 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm font-semibold text-ink-soft hover:bg-fog">
              {dt("signOut")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:px-8">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-dashboard-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-ink">{pick(businessName, locale)}</h1>
            <p className="text-xs text-ink-muted">
              vee.iq/{businessUsername} ·{" "}
              <span className={businessStatus === "published" ? "font-semibold text-success" : "font-semibold text-warning"}>
                {businessStatus === "published" ? dt("statusPublished") : dt("statusDraft")}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href={`/${businessUsername}`} target="_blank" className="text-sm font-semibold text-accent hover:underline">
              {dt("viewProfile")} ↗
            </Link>
          </div>
        </header>

        {mobileOpen && (
          <div id="mobile-dashboard-nav" className="border-b border-line bg-paper p-4 md:hidden">
            {nav}
          </div>
        )}

        <main id="main" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
