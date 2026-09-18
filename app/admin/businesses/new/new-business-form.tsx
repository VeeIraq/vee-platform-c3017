"use client";

import { useActionState } from "react";
import { createBusinessAsAdmin, type ActionState } from "@/lib/actions/admin";
import { Field, TextInput, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewBusinessForm({ plans }: { plans: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBusinessAsAdmin, undefined);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}

      <Field label="Business name (English)" htmlFor="nameEn" required>
        <TextInput id="nameEn" name="nameEn" required />
      </Field>
      <Field label="Business name (Arabic)" htmlFor="nameAr" hint="Falls back to the English name if left blank">
        <TextInput id="nameAr" name="nameAr" dir="rtl" />
      </Field>
      <Field label="Business name (Kurdish)" htmlFor="nameKu" hint="Falls back to the English name if left blank">
        <TextInput id="nameKu" name="nameKu" dir="rtl" />
      </Field>
      <Field label="Username (optional)" htmlFor="username" hint="This becomes vee.iq/username. Leave blank to generate one from the name.">
        <TextInput id="username" name="username" placeholder="e.g. vee-cafe" />
      </Field>
      <Field label="Plan" htmlFor="planId" required>
        <Select id="planId" name="planId" required defaultValue="">
          <option value="" disabled>
            Choose a plan…
          </option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create business"}
      </Button>
    </form>
  );
}
