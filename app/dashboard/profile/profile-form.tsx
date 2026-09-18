"use client";

import { useActionState, useState } from "react";
import { updateBusinessProfile, uploadBusinessImage, type ActionState } from "@/lib/actions/business";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Business = {
  id: string;
  name: Record<string, string>;
  category: Record<string, string>;
  description: Record<string, string>;
  whatsapp_number: string | null;
  phone: string | null;
  instagram_url: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  google_review_url: string | null;
  ordering_mode: string;
  menu_link_enabled: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
};

export function ProfileForm({ business, imageUploadsEnabled = true }: { business: Business; imageUploadsEnabled?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateBusinessProfile, undefined);
  const [tab, setTab] = useState<"en" | "ar" | "ku">("en");

  return (
    <div className="flex flex-col gap-6">
      {imageUploadsEnabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadCard businessId={business.id} field="logo_url" label="Logo" currentUrl={business.logo_url} />
          <ImageUploadCard businessId={business.id} field="cover_image_url" label="Cover image" currentUrl={business.cover_image_url} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["Logo", "Cover image"] as const).map((label) => {
            const url = label === "Logo" ? business.logo_url : business.cover_image_url;
            return (
              <div key={label} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
                <p className="mb-2 text-sm font-bold text-ink">{label}</p>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="mb-2 h-24 w-24 rounded-[var(--radius-sm)] border border-line object-cover" />
                ) : (
                  <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-line text-2xl">
                    🖼️
                  </div>
                )}
                <p className="text-xs text-ink-muted">Image uploads aren&apos;t included on your current plan.</p>
              </div>
            );
          })}
        </div>
      )}

      <form action={action} className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
        <input type="hidden" name="businessId" value={business.id} />

        {state?.error && (
          <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" className="rounded-[var(--radius-sm)] bg-success-bg px-4 py-3 text-sm font-medium text-success">
            Saved.
          </p>
        )}

        <div role="tablist" aria-label="Language" className="flex gap-2">
          {(["en", "ar", "ku"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={tab === lang}
              onClick={() => setTab(lang)}
              className={`min-h-9 rounded-full border px-4 py-1.5 text-sm font-semibold ${
                tab === lang ? "border-accent bg-accent text-white" : "border-line text-ink-soft"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {(["en", "ar", "ku"] as const).map((lang) => (
          <div key={lang} hidden={tab !== lang} className="flex flex-col gap-4">
            <Field label={`Business name (${lang.toUpperCase()})`} htmlFor={`name${lang}`} required={lang === "en"}>
              <TextInput id={`name${lang}`} name={`name${lang === "en" ? "En" : lang === "ar" ? "Ar" : "Ku"}`} defaultValue={business.name?.[lang] ?? ""} required={lang === "en"} dir={lang === "en" ? "ltr" : "rtl"} />
            </Field>
            <Field label={`Category (${lang.toUpperCase()})`} htmlFor={`category${lang}`}>
              <TextInput id={`category${lang}`} name={`category${lang === "en" ? "En" : lang === "ar" ? "Ar" : "Ku"}`} defaultValue={business.category?.[lang] ?? ""} dir={lang === "en" ? "ltr" : "rtl"} />
            </Field>
            <Field label={`Description (${lang.toUpperCase()})`} htmlFor={`description${lang}`}>
              <TextArea id={`description${lang}`} name={`description${lang === "en" ? "En" : lang === "ar" ? "Ar" : "Ku"}`} defaultValue={business.description?.[lang] ?? ""} dir={lang === "en" ? "ltr" : "rtl"} />
            </Field>
          </div>
        ))}

        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="whatsappNumber" hint="Include country code, e.g. 9647709565566">
            <TextInput id="whatsappNumber" name="whatsappNumber" defaultValue={business.whatsapp_number ?? ""} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <TextInput id="phone" name="phone" defaultValue={business.phone ?? ""} />
          </Field>
          <Field label="Instagram URL" htmlFor="instagramUrl">
            <TextInput id="instagramUrl" name="instagramUrl" type="url" defaultValue={business.instagram_url ?? ""} />
          </Field>
          <Field label="Website URL" htmlFor="websiteUrl">
            <TextInput id="websiteUrl" name="websiteUrl" type="url" defaultValue={business.website_url ?? ""} />
          </Field>
          <Field label="Google Maps URL" htmlFor="googleMapsUrl">
            <TextInput id="googleMapsUrl" name="googleMapsUrl" type="url" defaultValue={business.google_maps_url ?? ""} />
          </Field>
          <Field label="Google Review URL" htmlFor="googleReviewUrl">
            <TextInput id="googleReviewUrl" name="googleReviewUrl" type="url" defaultValue={business.google_review_url ?? ""} />
          </Field>
          <Field label="Ordering mode" htmlFor="orderingMode">
            <Select id="orderingMode" name="orderingMode" defaultValue={business.ordering_mode}>
              <option value="menu_only">Menu only (browse)</option>
              <option value="whatsapp">WhatsApp ordering</option>
              <option value="online">Online ordering</option>
              <option value="table">Table ordering</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold text-ink-soft">
            <input type="checkbox" name="menuLinkEnabled" defaultChecked={business.menu_link_enabled} className="h-5 w-5 rounded border-line" />
            Show the menu link on my profile
          </label>
        </div>

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

function ImageUploadCard({
  businessId,
  field,
  label,
  currentUrl,
}: {
  businessId: string;
  field: "logo_url" | "cover_image_url";
  label: string;
  currentUrl: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadBusinessImage, undefined);

  return (
    <form action={action} className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="field" value={field} />
      <p className="mb-2 text-sm font-bold text-ink">{label}</p>
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="mb-3 h-24 w-24 rounded-[var(--radius-sm)] border border-line object-cover" />
      ) : (
        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-line text-2xl">
          🖼️
        </div>
      )}
      {state?.error && <p className="mb-2 text-xs font-medium text-danger">{state.error}</p>}
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
          className="text-xs"
          aria-label={`Upload ${label}`}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
