"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/lib/actions/auth";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function SignupForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <Field label={t("auth.fullName")} htmlFor="fullName" required>
        <TextInput id="fullName" name="fullName" required autoComplete="name" />
      </Field>
      <Field label={t("auth.businessName")} htmlFor="businessName" required>
        <TextInput id="businessName" name="businessName" required />
      </Field>
      <Field label={t("auth.email")} htmlFor="email" required>
        <TextInput id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t("auth.password")} htmlFor="password" required hint="At least 8 characters, with a letter and a number.">
        <TextInput id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>
    </form>
  );
}
