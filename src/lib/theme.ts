/**
 * Global theme helpers — the single source of truth for the dark/light system.
 *
 * The resolved theme ("light" | "dark") is the only thing that touches the DOM:
 * the `.dark` class on <html> flips every CSS variable and `dark:` utility.
 * The preference ("light" | "dark" | "system") is what the user chose and is
 * persisted to localStorage under {@link THEME_STORAGE_KEY}.
 *
 * The pre-paint script in `index.html` reads the same storage key before first
 * paint so no wrong-theme flash can occur; this module is used by the React
 * provider afterwards to keep the DOM in sync on change.
 */

import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export type ThemeContextValue = {
  /** The user's preference — "system" until they pick an explicit mode. */
  theme: ThemePreference;
  /** The mode actually applied to the DOM ("light" | "dark"). */
  resolvedTheme: ThemeMode;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
};

/** Shared context — never consumed outside <ThemeProvider>. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Reads the current theme; throws if rendered outside <ThemeProvider>. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}

export const THEME_STORAGE_KEY = "theme";

/** Browser chrome (theme-color meta) per resolved mode. */
export const THEME_COLORS = { dark: "#0F172A", light: "#F2F4F7" } as const;

/** Live OS color scheme — false on non-browser (no SSR here, but be safe). */
export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** The persisted preference, if a valid value is present; otherwise null. */
export function readStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return null;
  } catch {
    return null;
  }
}

/** Resolves a preference (or none) down to an explicit light/dark mode. */
export function resolvePreference(
  preference: ThemePreference | null,
): ThemeMode {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersDark() ? "dark" : "light";
}

/** The mode already applied to <html> (set pre-paint by the index.html script). */
export function currentAppliedTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies a resolved mode to the DOM root + browser chrome meta. */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) meta.content = THEME_COLORS[mode];
}