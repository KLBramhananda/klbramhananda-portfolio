import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { SystemThemeToggle } from "@/components/theme/SystemThemeToggle";

/**
 * Full-screen shell for the Engineering Lab. Provides the isolated Lab
 * environment: a lab-owned top bar with the "Exit Lab" escape back to the
 * portfolio, a subtle enterprise ambient background, and the content container
 * for whichever Lab screen is active. Rendered only inside the lazy-loaded
 * `/lab` chunk — never on the portfolio.
 */
export function LabShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Lab ambient background — static radial washes + a faint engineering
          grid, matching the premium dark-navy / cyan-blur language of the
          portfolio without importing its background effects. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="lab-ambient absolute inset-0" />
        <div className="lab-grid absolute inset-0 opacity-60" />
        <div className="lab-3d-drift absolute -top-40 left-[8%] h-96 w-96 rounded-full bg-cyan-accent/15 blur-[7rem]" />
        <div className="lab-3d-drift lab-3d-drift--slow absolute top-1/3 right-[4%] h-[28rem] w-[28rem] rounded-full bg-blue-accent/10 blur-[8rem]" />
      </div>

      {/* Lab top bar — lab-owned chrome, floating and sticky like the
          portfolio nav but fully self-contained. */}
      <header className="sticky top-0 z-40 px-4 pt-4 lg:px-6">
        <div className="lab-topbar mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <Link
            to="/lab"
            aria-label="BK Engineering Lab — home"
            className="group flex min-w-0 items-center gap-3 rounded-lg"
          >
            <img
              src={bkLogo}
              alt="BK logo"
              width={1254}
              height={1254}
              className="h-8 w-8 shrink-0 rounded-lg object-cover"
            />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                Engineering Lab
              </span>
              <span className="hidden shrink-0 rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-widest text-cyan-accent sm:inline-flex">
                Playground
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <SystemThemeToggle />
            <span
              aria-hidden
              className="hidden items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-3 py-1.5 text-xs text-muted-foreground md:inline-flex dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent animate-pulse" />
              Sandbox environment
            </span>
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Back to Portfolio</span>
              <span className="sm:hidden">Exit</span>
            </Link>
            <Link
              to="/"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-4 py-2 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(6,182,212,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_50px_-10px_rgba(6,182,212,0.75)]"
            >
              Exit Lab
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative px-4 lg:px-6">{children}</main>
    </div>
  );
}