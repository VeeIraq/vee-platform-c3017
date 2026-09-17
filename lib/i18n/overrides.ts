import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "./config";

/**
 * Super Admin-editable text overrides layered on top of the static EN/AR/KU
 * dictionaries at runtime (translation_overrides table), so a copy fix never
 * requires a code deploy. Row shape: { namespace, key, locale, value } with
 * a unique (namespace, key, locale) -- the dotted dictionary path used by
 * t(dict, path) is reassembled as `${namespace}.${key}`.
 *
 * Cached per-request (React cache()) same as lib/auth/dal.ts, so multiple
 * calls within one render pass cost a single query.
 */
export const getTranslationOverrides = cache(async (locale: Locale): Promise<Record<string, string>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("translation_overrides")
      .select("namespace, key, value")
      .eq("locale", locale);
    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) {
      map[`${row.namespace}.${row.key}`] = row.value;
    }
    return map;
  } catch {
    // Never let an override-fetch failure break the page -- fall back to
    // the static dictionary untouched.
    return {};
  }
});

function setDeep(obj: Record<string, unknown>, path: string, value: string) {
  const parts = path.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = cursor[part];
    if (typeof next !== "object" || next === null) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

/**
 * Returns a copy of `dict` with every override applied at its dotted path.
 * Never mutates the shared static dictionary singleton (it's a module-level
 * object reused across every request) -- always clones first.
 */
export function applyTranslationOverrides<T extends Record<string, unknown>>(
  dict: T,
  overrides: Record<string, string>
): T {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return dict;

  const merged = structuredClone(dict) as Record<string, unknown>;
  for (const [path, value] of entries) {
    setDeep(merged, path, value);
  }
  return merged as T;
}
