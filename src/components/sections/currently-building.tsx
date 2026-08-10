import { ArrowRight } from "lucide-react";

export function CurrentlyBuilding() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-[7rem] -mb-[5.5rem] lg:pt-[7.5rem] lg:-mb-[7.5rem]">
      <a
        href="#contact"
        aria-label="Current status — see what I'm building and get in touch"
        className="group relative block animate-status-in glass rounded-2xl px-5 py-4 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.7)] transition-colors duration-300 hover:border-cyan-accent/30 hover:bg-white/[0.05] sm:px-6"
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

          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            My work evolves continuously. Want a real-time view of what I'm
            working on?
          </p>

          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 self-start text-cyan-accent opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 sm:self-auto"
          />
        </div>
      </a>
    </div>
  );
}
