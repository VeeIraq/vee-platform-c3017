import type { ReactNode } from "react";

export function LegalPage({
  title,
  updatedLabel,
  draftBanner,
  children,
}: {
  title: string;
  updatedLabel: string;
  draftBanner: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6" lang="en" dir="ltr">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {updatedLabel}: September 2026
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-warning-bg px-4 py-3 text-sm text-warning">
        <span aria-hidden="true">⚠️</span>
        <p>{draftBanner}</p>
      </div>
      <div className="prose prose-headings:font-extrabold prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft mt-8 max-w-none [&>h2]:mt-8 [&>h2]:text-lg [&>p]:mt-2 [&>ul]:mt-2 [&>ul]:list-disc [&>ul]:ps-5 [&>li]:mt-1">
        {children}
      </div>
    </div>
  );
}
