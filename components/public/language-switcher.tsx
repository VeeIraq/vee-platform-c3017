"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLocaleValue } from "@/lib/actions/locale";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/components/i18n/locale-provider";

export function LanguageSwitcher() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function choose(code: Locale) {
    setOpen(false);
    if (code === locale) return;
    startTransition(async () => {
      await setLocaleValue(code);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("meta.switchLanguage")}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-2 text-sm font-semibold text-ink hover:border-ink disabled:opacity-60"
      >
        <span aria-hidden="true">🌐</span>
        {t("meta.langShort")}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 z-20 mt-2 min-w-[9rem] rounded-[var(--radius-md)] border border-line bg-paper p-1.5 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              lang={code}
              role="menuitem"
              onClick={() => choose(code)}
              disabled={isPending}
              className={`block w-full rounded-[var(--radius-sm)] px-3 py-2 text-start text-sm hover:bg-fog disabled:opacity-60 ${
                code === locale ? "font-bold text-accent" : "text-ink"
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
