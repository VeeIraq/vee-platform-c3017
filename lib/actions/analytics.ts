"use server";

import { logAnalyticsEvent } from "@/lib/data/public";

/**
 * Client-callable wrapper around the server-only logAnalyticsEvent, for
 * events that only happen on the client (a link click, a WhatsApp
 * checkout tap) rather than during a page's server render. Fire-and-forget
 * from the client: callers don't need to await this before navigating.
 */
export async function trackClientEvent(businessId: string, type: string, locale?: string) {
  await logAnalyticsEvent(businessId, type, { locale });
}
