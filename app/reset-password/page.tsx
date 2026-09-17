import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const { dict } = await getServerDictionary();
  return (
    <AuthShell title={t(dict, "auth.resetTitle")} sub={t(dict, "auth.resetSub")}>
      <ResetForm />
    </AuthShell>
  );
}
