import "server-only";
import { headers } from "next/headers";

/**
 * Minimal in-memory sliding-window rate limiter for public forms and login.
 *
 * NOTE: this is process-local — fine for a single Node instance, but a
 * multi-instance production deployment should swap this for a shared store
 * (Upstash Redis, or a Postgres table with an atomic increment) so limits
 * are enforced across instances. The call sites (`lib/actions/auth.ts`,
 * `lib/actions/leads.ts`, `lib/actions/support.ts`) are written against
 * this same `checkRateLimit()` signature, so swapping the implementation
 * later doesn't touch calling code.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count += 1;
  return true;
}
