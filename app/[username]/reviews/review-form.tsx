"use client";

import { useActionState, useState } from "react";
import { submitReview, type SubmitReviewResult } from "@/lib/actions/reviews";
import { t } from "@/lib/i18n/dictionaries";
import { TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Question = { id: string; prompt: string };

function StarRating({ questionId, value, onChange, ariaLabelTemplate }: {
  questionId: string;
  value: number;
  onChange: (v: number) => void;
  ariaLabelTemplate: string;
}) {
  return (
    <div role="radiogroup" className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={ariaLabelTemplate.replace("{n}", String(n))}
          onClick={() => onChange(n)}
          className="min-h-11 min-w-11 text-2xl leading-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline"
        >
          <span aria-hidden="true" className={n <= value ? "text-warning" : "text-line"}>
            ★
          </span>
        </button>
      ))}
      {/* Hidden inputs are what actually reach the Server Action -- the
          star buttons above are pure UI state, not <input type="radio">,
          since a 5-way radio group per question is awkward to style
          consistently with the rest of this app's form components. */}
      <input type="hidden" name={`rating_${questionId}`} value={value || ""} />
    </div>
  );
}

export function ReviewForm({
  businessId,
  reviewPageId,
  questions,
  dict,
}: {
  businessId: string;
  reviewPageId: string;
  questions: Question[];
  dict: unknown;
}) {
  const tt = (path: string) => t(dict, `reviewPage.${path}`);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [state, action, pending] = useActionState<SubmitReviewResult, FormData>(submitReview, undefined);

  if (state?.success) {
    return (
      <p role="status" className="rounded-[var(--radius-md)] bg-success-bg px-4 py-4 text-center text-sm font-semibold text-success">
        {tt("thankYou")}
      </p>
    );
  }

  const allRated = questions.length > 0 && questions.every((q) => ratings[q.id] > 0);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="reviewPageId" value={reviewPageId} />
      {/* Honeypot: off-screen (not display:none, which some bots skip when
          filling forms) rather than removed from the tab order in a way
          that would also hide it from a screen reader user who tabs
          through -- aria-hidden + tabIndex=-1 keeps it out of both. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">{q.prompt}</p>
          <StarRating
            questionId={q.id}
            value={ratings[q.id] ?? 0}
            onChange={(v) => setRatings((prev) => ({ ...prev, [q.id]: v }))}
            ariaLabelTemplate={tt("starAriaLabel")}
          />
        </div>
      ))}

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
        {tt("commentLabel")}
        <TextArea name="comment" placeholder={tt("commentPlaceholder")} maxLength={2000} />
      </label>

      <Button type="submit" disabled={pending || !allRated}>
        {pending ? tt("submitting") : tt("submit")}
      </Button>
      {!allRated && questions.length > 0 && <p className="text-xs text-ink-muted">{tt("selectRating")}</p>}
    </form>
  );
}
