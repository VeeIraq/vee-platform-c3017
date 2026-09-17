"use client";

import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/lib/actions/auth";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(updatePassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <Field label="New password" htmlFor="password" required hint="At least 8 characters, with a letter and a number.">
        <TextInput id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>
      <Button type="submit" disabled={pending}>
        Set new password
      </Button>
    </form>
  );
}
