import "server-only";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";

/**
 * Privacy-conscious anonymous-visitor identity, shared by the menu-likes
 * and business-review-page features. Neither feature needs (or collects) a
 * customer account or any PII -- this is only enough to let the server
 * recognize "the same browser asked again" so it can de-duplicate.
 *
 * How it works:
 *  - A random UUID is stored in an httpOnly, SameSite=Lax cookie the first
 *    time a visitor actually performs the write action (like/review). It is
 *    httpOnly specifically so page JavaScript can never read or forge it --
 *    only this server-side code ever sees the raw value.
 *  - Callers never store or compare the raw cookie value. They combine it
 *    with a `scope` (e.g. a business id) and hash it with SHA-256 before it
 *    ever reaches a database row, so even the stored value can't be reversed
 *    back to "this is the same visitor as this other unrelated row" across
 *    scopes, and is never treated as an identifier for anything beyond
 *    "have I already done this one thing."
 *
 * This is a de-duplication aid, not an authentication system: a visitor who
 * clears cookies or uses a different browser resets it. That is an accepted
 * trade-off for an account-less feature -- combined with server-side rate
 * limiting (lib/rate-limit.ts) it stops the obvious/casual repeat case
 * without asking anyone to sign in just to like a menu item or leave a
 * rating.
 */

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export async function getOrCreateAnonId(cookieName: string): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(cookieName)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(cookieName, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return id;
}

/** Read-only variant for Server Components, which cannot set cookies -- returns null if the visitor has never triggered getOrCreateAnonId yet. */
export async function readAnonId(cookieName: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value ?? null;
}

/** SHA-256 of `${anonId}:${scope}`, hex-encoded. Never reversible back to the raw cookie value. */
export function hashAnonId(anonId: string, scope: string): string {
  return createHash("sha256").update(`${anonId}:${scope}`).digest("hex");
}
