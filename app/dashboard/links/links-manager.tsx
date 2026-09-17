"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProfileLink, deleteProfileLink, toggleProfileLink, type ActionState } from "@/lib/actions/links";
import { Field, TextInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/config";

type Link = { id: string; icon: string; label: Record<string, string>; url: string; enabled: boolean };

export function LinksManager({ businessId, links, locale }: { businessId: string; links: Link[]; locale: Locale }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProfileLink, undefined);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-paper p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{pick(link.label, locale)}</p>
              <p className="truncate text-xs text-ink-muted">{link.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <input
                  type="checkbox"
                  defaultChecked={link.enabled}
                  className="h-4 w-4"
                  onChange={(e) =>
                    startTransition(() => {
                      toggleProfileLink(link.id, businessId, e.target.checked);
                      router.refresh();
                    })
                  }
                />
                Visible
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(() => {
                    deleteProfileLink(link.id, businessId);
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
        {links.length === 0 && <p className="text-sm text-ink-muted">No custom links yet.</p>}
      </ul>

      <form action={action} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <input type="hidden" name="businessId" value={businessId} />
        <h2 className="font-bold text-ink">Add a link</h2>
        {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label (English)" htmlFor="labelEn" required>
            <TextInput id="labelEn" name="labelEn" required />
          </Field>
          <Field label="URL" htmlFor="url" required>
            <TextInput id="url" name="url" type="url" placeholder="https://" required />
          </Field>
          <Field label="Label (Arabic)" htmlFor="labelAr">
            <TextInput id="labelAr" name="labelAr" dir="rtl" />
          </Field>
          <Field label="Label (Kurdish)" htmlFor="labelKu">
            <TextInput id="labelKu" name="labelKu" dir="rtl" />
          </Field>
        </div>
        <input type="hidden" name="icon" value="link" />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Adding…" : "Add link"}
        </Button>
      </form>
    </div>
  );
}
