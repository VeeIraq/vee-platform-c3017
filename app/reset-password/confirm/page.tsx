import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Set a new password" };

// By the time a visitor reaches this page, /auth/confirm has already
// exchanged the emailed code for a real session and set its cookie on the
// redirect that brought them here -- this page only ever renders the form.
// (It used to do the exchange itself, but a Server Component can't persist
// a session cookie; see app/auth/confirm/route.ts.)
export default async function ResetConfirmPage() {
  return (
    <AuthShell title="Set a new password" sub="Choose a new password for your Vee account.">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
