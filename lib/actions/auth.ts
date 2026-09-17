"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthFormState = { error?: string } | undefined;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const withinLimit = await checkRateLimit("login", 10, 5 * 60 * 1000);
  if (!withinLimit) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Incorrect email or password." };
  }

  const next = (formData.get("next") as string) || "/dashboard";
  redirect(next.startsWith("/") ? next : "/dashboard");
}

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  businessName: z.string().trim().min(2, "Enter your business name."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

/**
 * Business owner signup. Creates the auth user, then — on first login — the
 * business + owner membership are created via `createBusinessForCurrentUser`
 * (kept separate so a signup can also be completed by Vee staff creating an
 * account on a customer's behalf from the Super Admin area).
 */
export async function signup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const withinLimit = await checkRateLimit("signup", 5, 15 * 60 * 1000);
  if (!withinLimit) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    return { error: error.message.includes("already registered") ? "An account with this email already exists." : error.message };
  }
  if (!data.user) {
    return { error: "Could not create your account. Please try again." };
  }

  // Email confirmation may be required depending on the Supabase project's
  // auth settings; if a session came back immediately, provision the
  // business now so the owner lands straight in their dashboard.
  if (data.session) {
    await provisionBusiness(data.user.id, parsed.data.businessName);
    redirect("/dashboard");
  }

  redirect("/login?checkEmail=1");
}

async function provisionBusiness(userId: string, businessName: string) {
  const supabase = await createClient();
  const username = await generateUniqueUsername(businessName);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({ username, name: { en: businessName, ar: businessName, ku: businessName }, status: "draft" })
    .select()
    .single();
  if (businessError || !business) return;

  await supabase.from("business_members").insert({
    business_id: business.id,
    user_id: userId,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  await supabase.from("subscriptions").insert({
    business_id: business.id,
    plan_id: "vee_start",
    status: "trial",
  });
}

const RESERVED_USERNAMES = new Set([
  "login", "signup", "dashboard", "admin", "api", "products", "product", "contact",
  "privacy", "terms", "about", "menu", "pricing", "plans", "faq", "reset-password",
  "_next", "public", "brand", "vee", "www",
]);

async function generateUniqueUsername(businessName: string) {
  const supabase = await createClient();
  const base =
    businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "business";

  let candidate = RESERVED_USERNAMES.has(base) ? `${base}-vee` : base;
  let suffix = 0;
  // Loop until we find a free, non-reserved slug.
  // (Bounded — usernames are short and collisions are rare in practice.)
  while (suffix < 50) {
    if (!RESERVED_USERNAMES.has(candidate)) {
      const { data } = await supabase.from("businesses").select("id").eq("username", candidate).maybeSingle();
      if (!data) return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

const resetSchema = z.object({ email: z.string().email("Enter a valid email address.") });

export async function requestPasswordReset(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const withinLimit = await checkRateLimit("reset", 5, 15 * 60 * 1000);
  if (!withinLimit) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = resetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password/confirm`,
  });
  // Always report success (regardless of whether the email exists) to avoid
  // leaking which emails have accounts.
  return { error: undefined };
}

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

/**
 * Called from the reset-password confirmation page, which the user reaches
 * via the emailed link — by that point Supabase has already exchanged the
 * link's code for a recovery session (see the /reset-password/confirm page,
 * which calls `exchangeCodeForSession` before rendering this form).
 */
export async function updatePassword(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "Could not update your password. Please request a new reset link." };
  }
  redirect("/dashboard");
}
