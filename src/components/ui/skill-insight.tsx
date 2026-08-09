import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { skills, type SkillInfo } from "@/data/skills";

const GAP = 12;
const VIEWPORT_MARGIN = 8;

interface SkillInsightProps {
  skill: SkillInfo;
  /** The pill the card is anchored to. */
  anchorEl: HTMLElement | null;
  open: boolean;
  popupId: string;
  onPopupEnter: () => void;
  onPopupLeave: () => void;
  onClose: () => void;
}

/**
 * Premium engineering-style Skill Insight card.
 * Positions itself (fixed) relative to the anchored pill and clamps to the
 * viewport so it never clips or overflows. Position is written imperatively to
 * the DOM (no React state churn); the component only re-renders when the active
 * skill changes.
 */
export function SkillInsight({
  skill,
  anchorEl,
  open,
  popupId,
  onPopupEnter,
  onPopupLeave,
  onClose,
}: SkillInsightProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const position = useCallback(() => {
    const root = rootRef.current;
    if (!root || !anchorEl) return;
    const a = anchorEl.getBoundingClientRect();
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = a.left + a.width / 2 - w / 2;
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - w - VIEWPORT_MARGIN);

    let top = a.bottom + GAP;
    if (top + h > vh - VIEWPORT_MARGIN) {
      top = a.top - h - GAP;
    }
    if (top < VIEWPORT_MARGIN) {
      top = Math.min(a.bottom + GAP, vh - h - VIEWPORT_MARGIN);
    }

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
  }, [anchorEl]);

  // Reposition synchronously before paint (the popup has just mounted/remounted).
  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  // Follow the anchor while scrolling/resizing — only active while open,
  // rAF-throttled, and never touching the marquee's own animation.
  useEffect(() => {
    if (!open) return;
    const onUpdate = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        position();
      });
    };
    window.addEventListener("scroll", onUpdate, { passive: true });
    window.addEventListener("resize", onUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", onUpdate);
      window.removeEventListener("resize", onUpdate);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, position]);

  if (!open || !anchorEl) return null;

  return (
    <div
      id={popupId}
      ref={rootRef}
      data-skill-insight
      role="dialog"
      aria-label={`${skill.name} details`}
      onMouseEnter={onPopupEnter}
      onMouseLeave={onPopupLeave}
      onFocus={onPopupEnter}
      onBlur={onPopupLeave}
      className="skill-insight glass-strong rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: skill.color }}
          />
          <h3 className="text-base font-semibold text-foreground">
            {skill.name}
          </h3>
          {skill.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/25 bg-cyan-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-accent">
              <span aria-hidden className="h-1 w-1 rounded-full bg-cyan-accent" />
              {skill.status}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {skill.category}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {skill.description}
      </p>

      <div className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          My work
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
          {skill.myWork}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Related
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skill.related.map((r) => {
            const relatedSkill = skills[r];
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-foreground/75"
              >
                {relatedSkill && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: relatedSkill.color }}
                  />
                )}
                {relatedSkill ? relatedSkill.name : r}
              </span>
            );
          })}
        </div>
      </div>

      <a
        href="#experience"
        onClick={onClose}
        className="mt-4 inline-flex items-center gap-1.5 border-t border-white/5 pt-3 text-xs font-medium text-cyan-accent transition-colors hover:text-cyan-accent/80"
      >
        View engineering context
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
