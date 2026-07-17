"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("theme", theme);
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Mirrors the inline theme-init script's DOM state into React after mount —
  // safe because that script runs before hydration, so this never causes a
  // visible flip, just makes the value readable for the toggle icon.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount gate
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  if (!theme) {
    return <span className={className} aria-hidden style={{ width: 20, height: 20, display: "inline-block" }} />;
  }

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      data-cursor-hover
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
          <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="9" y1="0.5" x2="9" y2="2.5" />
            <line x1="9" y1="15.5" x2="9" y2="17.5" />
            <line x1="0.5" y1="9" x2="2.5" y2="9" />
            <line x1="15.5" y1="9" x2="17.5" y2="9" />
            <line x1="2.9" y1="2.9" x2="4.3" y2="4.3" />
            <line x1="13.7" y1="13.7" x2="15.1" y2="15.1" />
            <line x1="2.9" y1="15.1" x2="4.3" y2="13.7" />
            <line x1="13.7" y1="4.3" x2="15.1" y2="2.9" />
          </g>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M15.5 10.5A6.5 6.5 0 0 1 7.5 2.5a6.5 6.5 0 1 0 8 8Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
