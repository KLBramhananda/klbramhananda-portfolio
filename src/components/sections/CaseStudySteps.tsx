import { useId, useRef, useState, type KeyboardEvent } from "react";
import { MoveRight, type LucideIcon } from "lucide-react";

export type CaseStudyStep = { icon: LucideIcon; label: string; text: string };

/**
 * Challenge → Solution → Outcome as a 3-step mini flow: pills joined by
 * arrows and one text panel below. A proper tabs pattern (tablist / tab /
 * tabpanel, arrow keys, roving tabindex). All three texts are rendered on top
 * of each other in one grid cell, so the panel is always as tall as the
 * tallest text and switching never shifts layout — only opacity crossfades.
 */
export function CaseStudySteps({ steps }: { steps: CaseStudyStep[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (i: number) => {
    const n = (i + steps.length) % steps.length;
    setActive(n);
    tabRefs.current[n]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusTab(active + 1),
      ArrowLeft: () => focusTab(active - 1),
      Home: () => focusTab(0),
      End: () => focusTab(steps.length - 1),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };

  return (
    <div className="mt-5">
      {/* Pills: one row; scrolls horizontally with snap when they can't fit */}
      <div
        role="tablist"
        aria-label="Case study"
        onKeyDown={onKeyDown}
        className="cs-tablist -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1 snap-x snap-mandatory"
      >
        {steps.map((s, i) => {
          const Icon = s.icon;
          const selected = i === active;
          return (
            <div key={s.label} className="flex shrink-0 items-center gap-1 snap-start">
              {i > 0 && <MoveRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-cyan-accent/50" />}
              <button
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "border-cyan-accent/40 bg-cyan-accent/10 text-foreground"
                    : "border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${selected ? "text-cyan-accent" : ""}`} />
                {s.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Panels stacked in one cell: the tallest reserves the height */}
      <div className="mt-3 grid">
        {steps.map((s, i) => {
          const selected = i === active;
          return (
            <div
              key={s.label}
              role="tabpanel"
              id={`${id}-panel-${i}`}
              aria-labelledby={`${id}-tab-${i}`}
              aria-hidden={!selected}
              inert={!selected}
              className={`cs-panel col-start-1 row-start-1 text-sm text-foreground/90 ${selected ? "is-active" : ""}`}
            >
              {s.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
