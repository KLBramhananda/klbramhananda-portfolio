import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, ChevronDown, Sparkles } from "lucide-react";
import profileImg from "@/assets/images/profile.jpeg";
import { usePauseAnimations } from "../effects/use-pause-animations";

const stats = [
  { value: "2+", label: "Years Experience" },
  { value: "3", label: "Enterprise Projects" },
  { value: "10+", label: "Technologies" },
];

const terminalLines = [
  { text: "$ bench start", tone: "muted" },
  { text: "✓ bench ready · frappe v16", tone: "ok" },
  { text: "SAP BTP · HANA connected", tone: "accent" },
  { text: "▶ deploying s2p-matrix …", tone: "muted" },
  { text: "✓ RFQ service online", tone: "ok" },
] as const;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function TerminalPanel() {
  const reduced = useReducedMotion();
  const full = terminalLines.map((l) => l.text).join("\n");
  const [out, setOut] = useState<string>(() => (reduced ? full : ""));
  const idxRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const visibleRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Replay the typing animation whenever the Hero section becomes meaningfully
  // visible, and blank the terminal when the Hero scrolls out of view. Uses an
  // IntersectionObserver (no scroll listeners) with a visibility threshold so
  // tiny scroll movements don't repeatedly restart the animation.
  useEffect(() => {
    const host = rootRef.current?.closest("section");
    if (!host) return;

    const clearTimer = () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };

    const start = () => {
      clearTimer();
      if (reduced) {
        setOut(full);
        return;
      }
      idxRef.current = 0;
      setOut("");
      const tick = () => {
        idxRef.current += 1;
        setOut(full.slice(0, idxRef.current));
        if (idxRef.current < full.length) {
          timerRef.current = window.setTimeout(tick, 24 + Math.random() * 46);
        } else {
          timerRef.current = undefined;
        }
      };
      timerRef.current = window.setTimeout(tick, 350);
    };

    const reset = () => {
      clearTimer();
      idxRef.current = 0;
      setOut(reduced ? full : "");
    };

    visibleRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!visibleRef.current) start();
          visibleRef.current = true;
        } else {
          if (visibleRef.current) reset();
          visibleRef.current = false;
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(host);
    return () => {
      observer.disconnect();
      clearTimer();
    };
  }, [reduced, full]);

  const rendered = out.split("\n");
  const done = out === full;
  const toneCls = (tone: (typeof terminalLines)[number]["tone"]) =>
    tone === "ok"
      ? "text-emerald-700/90 dark:text-emerald-300/90"
      : tone === "accent"
        ? "text-cyan-accent/90"
        : "text-muted-foreground";

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="absolute -top-8 -left-8 z-10 hidden w-60 rounded-2xl glass-strong shadow-[var(--shadow-terminal)] lg:block"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-900/10 px-3 py-2 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate font-mono text-[0.625rem] text-muted-foreground">
          ~ — enterprise
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[0.5625rem] text-emerald-700 dark:text-emerald-300">
          <span
            className={`h-1 w-1 rounded-full bg-emerald-400 ${
              done ? "" : "animate-pulse"
            }`}
          />
          {done ? "online" : "syncing"}
        </span>
      </div>
      <div className="px-3 py-2.5 font-mono text-[0.625rem] leading-relaxed">
        {rendered.map((line, i) => (
          <div
            key={i}
            className={`whitespace-nowrap ${toneCls(terminalLines[i].tone)}`}
          >
            {line}
            {i === rendered.length - 1 && !done && (
              <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-cyan-accent animate-caret" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const heroRef = usePauseAnimations<HTMLElement>();
  return (
    <section
      id="home"
      ref={heroRef}
      className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28"
    >
      {/* Ambient blobs — static, composited once (no continuous animation) */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-20 left-[10%] h-80 w-80 rounded-full bg-cyan-accent/20 blur-[6.875rem]" />
        <div className="absolute bottom-10 right-[8%] h-96 w-96 rounded-full bg-blue-accent/20 blur-[8.125rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[31.25rem] w-[31.25rem] rounded-full bg-cyan-accent/5 blur-[6.25rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          {/* Left */}
          <div className="animate-fade-up">
            <p className="text-muted-foreground text-lg mb-3">Hi, I'm</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-gradient">
              Bramhananda K L
            </h1>

            <p className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight text-cyan-accent">
              Full Stack · AI · ERPNext · SAP BTP
            </p>

            <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Building scalable enterprise software across full-stack
              applications, ERPNext, AI-powered systems, and SAP BTP
              integrations.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] transition-shadow hover:shadow-[0_14px_50px_-8px_rgba(6,182,212,0.75)]"
              >
                View Projects
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#experience"
                className="inline-flex items-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/10 dark:hover:bg-white/10"
              >
                <Briefcase className="h-4 w-4" />
                Experience
              </a>
            </div>

            <Link
              to="/lab"
              aria-label="Explore the BK Engineering Lab — interactive systems playground"
              title="BK Engineering Lab"
              className="group mt-4 inline-flex max-w-full text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-cyan-accent focus-visible:text-cyan-accent"
            >
              <span className="grid overflow-hidden [grid-template-areas:'stack']">
                <span className="flex items-center gap-1 whitespace-nowrap [grid-area:stack] transition-[opacity,transform] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:opacity-0 group-focus-visible:-translate-y-1.5 group-focus-visible:opacity-0">
                  <span aria-hidden className="text-sm">⚡</span>
                  Explore Engineering Lab
                </span>
                <span className="flex translate-y-1.5 items-center whitespace-nowrap [grid-area:stack] opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  Interactive Systems Playground →
                </span>
              </span>
            </Link>

            {/* Quick stats */}
            <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="glass flex h-full min-w-0 flex-col rounded-2xl p-4 transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
                >
                  <dt className="text-xs leading-snug text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="mt-2 min-h-[3.1rem] text-lg font-semibold leading-tight text-balance text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: profile */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up">
            {/* Static glow ring */}
            <div className="absolute inset-0 -m-8" aria-hidden>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-accent/30 via-transparent to-blue-accent/30 blur-3xl" />
            </div>

            {/* Live engineering terminal — types once on load, then idles */}
            <TerminalPanel />

            {/* Image container — 4/5 frame matches the source photo, no cropping */}
            <div className="relative aspect-[4/5] rounded-[2rem] glass-strong p-3 glow-cyan">
              <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                <img
                  src={profileImg}
                  alt="Bramhananda K L — Software Engineer"
                  width={900}
                  height={1125}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>

              {/* Corner badge */}
              <div className="absolute -bottom-4 -left-4 glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
                <div
                  aria-hidden
                  className="building-fx absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                >
                  <div className="building-glow absolute inset-0" />
                  <div className="building-sweep" />
                </div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-blue-accent">
                  <Sparkles className="h-5 w-5 text-background" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent"
                    />
                    <span className="text-xs text-muted-foreground">Currently building</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    KeeMeds · ERPNext
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint — gently scrolls to the footer */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={scrollToFooter}
          aria-label="Scroll to footer"
          className="hero-scroll-hint flex h-10 w-10 items-center justify-center rounded-full glass text-muted-foreground transition-colors duration-200 hover:text-cyan-accent"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function scrollToFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  footer.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}
