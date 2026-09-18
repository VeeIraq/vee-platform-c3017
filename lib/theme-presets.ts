import type { CSSProperties } from "react";

/**
 * Colour presets a business owner can choose for their own public profile
 * (app/[username]) from Dashboard > Profile > Appearance. "vee" is the
 * platform default and needs no override -- its values match the base
 * tokens already defined in app/globals.css, listed here only so the
 * dashboard can render an accurate preview swatch.
 *
 * Applying a preset means setting these as inline CSS custom properties on
 * the profile page's root wrapper (see getThemeStyle): app/globals.css's
 * `@theme inline` block maps --color-paper etc. to var(--paper) etc., so a
 * scoped override on an ancestor element cascades through every existing
 * bg-paper / text-ink / [background:var(--accent-grad)] utility without
 * touching a single class name.
 */
export const THEME_PRESETS = {
  vee: {
    label: "Vee Classic",
    paper: "#fcfaf5",
    fog: "#f5ebda",
    ink: "#241f1b",
    inkMuted: "#756a5c",
    accent: "#7a3a28",
    accent2: "#c39a6b",
  },
  midnight: {
    label: "Midnight",
    paper: "#181622",
    fog: "#211e2e",
    ink: "#f4f2fb",
    inkMuted: "#a49bc4",
    accent: "#8b7cf6",
    accent2: "#5b8def",
  },
  ocean: {
    label: "Ocean",
    paper: "#f1f8f8",
    fog: "#dcecec",
    ink: "#15302f",
    inkMuted: "#4f7472",
    accent: "#1f6f78",
    accent2: "#4fb3bf",
  },
  sunset: {
    label: "Sunset",
    paper: "#fff5ee",
    fog: "#ffe3cf",
    ink: "#3a1f1a",
    inkMuted: "#8a5c4c",
    accent: "#c94a4a",
    accent2: "#f2a154",
  },
} as const satisfies Record<string, { label: string; paper: string; fog: string; ink: string; inkMuted: string; accent: string; accent2: string }>;

export type ThemePresetId = keyof typeof THEME_PRESETS;
export const THEME_PRESET_IDS = Object.keys(THEME_PRESETS) as ThemePresetId[];

/** Unknown/legacy values (e.g. a column default before this preset existed) fall back to "vee". */
export function resolveThemePreset(value: string | null | undefined): ThemePresetId {
  return value && value in THEME_PRESETS ? (value as ThemePresetId) : "vee";
}

export function getThemeStyle(presetId: string | null | undefined): CSSProperties {
  const preset = THEME_PRESETS[resolveThemePreset(presetId)];
  return {
    "--paper": preset.paper,
    "--fog": preset.fog,
    "--ink": preset.ink,
    "--ink-soft": preset.ink,
    "--ink-muted": preset.inkMuted,
    "--accent": preset.accent,
    "--accent-2": preset.accent2,
    "--accent-grad": `linear-gradient(135deg, ${preset.accent}, ${preset.accent2})`,
  } as CSSProperties;
}
