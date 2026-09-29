"use client";
import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { useLocalPref, writeLocalPref } from "./useLocalPref";

const KEY = "bmus.mobile.appearance";

export type Appearance = "system" | "light" | "dark";

/**
 * System / Light / Dark on top of the app's existing named-theme system
 * (ThemeProvider). Light and Dark just pick a theme; System is one extra
 * per-browser flag that AppearanceSync resolves against the OS setting.
 */
export function useAppearance() {
  const { theme, setTheme } = useTheme();
  const system = useLocalPref(KEY) === "system";
  const appearance: Appearance = system ? "system" : theme.mode === "dark" ? "dark" : "light";
  return {
    appearance,
    theme,
    setAppearance(next: Appearance) {
      writeLocalPref(KEY, next === "system" ? "system" : null);
      if (next === "light") setTheme("light");
      // Keep a named dark theme (e.g. Tokyo Night) if one is already active.
      if (next === "dark" && theme.mode !== "dark") setTheme("dark");
    },
    /** Picking a named theme is an explicit choice, so it ends System mode. */
    setNamedTheme(id: string) {
      writeLocalPref(KEY, null);
      setTheme(id);
    },
  };
}

/** While Appearance is "System", keep the theme's light/dark side in step with the OS. */
export function AppearanceSync() {
  const { theme, setTheme } = useTheme();
  const system = useLocalPref(KEY) === "system";
  React.useEffect(() => {
    if (!system) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const id = mq.matches ? (theme.mode === "dark" ? theme.id : "dark") : "light";
      if (id !== theme.id) setTheme(id);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [system, theme.id, theme.mode, setTheme]);
  return null;
}
