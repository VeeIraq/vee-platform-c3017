"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrCreateAnonId, hashAnonId } from "@/lib/anon-identity";

const LIKE_COOKIE = "vee_like_id";

export type LikeToggleResult = { error?: string; liked?: boolean; count?: number };

/**
 * Toggles the caller's own like on one menu item. Anonymous, account-less,
 * and deliberately the *only* write path into menu_item_likes -- there is
 * no RLS insert/update/delete policy on that table for anon/authenticated
 * (see supabase/migrations/0018_menu_likes.sql), so a script hitting
 * Supabase's REST API directly with the public anon key cannot write to it
 * at all. Only this Server Action, running server-side with the
 * service-role client, can -- and it enforces every check below first:
 *   1. a per-IP rate limit (obvious scripted abuse),
 *   2. that the item's business actually has likes turned on (both the
 *      global feature flag and the business's own likes_enabled switch),
 *      and that the item/business are actually public (visible + published)
 *      -- never trust the client's claim that a button was even shown,
 *   3. one like per (anonymous visitor, item), via an httpOnly-cookie-based
 *      hash and the table's own unique index as a second line of defense.
 */
export async function toggleMenuItemLike(itemId: string, businessId: string): Promise<LikeToggleResult> {
  const allowed = await checkRateLimit(`menu-like:${businessId}`, 30, 60_000);
  if (!allowed) return { error: "Too many requests. Please try again in a moment." };

  // Read with the normal anon-key client so this fails closed on RLS if the
  // item/business aren't actually public -- the same check a real visitor's
  // page render would have passed. Two plain queries rather than a
  // PostgREST embed: the hand-written Database type carries no relationship
  // metadata for menu_items -> businesses (see lib/supabase/types.ts's own
  // TODO), so an embedded select would need the same "cast and hope" as the
  // menu_items -> product_options workaround elsewhere in this codebase.
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("menu_items")
    .select("id, business_id, visible")
    .eq("id", itemId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!item || !item.visible) return { error: "This item isn't available." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, likes_enabled, plan_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business || business.status !== "published") return { error: "This item isn't available." };
  if (!business.likes_enabled) return { error: "Likes aren't turned on for this business." };

  const flagOn = await isFeatureEnabled("menu_likes", { businessId, planId: business.plan_id ?? undefined });
  if (!flagOn) return { error: "Likes aren't turned on for this business." };

  const anonId = await getOrCreateAnonId(LIKE_COOKIE);
  const likerHash = hashAnonId(anonId, businessId);

  const service = createServiceRoleClient();
  const { data: existing } = await service
    .from("menu_item_likes")
    .select("id")
    .eq("menu_item_id", itemId)
    .eq("liker_hash", likerHash)
    .maybeSingle();

  if (existing) {
    await service.from("menu_item_likes").delete().eq("id", existing.id);
  } else {
    // Unique index (menu_item_id, liker_hash) is the real backstop against a
    // race double-inserting -- a conflict here just means someone else's
    // request already recorded the like, which is the correct end state.
    await service.from("menu_item_likes").insert({ menu_item_id: itemId, business_id: businessId, liker_hash: likerHash });
  }

  const { count } = await service
    .from("menu_item_likes")
    .select("id", { count: "exact", head: true })
    .eq("menu_item_id", itemId);

  return { liked: !existing, count: count ?? 0 };
}

export type MenuItemLikeState = { count: number; liked: boolean };

/**
 * Server-side read of like counts + "did this visitor already like it" for
 * every item of a business, via the narrow get_menu_item_likes() RPC
 * (public-callable, aggregate-only -- see the migration). Used from a
 * Server Component render, so it never needs to set the identity cookie
 * (only the toggle action does that) -- an unset cookie just means every
 * item reads as not-yet-liked, which is correct for a first-time visitor.
 */
export async function getMenuItemLikeStates(businessId: string, likerHash: string | null): Promise<Record<string, MenuItemLikeState>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_menu_item_likes", { p_business_id: businessId, p_liker_hash: likerHash });
  if (error || !data) return {};
  const result: Record<string, MenuItemLikeState> = {};
  for (const row of data) {
    result[row.menu_item_id] = { count: Number(row.like_count), liked: row.liked_by_caller };
  }
  return result;
}
