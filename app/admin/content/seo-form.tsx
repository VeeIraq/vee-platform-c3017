"use client";

import { useActionState } from "react";
import { saveHomepageSeo, type ActionState } from "@/lib/actions/cms";

type Seo = { title: { en: string; ar: string; ku: string }; description: { en: string; ar: string; ku: string } };

export function SeoForm({ seo }: { seo: Seo }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveHomepageSeo, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-xs font-medium text-accent-3">
          Saved.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO title (English)
          <input name="titleEn" defaultValue={seo.title.en} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO title (Arabic)
          <input name="titleAr" dir="rtl" defaultValue={seo.title.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO title (Kurdish)
          <input name="titleKu" dir="rtl" defaultValue={seo.title.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO description (English)
          <textarea name="descriptionEn" defaultValue={seo.description.en} required rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO description (Arabic)
          <textarea name="descriptionAr" dir="rtl" defaultValue={seo.description.ar} rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          SEO description (Kurdish)
          <textarea name="descriptionKu" dir="rtl" defaultValue={seo.description.ku} rows={3} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save SEO"}
      </button>
    </form>
  );
}
