import { ArrowRight } from "lucide-react";

export function CurrentlyBuilding() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-[112px] -mb-[88px] lg:pt-[120px] lg:-mb-[120px]">
      <aside
        aria-label="Current status"
        className="animate-status-in glass rounded-2xl px-5 py-4 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.7)] sm:px-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex w-max shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-foreground/80">
            <span
              aria-hidden
              className="status-dot h-2 w-2 rounded-full bg-cyan-accent"
            />
            Currently Building
          </span>

          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            My work evolves continuously. Want a real-time view of what I'm
            working on?
          </p>

          <a
            href="#contact"
            className="group relative inline-flex w-max shrink-0 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-cyan-accent transition-colors hover:text-cyan-accent sm:self-auto"
          >
            Let's talk
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-cyan-accent/70 transition-transform duration-200 group-hover:scale-x-100"
            />
          </a>
        </div>
      </aside>
    </div>
  );
}
