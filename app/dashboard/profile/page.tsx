import { getActiveBusiness } from "@/lib/data/dashboard";
import { ProfileForm } from "./profile-form";
import { AppearanceForm } from "./appearance-form";
import type { ProfileSectionKey } from "@/lib/actions/business";

export default async function DashboardProfilePage() {
  const { business } = await getActiveBusiness();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold text-ink">Business profile</h1>
        <p className="text-sm text-ink-muted">This is what customers see at vee.iq/{business.username}.</p>
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
      <AppearanceForm
        businessId={business.id}
        themePreset={business.theme_preset}
        profileSections={business.profile_sections as Partial<Record<ProfileSectionKey, boolean>> | null}
      />
    </div>
  );
}
