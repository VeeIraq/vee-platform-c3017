"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unassignDevice, setDeviceStatus, deleteDevice } from "@/lib/actions/devices";
import { AssignDeviceForm } from "./assign-device-form";
import { DeviceQr } from "./device-qr";

const STATUS_STYLE: Record<string, string> = {
  unassigned: "bg-fog text-ink-muted",
  active: "bg-success-bg text-success",
  inactive: "bg-warning-bg text-warning",
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  acrylic_stand: "Acrylic stand",
  flat_tag: "Flat tag",
  tissue_box: "Tissue box",
  tent_stand: "Tent stand",
  steel_stand: "Steel stand",
  nfc_card: "NFC card",
  qr_only: "QR only",
};

export type DeviceRowData = {
  id: string;
  serial: string;
  type: string;
  status: "unassigned" | "active" | "inactive";
  businessName: string | null;
  businessUsername: string | null;
  locationName: string | null;
  tableNumber: string | null;
};

export function DeviceRow({
  device,
  businesses,
  locations,
  qrCodesEnabled,
}: {
  device: DeviceRowData;
  businesses: { id: string; username: string; nameEn: string }[];
  locations: { id: string; businessId: string; nameEn: string }[];
  qrCodesEnabled: boolean;
}) {
  const [assigning, setAssigning] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <tr className="border-b border-line last:border-0">
        <td className="p-3">
          <p className="font-mono text-xs text-ink">{device.serial}</p>
          <a
            href={`/d/${device.serial}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block font-mono text-[10px] text-accent hover:underline"
          >
            /d/{device.serial} ↗
          </a>
        </td>
        <td className="p-3 text-ink-muted">{DEVICE_TYPE_LABELS[device.type] ?? device.type}</td>
        <td className="p-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[device.status]}`}>{device.status}</span>
        </td>
        <td className="p-3 text-ink-muted">
          {device.businessUsername ? (
            <a href={`/${device.businessUsername}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
              {device.businessName} (@{device.businessUsername})
            </a>
          ) : (
            "— unassigned —"
          )}
        </td>
        <td className="p-3 text-ink-muted">{device.locationName ?? "—"}</td>
        <td className="p-3 text-ink-muted">{device.tableNumber ?? "—"}</td>
        <td className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {qrCodesEnabled && <DeviceQr serial={device.serial} />}
            <button
              type="button"
              onClick={() => setAssigning((v) => !v)}
              className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog"
            >
              {device.businessUsername ? "Reassign" : "Assign"}
            </button>
            {device.businessUsername && device.status === "active" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await setDeviceStatus(device.id, "inactive");
                    router.refresh();
                  })
                }
                className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-warning hover:bg-fog"
              >
                Deactivate
              </button>
            )}
            {device.businessUsername && device.status === "inactive" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await setDeviceStatus(device.id, "active");
                    router.refresh();
                  })
                }
                className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-success hover:bg-fog"
              >
                Activate
              </button>
            )}
            {device.businessUsername && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Unassign this device from its business?")) return;
                  startTransition(async () => {
                    await unassignDevice(device.id);
                    router.refresh();
                  });
                }}
                className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog"
              >
                Unassign
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Permanently delete this device record?")) return;
                startTransition(async () => {
                  await deleteDevice(device.id);
                  router.refresh();
                });
              }}
              className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-danger hover:bg-fog"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {assigning && (
        <tr className="border-b border-line last:border-0">
          <td colSpan={7} className="bg-fog p-3">
            <AssignDeviceForm
              deviceId={device.id}
              businesses={businesses}
              locations={locations}
              onDone={() => {
                setAssigning(false);
                router.refresh();
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}
