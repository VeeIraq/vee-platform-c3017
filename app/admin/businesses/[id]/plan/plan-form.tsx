"use client";

import { useActionState } from "react";
import { setBusinessPlan, type ActionState } from "@/lib/actions/admin";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function PlanForm({
  businessId,
  currentPlanId,
  plans,
}: {
  businessId: string;
  currentPlanId: string | null;
  plans: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setBusinessPlan, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="planId" className="text-sm font-semibold text-ink-soft">
          Plan
        </label>
        <Select id="planId" name="planId" defaultValue={currentPlanId ?? ""} className="min-w-56">
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change plan"}
      </Button>
      {state?.error && <p role="alert" className="w-full text-sm font-medium text-danger">{state.error}</p>}
      {state?.success && <p role="status" className="w-full text-sm font-medium text-success">Plan updated.</p>}
    </form>
  );
}
