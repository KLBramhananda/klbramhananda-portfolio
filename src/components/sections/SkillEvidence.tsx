import { useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { landingY, lockSpy } from "@/lib/sections";
import type { UsageRow } from "./skill-usage";

const MAX_ROWS = 3;
const GAP = 10;
const MARGIN = 12;
const SWIPE_CLOSE_PX = 60;

export const NO_USAGE_TEXT = "Used across my day-to-day engineering work.";

/** Scroll a card / role into place below the nav and flash the existing highlight. */
function reveal(el: HTMLElement, highlight: HTMLElement, reduced: boolean) {
  window.scrollTo({
    top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - landingY()),
    behavior: reduced ? "auto" : "smooth",
  });
  highlight.classList.remove("project-targeted");
  void highlight.offsetWidth; // restart the highlight if it is already running
  highlight.classList.add("project-targeted");
  window.setTimeout(() => highlight.classList.remove("project-targeted"), 1400);
}

/**
 * "Used in" card for a skill keycap. Desktop: a popover anchored to the key,
 * positioned with a transform and flipped / shifted at the viewport edges.
 * Touch: a bottom sheet (tap outside or swipe down closes). Rendered in a
 * portal so the panel's overflow never clips it. A dialog with a label; focus
 * moves in when opened by keyboard, and the host returns it on Esc.
 */
export function SkillEvidence({
  skill,
  rows,
  anchorEl,
  popupId,
  sheet,
  autoFocus,
  onClose,
  onEnter,
  onLeave,
}: {
  skill: string;
  rows: UsageRow[];
  anchorEl: HTMLElement;
  popupId: string;
  sheet: boolean;
  autoFocus: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const swipeStart = useRef<number | null>(null);
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;

  // Popover placement: below the key, centred; flips above / shifts inside the
  // viewport. Written as a transform, so nothing in the page reflows.
  const position = useCallback(() => {
    const root = rootRef.current;
    if (!root || sheet) return;
    const a = anchorEl.getBoundingClientRect();
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = a.left + a.width / 2 - w / 2;
    left = Math.min(Math.max(left, MARGIN), vw - w - MARGIN);
    let top = a.bottom + GAP;
    if (top + h > vh - MARGIN) top = a.top - h - GAP;
    if (top < MARGIN) top = Math.min(a.bottom + GAP, vh - h - MARGIN);
    root.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    root.dataset.placed = "";
  }, [anchorEl, sheet]);

  useLayoutEffect(() => {
    position();
  }, [position]);

  useEffect(() => {
    if (sheet) {
      // Slide the sheet up on the next frame (transform only).
      const id = requestAnimationFrame(() => {
        if (rootRef.current) rootRef.current.dataset.placed = "";
      });
      return () => cancelAnimationFrame(id);
    }
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
  }, [sheet, position]);

  useEffect(() => {
    if (autoFocus) rootRef.current?.focus();
  }, [autoFocus]);

  const swipeDown = (e: PointerEvent<HTMLDivElement>) => {
    swipeStart.current = e.clientY;
  };
  const swipeUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start != null && e.clientY - start > SWIPE_CLOSE_PX) onClose();
  };

  const go = (row: UsageRow) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const section = row.kind === "project" ? "projects" : "experience";
    const el =
      row.kind === "project"
        ? document.getElementById(row.target)
        : document.querySelectorAll<HTMLElement>("#experience ol > li")[Number(row.target)];
    if (!el) return;
    const highlight = row.kind === "project" ? el : (el.querySelector<HTMLElement>(".glass-strong:last-child") ?? el);
    onClose();
    lockSpy(1500, false, section);
    const here = window.location.pathname === `/${section}`;
    const nav = here ? Promise.resolve() : router.navigate({ to: "/$section", params: { section }, resetScroll: false });
    void nav.finally(() => reveal(el, highlight, reduced));
  };

  const shown = rows.slice(0, MAX_ROWS);
  const more = rows.length - shown.length;

  return createPortal(
    <div
      id={popupId}
      ref={rootRef}
      data-skill-evidence
      role="dialog"
      aria-label={`${skill} — used in`}
      tabIndex={-1}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={sheet ? swipeDown : undefined}
      onPointerUp={sheet ? swipeUp : undefined}
      className={`${sheet ? "kb-sheet" : "kb-pop"} glass-strong text-sm outline-none`}
    >
      {sheet && <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-slate-900/20 dark:bg-white/20" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[0.6875rem] tracking-wider text-muted-foreground uppercase">Used in</div>
          <div className="mt-0.5 text-base font-semibold text-foreground">{skill}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="mt-3 text-foreground/85">{NO_USAGE_TEXT}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {shown.map((r) => (
            <li key={`${r.kind}-${r.name}`}>
              <a
                href={r.kind === "project" ? "/projects" : "/experience"}
                onClick={go(r)}
                className="group flex items-center gap-2 rounded-lg border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1.5 transition-colors hover:border-cyan-accent/40 hover:bg-cyan-accent/10 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.context}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-accent opacity-70 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {more > 0 && <div className="mt-2 font-mono text-xs text-muted-foreground">+{more} more</div>}
    </div>,
    document.body,
  );
}
