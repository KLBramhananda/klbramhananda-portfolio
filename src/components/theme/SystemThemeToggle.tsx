import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Theme toggle — shared by the portfolio nav and both lab shells so every
 * environment toggles through the same ThemeProvider. The icon shows the
 * ACTION (Sun = switch to light on a dark theme, Moon = switch to dark on a
 * light theme), never just the current theme.
 */
export function SystemThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground transition-colors duration-300 hover:border-cyan-accent/40 hover:bg-slate-900/[0.06] hover:text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
      <span
        key={dark ? "sun" : "moon"}
        className="theme-toggle__icon"
        aria-hidden="true"
      >
        {dark ? (
          <Sun className="h-[1.125rem] w-[1.125rem]" />
        ) : (
          <Moon className="h-[1.125rem] w-[1.125rem]" />
        )}
      </span>
    </button>
  );
}