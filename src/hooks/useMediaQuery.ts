"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe media query hook.
 * Returns `false` on the server and during hydration to avoid mismatch,
 * then syncs with the real viewport once the component mounts.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Shortcut: true when viewport < 768px (Tailwind `md` breakpoint).
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
