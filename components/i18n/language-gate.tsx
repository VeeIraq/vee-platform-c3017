"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleValue } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/config";

const CHOICES: { locale: Locale; label: string; sub: string }[] = [
  { locale: "en", label: "English", sub: "Continue in English" },
  { locale: "ar", label: "العربية", sub: "المتابعة بالعربية" },
  { locale: "ku", label: "کوردی", sub: "بەردەوامبوون بە کوردی" },
];

/**
 * First-visit language chooser. Only rendered when no `vee-lang` cookie is
 * present (see app/layout.tsx) — once a visitor picks a language it's
 * stored for a year, matching the original site's localStorage-based
 * behaviour, now server-persisted so it also survives across devices for
 * logged-in users (see lib/actions/locale.ts).
 *
 * Calls the server action directly and follows up with `router.refresh()`
 * rather than submitting a form that redirects back to the same path —
 * see the comment on `setLocale` in lib/actions/locale.ts for why the
 * redirect-to-same-path approach doesn't reliably update `<html lang dir>`.
 */
export function LanguageGate() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    startTransition(async () => {
      await setLocaleValue(locale);
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink p-6"
    >
      <div className="w-full max-w-sm text-center">
        <Image src="/brand/vee-logo-white.png" alt="" width={128} height={44} priority className="mx-auto mb-6" />
        <h1 id="lang-gate-title" className="mb-2 text-xl font-extrabold text-white">
          Choose your language · اختر لغتك · زمانەکەت هەڵبژێرە
        </h1>
        <p className="mb-8 text-sm text-paper-muted">Vee — your business, one tap away.</p>
        <div className="flex flex-col gap-3">
          {CHOICES.map((choice) => (
            <button
              key={choice.locale}
              type="button"
              lang={choice.locale}
              disabled={isPending}
              onClick={() => choose(choice.locale)}
              className="w-full rounded-[var(--radius-md)] border border-line-dark bg-ink-soft px-5 py-4 text-start text-white transition-colors hover:[background:var(--accent-grad)] hover:border-transparent focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline disabled:opacity-60"
            >
              <span className="block text-lg font-bold">{choice.label}</span>
              <span className="block text-sm text-paper-muted">{choice.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
