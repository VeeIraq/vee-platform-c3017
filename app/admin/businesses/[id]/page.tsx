import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/app/dashboard/profile/profile-form";
import { BusinessRowActions } from "../business-row-actions";

export default async function BusinessAdminOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  if (!business) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-line bg-fog p-4">
        <p className="text-sm font-semibold text-ink-soft">Status</p>
        <BusinessRowActions businessId={business.id} status={business.status} />
      </div>
      <ProfileForm
        business={{
          id: business.id,
          name: business.name as Record<string, string>,
          category: business.category as Record<string, string>,
          description: business.description as Record<string, string>,
          whatsapp_number: business.whatsapp_number,
          phone: business.phone,
          instagram_url: business.instagram_url,
          website_url: business.website_url,
          google_maps_url: business.google_maps_url,
          google_review_url: business.google_review_url,
          ordering_mode: business.ordering_mode,
          menu_link_enabled: business.menu_link_enabled,
          logo_url: business.logo_url,
          cover_image_url: business.cover_image_url,
        }}
      />
    </div>
  );
}
