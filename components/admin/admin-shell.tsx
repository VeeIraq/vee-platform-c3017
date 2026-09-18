"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";

const NAV = [
  { href: "/admin", labelKey: "navOverview", icon: "🛠️", superAdminOnly: false },
  { href: "/admin/businesses", labelKey: "navBusinesses", icon: "🏪", superAdminOnly: false },
  { href: "/admin/leads", labelKey: "navLeads", icon: "📥", superAdminOnly: false },
  { href: "/admin/catalogue", labelKey: "navCatalogue", icon: "📇", superAdminOnly: false },
  { href: "/admin/devices", labelKey: "navDevices", icon: "📶", superAdminOnly: false },
  { href: "/admin/analytics", labelKey: "navAnalytics", icon: "📈", superAdminOnly: true },
  { href: "/admin/content", labelKey: "navContent", icon: "📝", superAdminOnly: true },
  { href: "/admin/nav", labelKey: "navNav", icon: "🧭", superAdminOnly: true },
  { href: "/admin/translations", labelKey: "navTranslations", icon: "🌐", superAdminOnly: true },
  { href: "/admin/pricing", labelKey: "navPricing", icon: "💳", superAdminOnly: true },
  { href: "/admin/feature-flags", labelKey: "navFeatureFlags", icon: "🚩", superAdminOnly: true },
];

export function AdminShell({
  children,
  staffName,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  staffName: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const dt = (key: string) => t(`admin.${key}`);
  const items = NAV.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1 overflow-y-auto">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-semibold ${
              active ? "bg-accent text-white" : "text-paper-muted hover:bg-ink"
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
    <div className="flex min-h-screen flex-col bg-ink md:flex-row">
      <header className="flex items-center justify-between gap-3 border-b border-line-dark bg-ink-soft px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/vee-logo-white.png" alt="Vee" width={84} height={29} />
          <span className="text-xs font-bold uppercase tracking-widest text-gold">Admin</span>
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-dark text-white"
          aria-expanded={mobileOpen}
          aria-controls="mobile-admin-nav"
          aria-label={mobileOpen ? dt("closeMenu") : dt("openMenu")}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </header>
      {mobileOpen && (
        <div id="mobile-admin-nav" className="border-b border-line-dark bg-ink-soft p-4 md:hidden">
          {nav}
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-e border-line-dark bg-ink-soft p-4 md:flex md:flex-col">
        <Link href="/" className="mb-6 flex flex-col gap-1 px-2">
          <Image src="/brand/vee-logo-white.png" alt="Vee" width={104} height={36} />
          <span className="block text-[10px] font-bold uppercase tracking-widest text-gold">Super Admin</span>
        </Link>
        {nav}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <LanguageSwitcher />
          <p className="px-3 text-xs text-paper-muted">
            {dt("signedInAs")} {staffName}
          </p>
          <form action={logout}>
            <button type="submit" className="mt-2 min-h-11 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm font-semibold text-paper-muted hover:bg-ink">
              {dt("signOut")}
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 bg-fog p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
