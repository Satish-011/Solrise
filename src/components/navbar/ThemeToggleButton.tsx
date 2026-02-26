"use client";

import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const ThemeToggleButton: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden"
    >
      <span key={theme} className="theme-toggle-spin">
        {theme === "light" ? (
          <FaMoon className="text-[var(--text-secondary)] text-sm" />
        ) : (
          <FaSun className="text-amber-400 text-sm" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggleButton;
