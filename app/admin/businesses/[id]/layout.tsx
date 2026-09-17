import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n/pick";
import { BusinessAdminNav } from "./business-admin-nav";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-success-bg text-success",
  draft: "bg-warning-bg text-warning",
  suspended: "bg-danger-bg text-danger",
};

export default async function BusinessAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Every action a Super Admin takes under this route acts on a business
  // they aren't necessarily a member of -- see the "Super Admin with no
  // membership row" branch requireBusinessMembership() grows in
  // lib/auth/dal.ts, which is what actually lets the reused dashboard forms
  // (ProfileForm, MenuManager, LinksManager, StaffManager) save here.
  // Gating this route at super_admin (rather than any Vee staff) matches
  // that DAL check and keeps "manage any business" a Super Admin-only power.
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("id, username, name, status").eq("id", id).maybeSingle();
  if (!business) notFound();

  return (
    <div>
      <Link href="/admin/businesses" className="mb-3 inline-block text-sm font-semibold text-accent hover:underline">
        ← All businesses
      </Link>
      <div className="mb-1 flex flex-wrap items-center gap-2.5">
        <h1 className="text-2xl font-extrabold text-ink">{pick(business.name as Record<string, string>, "en")}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[business.status]}`}>{business.status}</span>
      </div>
      <p className="mb-6 text-sm text-ink-muted">
        vee.iq/{business.username} — you&apos;re editing this business as Super Admin; changes save immediately, same as
        if the owner made them.
      </p>
      <BusinessAdminNav businessId={business.id} />
      {children}
    </div>
  );
}
