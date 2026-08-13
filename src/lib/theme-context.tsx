import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  readStoredPreference,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeMode,
  type ThemePreference,
} from "./theme";

/**
 * ThemeProvider — owns the single source of truth for the theme.
 *
 * The initial resolved value intentionally mirrors what the pre-paint script
 * in `index.html` already applied, so mounting is a no-op (no flash). From then
 * on it owns every change: explicit toggles persist to localStorage, "system"
 * follows the OS live, and cross-tab `storage` events keep multiple tabs in
 * sync.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(
    () => readStoredPreference() ?? "system",
  );
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const resolvedTheme: ThemeMode =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Keep the DOM in step with the resolved theme. On mount the resolved value
  // already matches the pre-paint state, so this first run is a no-op.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // While in "system" mode, follow the OS scheme live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Sync across tabs: a preference change elsewhere updates this tab too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const raw = e.newValue;
      if (raw === "light" || raw === "dark" || raw === "system") {
        setThemeState(raw);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode / disabled) — the in-memory
      // preference still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}