import Link from "next/link";
import { getActiveBusiness } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
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
  const { dict } = await getServerDictionary();
  const dt = (key: string) => t(dict, `dashboard.${key}`);

  const checklist = [
    { done: !!business.logo_url, label: dt("checklistLogo"), href: "/dashboard/profile" },
    { done: !!(business.name as Record<string, string>)?.en, label: dt("checklistName"), href: "/dashboard/profile" },
    { done: !!(business.description as Record<string, string>)?.en, label: dt("checklistDescription"), href: "/dashboard/profile" },
    { done: !!business.whatsapp_number || !!business.phone, label: dt("checklistContact"), href: "/dashboard/profile" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink">{dt("publishStatusTitle")}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {business.status === "published" ? `${dt("profileLiveNote")} vee.iq/${business.username}` : dt("profileDraftNote")}
            </p>
          </div>
          <PublishToggle businessId={business.id} status={business.status} canPublish={membership.role === "owner"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">{dt("last30Days")}</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [dt("statProfileViews"), stats.views],
            [dt("statMenuViews"), stats.menuViews],
            [dt("statWhatsappClicks"), stats.whatsappClicks],
            [dt("statOrders"), stats.orders],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
              <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <h2 className="text-lg font-extrabold text-ink">{dt("getSetUp")}</h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-ink-soft">
                <span aria-hidden="true">{item.done ? "✅" : "⬜️"}</span>
                {item.label}
              </span>
              {!item.done && (
                <Link href={item.href} className="text-sm font-semibold text-accent hover:underline">
                  {dt("addAction")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
