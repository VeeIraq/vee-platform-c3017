"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteStaffMember, removeStaffMember, type ActionState } from "@/lib/actions/staff";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const PERMISSIONS = [
  { key: "profile.edit", label: "Edit business profile" },
  { key: "menu.edit", label: "Edit menu" },
  { key: "locations.edit", label: "Edit locations" },
  { key: "devices.edit", label: "Manage NFC devices" },
  { key: "orders.view", label: "View orders" },
  { key: "analytics.view", label: "View analytics" },
  { key: "media.upload", label: "Upload images" },
  { key: "reviews.manage", label: "Manage the review page" },
];

type Member = { id: string; role: string; permissions: string[]; invited_email: string | null; accepted_at: string | null };

export function StaffManager({ businessId, members, canManage }: { businessId: string; members: Member[]; canManage: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteStaffMember, undefined);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2.5">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
            <div>
              <p className="font-semibold text-ink">
                {m.invited_email ?? "Owner"} {m.role === "owner" && <span className="ms-1 text-xs font-bold text-accent">OWNER</span>}
              </p>
              <p className="text-xs text-ink-muted">
                {m.role === "owner" ? "Full access" : m.permissions.length > 0 ? m.permissions.join(", ") : "No permissions granted yet"}
                {" · "}
                {m.accepted_at ? "Active" : "Invitation pending"}
              </p>
            </div>
            {canManage && m.role !== "owner" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(() => {
                    removeStaffMember(m.id, businessId);
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <form action={action} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
          <input type="hidden" name="businessId" value={businessId} />
          <h2 className="font-bold text-ink">Invite staff</h2>
          {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
          {state?.success && <p role="status" className="text-sm font-medium text-success">Invitation sent.</p>}
          <Field label="Email" htmlFor="staffEmail" required>
            <TextInput id="staffEmail" name="email" type="email" required />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">Permissions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" name="permissions" value={p.key} className="h-4 w-4" />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      )}
    </div>
  );
}
