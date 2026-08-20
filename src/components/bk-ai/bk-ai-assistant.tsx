import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@tanstack/react-router";
import "./bk-ai.css";

/**
 * BK AI Watch — a minimal, purely decorative "watching eyes" feature.
 *
 * Two realistic 3D eyes (Left / Right) quietly track the visitor's cursor on
 * every page and in every environment (portfolio, Engineering Lab, AI Research
 * Lab). There is deliberately NO chatbot, chat panel, input field, click
 * target, or "Ask BK AI" chrome — the eyes simply watch and focus.
 *
 * How it works:
 *   - a single requestAnimationFrame loop eases a normalized gaze direction
 *     toward the cursor and writes two CSS variables (--gx / --gy) plus an
 *     is-idle class toggle per frame. The loop pauses itself the instant the
 *     gaze settles, so while the visitor is still it costs nothing;
 *   - the head rotates in 3D (rotateX/rotateY) toward the cursor and the two
 *     irises translate inside their sockets with a slight convergence offset,
 *     so the pair reads as genuinely focusing on one point in space;
 *   - every ambient cue (idle drift, independent per-eye blinks, breathing,
 *     scan / orbit sweeps) is a CSS keyframe on transform/opacity — no JS, no
 *     canvas, and it all honours prefers-reduced-motion. On coarse/touch
 *     pointers the eyes rest in a neutral idle pose.
 */

type Env = "portfolio" | "engineer" | "neural";

/** Pixel distance to the widget below which the gaze eases down — the entity
 *  looks *at* something right next to it, not past it. */
const NEAR_DIST = 170;

/** Easing gain per frame (applied frame-rate independently in the rAF loop). */
const GAZE_LERP = 0.16;

function envFromPath(pathname: string): Env {
  if (pathname.startsWith("/lab/ai-research")) return "neural";
  if (pathname.startsWith("/lab")) return "engineer";
  return "portfolio";
}

function matchMediaSafe(query: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

export function BkAiAssistant() {
  const { pathname } = useLocation();
  const env = useMemo(() => envFromPath(pathname), [pathname]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Real-time gaze. A direction target is fed by pointermove; a single rAF
  // loop eases the gaze toward it and writes the head/iris CSS variables. The
  // loop pauses as soon as the gaze settles, and coarse pointers or reduced
  // motion skip it entirely (the eyes simply rest in their idle pose).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (matchMediaSafe("(pointer: coarse)")) return;
    if (matchMediaSafe("(prefers-reduced-motion: reduce)")) return;

    let raf = 0;
    let running = false;
    let lastTime = 0;
    let gazeX = 0;
    let gazeY = 0;
    let targetX = 0;
    let targetY = 0;
    let tracking = false;

    const apply = (idle: boolean) => {
      root.style.setProperty("--gx", gazeX.toFixed(4));
      root.style.setProperty("--gy", gazeY.toFixed(4));
      root.classList.toggle("is-idle", idle);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.667, 2) || 1;
      lastTime = now;
      if (!tracking) {
        targetX = 0;
        targetY = 0;
      }
      const k = 1 - Math.pow(1 - GAZE_LERP, dt);
      gazeX += (targetX - gazeX) * k;
      gazeY += (targetY - gazeY) * k;
      const settled =
        Math.abs(gazeX - targetX) < 0.0008 && Math.abs(gazeY - targetY) < 0.0008;
      apply(!tracking && settled);
      if (!settled) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      // Full-screen transitions (AI lab boot overlay) pause the gaze; it
      // resumes automatically once the overlay clears.
      if (document.documentElement.classList.contains("bk-transition-lock")) return;
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 0.5) {
        // Full direction while far away, gently easing down as the cursor
        // approaches the widget — reads as real attention.
        const strength = 0.96 * Math.min(len / NEAR_DIST, 1);
        targetX = (dx / len) * strength;
        targetY = (dy / len) * strength;
      }
      if (!tracking) {
        tracking = true;
        root.classList.remove("is-idle");
      }
      start();
    };

    const onLeave = () => {
      tracking = false;
      start();
    };

    apply(true);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  const ui = (
    <div
      ref={rootRef}
      className={`bkai bkai--${env} is-idle`}
      aria-hidden="true"
    >
      <div className="bkai__sock">
        <div className="bkai__face">
          <span className="bkai__eye bkai__eye--l">
            <span className="bkai__socket">
              <span className="bkai__sclera" />
              <span className="bkai__iris">
                <span className="bkai__limbal" />
                <span className="bkai__pupil" />
              </span>
              <span className="bkai__glint" />
              <span className="bkai__glint bkai__glint--soft" />
              <span className="bkai__shade" />
              <span className="bkai__lid" />
            </span>
            <span className="bkai__tag">L · EYE</span>
          </span>

          <span className="bkai__eye bkai__eye--r">
            <span className="bkai__socket">
              <span className="bkai__sclera" />
              <span className="bkai__iris">
                <span className="bkai__limbal" />
                <span className="bkai__pupil" />
              </span>
              <span className="bkai__glint" />
              <span className="bkai__glint bkai__glint--soft" />
              <span className="bkai__shade" />
              <span className="bkai__lid" />
            </span>
            <span className="bkai__tag">R · EYE</span>
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}