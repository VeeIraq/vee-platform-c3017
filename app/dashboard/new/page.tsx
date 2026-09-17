import { requireUser } from "@/lib/auth/dal";
import { getMyBusinessMemberships } from "@/lib/auth/dal";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { NewBusinessForm } from "./new-business-form";

export default async function NewBusinessPage() {
  await requireUser();
  const memberships = await getMyBusinessMemberships();
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <AuthShell title="Set up your business" sub="One business account, one dashboard — you can add more later.">
      <NewBusinessForm />
    </AuthShell>
  );
}
