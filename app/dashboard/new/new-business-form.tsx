"use client";

import { useActionState } from "react";
import { createBusinessForCurrentUser } from "@/lib/actions/dashboard-context";
import type { ActionState } from "@/lib/actions/business";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewBusinessForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBusinessForCurrentUser, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <Field label="Business name" htmlFor="businessName" required>
        <TextInput id="businessName" name="businessName" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create business"}
      </Button>
    </form>
  );
}
