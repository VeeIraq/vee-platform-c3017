"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitLead, type LeadFormState } from "@/lib/actions/leads";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { COMPANY_WHATSAPP_NUMBER } from "@/lib/company";

const PLAN_IDS = ["vee_start", "vee_business", "vee_pro", "vee_custom"];

export function ContactForm() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get("plan") ?? "";
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, undefined);

  if (state?.success) {
    return (
      <div role="status" className="rounded-[var(--radius-md)] border border-line bg-paper p-8 text-center">
        <h2 className="text-xl font-extrabold text-ink">{t("contact.thankYouTitle")}</h2>
        <p className="mt-2 text-ink-muted">{t("contact.thankYouDesc")}</p>
        <a
          href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block font-bold text-accent hover:underline"
        >
          {t("contact.thankYouWa")}
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-line bg-paper p-6 sm:p-8">
      <h2 className="text-xl font-extrabold text-ink">{t("contact.formTitle")}</h2>

      {/* Honeypot — hidden from real users, catches naive bots */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("contact.formName")} htmlFor="name" required>
          <TextInput id="name" name="name" placeholder={t("contact.formNamePh")} required autoComplete="name" />
        </Field>
        <Field label={t("contact.formBusiness")} htmlFor="businessName" required>
          <TextInput id="businessName" name="businessName" placeholder={t("contact.formBusinessPh")} required />
        </Field>
        <Field label={t("contact.formType")} htmlFor="businessType">
          <TextInput id="businessType" name="businessType" placeholder={t("contact.formTypePh")} />
        </Field>
        <Field label={t("contact.formPhone")} htmlFor="phone" required>
          <TextInput id="phone" name="phone" type="tel" placeholder={t("contact.formPhonePh")} required autoComplete="tel" />
        </Field>
        <Field label={t("contact.formWhatsapp")} htmlFor="whatsapp">
          <TextInput id="whatsapp" name="whatsapp" type="tel" placeholder={t("contact.formWhatsappPh")} />
        </Field>
        <Field label={t("contact.formInstagram")} htmlFor="instagram">
          <TextInput id="instagram" name="instagram" placeholder={t("contact.formInstagramPh")} />
        </Field>
        <Field label={t("contact.formBranches")} htmlFor="branches">
          <TextInput id="branches" name="branches" type="number" min={1} placeholder={t("contact.formBranchesPh")} />
        </Field>
        <Field label={t("contact.formPlan")} htmlFor="plan">
          <Select id="plan" name="plan" defaultValue={defaultPlan}>
            <option value="">{t("contact.formPlanChoose")}</option>
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {id.replace("vee_", "Vee ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <input type="hidden" name="language" value={locale} />

      <Field label={t("contact.formMessage")} htmlFor="message">
        <TextArea id="message" name="message" placeholder={t("contact.formMessagePh")} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "…" : t("contact.submit")}
      </Button>
      <p className="text-xs text-ink-muted">{t("contact.note")}</p>
    </form>
  );
}
