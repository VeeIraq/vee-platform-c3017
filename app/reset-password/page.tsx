import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { dict } = await getServerDictionary();
  const { expired } = await searchParams;
  return (
    <AuthShell title={t(dict, "auth.resetTitle")} sub={t(dict, "auth.resetSub")}>
      {expired === "1" && (
        <p role="alert" className="mb-5 rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
          {t(dict, "auth.linkExpired")}
        </p>
      )}
      <ResetForm />
    </AuthShell>
  );
}
