"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBusinessStatus } from "@/lib/actions/business";
import { Button } from "@/components/ui/button";

export function PublishToggle({
  businessId,
  status,
  canPublish,
}: {
  businessId: string;
  status: string;
  canPublish: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!canPublish) return null;

  return (
    <Button
      variant={status === "published" ? "outline" : "primary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setBusinessStatus(businessId, status === "published" ? "draft" : "published");
          router.refresh();
        })
      }
    >
      {pending ? "…" : status === "published" ? "Unpublish" : "Publish profile"}
    </Button>
  );
}
