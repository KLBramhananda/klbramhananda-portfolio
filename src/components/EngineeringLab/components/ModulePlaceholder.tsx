import { ArrowLeft, Construction, FlaskConical, Hammer } from "lucide-react";
import { LAB_MODULES, type LabModule } from "../data/modules";
import { Link } from "@tanstack/react-router";

/**
 * Placeholder screen for each Lab module. Establishes the per-module layout,
 * breadcrumb, and "back to module selection" behavior — the surface that the
 * real interactive scenarios will mount onto next.
 */
export function ModulePlaceholder({
  module,
  onBack,
}: {
  module: LabModule;
  onBack: () => void;
}) {
  // Defensive: always render from the canonical module definition so a stale
  // or incomplete object passed in (e.g. via preserved Fast Refresh state)
  // can never produce an undefined icon or empty coming-soon list.
  const canonical = LAB_MODULES.find((m) => m.id === module.id) ?? module;
  const Icon = canonical.icon ?? FlaskConical;
  const blue = canonical.accent === "blue";
  const name = canonical.name;
  const tagline = canonical.tagline;
  const description = canonical.description;

  return (
    <section className="mx-auto max-w-5xl pb-24 pt-8 sm:pb-32">
      {/* Breadcrumb + back */}
      <nav
        aria-label="Breadcrumb"
        className="animate-fade-up flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <Link to="/lab" className="font-medium text-muted-foreground transition-colors hover:text-cyan-accent">
          BK Engineering Lab
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground/85">{name}</span>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          All modules
        </button>
      </nav>

      {/* Module header */}
      <div className="mt-10 animate-fade-up">
        <div
          className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl ${
            blue
              ? "bg-gradient-to-br from-blue-accent/25 to-cyan-accent/15 text-blue-accent shadow-[0_0_40px_-12px_rgba(59,130,246,0.6)]"
              : "bg-gradient-to-br from-cyan-accent/25 to-blue-accent/15 text-cyan-accent shadow-[0_0_40px_-12px_rgba(6,182,212,0.6)]"
          }`}
        >
          <Icon className="h-8 w-8" strokeWidth={1.6} />
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
          Module · In development
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gradient sm:text-5xl">
          {name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cyan-accent">
          {tagline}
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Construction state */}
      <div className="mt-12 rounded-3xl glass-strong p-8 sm:p-10">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
              <Construction className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Foundation is in place — simulator coming soon
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                The routing, layout, and module shell for{" "}
                <span className="text-foreground/85">{name}</span> are
                ready. Interactive scenarios, simulations, and live system
                models will mount here next.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/25 bg-cyan-accent/10 px-3 py-1 text-xs font-medium text-cyan-accent">
              <Hammer className="h-3.5 w-3.5" />
              Under construction
            </span>
          </div>
        </div>

        <ul className="mt-10 grid gap-3 border-t border-slate-900/8 pt-8 sm:grid-cols-3 dark:border-white/8">
          {(module.comingSoon ?? []).map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 rounded-xl border border-slate-900/10 bg-slate-900/[0.03] px-4 py-3 text-sm text-foreground/85 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent/70" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/10 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab modules
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-cyan-accent transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          Exit Lab
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}