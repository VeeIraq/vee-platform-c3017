"use client";

import { useActionState } from "react";
import { inviteBusinessOwnerAsAdmin, type ActionState } from "@/lib/actions/admin";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function AssignOwnerForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteBusinessOwnerAsAdmin, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-warning bg-warning-bg/40 p-5">
      <div>
        <p className="font-bold text-ink">This business has no owner yet</p>
        <p className="text-xs text-ink-muted">
          Invite the person who&apos;ll actually run it. They&apos;ll get an email to set a password and sign in — from
          then on, they see only their own business, on whatever plan and features you&apos;ve set for it.
        </p>
      </div>
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm font-medium text-success">Invitation sent.</p>}
      <input type="hidden" name="businessId" value={businessId} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Owner's email" htmlFor="ownerEmail" required>
          <TextInput id="ownerEmail" name="email" type="email" required className="min-w-64" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Invite as owner"}
        </Button>
      </div>
    </form>
  );
}
