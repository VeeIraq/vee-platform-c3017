"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/lib/actions/auth";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function LoginForm({ next, checkEmail }: { next: string; checkEmail: boolean }) {
  const { t } = useLocale();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {checkEmail && (
        <p role="status" className="rounded-[var(--radius-sm)] bg-success-bg px-4 py-3 text-sm font-medium text-success">
          {t("auth.checkEmail")}
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <Field label={t("auth.email")} htmlFor="email" required>
        <TextInput id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t("auth.password")} htmlFor="password" required>
        <TextInput id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset-password" className="font-semibold text-accent hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>
    </form>
  );
}
