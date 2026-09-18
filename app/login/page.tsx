import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; checkEmail?: string }>;
}) {
  const { next, checkEmail } = await searchParams;
  const { dict } = await getServerDictionary();
  const tt = (path: string) => t(dict, path);

  return (
    <AuthShell
      title={tt("auth.signInTitle")}
      sub={tt("auth.signInSub")}
      footer={
        <>
          {tt("auth.noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            {tt("auth.createAccount")}
          </Link>
        </>
      }
    >
      <LoginForm next={next ?? "/dashboard"} checkEmail={checkEmail === "1"} />
    </AuthShell>
  );
}
