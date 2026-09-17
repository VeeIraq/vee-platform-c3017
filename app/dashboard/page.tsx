import Link from "next/link";
import { getActiveBusiness } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { PublishToggle } from "./publish-toggle";

async function getQuickStats(businessId: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: views }, { count: whatsappClicks }, { count: menuViews }, { count: orders }] = await Promise.all([
    supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("type", "profile_view").gte("created_at", since),
    supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("type", "whatsapp_click").gte("created_at", since),
    supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("type", "menu_view").gte("created_at", since),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("business_id", businessId).gte("created_at", since),
  ]);
  return { views: views ?? 0, whatsappClicks: whatsappClicks ?? 0, menuViews: menuViews ?? 0, orders: orders ?? 0 };
}

export default async function DashboardOverviewPage() {
  const { business, membership } = await getActiveBusiness();
  const stats = await getQuickStats(business.id);

  const checklist = [
    { done: !!business.logo_url, label: "Upload your logo", href: "/dashboard/profile" },
    { done: !!(business.name as Record<string, string>)?.en, label: "Add your business name", href: "/dashboard/profile" },
    { done: !!(business.description as Record<string, string>)?.en, label: "Write a description", href: "/dashboard/profile" },
    { done: !!business.whatsapp_number || !!business.phone, label: "Add a WhatsApp number or phone", href: "/dashboard/profile" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Publish status</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {business.status === "published"
                ? "Your profile is live at vee.iq/" + business.username
                : "Your profile is a draft — publish it once it's ready for customers."}
            </p>
          </div>
          <PublishToggle businessId={business.id} status={business.status} canPublish={membership.role === "owner"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Last 30 days</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Profile views", stats.views],
            ["Menu views", stats.menuViews],
            ["WhatsApp clicks", stats.whatsappClicks],
            ["Orders", stats.orders],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
              <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <h2 className="text-lg font-extrabold text-ink">Get set up</h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-ink-soft">
                <span aria-hidden="true">{item.done ? "✅" : "⬜️"}</span>
                {item.label}
              </span>
              {!item.done && (
                <Link href={item.href} className="text-sm font-semibold text-accent hover:underline">
                  Add
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
