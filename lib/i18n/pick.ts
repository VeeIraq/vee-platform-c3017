import type { Locale } from "./config";

/** Picks the current-locale value out of a `{ en, ar, ku }`-shaped jsonb field, falling back to English. */
export function pick(field: Partial<Record<Locale, string>> | null | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale] || field.en || "";
}
