"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Sets the visitor's chosen language. For a logged-in user this also
 * updates `profiles.locale` (per the brief: "store the selected language in
 * the user profile for logged-in users, and locally for visitors") — the
 * cookie remains the source of truth for the current request/device, the
 * profile column is what a signed-in user's *next* device/session picks up.
 */
async function applyLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ locale }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
}

/**
 * Progressive-enhancement entry point for a plain `<form action={setLocale}>`.
 * Needed for the no-JS case, where the browser does a real POST and relies
 * on the 303 redirect to show the result.
 *
 * When JS *is* available, prefer calling `setLocaleValue` directly from a
 * Client Component and following up with `router.refresh()` — redirecting
 * to the current path from inside a Server Action's implicit client-side
 * navigation does not reliably re-render the root layout's `<html lang
 * dir>` attributes in this Next.js version (the router treats a redirect
 * back to the already-active URL as a no-op), so relying on `redirect()`
 * alone silently leaves the page in the old language until a hard reload.
 */
export async function setLocale(formData: FormData) {
  const localeValue = formData.get("locale");
  const returnTo = (formData.get("returnTo") as string) || "/";
  if (typeof localeValue !== "string" || !isLocale(localeValue)) {
    redirect(returnTo);
  }
  await applyLocale(localeValue);
  redirect(returnTo);
}

/**
 * Client-callable entry point — see components/public/language-switcher.tsx
 * and components/i18n/language-gate.tsx. Call this directly from a Client
 * Component (inside a transition) and then call `router.refresh()`; that
 * combination reliably updates the root layout, unlike `redirect()` to the
 * same path.
 */
export async function setLocaleValue(locale: string) {
  if (!isLocale(locale)) return;
  await applyLocale(locale);
}
