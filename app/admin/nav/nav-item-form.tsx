"use client";

import { useActionState, useState, useTransition } from "react";
import { saveNavItem, uploadPlatformImage, type ActionState } from "@/lib/actions/cms";

export type NavItemFormValue = {
  id?: string;
  label: { en: string; ar: string; ku: string };
  url: string;
  icon: string | null;
  imageUrl: string | null;
  openNewTab: boolean;
};

export function NavItemForm({
  location,
  footerGroup,
  item,
  onDone,
}: {
  location: "header" | "footer";
  footerGroup?: "solutions" | "company" | "legal";
  item?: NavItemFormValue;
  onDone?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [uploadPending, startUpload] = useTransition();
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    formData.set("imageUrl", imageUrl);
    const result = await saveNavItem(prev, formData);
    if (result?.success) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="location" value={location} />
      {location === "footer" && <input type="hidden" name="footerGroup" value={footerGroup} />}
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Label (English)
          <input name="labelEn" defaultValue={item?.label.en} required className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Label (Arabic)
          <input name="labelAr" dir="rtl" defaultValue={item?.label.ar} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Label (Kurdish)
          <input name="labelKu" dir="rtl" defaultValue={item?.label.ku} className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          URL
          <input name="url" defaultValue={item?.url} required placeholder="/products or https://…" className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Icon (emoji, optional)
          <input name="icon" defaultValue={item?.icon ?? ""} placeholder="📇" className="rounded-[var(--radius-sm)] border border-line px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>
      <div className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Image (optional — shown instead of the icon if set)
        <div className="flex items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            disabled={uploadPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("file", file);
              startUpload(async () => {
                const result = await uploadPlatformImage(undefined, fd);
                if (result?.url) setImageUrl(result.url);
              });
            }}
            className="text-xs"
          />
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")} className="text-xs font-semibold text-danger">
              Remove
            </button>
          )}
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft">
        <input type="checkbox" name="openNewTab" defaultChecked={item?.openNewTab} />
        Open in a new tab
      </label>
      <button type="submit" disabled={pending || uploadPending} className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : item ? "Save changes" : "Add link"}
      </button>
    </form>
  );
}
