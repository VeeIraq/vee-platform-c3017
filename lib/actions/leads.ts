"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export type LeadFormState = { error?: string; success?: boolean } | undefined;

const leadSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  businessName: z.string().trim().min(2, "Enter your business name."),
  businessType: z.string().trim().optional(),
  phone: z.string().trim().min(6, "Enter a valid phone number."),
  whatsapp: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  branches: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  language: z.string().trim().optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function submitLead(_prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const withinLimit = await checkRateLimit("lead", 5, 10 * 60 * 1000);
  if (!withinLimit) {
    return { error: "Too many submissions. Please try again in a few minutes." };
  }

  // Honeypot: a hidden field real users never fill in; bots that
  // autofill every field will trip it.
  if (formData.get("company_website")) {
    return { success: true };
  }

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    instagram: formData.get("instagram"),
    branches: formData.get("branches"),
    plan: formData.get("plan"),
    language: formData.get("language"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    name: parsed.data.name,
    business_name: parsed.data.businessName,
    phone: parsed.data.phone,
    source: "contact_form",
    status: "new",
    metadata: {
      businessType: parsed.data.businessType,
      whatsapp: parsed.data.whatsapp,
      instagram: parsed.data.instagram,
      branches: parsed.data.branches,
      plan: parsed.data.plan,
      language: parsed.data.language,
      message: parsed.data.message,
    },
  });

  if (error) {
    return { error: "Something went wrong submitting the form. Please try WhatsApp instead." };
  }

  // TODO once a notification channel is configured: notify Vee staff (email
  // or Slack webhook) here — see README "Environment variables" for where
  // to plug in a LEADS_NOTIFY_WEBHOOK_URL.

  return { success: true };
}
