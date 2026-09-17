import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import { getTranslationOverrides, applyTranslationOverrides } from "./overrides";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerDictionary() {
  const locale = await getServerLocale();
  const base = getDictionary(locale);
  const overrides = await getTranslationOverrides(locale);
  const dict = applyTranslationOverrides(base, overrides);
  return { locale, dict };
}
