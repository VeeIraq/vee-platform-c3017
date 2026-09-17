import localFont from "next/font/local";

/**
 * Vee brand fonts.
 *
 * Self-hosted (next/font/local) rather than next/font/google: the build
 * environment doesn't have network access to fonts.googleapis.com, and
 * self-hosting also means production doesn't take a runtime dependency on
 * Google's font CDN either. Files under ./fonts/files were copied from the
 * @fontsource/{inter,tajawal,noto-sans-arabic} npm packages (same font
 * files Google Fonts serves, just distributed as static assets).
 *
 * IMPORTANT — Kurdish typography fix:
 * The original static site partly hard-coded Kurdish text to reuse Tajawal
 * (the Arabic font) in a few places (language gate, lang menu). Noto Sans
 * Arabic has full Sorani Kurdish glyph coverage and is the correct font for
 * `lang="ku"` content. Kurdish must never look visibly different in size,
 * weight, or line-height from Arabic — only the font family differs, and
 * both are applied consistently everywhere via the `:lang()` CSS rules in
 * globals.css, never per-component overrides.
 */

export const fontEn = localFont({
  src: [
    { path: "./fonts/files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/files/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/files/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/files/inter-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-en",
  display: "swap",
});

export const fontAr = localFont({
  src: [
    { path: "./fonts/files/tajawal-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/files/tajawal-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/files/tajawal-arabic-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/files/tajawal-arabic-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-ar",
  display: "swap",
});

export const fontKu = localFont({
  src: [
    { path: "./fonts/files/noto-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/files/noto-sans-arabic-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/files/noto-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/files/noto-sans-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/files/noto-sans-arabic-arabic-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-ku",
  display: "swap",
});

export const fontVariables = `${fontEn.variable} ${fontAr.variable} ${fontKu.variable}`;
