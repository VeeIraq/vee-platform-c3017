"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: "🛠️", superAdminOnly: false },
  { href: "/admin/businesses", label: "Businesses", icon: "🏪", superAdminOnly: false },
  { href: "/admin/leads", label: "Leads", icon: "📥", superAdminOnly: false },
  { href: "/admin/catalogue", label: "Catalogue", icon: "📇", superAdminOnly: false },
  { href: "/admin/devices", label: "NFC / QR Devices", icon: "📶", superAdminOnly: false },
  { href: "/admin/analytics", label: "Analytics", icon: "📈", superAdminOnly: true },
  { href: "/admin/content", label: "Content", icon: "📝", superAdminOnly: true },
  { href: "/admin/nav", label: "Navigation", icon: "🧭", superAdminOnly: true },
  { href: "/admin/translations", label: "Translations", icon: "🌐", superAdminOnly: true },
  { href: "/admin/pricing", label: "Pricing", icon: "💳", superAdminOnly: true },
  { href: "/admin/feature-flags", label: "Feature flags", icon: "🚩", superAdminOnly: true },
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-ink md:flex-row">
      <header className="flex items-center justify-between gap-3 border-b border-line-dark bg-ink-soft px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/vee-mark-square.png" alt="Vee" width={28} height={28} className="rounded-lg" />
          <span className="text-base font-extrabold text-white">Vee Admin</span>
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-dark text-white"
          aria-expanded={mobileOpen}
          aria-controls="mobile-admin-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <Image src="/brand/vee-mark-square.png" alt="Vee" width={32} height={32} className="rounded-lg" />
          <div>
            <span className="block text-lg font-extrabold text-white">Vee</span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-gold">Super Admin</span>
          </div>
        </Link>
        {nav}
        <div className="mt-auto pt-4">
          <p className="px-3 text-xs text-paper-muted">Signed in as {staffName}</p>
          <form action={logout}>
            <button type="submit" className="mt-2 min-h-11 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm font-semibold text-paper-muted hover:bg-ink">
              Sign out
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
