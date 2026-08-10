import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { usePauseAnimations } from "../effects/use-pause-animations";

const MESSAGES = [
  "Building an AI-powered ERP Procurement Platform",
  "Working on ERPNext & SAP BTP Integrations",
  "Exploring LLMs, RAG & Enterprise AI",
  "Designing Scalable Full-Stack Enterprise Solutions",
  "Want a real-time view of what I'm working on?",
];

const ROTATION_MS = 3600;
const FADE_MS = 320;

export function CurrentlyBuilding() {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  // Stop rotating (and freeze the sweep/pulse loops via `anim-paused`) while
  // the strip is scrolled out of view — no timer or animation keeps running
  // for a section nobody can see.
  const [inView, setInView] = useState(true);
  const rootRef = usePauseAnimations<HTMLDivElement>(
    useCallback((visible) => setInView(visible), []),
  );

  const rotationPaused = paused || !inView;

  useEffect(() => {
    if (rotationPaused) return;
    const id = setInterval(() => {
      setPrevious(index);
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [rotationPaused, index]);

  useEffect(() => {
    if (previous == null) return;
    const id = setTimeout(() => setPrevious(null), FADE_MS);
    return () => clearTimeout(id);
  }, [previous]);

  return (
    <div
      ref={rootRef}
      className="relative z-10 mx-auto max-w-7xl px-4 pt-[7rem] -mb-[5.5rem] lg:pt-[7.5rem] lg:-mb-[7.5rem]"
    >
      <a
        href="#contact"
        aria-label="Current status — see what I'm building and get in touch"
        className="group relative block animate-status-in glass rounded-2xl px-5 py-2.5 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.7)] transition-colors duration-300 hover:border-cyan-accent/30 hover:bg-white/[0.05] sm:px-6"
      >
        <div
          aria-hidden
          className="building-fx absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        >
          <div className="building-glow absolute inset-0" />
          <div className="building-sweep" />
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex w-max shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-widest text-foreground/80">
            <span
              aria-hidden
              className="status-pulse h-2 w-2 rounded-full bg-cyan-accent"
            />
            Currently Building
          </span>

          <div
            aria-live="polite"
            className="relative grid min-h-[2.875rem] flex-1 items-center sm:min-h-0"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {previous != null && (
              <p
                aria-hidden
                className="rotating-status--out col-start-1 row-start-1 text-sm leading-relaxed text-muted-foreground"
              >
                {MESSAGES[previous]}
              </p>
            )}
            <p
              key={index}
              className="rotating-status col-start-1 row-start-1 text-sm leading-relaxed text-muted-foreground"
            >
              {MESSAGES[index]}
            </p>
          </div>

          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 self-start text-cyan-accent opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 sm:self-auto"
          />
        </div>
      </a>
    </div>
  );
}
