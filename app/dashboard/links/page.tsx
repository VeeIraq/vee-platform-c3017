import { getActiveBusiness } from "@/lib/data/dashboard";
import { getServerLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { LinksManager } from "./links-manager";

export default async function DashboardLinksPage() {
  const { business } = await getActiveBusiness();
  const locale = await getServerLocale();

  const linksOn = await isFeatureEnabled("custom_links", { businessId: business.id, planId: business.plan_id ?? undefined });
  if (!linksOn) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
        Custom links aren&apos;t enabled for your business right now.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("profile_links")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Links</h1>
      <p className="mb-6 text-sm text-ink-muted">
        WhatsApp, Instagram, Maps and Reviews come from your business profile. Add anything else here.
      </p>
      <LinksManager
        businessId={business.id}
        locale={locale}
        links={(links ?? []).map((l) => ({ id: l.id, icon: l.icon, label: l.label as Record<string, string>, url: l.url, enabled: l.enabled }))}
      />
    </div>
  );
}
