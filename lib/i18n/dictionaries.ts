import type { Locale } from "./config";
import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";
import ku from "./dictionaries/ku.json";
import content from "./dictionaries/content.json";
import authStrings from "./dictionaries/auth.json";

// The dictionary shape is intentionally loose (nested string/record tree) —
// it mirrors the original TRANSLATIONS.<lang>.<namespace>.<key> structure
// from the static site 1:1, ported verbatim so no marketing/product/legal
// copy was rewritten or lost in the migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary = any;

const RAW: Record<Locale, Dictionary> = { en, ar, ku };
const AUTH = authStrings as Record<Locale, Dictionary>;

// `auth` is a namespace added during the platform rebuild (the original
// static site had no real login). Merged in here rather than editing the
// ported en/ar/ku.json files, so those stay a verbatim copy of the source.
const DICTIONARIES: Record<Locale, Dictionary> = {
  en: { ...RAW.en, auth: AUTH.en },
  ar: { ...RAW.ar, auth: AUTH.ar },
  ku: { ...RAW.ku, auth: AUTH.ku },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export const CONTENT = content as {
  WHY_ITEMS: Array<Record<string, unknown>>;
  BUSINESS_TYPE_ITEMS: Array<Record<string, unknown>>;
  PLAN_ITEMS: Array<Record<string, unknown>>;
  COMPARE_ROWS: Array<Record<string, unknown>>;
  FAQ_ITEMS: Array<Record<string, unknown>>;
};

/**
 * Namespaced string lookup with automatic fallback to English, matching the
 * original `t()` helper in js/core.js. Usage: `t(dict, "nav.home")`.
 */
export function t(dict: Dictionary, path: string, fallbackDict: Dictionary = DICTIONARIES.en): string {
  const walk = (obj: Dictionary): unknown =>
    path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in (acc as object)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);

  const value = walk(dict);
  if (typeof value === "string") return value;
  const fallback = walk(fallbackDict);
  if (typeof fallback === "string") return fallback;
  return path;
}
