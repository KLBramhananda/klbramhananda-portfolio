import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@tanstack/react-router";
import { coreBridge } from "../intro/intro-bridge";
import "./bk-ai.css";

/**
 * BK AI Watch — the "watching eyes" widget; on the portfolio it is B-Bot.
 *
 * Two realistic 3D eyes (Left / Right) quietly track the visitor's cursor on
 * every page and in every environment (portfolio, Engineering Lab, AI Research
 * Lab). In the labs they stay purely decorative. On the portfolio the same eyes
 * sit in a small glass robot head ("B-Bot"): a button that opens the terminal,
 * with a tiny state machine (watching, happy, surprised, sleeping, listening),
 * random blinks and at most three one-time tips per session.
 *
 * How it works:
 *   - a single requestAnimationFrame loop eases a normalized gaze direction
 *     toward the target (cursor, focused element or last tap) and writes two
 *     CSS variables (--gx / --gy) plus an is-idle class toggle per frame. The
 *     loop pauses itself the instant the gaze settles, so while the visitor is
 *     still it costs nothing;
 *   - the head rotates in 3D (rotateX/rotateY) toward the gaze and the two
 *     irises translate inside their sockets with a slight convergence offset;
 *   - B-Bot's state lives in a `data-state` attribute written imperatively —
 *     never React state per pointer move — and every cue is a CSS animation on
 *     transform/opacity. All of it honours prefers-reduced-motion.
 */

type Env = "portfolio" | "engineer" | "neural";
type BotState = "watching" | "happy" | "surprised" | "sleeping" | "listening";

/** Pixel distance to the widget below which the gaze eases down — the entity
 *  looks *at* something right next to it, not past it. */
const NEAR_DIST = 170;

/** Easing gain per frame (applied frame-rate independently in the rAF loop). */
const GAZE_LERP = 0.16;

const SLEEP_AFTER_MS = 20_000;
const TIP_GAP_MS = 25_000;
const TIP_SHOW_MS = 5_000;
const NO_TIPS_BEFORE_MS = 4_000;
const TIPS_KEY = "bk:bbot:tips:v1";
const MAX_TIPS = 3;

const TIPS = {
  terminal: "Psst… press / to open my terminal.",
  core: "Try dragging the Core.",
  hire: "Pro tip: type 'hire bramha' in my terminal.",
} as const;
type TipId = keyof typeof TIPS;
const TIP_ORDER: TipId[] = ["terminal", "core", "hire"];

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

function readShownTips(): TipId[] {
  try {
    const raw = window.sessionStorage.getItem(TIPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t): t is TipId => t in TIPS) : [];
  } catch {
    return [];
  }
}

function writeShownTips(ids: TipId[]) {
  try {
    window.sessionStorage.setItem(TIPS_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable: tips may repeat after a reload, never within a visit.
  }
}

function Eye({ side, tag }: { side: "l" | "r"; tag: string }) {
  return (
    <span className={`bkai__eye bkai__eye--${side}`}>
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
        <span className="bkai__arc" />
      </span>
      <span className="bkai__tag">{tag}</span>
    </span>
  );
}

export function BkAiAssistant() {
  const { pathname } = useLocation();
  const env = useMemo(() => envFromPath(pathname), [pathname]);
  const isBot = env === "portfolio";
  const rootRef = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<TipId | null>(null);

  // Gaze + (portfolio) B-Bot behaviour. One rAF loop eases the gaze toward a
  // target and writes the head/iris CSS variables; it pauses as soon as the
  // gaze settles. Coarse pointers look at the last tap instead of the cursor.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = matchMediaSafe("(prefers-reduced-motion: reduce)");
    const coarse = matchMediaSafe("(pointer: coarse)");
    // The labs keep their original behaviour: still on touch / reduced motion.
    if (!isBot && (coarse || reduced)) return;

    let raf = 0;
    let running = false;
    let lastTime = 0;
    let gazeX = 0;
    let gazeY = 0;
    let targetX = 0;
    let targetY = 0;
    let tracking = false;
    let releaseTimer = 0;
    const lerp = reduced ? 1 : GAZE_LERP;

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
      const k = reduced ? 1 : 1 - Math.pow(1 - lerp, dt);
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

    /** Look toward a viewport point; `holdMs` drifts back to center afterwards. */
    const lookAt = (x: number, y: number, holdMs = 0) => {
      // Full-screen transitions (AI lab boot overlay) pause the gaze; it
      // resumes automatically once the overlay clears.
      if (document.documentElement.classList.contains("bk-transition-lock")) return;
      const rect = root.getBoundingClientRect();
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 0.5) {
        // Full direction while far away, gently easing down as the target
        // approaches the widget — reads as real attention.
        const strength = 0.96 * Math.min(len / NEAR_DIST, 1);
        targetX = (dx / len) * strength;
        targetY = (dy / len) * strength;
      }
      tracking = true;
      root.classList.remove("is-idle");
      window.clearTimeout(releaseTimer);
      if (holdMs > 0) {
        releaseTimer = window.setTimeout(() => {
          tracking = false;
          start();
        }, holdMs);
      }
      start();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lookAt(e.clientX, e.clientY);
    };
    const onLeave = () => {
      tracking = false;
      start();
    };
    const onTouch = (e: PointerEvent) => {
      if (e.pointerType === "touch") lookAt(e.clientX, e.clientY, 1800);
    };

    apply(true);
    if (!coarse) window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    // ---- B-Bot (portfolio) ------------------------------------------------
    const cleanups: (() => void)[] = [];
    if (isBot) {
      window.addEventListener("pointerdown", onTouch, { passive: true });

      const flags = { terminal: false, asleep: false, happy: false, surprised: false };
      const render = () => {
        const state: BotState = flags.surprised
          ? "surprised"
          : flags.terminal
            ? "listening"
            : flags.asleep
              ? "sleeping"
              : flags.happy
                ? "happy"
                : "watching";
        if (root.dataset.state !== state) root.dataset.state = state;
      };
      let lastActivity = performance.now();
      let surpriseTimer = 0;
      let wakeTimer = 0;
      const timers = new Set<number>();

      // Keyboard focus: look at the focused element for a moment.
      const onFocusIn = (e: FocusEvent) => {
        const t = e.target as HTMLElement | null;
        if (!t || root.contains(t) || t === document.body) return;
        const r = t.getBoundingClientRect();
        lookAt(r.left + r.width / 2, r.top + r.height / 2, 2200);
      };
      document.addEventListener("focusin", onFocusIn);
      cleanups.push(() => document.removeEventListener("focusin", onFocusIn));

      // Happy while hovering / focusing "Enter AI World" or "Let's Talk".
      const HAPPY = 'a[href="/lab/ai-research"], a[href="/contact"]';
      const onOver = (e: Event) => {
        const hit = (e.target as Element | null)?.closest?.(HAPPY);
        if (hit && !flags.happy) {
          flags.happy = true;
          render();
        }
      };
      const onOut = (e: Event) => {
        const hit = (e.target as Element | null)?.closest?.(HAPPY);
        if (hit && flags.happy) {
          flags.happy = false;
          render();
        }
      };
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      document.addEventListener("focusin", onOver);
      document.addEventListener("focusout", onOut);
      cleanups.push(() => {
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerout", onOut);
        document.removeEventListener("focusin", onOver);
        document.removeEventListener("focusout", onOut);
      });

      // Click / Enter / Space: a small hop, then open the terminal.
      const onClick = () => {
        flags.surprised = true;
        render();
        window.clearTimeout(surpriseTimer);
        surpriseTimer = window.setTimeout(() => {
          flags.surprised = false;
          render();
        }, 700);
        window.dispatchEvent(new Event("bk:terminal"));
      };
      root.addEventListener("click", onClick);
      cleanups.push(() => {
        root.removeEventListener("click", onClick);
        window.clearTimeout(surpriseTimer);
      });

      // Listening while the terminal is open.
      const onTerm = (open: boolean) => () => {
        flags.terminal = open;
        render();
      };
      const termOpen = onTerm(true);
      const termClose = onTerm(false);
      window.addEventListener("bk:terminal-open", termOpen);
      window.addEventListener("bk:terminal-close", termClose);
      cleanups.push(() => {
        window.removeEventListener("bk:terminal-open", termOpen);
        window.removeEventListener("bk:terminal-close", termClose);
      });

      // Sleep after 20 s without input; any input wakes it with a short stretch.
      const activity = () => {
        lastActivity = performance.now();
        if (flags.asleep) {
          flags.asleep = false;
          root.dataset.wake = "true";
          window.clearTimeout(wakeTimer);
          wakeTimer = window.setTimeout(() => delete root.dataset.wake, 400);
          render();
        }
      };
      const activityEvents = ["pointermove", "pointerdown", "keydown", "scroll", "wheel"] as const;
      activityEvents.forEach((n) => window.addEventListener(n, activity, { passive: true }));
      cleanups.push(() => {
        activityEvents.forEach((n) => window.removeEventListener(n, activity));
        window.clearTimeout(wakeTimer);
      });

      // Random blinks every 3–7 s (a `data-blink` flag drives the lids).
      const scheduleBlink = () => {
        const id = window.setTimeout(
          () => {
            timers.delete(id);
            if (!flags.asleep && !flags.happy) {
              root.dataset.blink = "true";
              const off = window.setTimeout(() => {
                timers.delete(off);
                delete root.dataset.blink;
              }, 150);
              timers.add(off);
            }
            scheduleBlink();
          },
          3000 + Math.random() * 4000,
        );
        timers.add(id);
      };
      scheduleBlink();

      // One shared 1 s tick: sleep check + tip scheduling.
      const mountedAt = performance.now();
      const shown = readShownTips();
      let lastTipAt = 0;
      let heroReadyAt = 0;
      let heroVisible = false;
      let coreVisible = false;
      let dragged = false;
      let contactReached = false;
      let hideTimer = 0;

      const observers: IntersectionObserver[] = [];
      const watch = (selector: string, threshold: number, set: (v: boolean) => void) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const io = new IntersectionObserver(([entry]) => set(entry.isIntersecting), { threshold });
        io.observe(el);
        observers.push(io);
      };
      watch("#home", 0.3, (v) => (heroVisible = v));
      watch("[data-core]", 0.4, (v) => (coreVisible = v));
      watch("#contact", 0.3, (v) => {
        if (v) contactReached = true;
      });
      const onDrag = () => {
        dragged = true;
      };
      window.addEventListener("bk:core-drag", onDrag);

      const introUp = () =>
        coreBridge.introActive || !!document.querySelector('[role="dialog"][aria-label="Intro"]');

      const tickId = window.setInterval(() => {
        const now = performance.now();
        if (!flags.asleep && !flags.terminal && now - lastActivity > SLEEP_AFTER_MS) {
          flags.asleep = true;
          render();
        }

        if (heroVisible && !introUp() && heroReadyAt === 0) heroReadyAt = now;
        if (
          shown.length >= MAX_TIPS ||
          now - mountedAt < NO_TIPS_BEFORE_MS ||
          (lastTipAt > 0 && now - lastTipAt < TIP_GAP_MS) ||
          flags.terminal ||
          introUp() ||
          hideTimer
        ) {
          return;
        }
        const ready: Record<TipId, boolean> = {
          terminal: heroReadyAt > 0 && now - heroReadyAt >= 6000,
          // The Core tip follows the terminal tip.
          core: coreVisible && !dragged && shown.includes("terminal"),
          hire: contactReached,
        };
        const next = TIP_ORDER.find((id) => !shown.includes(id) && ready[id]);
        if (!next) return;
        shown.push(next);
        writeShownTips(shown);
        lastTipAt = now;
        setTip(next);
        hideTimer = window.setTimeout(() => {
          hideTimer = 0;
          setTip(null);
        }, TIP_SHOW_MS);
      }, 1000);

      cleanups.push(() => {
        window.clearInterval(tickId);
        window.clearTimeout(hideTimer);
        window.removeEventListener("bk:core-drag", onDrag);
        observers.forEach((o) => o.disconnect());
        timers.forEach((t) => window.clearTimeout(t));
        window.removeEventListener("pointerdown", onTouch);
      });

      render();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(releaseTimer);
      cleanups.forEach((fn) => fn());
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [isBot]);

  const eyes = (
    <span className="bkai__sock">
      <span className="bkai__face">
        <Eye side="l" tag="L · EYE" />
        <Eye side="r" tag="R · EYE" />
      </span>
    </span>
  );

  if (isBot) {
    return createPortal(
      <>
        <button
          ref={(el) => {
            rootRef.current = el;
          }}
          type="button"
          aria-label="Open terminal"
          data-state="watching"
          className="bkai bkai--portfolio bkbot is-idle"
        >
          <span className="bkbot__rig" aria-hidden="true">
            <span className="bkbot__antenna">
              <span className="bkbot__led" />
            </span>
            <span className="bkbot__light bkbot__light--l" />
            <span className="bkbot__light bkbot__light--r" />
            {eyes}
            <span className="bkbot__z">z z</span>
          </span>
        </button>
        <div role="status" aria-live="polite" className="bkbot__tip" data-show={tip ? "true" : "false"}>
          {tip && (
            <>
              <span>{TIPS[tip]}</span>
              <button
                type="button"
                aria-label="Dismiss tip"
                onClick={() => setTip(null)}
                className="bkbot__tip-x"
              >
                ×
              </button>
            </>
          )}
        </div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <div
      ref={(el) => {
        rootRef.current = el;
      }}
      className={`bkai bkai--${env} is-idle`}
      aria-hidden="true"
    >
      {eyes}
    </div>,
    document.body,
  );
}
