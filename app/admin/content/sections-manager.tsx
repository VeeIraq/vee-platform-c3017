"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSectionVisibility, reorderSections } from "@/lib/actions/cms";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  explain: "How Vee works (journey)",
  why: "Why Vee",
  products: "Products teaser",
  how: "How it works (steps)",
  plans: "Plans & pricing",
  faq: "FAQ",
  contact: "Contact CTA",
};

type Section = { key: string; visible: boolean; sortOrder: number };

export function SectionsManager({ sections }: { sections: Section[] }) {
  const [items, setItems] = useState(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function move(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    startTransition(async () => {
      await reorderSections(next.map((s) => s.key));
      router.refresh();
    });
  }

  return (
    <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper">
      {items.map((section, i) => (
        <li key={section.key} className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <button
                type="button"
                disabled={pending || i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move ${SECTION_LABELS[section.key] ?? section.key} up`}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={pending || i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${SECTION_LABELS[section.key] ?? section.key} down`}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <span className="font-semibold text-ink">{SECTION_LABELS[section.key] ?? section.key}</span>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={section.visible}
              disabled={pending}
              onChange={(e) => {
                const visible = e.target.checked;
                setItems((prev) => prev.map((s) => (s.key === section.key ? { ...s, visible } : s)));
                startTransition(async () => {
                  await toggleSectionVisibility(section.key, visible);
                  router.refresh();
                });
              }}
            />
            {section.visible ? "Visible" : "Hidden (draft)"}
          </label>
        </li>
      ))}
    </ul>
  );
}
