import { getServerLocale } from "@/lib/i18n/server";
import { getActiveBusiness } from "@/lib/data/dashboard";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const { business, allMemberships } = await getActiveBusiness();
  const planId = business.plan_id ?? undefined;

  // Nav items for features a Super Admin has turned off (globally, per-plan,
  // or for this specific business) are hidden rather than left as dead
  // links pointing at a page that will just refuse to show anything.
  const [menuOn, ordersOn, analyticsOn, linksOn, reviewsOn] = await Promise.all([
    isFeatureEnabled("digital_menus", { businessId: business.id, planId }),
    isFeatureEnabled("online_ordering", { businessId: business.id, planId }),
    isFeatureEnabled("analytics", { businessId: business.id, planId }),
    isFeatureEnabled("custom_links", { businessId: business.id, planId }),
    isFeatureEnabled("custom_reviews", { businessId: business.id, planId }),
  ]);

  return (
    <DashboardShell
      businessName={business.name as Record<string, string>}
      businessUsername={business.username}
      businessStatus={business.status}
      locale={locale}
      activeBusinessId={business.id}
      memberships={allMemberships.map((m) => ({
        business_id: m.business_id,
        businesses: { name: m.businesses.name as Record<string, string> },
      }))}
      enabledNav={{ menu: menuOn, orders: ordersOn, analytics: analyticsOn, links: linksOn, reviews: reviewsOn }}
    >
      {children}
    </DashboardShell>
  );
}
