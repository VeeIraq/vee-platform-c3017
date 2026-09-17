"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/data/dashboard";
import type { ActionState } from "./business";

export async function setActiveBusiness(formData: FormData) {
  const businessId = formData.get("businessId");
  if (typeof businessId !== "string") return;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/dashboard", "layout");
}

const RESERVED_USERNAMES = new Set([
  "login", "signup", "dashboard", "admin", "api", "products", "product", "contact",
  "privacy", "terms", "about", "menu", "pricing", "plans", "faq", "reset-password",
  "_next", "public", "brand", "vee", "www",
]);

const createSchema = z.object({ businessName: z.string().trim().min(2, "Enter your business name.") });

export async function createBusinessForCurrentUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createSchema.safeParse({ businessName: formData.get("businessName") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { authUser } = await requireUser();
  const supabase = await createClient();

  const base =
    parsed.data.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "business";
  let candidate = RESERVED_USERNAMES.has(base) ? `${base}-vee` : base;
  let suffix = 0;
  while (suffix < 50) {
    if (!RESERVED_USERNAMES.has(candidate)) {
      const { data } = await supabase.from("businesses").select("id").eq("username", candidate).maybeSingle();
      if (!data) break;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      username: candidate,
      name: { en: parsed.data.businessName, ar: parsed.data.businessName, ku: parsed.data.businessName },
      status: "draft",
    })
    .select()
    .single();
  if (error || !business) return { error: "Could not create your business. Please try again." };

  await supabase
    .from("business_members")
    .insert({ business_id: business.id, user_id: authUser.id, role: "owner", accepted_at: new Date().toISOString() });
  await supabase.from("subscriptions").insert({ business_id: business.id, plan_id: "vee_start", status: "trial" });

  redirect("/dashboard");
}
