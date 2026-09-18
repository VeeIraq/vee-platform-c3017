import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline disabled:opacity-60 disabled:cursor-not-allowed min-h-11 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0";

const variants: Record<Variant, string> = {
  primary: "text-white shadow-md [background:var(--accent-grad)] hover:brightness-105 active:scale-[0.98]",
  outline: "border border-line text-ink hover:border-ink bg-paper",
  ghost: "text-ink hover:bg-fog",
  danger: "bg-danger text-white hover:brightness-105",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-[15px]",
  sm: "px-3.5 py-2 text-sm",
};

/** Shared class builder so links can look like buttons (e.g. `<Link className={buttonClass()}>`). */
export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}
