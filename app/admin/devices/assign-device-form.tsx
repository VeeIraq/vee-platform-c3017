"use client";

import { useActionState, useState } from "react";
import { assignDevice, type ActionState } from "@/lib/actions/devices";

type Business = { id: string; username: string; nameEn: string };
type Location = { id: string; businessId: string; nameEn: string };

export function AssignDeviceForm({
  deviceId,
  businesses,
  locations,
  onDone,
}: {
  deviceId: string;
  businesses: Business[];
  locations: Location[];
  onDone?: () => void;
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await assignDevice(prev, formData);
    if (result?.success) onDone?.();
    return result;
  }, undefined);

  const businessLocations = locations.filter((l) => l.businessId === businessId);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-sm)] border border-line bg-fog p-3">
      <input type="hidden" name="deviceId" value={deviceId} />
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Business
        <select
          name="businessId"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          required
          className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink"
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameEn} (@{b.username})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Location (optional)
        <select name="locationId" defaultValue="" className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink">
          <option value="">— No specific location —</option>
          {businessLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Table number (optional)
        <input name="tableNumber" placeholder="e.g. 12" className="w-24 rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
      </label>
      <button type="submit" disabled={pending || !businessId} className="min-h-9 rounded-[var(--radius-sm)] bg-accent px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Assigning…" : "Assign & activate"}
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
