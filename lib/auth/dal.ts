import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type BusinessMember = Database["public"]["Tables"]["business_members"]["Row"];

/**
 * Data Access Layer — the AUTHORITATIVE auth check (backed by the database,
 * not just the cookie proxy.ts optimistically trusts). Every Server
 * Component, Server Action, and Route Handler under /dashboard or /admin
 * must call one of these rather than relying on proxy.ts alone. Cached per
 * request with React's `cache()` so calling it from multiple components in
 * one render doesn't cost multiple round trips.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return { authUser: user, profile: profile as Profile | null };
});

/** Requires any authenticated user; redirects to /login otherwise. */
export const requireUser = cache(async () => {
  const result = await getCurrentUser();
  if (!result || !result.profile) {
    redirect("/login");
  }
  return result;
});

/** Requires a Vee internal staff account (any internal_role); redirects to /admin/login-style 404 otherwise. */
export const requireStaff = cache(async () => {
  const result = await requireUser();
  if (!result.profile!.internal_role) {
    redirect("/dashboard");
  }
  return result;
});

/** Requires the super_admin internal_role specifically. */
export const requireSuperAdmin = cache(async () => {
  const result = await requireStaff();
  if (result.profile!.internal_role !== "super_admin") {
    redirect("/admin");
  }
  return result;
});

/**
 * Returns the caller's memberships across all businesses (usually one).
 * Business owners land in /dashboard scoped to whichever business they pick
 * if they have more than one.
 */
export const getMyBusinessMemberships = cache(async () => {
  const { authUser } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_members")
    .select("*, businesses(*)")
    .eq("user_id", authUser.id)
    .not("accepted_at", "is", null);
  return (data ?? []) as (BusinessMember & { businesses: Database["public"]["Tables"]["businesses"]["Row"] })[];
});

/**
 * Verifies the current user is a member of the given business (owner or
 * staff) — call this at the top of every dashboard Server Action that takes
 * a businessId, in addition to relying on RLS, so a bad request fails fast
 * with a clear error instead of a silent empty write.
 *
 * A Super Admin with no membership row on this business still passes: every
 * relevant RLS policy already carries an `or is_vee_staff()` clause (see
 * 0003_helpers_and_rls.sql / 0005_storage.sql), so the database was always
 * going to allow the write -- this just stops the app-layer check from
 * rejecting it first. That's what backs Super Admin > Businesses > Manage
 * (app/admin/businesses/[id]/), which reuses the same dashboard forms and
 * actions a business owner uses, scoped to whichever business Super Admin
 * opened. The synthetic membership below is role "owner" so every
 * `membership.role === "owner" || membership.permissions.includes(...)`
 * check in the action files grants full access, exactly like a real owner.
 */
export async function requireBusinessMembership(businessId: string) {
  const { authUser, profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", businessId)
    .eq("user_id", authUser.id)
    .not("accepted_at", "is", null)
    .maybeSingle();

  if (data) return data as BusinessMember;

  if (profile!.internal_role === "super_admin") {
    return {
      id: "super-admin-virtual-membership",
      business_id: businessId,
      user_id: authUser.id,
      role: "owner",
      permissions: [],
      invited_email: null,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    } satisfies BusinessMember;
  }

  throw new Error("Not a member of this business");
}
