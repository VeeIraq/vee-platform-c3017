"use client";

import { useActionState } from "react";
import { createDevice, type ActionState } from "@/lib/actions/devices";

const DEVICE_TYPE_LABELS: Record<string, string> = {
  acrylic_stand: "Acrylic stand",
  flat_tag: "Flat tag",
  tissue_box: "Tissue box",
  tent_stand: "Tent stand",
  steel_stand: "Steel stand",
  nfc_card: "NFC card",
  qr_only: "QR only",
};

export function CreateDeviceForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createDevice, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-dashed border-line bg-paper p-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Serial number
        <input name="serial" required placeholder="VEE-000123" className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Device type
        <select name="type" className="rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1.5 text-sm text-ink">
          {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="min-h-9 rounded-[var(--radius-sm)] bg-accent px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Creating…" : "+ Create device"}
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
