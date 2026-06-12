"use client";

import React from "react";
import type { Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  toggle: () => void;
}

export default function ThemeToggle({ theme, toggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="p-2 rounded-full transition-colors
        bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
        text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white
        border border-slate-200 dark:border-white/[0.12]"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
