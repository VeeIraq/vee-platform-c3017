"use client";

import { useActionState } from "react";
import { saveTranslationOverride, type ActionState } from "@/lib/actions/cms";

export function OverrideForm({
  initial,
  onDone,
}: {
  initial?: { namespace: string; key: string; locale: "en" | "ar" | "ku"; value: string };
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await saveTranslationOverride(prev, formData);
    if (result?.success) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-xs font-medium text-accent-3">
          Saved. This text updates on the site immediately.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Namespace
          <input name="namespace" defaultValue={initial?.namespace} required placeholder="nav" className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Key
          <input name="key" defaultValue={initial?.key} required placeholder="home" className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Language
          <select name="locale" defaultValue={initial?.locale ?? "en"} className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="ku">Kurdish</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Text
          <input name="value" defaultValue={initial?.value} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <p className="text-xs text-ink-muted">
        Namespace + key together are the dictionary path shown throughout the site, e.g. namespace <code>nav</code>{" "}
        + key <code>home</code> overrides the header&apos;s &quot;Home&quot; link text (<code>nav.home</code>).
      </p>
      <button type="submit" disabled={pending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save override"}
      </button>
    </form>
  );
}
