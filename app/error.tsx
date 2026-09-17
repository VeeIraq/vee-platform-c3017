"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { dir } from "@/lib/i18n/config";
import { buttonClass } from "@/components/ui/button";

// Catches a thrown error anywhere below RootLayout (Next.js's error
// boundary convention: must be a Client Component, receives error + reset).
// Renders inside RootLayout, so <LocaleProvider> is already available --
// unlike global-error.tsx below, which fires only if the root layout itself
// throws and therefore can't rely on any provider.
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale, t } = useLocale();

  useEffect(() => {
    // No error-tracking SaaS is wired into this app yet (see the launch
    // audit) -- this is the one place to plug a Sentry/etc. captureException
    // call in once that's added. Logged to the console in the meantime so
    // it isn't silently swallowed.
    console.error(error);
  }, [error]);

  return (
    <div dir={dir(locale)} className="flex min-h-screen flex-col items-center justify-center bg-fog px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-danger">{t("errors.errorTitle")}</p>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{t("errors.errorBody")}</p>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={reset} className={buttonClass("primary", "md")}>
          {t("errors.tryAgain")}
        </button>
        <Link href="/" className={buttonClass("outline", "md")}>
          {t("errors.backHome")}
        </Link>
      </div>
    </div>
  );
}
