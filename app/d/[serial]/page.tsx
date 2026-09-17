import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAnalyticsEvent } from "@/lib/data/public";

type Params = { serial: string };

// A physical NFC tap or QR scan always lands here first, then always
// forwards to the business's profile URL (/:username) -- never to a
// fixed menu link -- so a business can change its menu, links or
// ordering mode later without ever replacing the physical hardware.
//
// Device lookup goes through the resolve_device() RPC (see migration
// 0013) rather than querying nfc_devices directly: that table is never
// publicly readable by design (it's internal inventory), so a narrow
// security-definer function resolves exactly one serial to a redirect
// target without exposing the table to public listing.
export default async function DeviceRedirectPage({ params }: { params: Promise<Params> }) {
  const { serial } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("resolve_device", { p_serial: serial });
  const device = Array.isArray(data) ? data[0] : null;

  if (device && device.status === "active" && device.username) {
    if (device.business_id) {
      const eventType = device.device_type === "qr_only" ? "qr_scan" : "nfc_tap";
      await logAnalyticsEvent(device.business_id, eventType, { serial, locationId: device.location_id });
    }
    const query = device.table_number ? `?table=${encodeURIComponent(device.table_number)}` : "";
    redirect(`/${device.username}${query}`);
  }

  const knownButNotActive = device && device.username;

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog px-4">
      <div className="max-w-sm rounded-[var(--radius-lg)] border border-line bg-paper p-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          📇
        </p>
        <h1 className="mt-4 text-lg font-extrabold text-ink">
          {knownButNotActive ? "This device isn't active right now" : "This device isn't set up yet"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {knownButNotActive
            ? "Please contact the business, or try again later."
            : "This NFC/QR product hasn't been activated. Please contact Vee support."}
        </p>
      </div>
    </div>
  );
}
