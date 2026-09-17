import Link from "next/link";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  const { dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);

  return (
    <AuthShell
      title={tt("auth.createAccountTitle")}
      sub={tt("auth.createAccountSub")}
      footer={
        <>
          {tt("auth.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            {tt("auth.signIn")}
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
