"use client";

import { Link } from "next-view-transitions";
import { useActionState } from "react";
import { requestPasswordReset, type AuthFormState } from "@/lib/actions/auth";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function ResetForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(requestPasswordReset, undefined);
  const submitted = state !== undefined && !state.error;

  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <p role="status" className="rounded-[var(--radius-sm)] bg-success-bg px-4 py-3 text-sm font-medium text-success">
          {t("auth.resetSent")}
        </p>
        <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <Field label={t("auth.email")} htmlFor="email" required>
        <TextInput id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("auth.sendResetLink")}
      </Button>
    </form>
  );
}
