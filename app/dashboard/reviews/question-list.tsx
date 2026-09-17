"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { saveReviewQuestion, deleteReviewQuestion, reorderReviewQuestions, type ActionState } from "@/lib/actions/reviews";

export type QuestionListItem = { id: string; prompt: Record<"en" | "ar" | "ku", string>; sortOrder: number };

export function QuestionList({
  businessId,
  questions,
  canManage,
}: {
  businessId: string;
  questions: QuestionListItem[];
  canManage: boolean;
}) {
  const [list, setList] = useState(() => [...questions].sort((a, b) => a.sortOrder - b.sortOrder));
  const [editingId, setEditingId] = useState<string | null>(null);
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
      await reorderReviewQuestions(businessId, next.map((q) => q.id));
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      <div className="mb-3">
        <h2 className="text-lg font-extrabold text-ink">Questions</h2>
        <p className="text-sm text-ink-muted">Every question always collects a 1–5 star rating. Add as many as you need, in any order.</p>
      </div>

      <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
        {list.map((q, i) =>
          editingId === q.id ? (
            <li key={q.id} className="p-4">
              <QuestionForm
                businessId={businessId}
                question={q}
                onDone={(saved) => {
                  setEditingId(null);
                  if (saved) setList((prev) => prev.map((p) => (p.id === q.id ? { ...p, prompt: saved } : p)));
                  router.refresh();
                }}
              />
              <button type="button" onClick={() => setEditingId(null)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
                Cancel
              </button>
            </li>
          ) : (
            <li key={q.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2">
                {canManage && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={pending || i === 0}
                      onClick={() => move(i, -1)}
                      aria-label="Move up"
                      className="flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={pending || i === list.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Move down"
                      className="flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-fog disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                )}
                <p className="text-sm font-semibold text-ink">{q.prompt.en}</p>
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(q.id)}
                    className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-ink-soft hover:bg-fog"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Delete this question? Past responses to it are kept.")) return;
                      setList((prev) => prev.filter((p) => p.id !== q.id));
                      startTransition(async () => {
                        await deleteReviewQuestion(q.id, businessId);
                        router.refresh();
                      });
                    }}
                    className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2 text-xs font-semibold text-danger hover:bg-fog"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          )
        )}
        {list.length === 0 && <li className="p-3 text-sm text-ink-muted">No questions yet — add one below.</li>}
      </ul>

      {canManage &&
        (adding ? (
          <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-line p-4">
            <QuestionForm
              businessId={businessId}
              onDone={(saved) => {
                setAdding(false);
                if (saved) router.refresh();
              }}
            />
            <button type="button" onClick={() => setAdding(false)} className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 w-fit rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-fog"
          >
            + Add question
          </button>
        ))}
    </div>
  );
}

function QuestionForm({
  businessId,
  question,
  onDone,
}: {
  businessId: string;
  question?: QuestionListItem;
  onDone?: (saved?: Record<"en" | "ar" | "ku", string>) => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await saveReviewQuestion(prev, formData);
    if (result?.success) {
      onDone?.({
        en: String(formData.get("promptEn") ?? ""),
        ar: String(formData.get("promptAr") || formData.get("promptEn") || ""),
        ku: String(formData.get("promptKu") || formData.get("promptEn") || ""),
      });
    }
    return result;
  }, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {question?.id && <input type="hidden" name="id" value={question.id} />}
      <input type="hidden" name="businessId" value={businessId} />
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (English)
          <input
            name="promptEn"
            defaultValue={question?.prompt.en}
            required
            placeholder="How was our service?"
            className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (Arabic)
          <input
            name="promptAr"
            dir="rtl"
            defaultValue={question?.prompt.ar}
            className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Question (Kurdish)
          <input
            name="promptKu"
            dir="rtl"
            defaultValue={question?.prompt.ku}
            className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : question ? "Save changes" : "Add question"}
      </button>
    </form>
  );
}
