import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { SystemThemeToggle } from "@/components/theme/SystemThemeToggle";

export function AIResearchLabShell({
  children,
  online = false,
}: {
  children: React.ReactNode;
  online?: boolean;
}) {
  return (
    <div className="ai-lab-dark relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      <div aria-hidden className="ai-lab-env pointer-events-none absolute inset-0 -z-10">
        <div className="ai-lab-env__base" />
        <div className="ai-lab-env__grid" />
        <div className="ai-lab-env__glow ai-lab-env__glow--c" />
        <div className="ai-lab-env__glow ai-lab-env__glow--b" />
        <div className="ai-lab-particles ai-lab-particles--far" />
        <div className="ai-lab-particles ai-lab-particles--near" />
      </div>

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
        <div className="ai-lab-topbar mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl px-3 py-2.5 sm:gap-x-4 sm:px-4 sm:py-3 md:flex-nowrap md:gap-3">
          {/* Essential brand — logo + title, always present. On mobile the
              "AI Research" badge leaves the navigation and lives in the hero;
              on md+ it returns here, exactly as the desktop design. */}
          <Link
            to="/lab/ai-research"
            aria-label="BK AI Research Lab — home"
            className="group flex min-w-0 items-center gap-2.5 rounded-lg"
          >
            <img
              src={bkLogo}
              alt="BK logo"
              width={1254}
              height={1254}
              className="h-8 w-8 shrink-0 rounded-lg object-cover"
            />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                AI Research Lab
              </span>
              <span className="ai-lab-chip ai-lab-chip--cyan hidden shrink-0 md:inline-flex">
                AI Research
              </span>
            </span>
          </Link>

          {/* Essential controls — theme toggle stays reachable and the primary
              action (Labs) remains. Status + Exit move to the hero on mobile. */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <SystemThemeToggle />
            <span
              className={`ai-lab-chip hidden shrink-0 md:inline-flex${
                online ? " ai-lab-chip--online" : " ai-lab-chip--green"
              }`}
            >
              <span
                className={`ai-lab-dot ${
                  online ? "ai-lab-dot--green" : "ai-lab-dot--amber"
                }`}
              />
              {online ? "System online" : "System standby"}
            </span>
            <Link
              to="/"
              className="group hidden shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06] sm:px-3.5 md:inline-flex"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Exit Lab</span>
              <span className="sm:hidden">Exit</span>
            </Link>
            <Link
              to="/lab"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-3 py-2 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(6,182,212,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_50px_-10px_rgba(6,182,212,0.75)] sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Back to Engineering Lab</span>
              <span className="sm:hidden">Labs</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative px-4 lg:px-6">{children}</main>
    </div>
  );
}