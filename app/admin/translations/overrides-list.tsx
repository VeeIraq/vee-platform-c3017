"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTranslationOverride } from "@/lib/actions/cms";
import { OverrideForm } from "./override-form";

type Override = { id: string; namespace: string; key: string; locale: "en" | "ar" | "ku"; value: string };

const LOCALE_LABEL: Record<string, string> = { en: "English", ar: "Arabic", ku: "Kurdish" };

export function OverridesList({ overrides }: { overrides: Override[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper">
        {overrides.map((o) =>
          editingId === o.id ? (
            <li key={o.id} className="p-4">
              <OverrideForm
                initial={o}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
              <button type="button" onClick={() => setEditingId(null)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
                Cancel
              </button>
            </li>
          ) : (
            <li key={o.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-mono text-xs text-ink-muted">
                  {o.namespace}.{o.key} · {LOCALE_LABEL[o.locale]}
                </p>
                <p className="text-sm font-semibold text-ink">{o.value}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={() => setEditingId(o.id)} className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-ink-soft hover:bg-fog">
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Remove this override? The site will fall back to the default text.")) return;
                    startTransition(async () => {
                      await deleteTranslationOverride(o.id);
                      router.refresh();
                    });
                  }}
                  className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-danger hover:bg-fog"
                >
                  Remove
                </button>
              </div>
            </li>
          )
        )}
        {overrides.length === 0 && <li className="p-4 text-sm text-ink-muted">No overrides yet — the site is using its default text everywhere.</li>}
      </ul>

      {adding ? (
        <div>
          <OverrideForm
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
          />
          <button type="button" onClick={() => setAdding(false)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="w-fit rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:bg-fog">
          + Add override
        </button>
      )}
    </div>
  );
}
