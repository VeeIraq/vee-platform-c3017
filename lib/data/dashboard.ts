import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMyBusinessMemberships } from "@/lib/auth/dal";

const ACTIVE_BUSINESS_COOKIE = "vee-active-business";

/**
 * Resolves which business the signed-in owner/staff member is currently
 * managing. Most accounts have exactly one; when there's more than one
 * (e.g. Vee Custom multi-brand accounts) the choice is remembered in a
 * cookie and changed via the business switcher in the dashboard header.
 */
export async function getActiveBusiness() {
  const memberships = await getMyBusinessMemberships();
  if (memberships.length === 0) {
    redirect("/dashboard/new");
  }

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const active = memberships.find((m) => m.business_id === preferredId) ?? memberships[0];

  return { business: active.businesses, membership: active, allMemberships: memberships };
}

export { ACTIVE_BUSINESS_COOKIE };
