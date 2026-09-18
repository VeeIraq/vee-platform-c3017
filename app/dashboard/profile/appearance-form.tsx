"use client";

import { useActionState, useState } from "react";
import { updateBusinessAppearance, type ActionState, type ProfileSectionKey } from "@/lib/actions/business";
import { THEME_PRESETS, THEME_PRESET_IDS, resolveThemePreset, type ThemePresetId } from "@/lib/theme-presets";
import { Button } from "@/components/ui/button";

const SECTION_LABELS: Record<ProfileSectionKey, string> = {
  offer: "Promo banner",
  menu: "Menu link",
  whatsapp: "WhatsApp button",
  instagram: "Instagram link",
  maps: "Google Maps link",
  reviews: "Google Reviews link",
  call: "Call button",
  website: "Website link",
  reservation: "Reservation link",
  customReview: "Rate-us page link",
  customLinks: "Your custom links",
};

const SECTION_KEYS = Object.keys(SECTION_LABELS) as ProfileSectionKey[];

export function AppearanceForm({
  businessId,
  themePreset,
  profileSections,
}: {
  businessId: string;
  themePreset: string | null;
  profileSections: Partial<Record<ProfileSectionKey, boolean>> | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateBusinessAppearance, undefined);
  const [selectedPreset, setSelectedPreset] = useState<ThemePresetId>(resolveThemePreset(themePreset));

  return (
    <form action={action} className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-line bg-paper p-6">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="themePreset" value={selectedPreset} />

      <div>
        <h2 className="text-lg font-extrabold text-ink">Appearance</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a colour theme and pick which sections show on your public profile at vee.iq. This is separate from
          what your plan includes -- it only ever hides things, never unlocks them.
        </p>
      </div>

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

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink">Theme</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_PRESET_IDS.map((id) => {
            const preset = THEME_PRESETS[id];
            const checked = selectedPreset === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={checked}
                onClick={() => setSelectedPreset(id)}
                className={`flex min-h-11 flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-3 text-center transition-colors ${
                  checked ? "border-accent" : "border-line hover:border-ink-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-9 w-full rounded-[var(--radius-sm)]"
                  style={{ background: `linear-gradient(135deg, ${preset.accent}, ${preset.accent2})` }}
                />
                <span className="text-xs font-semibold text-ink">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink">Sections shown on your profile</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SECTION_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2.5 text-sm font-semibold text-ink-soft">
              <input
                type="checkbox"
                name={`section_${key}`}
                defaultChecked={profileSections?.[key] ?? true}
                className="h-5 w-5 rounded border-line"
              />
              {SECTION_LABELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save appearance"}
      </Button>
    </form>
  );
}
