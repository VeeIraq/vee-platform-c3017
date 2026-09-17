"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBusinessStatusAsAdmin } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function BusinessRowActions({ businessId, status }: { businessId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set(next: "draft" | "published" | "suspended") {
    startTransition(async () => {
      await setBusinessStatusAsAdmin(businessId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== "published" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => set("published")}>
          Publish
        </Button>
      )}
      {status !== "draft" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => set("draft")}>
          Unpublish
        </Button>
      )}
      {status !== "suspended" && (
        <Button size="sm" variant="danger" disabled={pending} onClick={() => set("suspended")}>
          Suspend
        </Button>
      )}
    </div>
  );
}
