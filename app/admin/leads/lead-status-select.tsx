"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/admin";

const STATUSES = ["new", "contacted", "qualified", "closed"] as const;

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await updateLeadStatus(leadId, e.target.value as (typeof STATUSES)[number]);
          router.refresh();
        })
      }
      className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-xs font-semibold"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
