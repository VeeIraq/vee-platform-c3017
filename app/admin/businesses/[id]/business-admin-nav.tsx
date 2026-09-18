"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BusinessAdminNav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/admin/businesses/${businessId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/plan`, label: "Plan & Features" },
    { href: `${base}/menu`, label: "Menu" },
    { href: `${base}/links`, label: "Links" },
    { href: `${base}/team`, label: "Team" },
  ];

  return (
    <nav aria-label="Business sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold ${
              active ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
