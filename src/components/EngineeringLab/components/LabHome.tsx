import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, BrainCircuit, FlaskConical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LAB_MODULES, type LabModule } from "../data/modules";

const STATUS_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]";

export function LabHome({
  onOpen,
}: {
  onOpen: (module: LabModule) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 sm:pt-16">
      {/* Lab hero */}
      <div className="max-w-3xl animate-fade-up">
        <p className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
          Interactive Enterprise Systems Playground
        </p>
        <h1 className="mt-5 block max-w-full text-4xl font-bold leading-[1.25] tracking-tight text-gradient sm:text-6xl lg:text-7xl">
          BK Engineering Lab
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A hands-on playground for the systems I build professionally - design
          enterprise architectures, model ERP and source-to-pay workflows, and
          rehearse production incident response. Everything here is a synthetic
          sandbox: safe to break, explore, and learn from.
        </p>
      </div>

      {/* Flagship AI experience — routes to the dedicated, code-split AI
          Research Lab at /lab/ai-research. Kept as a single primary entry
          above the system modules. The AI Research Lab already ships its own
          shell top bar with "Back to Engineering Lab", and because this is a
          real TanStack Router Link, browser back/forward behaves naturally. */}
      <div className="mt-10">
        <Link
          to="/lab/ai-research"
          aria-label="Open BK AI Research Lab"
          className="lab-ai-flagship lab-raise group relative block overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div aria-hidden className="lab-ai-flagship__wash pointer-events-none absolute inset-0" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-cyan-accent">
                <BrainCircuit className="h-3.5 w-3.5" />
                Flagship AI experience
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
                AI Research Lab
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                An isolated research sandbox for the AI systems I build and
                study - reasoning cores, perception, memory, agents, tool
                calling, digital worlds, and robot assistants.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-foreground/80">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  9 system modules
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
                  Synthetic · no external calls
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(6,182,212,0.6)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_50px_-10px_rgba(6,182,212,0.75)]">
                Enter AI Research Lab
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Foundation note */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="glass flex items-start gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Foundation is live
            </div>
            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Routing, layout, and module structure are in place. Interactive
              scenarios arrive next.
            </div>
          </div>
        </div>
        <div className="glass flex items-start gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Sandbox only
            </div>
            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Synthetic data and simulated systems. No production workloads, no
              real credentials.
            </div>
          </div>
        </div>
        <div className="glass flex items-start gap-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
            <span
              aria-hidden
              className="font-mono text-xs font-bold"
            >
              0.1
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Early preview
            </div>
            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              This is an emerging lab - the clean structure is ready to grow
              module by module.
            </div>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div className="mt-14">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
          Lab modules
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LAB_MODULES.map((module, i) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={i}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  module,
  index,
  onOpen,
}: {
  module: LabModule;
  index: number;
  onOpen: (module: LabModule) => void;
}) {
  const Icon = module.icon;
  const blue = module.accent === "blue";
  const reduced = useReducedMotion() ?? false;
  const [finePointer] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
  );
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, (v) => -v * 6), { stiffness: 150, damping: 18, mass: 0.6 });
  const rotY = useSpring(useTransform(mx, (v) => v * 8), { stiffness: 150, damping: 18, mass: 0.6 });
  const tiltable = finePointer && !reduced;

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={wrapRef}
      className="h-full"
      style={{
        perspective: 1100,
        transformStyle: tiltable ? "preserve-3d" : undefined,
        rotateX: tiltable ? rotX : 0,
        rotateY: tiltable ? rotY : 0,
      }}
      whileHover={tiltable ? { scale: 1.02, y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      onPointerMove={tiltable ? handleMove : undefined}
      onPointerLeave={tiltable ? handleLeave : undefined}
    >
      <button
        type="button"
        onClick={() => onOpen(module)}
        aria-label={`Open ${module.name}`}
        style={{ animationDelay: `${index * 90}ms` }}
        className="lab-module-card lab-3d-preserve lab-raise glass-strong group flex h-full w-full flex-col rounded-3xl p-6 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              blue
                ? "bg-gradient-to-br from-blue-accent/25 to-cyan-accent/15 text-blue-accent"
                : "bg-gradient-to-br from-cyan-accent/25 to-blue-accent/15 text-cyan-accent"
            }`}
            style={{ transform: tiltable ? "translateZ(28px)" : undefined }}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className={STATUS_PILL}>
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                module.status === "live" ? "bg-emerald-500" : "bg-cyan-accent/70"
              }`}
            />
            {module.status === "live" ? "Interactive" : "Under construction"}
          </span>
        </div>

        <div className="mt-5">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            {module.name}
          </h3>
          <div className="mt-1 text-cyan-accent">{module.tagline}</div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {module.description}
        </p>

        {module.comingSoon && module.comingSoon.length > 0 && (
          <ul className="mt-5 space-y-1.5">
            {module.comingSoon.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-xs text-foreground/80"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900/8 pt-4 font-medium text-sm text-foreground dark:border-white/8">
          Open playground
          <ArrowRight
            className={`h-4 w-4 text-cyan-accent transition-transform duration-200 group-hover:translate-x-0.5 ${
              blue ? "text-blue-accent" : ""
            }`}
          />
        </div>
      </button>
    </motion.div>
  );
}