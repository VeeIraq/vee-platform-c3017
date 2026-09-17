"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFaqItem, toggleFaqVisibility, deleteFaqItem, reorderFaqItems, type ActionState } from "@/lib/actions/cms";

type Faq = {
  key: string;
  visible: boolean;
  sortOrder: number;
  q: { en: string; ar: string; ku: string };
  a: { en: string; ar: string; ku: string };
};

function FaqForm({ faq, onDone }: { faq?: Faq; onDone?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await saveFaqItem(prev, formData);
    if (result?.success) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {faq && <input type="hidden" name="key" value={faq.key} />}
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (English)
          <input name="qEn" defaultValue={faq?.q.en} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (Arabic)
          <input name="qAr" dir="rtl" defaultValue={faq?.q.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (Kurdish)
          <input name="qKu" dir="rtl" defaultValue={faq?.q.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Answer (English)
          <textarea name="aEn" defaultValue={faq?.a.en} required rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Answer (Arabic)
          <textarea name="aAr" dir="rtl" defaultValue={faq?.a.ar} rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Answer (Kurdish)
          <textarea name="aKu" dir="rtl" defaultValue={faq?.a.ku} rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : faq ? "Save changes" : "Add FAQ item"}
      </button>
    </form>
  );
}

export function FaqManager({ items }: { items: Faq[] }) {
  const [list, setList] = useState(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function move(index: number, direction: -1 | 1) {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
    startTransition(async () => {
      await reorderFaqItems(next.map((f) => f.key));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper">
        {list.map((faq, i) => (
          <li key={faq.key} className="p-4">
            {editingKey === faq.key ? (
              <div className="flex flex-col gap-3">
                <FaqForm
                  faq={faq}
                  onDone={() => {
                    setEditingKey(null);
                    router.refresh();
                  }}
                />
                <button type="button" onClick={() => setEditingKey(null)} className="w-fit text-xs font-semibold text-ink-muted hover:text-ink">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col pt-0.5">
                    <button
                      type="button"
                      disabled={pending || i === 0}
                      onClick={() => move(i, -1)}
                      aria-label="Move up"
                      className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={pending || i === list.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Move down"
                      className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-ink">{faq.q.en}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">{faq.a.en}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex min-h-11 items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <input
                      type="checkbox"
                      checked={faq.visible}
                      onChange={(e) => {
                        const visible = e.target.checked;
                        setList((prev) => prev.map((f) => (f.key === faq.key ? { ...f, visible } : f)));
                        startTransition(async () => {
                          await toggleFaqVisibility(faq.key, visible);
                          router.refresh();
                        });
                      }}
                    />
                    {faq.visible ? "Visible" : "Draft"}
                  </label>
                  <button type="button" onClick={() => setEditingKey(faq.key)} className="min-h-11 rounded-[var(--radius-sm)] border border-line px-3 text-xs font-semibold text-ink-soft hover:bg-fog">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Delete this FAQ item?")) return;
                      setList((prev) => prev.filter((f) => f.key !== faq.key));
                      startTransition(async () => {
                        await deleteFaqItem(faq.key);
                        router.refresh();
                      });
                    }}
                    className="min-h-11 rounded-[var(--radius-sm)] border border-line px-3 text-xs font-semibold text-danger hover:bg-fog"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="p-4 text-sm text-ink-muted">No FAQ items yet.</li>}
      </ul>

      {adding ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-line bg-paper p-4">
          <FaqForm
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
          />
          <button type="button" onClick={() => setAdding(false)} className="mt-2 w-fit text-xs font-semibold text-ink-muted hover:text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-fit rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-bold text-ink-soft hover:bg-fog"
        >
          + Add FAQ item
        </button>
      )}
    </div>
  );
}
