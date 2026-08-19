import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  PageTransitionContext,
  type PageTransitionOrigin,
  type TransitionPhase,
} from "./page-transition-context";

/**
 * Cinematic page transition for the Engineering Lab entry.
 *
 * Flow (zero artificial delay):
 *   1. The hero CTA calls `enter(origin)` → the overlay mounts in the same
 *      render that starts the router navigation, so the outgoing page is
 *      covered from the very first frame (no blank/freeze).
 *   2. The router navigates immediately. While the lazy `/lab` chunk loads,
 *      the overlay shows a cyan/blue flash burst + expanding glow over a dark
 *      navy "engineering environment" wash — never a white or blank screen.
 *   3. The mounted Lab signals it has painted via the `bk:page-ready` window
 *      event, and the provider reveals: the surface zooms in while the
 *      overlay fades out (~380ms). The whole thing is event-driven, so the
 *      timing adapts to how fast the page actually becomes ready.
 *   4. Safety timers only fire if a signal is lost (broken route, hard Back,
 *      etc.), so the overlay can never trap the visitor.
 *
 * Reduced motion: the flash/wash/zoom layers are skipped entirely; the overlay
 * becomes a simple theme-tinted crossfade (the global reduced-motion rules
 * collapse it to a minimal fade). No surface transform is applied.
 */

const FLASH_SAFETY_MS = 3500;
const REVEAL_SAFETY_MS = 1200;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PageTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [origin, setOrigin] = useState<PageTransitionOrigin>({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const phaseRef = useRef<TransitionPhase>("idle");
  const busyRef = useRef(false);
  const flashTimerRef = useRef<number | undefined>(undefined);
  const revealTimerRef = useRef<number | undefined>(undefined);

  // Stay in sync with the OS motion preference while the page is open.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep the phase ref aligned for the window-event listeners.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(
    () => () => {
      if (flashTimerRef.current !== undefined) {
        window.clearTimeout(flashTimerRef.current);
      }
      if (revealTimerRef.current !== undefined) {
        window.clearTimeout(revealTimerRef.current);
      }
    },
    [],
  );

  const finish = useCallback(() => {
    if (flashTimerRef.current !== undefined) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = undefined;
    }
    if (revealTimerRef.current !== undefined) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = undefined;
    }
    busyRef.current = false;
    phaseRef.current = "idle";
    setPhase("idle");
  }, []);

  const reveal = useCallback(() => {
    if (phaseRef.current !== "flash") return;
    phaseRef.current = "reveal";
    setPhase("reveal");
    if (flashTimerRef.current !== undefined) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = undefined;
    }
    if (revealTimerRef.current === undefined) {
      revealTimerRef.current = window.setTimeout(finish, REVEAL_SAFETY_MS);
    }
  }, [finish]);

  // Called by the source page the moment navigation starts. The caller then
  // navigates itself — navigation is never delayed by the transition.
  const enter = useCallback(
    (clickOrigin?: PageTransitionOrigin) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setOrigin(
        clickOrigin ?? {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
      );
      phaseRef.current = "flash";
      setPhase("flash");
      if (flashTimerRef.current === undefined) {
        flashTimerRef.current = window.setTimeout(reveal, FLASH_SAFETY_MS);
      }
    },
    [reveal],
  );

  // The newly mounted page signals it has painted via `bk:page-ready`.
  useEffect(() => {
    const onReady = () => reveal();
    window.addEventListener("bk:page-ready", onReady);
    return () => window.removeEventListener("bk:page-ready", onReady);
  }, [reveal]);

  // If navigation goes somewhere that never fires `bk:page-ready` (browser
  // Back during the flash, broken route, etc.), release the overlay instead
  // of trapping the visitor behind it.
  const pathname = useRouterState((s) => s.location.pathname);
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    const prev = lastPathRef.current;
    lastPathRef.current = pathname;
    if (prev === pathname) return;
    if (phaseRef.current === "flash" && !pathname.startsWith("/lab")) {
      reveal();
    }
  }, [pathname, reveal]);

  const onOverlayAnimationEnd = useCallback(
    (e: ReactAnimationEvent<HTMLDivElement>) => {
      if (e.animationName !== "bk-overlay-out") return;
      if (phaseRef.current === "reveal") finish();
    },
    [finish],
  );

  const overlayStyle = {
    "--ox": `${origin.x}px`,
    "--oy": `${origin.y}px`,
  } as CSSProperties;

  return (
    <PageTransitionContext.Provider value={{ enter, phase, reduced }}>
      {children}
      {phase !== "idle" && (
        <div
          aria-hidden
          className={`bk-overlay ${
            phase === "reveal" ? "bk-overlay--reveal" : ""
          } ${reduced ? "bk-overlay--reduced" : ""}`}
          style={overlayStyle}
          onAnimationEnd={onOverlayAnimationEnd}
        >
          {reduced ? (
            <div className="bk-min" />
          ) : (
            <>
              <div className="bk-flash" />
              <div className="bk-ring" />
              <div className="bk-ring bk-ring--two" />
              <div className="bk-wash" />
            </>
          )}
        </div>
      )}
    </PageTransitionContext.Provider>
  );
}