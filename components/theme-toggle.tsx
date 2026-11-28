"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage can be blocked; the choice then lasts for this visit
    }
  };

  // both icons are rendered and CSS picks one, so there is no flash before hydration
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch color theme"
      className="theme-toggle -mr-3 grid size-10 shrink-0 cursor-pointer place-items-center text-faint transition-colors hover:text-fg"
    >
      <Sun className="icon-sun size-4" strokeWidth={1.5} aria-hidden />
      <Moon className="icon-moon size-4" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
