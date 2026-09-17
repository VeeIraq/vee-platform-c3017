import type { Metadata } from "next";
import { cookies } from "next/headers";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dir, isLocale } from "@/lib/i18n/config";
import { getDictionary, t } from "@/lib/i18n/dictionaries";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { LanguageGate } from "@/components/i18n/language-gate";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return {
    title: { default: t(dict, "meta.title"), template: "%s · Vee" },
    description: t(dict, "meta.description"),
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    openGraph: {
      title: t(dict, "meta.ogTitle"),
      description: t(dict, "meta.ogDescription"),
      type: "website",
      images: ["/brand/og-image.png"],
    },
    icons: { icon: "/brand/vee-mark-square.png" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const hasChosenLocale = isLocale(cookieLocale);
  const locale = hasChosenLocale ? cookieLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={dir(locale)} className={fontVariables}>
      <body>
        <a href="#main" className="skip-link">
          {t(dict, "meta.skipToContent")}
        </a>
        <LocaleProvider locale={locale} dict={dict}>
          {children}
          {!hasChosenLocale && <LanguageGate />}
        </LocaleProvider>
      </body>
    </html>
  );
}
