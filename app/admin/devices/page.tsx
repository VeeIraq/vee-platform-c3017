import { requireStaff } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { pick } from "@/lib/i18n/pick";
import { CreateDeviceForm } from "./create-device-form";
import { DeviceRow, type DeviceRowData } from "./device-row";

export default async function AdminDevicesPage() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: devices }, { data: businessRows }, { data: locationRows }, qrCodesEnabled] = await Promise.all([
    supabase.from("nfc_devices").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("businesses").select("id, username, name").order("username"),
    supabase.from("locations").select("id, business_id, name").order("name"),
    isFeatureEnabled("qr_codes"),
  ]);

  const businesses = (businessRows ?? []).map((b) => ({
    id: b.id,
    username: b.username,
    nameEn: pick(b.name as Record<string, string>, "en"),
  }));
  const locations = (locationRows ?? []).map((l) => ({
    id: l.id,
    businessId: l.business_id,
    nameEn: pick(l.name as Record<string, string>, "en") || "Unnamed location",
  }));
  const businessById = new Map(businesses.map((b) => [b.id, b]));
  const locationById = new Map(locations.map((l) => [l.id, l]));

  const rows: DeviceRowData[] = (devices ?? []).map((d) => ({
    id: d.id,
    serial: d.serial,
    type: d.type,
    status: d.status,
    businessName: d.business_id ? (businessById.get(d.business_id)?.nameEn ?? "Unknown business") : null,
    businessUsername: d.business_id ? (businessById.get(d.business_id)?.username ?? null) : null,
    locationName: d.location_id ? (locationById.get(d.location_id)?.nameEn ?? null) : null,
    tableNumber: d.table_number,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">NFC / QR devices</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Every physical device always opens the business&apos;s profile URL (<code>/username</code>) when tapped or
        scanned — never a fixed menu link — so a business can change its menu, links or ordering mode without
        replacing hardware.
      </p>

      <div className="mb-6">
        <CreateDeviceForm />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-paper">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase text-ink-muted">
              <th className="p-3 text-start">Serial</th>
              <th className="p-3 text-start">Type</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Business</th>
              <th className="p-3 text-start">Location</th>
              <th className="p-3 text-start">Table</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((device) => (
              <DeviceRow key={device.id} device={device} businesses={businesses} locations={locations} qrCodesEnabled={qrCodesEnabled} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  No devices yet — create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
