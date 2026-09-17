"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewSubmissionStatus } from "@/lib/actions/reviews";

export type ResultsQuestion = { id: string; prompt: Record<"en" | "ar" | "ku", string> };
export type ResultsSubmission = {
  id: string;
  ratings: Record<string, number>;
  averageRating: number;
  comment: string | null;
  status: string;
  createdAt: string;
};
export type ReviewResultsData = {
  totalCount: number;
  overallAverage: number | null;
  questionAverages: { questionId: string; average: number | null; count: number }[];
  submissions: ResultsSubmission[];
};

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value.toFixed(1)} out of 5 stars`} className="text-warning">
      {"★".repeat(Math.round(value))}
      <span className="text-line">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function ReviewResultsPanel({
  businessId,
  results,
  questions,
  canManage,
}: {
  businessId: string;
  results: ReviewResultsData;
  questions: ResultsQuestion[];
  canManage: boolean;
}) {
  const [submissions, setSubmissions] = useState(results.submissions);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const questionLabel = (id: string) => questions.find((q) => q.id === id)?.prompt.en ?? "Question";

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink">Results</h2>
          <p className="text-sm text-ink-muted">{results.totalCount} response{results.totalCount === 1 ? "" : "s"} total.</p>
        </div>
        {canManage && results.totalCount > 0 && (
          <a
            href={`/dashboard/reviews/export?businessId=${businessId}`}
            className="min-h-9 rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-fog"
          >
            Export CSV
          </a>
        )}
      </div>

      {results.overallAverage !== null && (
        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] bg-fog px-4 py-3">
          <span className="text-2xl font-extrabold text-ink">{results.overallAverage.toFixed(1)}</span>
          <Stars value={results.overallAverage} />
          <span className="text-xs text-ink-muted">overall average</span>
        </div>
      )}

      {results.questionAverages.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {results.questionAverages.map((qa) => (
            <li key={qa.questionId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-soft">{questionLabel(qa.questionId)}</span>
              <span className="flex items-center gap-2 font-semibold text-ink">
                {qa.average !== null ? (
                  <>
                    {qa.average.toFixed(1)} <Stars value={qa.average} />
                  </>
                ) : (
                  <span className="text-ink-muted">No responses yet</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">Individual responses</h3>
      <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
        {submissions.map((s) => (
          <li key={s.id} className={`flex flex-col gap-1.5 p-3 ${s.status === "hidden" ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                {s.averageRating.toFixed(1)} <Stars value={s.averageRating} />
              </span>
              <span className="text-xs text-ink-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
            {s.comment && <p className="text-sm text-ink-soft">{s.comment}</p>}
            {canManage && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const nextStatus = s.status === "published" ? "hidden" : "published";
                  setSubmissions((prev) => prev.map((p) => (p.id === s.id ? { ...p, status: nextStatus } : p)));
                  startTransition(async () => {
                    await setReviewSubmissionStatus(s.id, businessId, nextStatus);
                    router.refresh();
                  });
                }}
                className="mt-1 w-fit text-xs font-semibold text-ink-muted hover:text-ink"
              >
                {s.status === "published" ? "Hide from average" : "Restore"}
              </button>
            )}
          </li>
        ))}
        {submissions.length === 0 && <li className="p-3 text-sm text-ink-muted">No responses yet.</li>}
      </ul>
    </div>
  );
}
