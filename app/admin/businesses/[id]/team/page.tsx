import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffManager } from "@/app/dashboard/settings/staff-manager";

export default async function BusinessAdminTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
  if (!business) notFound();

  const { data: members } = await supabase.from("business_members").select("*").eq("business_id", businessId);

  return (
    <StaffManager
      businessId={businessId}
      canManage
      members={(members ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        permissions: m.permissions,
        invited_email: m.invited_email,
        accepted_at: m.accepted_at,
      }))}
    />
  );
}
