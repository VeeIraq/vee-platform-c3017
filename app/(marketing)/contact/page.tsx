import type { Metadata } from "next";
import { Suspense } from "react";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { COMPANY_WHATSAPP_NUMBER } from "@/lib/company";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerDictionary();
  return { title: t(dict, "contact.title"), description: t(dict, "contact.sub") };
}

export default async function ContactPage() {
  const { dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);
  const contactFormOn = await isFeatureEnabled("contact_forms");

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent-3">{tt("contact.eyebrow")}</p>
          <h1 className="text-4xl font-extrabold text-ink">{tt("contact.title")}</h1>
          <p className="mt-2 font-semibold text-ink-soft">{tt("contact.tagline")}</p>
          <p className="mt-4 max-w-md text-ink-muted">{tt("contact.sub")}</p>

          <div className="mt-8 rounded-[var(--radius-md)] border border-line bg-fog p-5">
            <h2 className="font-bold text-ink">{tt("contact.waTitle")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{tt("contact.waDesc")}</p>
            <a
              href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-bold text-accent hover:underline"
            >
              {tt("contact.waBtn")} →
            </a>
          </div>
        </div>

        {contactFormOn ? (
          <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-fog" />}>
            <ContactForm />
          </Suspense>
        ) : (
          <div className="flex h-fit flex-col gap-2 rounded-[var(--radius-lg)] border border-line bg-fog p-6 text-sm text-ink-muted">
            <p>{tt("contact.formUnavailable")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
