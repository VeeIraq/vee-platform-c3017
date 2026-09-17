"use client";

import { useActionState, useState } from "react";
import { saveReviewPageConfig, type ActionState } from "@/lib/actions/reviews";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export type ReviewPageConfig = {
  enabled: boolean;
  title: Record<"en" | "ar" | "ku", string>;
  intro: Record<"en" | "ar" | "ku", string>;
} | null;

export function ReviewPageForm({ businessId, page, canManage }: { businessId: string; page: ReviewPageConfig; canManage: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveReviewPageConfig, undefined);
  const [tab, setTab] = useState<"en" | "ar" | "ku">("en");

  return (
    <form action={action} className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      <input type="hidden" name="businessId" value={businessId} />
      <div>
        <h2 className="text-lg font-extrabold text-ink">Review page</h2>
        <p className="text-sm text-ink-muted">
          An optional page at vee.iq/&#123;username&#125;/reviews where customers rate your business. Linked from your profile alongside
          Menu and Instagram when turned on below.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-[var(--radius-sm)] bg-success-bg px-4 py-3 text-sm font-medium text-success">
          Saved.
        </p>
      )}

      <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-ink-soft">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={page?.enabled ?? false}
          disabled={!canManage}
          className="h-5 w-5 rounded border-line"
        />
        Show the review page on my public profile
      </label>

      <div role="tablist" aria-label="Language" className="flex gap-2">
        {(["en", "ar", "ku"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={tab === lang}
            onClick={() => setTab(lang)}
            className={`min-h-9 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              tab === lang ? "border-accent bg-accent text-white" : "border-line text-ink-soft"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {(["en", "ar", "ku"] as const).map((lang) => {
        const suffix = lang === "en" ? "En" : lang === "ar" ? "Ar" : "Ku";
        return (
          <div key={lang} hidden={tab !== lang} className="flex flex-col gap-4">
            <Field label={`Title (${lang.toUpperCase()})`} htmlFor={`title${lang}`} required={lang === "en"}>
              <TextInput
                id={`title${lang}`}
                name={`title${suffix}`}
                defaultValue={page?.title?.[lang] ?? (lang === "en" ? "Rate your experience" : "")}
                required={lang === "en"}
                disabled={!canManage}
                dir={lang === "en" ? "ltr" : "rtl"}
              />
            </Field>
            <Field label={`Introduction (${lang.toUpperCase()})`} htmlFor={`intro${lang}`} hint="Optional — shown above the questions.">
              <TextArea
                id={`intro${lang}`}
                name={`intro${suffix}`}
                defaultValue={page?.intro?.[lang] ?? ""}
                disabled={!canManage}
                dir={lang === "en" ? "ltr" : "rtl"}
              />
            </Field>
          </div>
        );
      })}

      {canManage && (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save"}
        </Button>
      )}
    </form>
  );
}
