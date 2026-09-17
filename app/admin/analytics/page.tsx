import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { BarList, StatTile } from "./analytics-widgets";

const EVENT_LABELS: Record<string, string> = {
  profile_view: "Profile views",
  nfc_tap: "NFC taps",
  qr_scan: "QR scans",
  menu_view: "Menu views",
  whatsapp_click: "WhatsApp clicks",
  instagram_click: "Instagram clicks",
  maps_click: "Maps clicks",
  review_click: "Review clicks",
  call_click: "Call clicks",
  reservation_click: "Reservation clicks",
  cart_created: "Carts created",
  order_created: "Orders (from taps)",
};

type SearchParams = {
  from?: string;
  to?: string;
  business?: string;
  location?: string;
  product?: string;
  device?: string;
  language?: string;
};

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const from = sp.from || daysAgoIso(30).slice(0, 10);
  const to = sp.to || new Date().toISOString().slice(0, 10);
  const fromIso = new Date(`${from}T00:00:00Z`).toISOString();
  const toIso = new Date(`${to}T23:59:59Z`).toISOString();

  let loadError: string | null = null;
  const supabase = await createClient();

  type BusinessRow = { id: string; username: string; name: unknown; status: string; plan_id?: string | null };
  type LocationRow = { id: string; business_id: string; name: unknown };
  type MenuItemRow = { id: string; business_id: string; name: unknown };
  type FlagRow = { id: string; key: string; label: string; default_value: boolean };
  type OverrideRow = { flag_id: string; scope_type: string; scope_id: string; value: boolean };

  let businessRows: BusinessRow[] = [];
  let locationRows: LocationRow[] = [];
  let menuItemRows: MenuItemRow[] = [];
  let flagRows: FlagRow[] = [];
  let overrideRows: OverrideRow[] = [];

  try {
    const [businessesRes, locationsRes, menuItemsRes, flagsRes, overridesRes] = await Promise.all([
      supabase.from("businesses").select("id, username, name, status, plan_id").order("username"),
      supabase.from("locations").select("id, business_id, name").order("name"),
      supabase.from("menu_items").select("id, business_id, name").order("name").limit(500),
      supabase.from("feature_flags").select("*").order("key"),
      supabase.from("feature_flag_overrides").select("*"),
    ]);
    if (businessesRes.error) throw businessesRes.error;
    businessRows = businessesRes.data ?? [];
    locationRows = locationsRes.data ?? [];
    menuItemRows = menuItemsRes.data ?? [];
    flagRows = flagsRes.data ?? [];
    overrideRows = overridesRes.data ?? [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Couldn't load filter options.";
  }

  const businesses = businessRows ?? [];
  const locations = locationRows ?? [];
  const menuItems = menuItemRows ?? [];
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  let events: { type: string; device_type: string | null; session_locale: string | null; location_id: string | null }[] = [];
  let orders: { id: string; business_id: string; total: number; created_at: string; items: unknown }[] = [];
  let leadsCount = 0;
  let eventsError: string | null = null;

  try {
    let eventsQuery = supabase
      .from("analytics_events")
      .select("type, device_type, session_locale, location_id")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .limit(5000);
    if (sp.business) eventsQuery = eventsQuery.eq("business_id", sp.business);
    if (sp.location) eventsQuery = eventsQuery.eq("location_id", sp.location);
    if (sp.device) eventsQuery = eventsQuery.eq("device_type", sp.device);
    if (sp.language) eventsQuery = eventsQuery.eq("session_locale", sp.language as "en" | "ar" | "ku");
    const { data, error } = await eventsQuery;
    if (error) throw error;
    events = data ?? [];

    let ordersQuery = supabase
      .from("orders")
      .select("id, business_id, total, created_at, items")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .limit(2000);
    if (sp.business) ordersQuery = ordersQuery.eq("business_id", sp.business);
    const { data: orderData, error: orderError } = await ordersQuery;
    if (orderError) throw orderError;
    orders = sp.product
      ? (orderData ?? []).filter((o) => Array.isArray(o.items) && (o.items as { menuItemId?: string }[]).some((i) => i.menuItemId === sp.product))
      : orderData ?? [];

    const { count, error: leadsError } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    if (leadsError) throw leadsError;
    leadsCount = count ?? 0;
  } catch (e) {
    eventsError = e instanceof Error ? e.message : "Couldn't load analytics data.";
  }

  const byType = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byLocale = new Map<string, number>();
  for (const e of events) {
    byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
    if (e.device_type) byDevice.set(e.device_type, (byDevice.get(e.device_type) ?? 0) + 1);
    if (e.session_locale) byLocale.set(e.session_locale, (byLocale.get(e.session_locale) ?? 0) + 1);
  }
  const ordersTotal = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const activeBusinesses = businesses.filter((b) => b.status === "published").length;

  // Feature usage: for each flag, how many businesses currently resolve it
  // to ON vs OFF once business- and plan-level overrides are applied --
  // computed in JS from the small flags/overrides/businesses tables rather
  // than one isFeatureEnabled() round trip per business.
  const overridesByFlag = new Map<string, { business: Map<string, boolean>; plan: Map<string, boolean> }>();
  for (const o of overrideRows ?? []) {
    if (!overridesByFlag.has(o.flag_id)) overridesByFlag.set(o.flag_id, { business: new Map(), plan: new Map() });
    const bucket = overridesByFlag.get(o.flag_id)!;
    if (o.scope_type === "business") bucket.business.set(o.scope_id, o.value);
    else if (o.scope_type === "plan") bucket.plan.set(o.scope_id, o.value);
  }
  const featureUsage = (flagRows ?? []).map((flag) => {
    const overrides = overridesByFlag.get(flag.id);
    let on = 0;
    for (const b of businesses) {
      const businessOverride = overrides?.business.get(b.id);
      const planOverride = b.plan_id ? overrides?.plan.get(b.plan_id) : undefined;
      const resolved = businessOverride ?? planOverride ?? flag.default_value;
      if (resolved) on++;
    }
    return { key: flag.key, label: flag.label, on, off: businesses.length - on };
  });

  const filteredLocations = sp.business ? locations.filter((l) => l.business_id === sp.business) : locations;
  const filteredMenuItems = sp.business ? menuItems.filter((m) => m.business_id === sp.business) : menuItems;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Analytics</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">Platform-wide activity across every business. Filters apply to the sections below.</p>

      <form className="mb-6 grid gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-4 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          From
          <input type="date" name="from" defaultValue={from} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          To
          <input type="date" name="to" defaultValue={to} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Business
          <select name="business" defaultValue={sp.business ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink">
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {pick(b.name as Record<string, string>, "en")} (@{b.username})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Location
          <select name="location" defaultValue={sp.location ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink">
            <option value="">All locations</option>
            {filteredLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {businessById.get(l.business_id)?.username ?? "?"} — {(l.name as Record<string, string> | null)?.en ?? "Unnamed"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Product (menu item, filters orders)
          <select name="product" defaultValue={sp.product ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink">
            <option value="">All products</option>
            {filteredMenuItems.map((m) => (
              <option key={m.id} value={m.id}>
                {businessById.get(m.business_id)?.username ?? "?"} — {(m.name as Record<string, string> | null)?.en ?? "Item"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Device
          <select name="device" defaultValue={sp.device ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink">
            <option value="">All devices</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Language
          <select name="language" defaultValue={sp.language ?? ""} className="min-h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-sm text-ink">
            <option value="">All languages</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="ku">Kurdish</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-3 lg:col-span-2">
          <button type="submit" className="min-h-10 rounded-[var(--radius-sm)] bg-accent px-5 text-sm font-bold text-white">
            Apply filters
          </button>
          <Link href="/admin/analytics" className="flex min-h-10 items-center rounded-[var(--radius-sm)] border border-line px-4 text-sm font-semibold text-ink-soft">
            Reset
          </Link>
        </div>
      </form>

      {loadError && (
        <p role="alert" className="mb-4 rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {loadError}
        </p>
      )}
      {eventsError && (
        <p role="alert" className="mb-4 rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          Couldn&apos;t load analytics for this range: {eventsError}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active businesses" value={activeBusinesses} sub={`of ${businesses.length} total`} />
        <StatTile label="Products in catalogue" value={menuItems.length > 0 ? filteredMenuItems.length : 0} sub="menu items in scope" />
        <StatTile label="Orders" value={orders.length} sub={`${ordersTotal.toLocaleString()} IQD total`} />
        <StatTile label="Leads" value={leadsCount} sub="in this date range" />
      </div>

      {!eventsError && events.length === 0 && orders.length === 0 && leadsCount === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No activity matches these filters. Try a wider date range or clear a filter.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-5 lg:col-span-2">
            <h2 className="mb-3 font-bold text-ink">Interactions</h2>
            <BarList
              items={[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, n]) => ({ label: EVENT_LABELS[type] ?? type, value: n }))}
              emptyLabel="No interactions in this range."
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-5">
              <h2 className="mb-3 font-bold text-ink">By device</h2>
              <BarList items={[...byDevice.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => ({ label: d, value: n }))} emptyLabel="No data." />
            </div>
            <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-5">
              <h2 className="mb-3 font-bold text-ink">By language</h2>
              <BarList
                items={[...byLocale.entries()].sort((a, b) => b[1] - a[1]).map(([l, n]) => ({ label: l.toUpperCase(), value: n }))}
                emptyLabel="No data."
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-[var(--radius-lg)] border border-line bg-paper p-5">
        <h2 className="mb-1 font-bold text-ink">Feature usage</h2>
        <p className="mb-3 text-xs text-ink-muted">How many businesses currently have each feature on, after plan and per-business overrides.</p>
        {featureUsage.length === 0 ? (
          <p className="text-sm text-ink-muted">No feature flags configured.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {featureUsage.map((f) => (
              <div key={f.key} className="flex items-center gap-3 text-sm">
                <span className="w-48 shrink-0 truncate text-ink-soft">{f.label}</span>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-fog">
                  <div className="h-full bg-success" style={{ width: `${businesses.length ? (f.on / businesses.length) * 100 : 0}%` }} />
                </div>
                <span className="w-20 shrink-0 text-end font-semibold text-ink">
                  {f.on}/{businesses.length}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-paper">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-start text-xs font-semibold uppercase text-ink-muted">
              <th className="p-3 text-start">Date</th>
              <th className="p-3 text-start">Business</th>
              <th className="p-3 text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 20).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-3 text-ink-muted">{businessById.get(o.business_id)?.username ?? o.business_id}</td>
                <td className="p-3 text-end font-semibold">{Number(o.total).toLocaleString()} IQD</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-ink-muted">
                  No orders in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
