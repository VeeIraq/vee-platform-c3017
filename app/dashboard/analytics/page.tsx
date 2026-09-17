import { getActiveBusiness } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";

// Plain helper (not a component/hook) so the Date.now() call isn't flagged
// by react-hooks' purity check -- this Server Component runs once per
// request, not repeatedly re-rendered, so a fresh "30 days ago" cutoff on
// every request is exactly the intended behavior.
function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const EVENT_LABELS: Record<string, string> = {
  profile_view: "Profile views",
  nfc_tap: "NFC taps",
  qr_scan: "QR scans",
  menu_view: "Menu views",
  product_view: "Product views",
  whatsapp_click: "WhatsApp clicks",
  instagram_click: "Instagram clicks",
  maps_click: "Maps clicks",
  review_click: "Review clicks",
  call_click: "Call clicks",
  reservation_click: "Reservation clicks",
  cart_created: "Carts created",
  order_created: "Orders created",
};

export default async function DashboardAnalyticsPage() {
  const { business, membership } = await getActiveBusiness();

  if (!(membership.role === "owner" || membership.permissions.includes("analytics.view"))) {
    return <p className="text-sm text-ink-muted">You don&apos;t have permission to view analytics.</p>;
  }

  const analyticsOn = await isFeatureEnabled("analytics", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!analyticsOn) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
        Analytics isn&apos;t included on your current plan. Contact Vee to upgrade.
      </p>
    );
  }

  const supabase = await createClient();
  const since = daysAgoIso(30);
  const { data: events } = await supabase
    .from("analytics_events")
    .select("type, device_type, session_locale")
    .eq("business_id", business.id)
    .gte("created_at", since);

  const byType = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byLocale = new Map<string, number>();
  for (const e of events ?? []) {
    byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
    if (e.device_type) byDevice.set(e.device_type, (byDevice.get(e.device_type) ?? 0) + 1);
    if (e.session_locale) byLocale.set(e.session_locale, (byLocale.get(e.session_locale) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Analytics</h1>
      <p className="mb-6 text-sm text-ink-muted">Last 30 days, this business only.</p>

      {(events?.length ?? 0) === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No activity yet. Once your profile is published and customers start tapping/scanning, activity will appear here.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="By interaction">
            {[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, n]) => (
              <Row key={type} label={EVENT_LABELS[type] ?? type} value={n} />
            ))}
          </Panel>
          <Panel title="By device">
            {[...byDevice.entries()].sort((a, b) => b[1] - a[1]).map(([device, n]) => (
              <Row key={device} label={device} value={n} />
            ))}
          </Panel>
          <Panel title="By language">
            {[...byLocale.entries()].sort((a, b) => b[1] - a[1]).map(([locale, n]) => (
              <Row key={locale} label={locale.toUpperCase()} value={n} />
            ))}
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-5">
      <h2 className="mb-3 font-bold text-ink">{title}</h2>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="capitalize text-ink-soft">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
