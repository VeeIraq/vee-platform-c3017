import { Link } from "next-view-transitions";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dir, isLocale } from "@/lib/i18n/config";
import { getDictionary, t } from "@/lib/i18n/dictionaries";
import { buttonClass } from "@/components/ui/button";

// Renders whenever notFound() is called (used throughout app/[username]/*,
// app/d/[serial]/, etc.) or a route simply doesn't match. Server Component,
// so it reads the locale cookie directly rather than needing useLocale() --
// this file already renders inside RootLayout's <LocaleProvider>, but there
// is no interactivity here that would require a Client Component.
export default async function NotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const tt = (path: string) => t(dict, `errors.${path}`);

  return (
    <div dir={dir(locale)} className="flex min-h-screen flex-col items-center justify-center bg-fog px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">{tt("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{tt("notFoundBody")}</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        {tt("backHome")}
      </Link>
    </div>
  );
}
