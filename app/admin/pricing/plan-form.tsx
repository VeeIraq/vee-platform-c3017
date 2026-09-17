"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePlan, deletePlan, type ActionState } from "@/lib/actions/cms";
import type { Database } from "@/lib/supabase/types";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

export function PlanForm({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePlan, undefined);
  const [deleteState, setDeleteState] = useState<ActionState>(undefined);
  const [deletePending, startDelete] = useTransition();
  const router = useRouter();

  const name = plan.name as Record<string, string>;
  const tagline = plan.tagline as Record<string, string>;
  const cta = plan.cta as Record<string, string>;
  const features = (Array.isArray(plan.features) ? plan.features : []) as Array<Record<string, string>>;

  function handleDelete() {
    if (!confirm(`Delete the "${name.en}" plan? This can't be undone.`)) return;
    startDelete(async () => {
      const res = await deletePlan(plan.id);
      setDeleteState(res);
      if (res?.success) router.refresh();
    });
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-5">
      <input type="hidden" name="id" value={plan.id} />
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-ink">{name.en}</h3>
        <span className="rounded-full bg-fog px-2.5 py-1 text-xs font-bold text-ink-muted">{plan.id}</span>
      </div>
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
          Name (English)
          <input name="nameEn" defaultValue={name.en} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Name (Arabic)
          <input name="nameAr" dir="rtl" defaultValue={name.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Name (Kurdish)
          <input name="nameKu" dir="rtl" defaultValue={name.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Tagline (English)
          <input name="taglineEn" defaultValue={tagline?.en} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Tagline (Arabic)
          <input name="taglineAr" dir="rtl" defaultValue={tagline?.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Tagline (Kurdish)
          <input name="taglineKu" dir="rtl" defaultValue={tagline?.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Monthly price (IQD, blank = &quot;Contact us&quot;)
          <input name="priceIqd" type="number" min={0} defaultValue={plan.price_iqd ?? ""} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Setup fee (IQD, optional)
          <input name="setupPriceIqd" type="number" min={0} defaultValue={plan.setup_price_iqd ?? ""} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Button text (English)
          <input name="ctaEn" defaultValue={cta?.en} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Button text (Arabic)
          <input name="ctaAr" dir="rtl" defaultValue={cta?.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Button text (Kurdish)
          <input name="ctaKu" dir="rtl" defaultValue={cta?.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Features (English, one per line)
          <textarea name="featuresEn" rows={5} defaultValue={features.map((f) => f.en).join("\n")} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Features (Arabic, one per line)
          <textarea name="featuresAr" dir="rtl" rows={5} defaultValue={features.map((f) => f.ar).join("\n")} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Features (Kurdish, one per line)
          <textarea name="featuresKu" dir="rtl" rows={5} defaultValue={features.map((f) => f.ku).join("\n")} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <p className="text-xs text-ink-muted">Lines are matched by position — line 1 in each column should be the same feature in each language.</p>

      <div className="flex items-center gap-5">
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" name="popular" defaultChecked={plan.popular} />
          Show &quot;Most popular&quot; badge
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" name="active" defaultChecked={plan.active} />
          Active (shown on site)
        </label>
      </div>

      {deleteState?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {deleteState.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={pending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save plan"}
        </button>
        <button
          type="button"
          disabled={deletePending}
          onClick={handleDelete}
          className="w-fit rounded-[var(--radius-sm)] border border-danger px-4 py-2 text-sm font-bold text-danger disabled:opacity-60"
        >
          {deletePending ? "Deleting…" : "Delete plan"}
        </button>
      </div>
    </form>
  );
}
