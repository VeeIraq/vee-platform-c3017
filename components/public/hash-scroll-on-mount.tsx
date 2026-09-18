"use client";

import { useEffect } from "react";

/**
 * Handles landing on "/#how" (or any other in-page anchor) from a different
 * page -- e.g. clicking "How It Works" in the header while on /login. The
 * header's own click handler (see site-header.tsx) only covers the
 * same-page case; a cross-page Link navigation reloads/re-renders this page
 * fresh, so the scroll has to happen once it's actually mounted, with the
 * same sticky-header offset the header's own handler uses.
 */
export function HashScrollOnMount() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    // Let the initial paint settle before measuring/scrolling.
    requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  }, []);

  return null;
}
