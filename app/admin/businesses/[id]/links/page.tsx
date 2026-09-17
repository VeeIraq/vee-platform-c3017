import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/i18n/server";
import { LinksManager } from "@/app/dashboard/links/links-manager";

export default async function BusinessAdminLinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const locale = await getServerLocale();
  const supabase = await createClient();

  const { data: business } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
  if (!business) notFound();

  const { data: links } = await supabase.from("profile_links").select("*").eq("business_id", businessId).order("sort_order");

  return (
    <LinksManager
      businessId={businessId}
      locale={locale}
      links={(links ?? []).map((l) => ({ id: l.id, icon: l.icon, label: l.label as Record<string, string>, url: l.url, enabled: l.enabled }))}
    />
  );
}
