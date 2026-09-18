"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Reads the visitor's reduced-motion preference via useSyncExternalStore
 * (not a plain useState+useEffect read) so the server-rendered markup
 * (which always assumes "no preference", matching getServerSnapshot) and
 * the first client render never mismatch -- React reconciles the real
 * value in the commit that follows hydration, which is exactly the
 * problem useSyncExternalStore exists to solve for external browser APIs
 * like matchMedia.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Wraps marketing-page content that should fade/slide in as it scrolls into
 * view. Deliberately conservative:
 *  - Renders children plainly (no `data-animate`, no observer) when the
 *    visitor prefers reduced motion -- content is never hidden waiting on
 *    an animation that will never play.
 *  - The matching CSS in app/globals.css only applies the hidden starting
 *    state under `@media (prefers-reduced-motion: no-preference)` too, as a
 *    second, CSS-only backstop for the same preference.
 *  - `once` (default true): stays visible after the first reveal instead of
 *    re-hiding on scroll-away, which is calmer for a marketing page a
 *    visitor might scroll up and down while reading.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delayMs = 0,
  once = true,
}: {
  children: ReactNode;
  as?: "div" | "li" | "section";
  className?: string;
  delayMs?: number;
  once?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, once]);

  const Comp = Tag as "div";
  return (
    <Comp
      ref={ref}
      data-animate={reducedMotion ? undefined : "true"}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={!reducedMotion && delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Comp>
  );
}
