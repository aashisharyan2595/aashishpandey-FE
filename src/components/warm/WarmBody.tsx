"use client";

import { useEffect } from "react";

/**
 * Toggles the shared body background to the warm gradient while a
 * warm-redesign page is mounted, and back off on unmount. Needed because
 * body is the one element shared across every route (root layout.tsx), and
 * the gradient has to live there — not on a per-page wrapper div — for
 * SiteFx's negative-z-index Three.js canvas to render visibly. See the
 * body.warm-bg comment in globals.css for why.
 */
export default function WarmBody() {
  useEffect(() => {
    document.body.classList.add("warm-bg");
    return () => {
      document.body.classList.remove("warm-bg");
    };
  }, []);

  return null;
}
