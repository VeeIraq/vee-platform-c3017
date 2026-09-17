import { getActiveBusiness } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  preparing: "Preparing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function DashboardOrdersPage() {
  const { business, membership } = await getActiveBusiness();

  if (!(membership.role === "owner" || membership.permissions.includes("orders.view"))) {
    return <p className="text-sm text-ink-muted">You don&apos;t have permission to view orders.</p>;
  }

  const ordersOn = await isFeatureEnabled("online_ordering", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!ordersOn) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
        Order management isn&apos;t enabled for your business right now.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Orders</h1>
      <p className="mb-6 text-sm text-ink-muted">
        {business.ordering_mode === "whatsapp"
          ? "WhatsApp orders are sent directly to your WhatsApp number and aren't stored here. Switch to online or table ordering in your profile settings to track orders in this list."
          : "Orders placed through online or table ordering appear here."}
      </p>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-paper">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs font-semibold uppercase text-ink-muted">
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-start">Type</th>
                <th className="p-3 text-start">Table</th>
                <th className="p-3 text-end">Total</th>
                <th className="p-3 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="p-3">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="p-3 capitalize">{order.type}</td>
                  <td className="p-3">{order.table_number ?? "—"}</td>
                  <td className="p-3 text-end font-semibold">{order.total.toLocaleString()} IQD</td>
                  <td className="p-3">
                    <span className="rounded-full bg-fog px-2.5 py-1 text-xs font-semibold text-ink-soft">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          No orders yet.
        </p>
      )}
    </div>
  );
}
