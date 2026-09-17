"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPlan, type ActionState } from "@/lib/actions/cms";

/**
 * Deliberately minimal -- id + English name is enough to create the row.
 * Everything else (pricing, tagline, CTA text, features, active/popular)
 * gets filled in on the full PlanForm that appears for it once created,
 * same as every other plan. New plans start inactive (hidden from the
 * public site) so there's no window where a half-filled-in plan is live.
 */
export function NewPlanForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPlan, undefined);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-line bg-fog p-5 lg:col-span-2"
    >
      <h3 className="text-lg font-extrabold text-ink">Add a new plan</h3>
      <p className="text-xs text-ink-muted">
        Starts inactive (hidden from the public site) — fill in pricing, tagline and features below, then check
        &quot;Active&quot; to publish it.
      </p>
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Plan ID
          <input
            name="id"
            placeholder="vee_enterprise"
            required
            pattern="[a-z][a-z0-9_]*"
            title="Lowercase letters, numbers and underscores, starting with a letter"
            className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Name (English)
          <input name="nameEn" required className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Adding…" : "Add plan"}
      </button>
    </form>
  );
}
