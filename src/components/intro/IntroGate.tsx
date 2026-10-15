import { Component, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export interface IntroScene {
  /** Bursts the letters toward the camera; resolves when the burst is done. */
  enter(): Promise<void>;
  dispose(): void;
}

export interface IntroSceneOptions {
  host: HTMLElement;
  high: boolean;
  accent: string;
  white: string;
  /** Seconds of intro already elapsed, so a swapped-in scene stays in sync. */
  startAt: number;
  /** The scene can no longer run well (context lost, low fps, error). */
  onDegrade: () => void;
}

type Tier = "high" | "mid" | "2d";

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

const STORAGE_KEY = "bk:intro:v2";
const ROLE = "SOFTWARE ENGINEER";
const GLYPHS = "01<>/{}[]#$%&*+=?";
const WHITE = "#F2EFE8";
const FALLBACK_ACCENT = "#06B6D4";
const HOLD_MS = 800;
const DRAIN_MS = 400;
const RING_R = 29;
const RING_C = 2 * Math.PI * RING_R;

function shouldPlay(): boolean {
  if (window.location.pathname !== "/") return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  } catch {
    // matchMedia unavailable: treat as no preference.
  }
  if (new URLSearchParams(window.location.search).get("intro") === "1") return true;
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectTier(): Tier {
  if (window.innerWidth < 768 || !hasWebGL2()) return "2d";
  const nav = navigator as NavigatorHints;
  const high =
    (nav.hardwareConcurrency ?? 0) >= 4 &&
    (nav.deviceMemory === undefined || nav.deviceMemory >= 4) &&
    !nav.connection?.saveData;
  return high ? "high" : "mid";
}

/** Site accent (cyan). The intro is always dark, so light mode uses the dark-mode cyan. */
function readAccent(): string {
  try {
    if (!document.documentElement.classList.contains("dark")) return FALLBACK_ACCENT;
    const v = getComputedStyle(document.documentElement).getPropertyValue("--cyan-accent").trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : FALLBACK_ACCENT;
  } catch {
    return FALLBACK_ACCENT;
  }
}

function lockScroll(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const prev = {
    html: html.style.overflow,
    body: body.style.overflow,
    padding: body.style.paddingRight,
  };
  const gap = window.innerWidth - html.clientWidth;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (gap > 0) {
    body.style.paddingRight = `${gap + (parseFloat(getComputedStyle(body).paddingRight) || 0)}px`;
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    html.style.overflow = prev.html;
    body.style.overflow = prev.body;
    body.style.paddingRight = prev.padding;
  };
}

function IntroOverlay({ onExit }: { onExit: () => void }) {
  const [accent] = useState(readAccent);
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const holdRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    const role = roleRef.current;
    const flash = flashRef.current;
    const skip = skipRef.current;
    const hold = holdRef.current;
    const ring = ringRef.current;
    if (!root || !host || !role || !flash || !skip || !hold || !ring) return;

    let disposed = false;
    let leaving = false;
    let scene: IntroScene | null = null;
    let timelineStart = 0;
    let decodeTimer = 0;
    let holdRaf = 0;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };

    const unlock = lockScroll();
    hold.focus({ preventScroll: true });

    const startDecode = () => {
      const begin = performance.now();
      decodeTimer = window.setInterval(() => {
        const t = performance.now() - begin;
        let out = "";
        let done = true;
        for (let i = 0; i < ROLE.length; i++) {
          if (ROLE[i] === " " || t >= 150 + i * 38) {
            out += ROLE[i];
          } else {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            done = false;
          }
        }
        role.textContent = out;
        if (done) {
          window.clearInterval(decodeTimer);
          decodeTimer = 0;
        }
      }, 45);
    };

    const startTimeline = () => {
      if (timelineStart) return;
      timelineStart = performance.now();
      later(startDecode, 2200);
      later(() => {
        hold.style.opacity = "1";
      }, 3000);
    };
    const elapsed = () => (timelineStart ? (performance.now() - timelineStart) / 1000 : 0);

    const finish = (burst: boolean) => {
      if (leaving) return;
      leaving = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Storage unavailable: the intro simply replays next visit.
      }
      window.clearInterval(decodeTimer);
      cancelAnimationFrame(holdRaf);
      hold.style.pointerEvents = "none";

      const fade = () => {
        unlock();
        const main = document.getElementById("main");
        if (main) {
          main.tabIndex = -1;
          main.style.outline = "none";
          main.focus({ preventScroll: true });
        }
        root.style.pointerEvents = "none";
        if (typeof root.animate !== "function") {
          onExit();
          return;
        }
        root.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 350,
          easing: "ease-out",
          fill: "forwards",
        }).onfinish = onExit;
      };

      if (!burst || !scene) {
        fade();
        return;
      }
      void scene.enter();
      if (typeof flash.animate === "function") {
        flash.animate([{ opacity: 0 }, { opacity: 0.6, offset: 0.4 }, { opacity: 0 }], {
          duration: 600,
          delay: 200,
        });
      }
      later(fade, 700);
    };

    // Scene selection: WebGL tier -> lazy three.js chunk, otherwise (or on any failure) 2D.
    let fallbackStarted = false;
    const startFallback = async () => {
      if (fallbackStarted || disposed) return;
      fallbackStarted = true;
      try {
        const mod = await import("./intro-fallback-2d");
        if (disposed || leaving) return;
        const prev = scene;
        scene = mod.startFallback2D({
          host,
          high: false,
          accent,
          white: WHITE,
          startAt: elapsed(),
          onDegrade: () => finish(false),
        });
        startTimeline();
        prev?.dispose();
      } catch {
        finish(false);
      }
    };

    const tier = detectTier();
    if (tier === "2d") {
      void startFallback();
    } else {
      let abandoned = false;
      const loadTimer = later(() => {
        abandoned = true;
        void startFallback();
      }, 1500);
      import("./intro-webgl")
        .then((mod) => {
          if (abandoned || disposed) return undefined;
          window.clearTimeout(loadTimer);
          timers.delete(loadTimer);
          return mod.startWebGL({
            host,
            high: tier === "high",
            accent,
            white: WHITE,
            startAt: 0,
            onDegrade: () => void startFallback(),
          });
        })
        .then((s) => {
          if (!s) return;
          if (disposed || abandoned) {
            s.dispose();
            return;
          }
          scene = s;
          startTimeline();
        })
        .catch(() => {
          if (!abandoned) void startFallback();
        });
    }

    // Hold-to-enter: ring fills over HOLD_MS, drains smoothly when released early.
    let progress = 0;
    let holding = false;
    let lastTick = 0;
    const step = (now: number) => {
      const dt = Math.min(now - lastTick, 50);
      lastTick = now;
      progress = Math.min(1, Math.max(0, progress + (holding ? dt / HOLD_MS : -dt / DRAIN_MS)));
      ring.style.strokeDashoffset = String(RING_C * (1 - progress));
      if (progress >= 1) {
        holdRaf = 0;
        finish(true);
        return;
      }
      holdRaf = holding || progress > 0 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (holdRaf || leaving) return;
      lastTick = performance.now();
      holdRaf = requestAnimationFrame(step);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      holding = true;
      hold.setPointerCapture?.(e.pointerId);
      kick();
    };
    const onUp = () => {
      holding = false;
      kick();
    };
    const onHoldKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (e.type === "keydown") finish(true);
    };
    const onHoldClick = (e: MouseEvent) => {
      if (e.detail === 0) finish(true);
    };
    const onSkip = () => finish(false);
    const noMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      } else if (e.key === "Tab") {
        e.preventDefault();
        const items = [skip, hold];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.shiftKey
          ? items[i <= 0 ? items.length - 1 : i - 1]
          : items[i < 0 || i === items.length - 1 ? 0 : i + 1];
        next.focus({ preventScroll: true });
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!leaving && e.target instanceof Node && !root.contains(e.target)) {
        hold.focus({ preventScroll: true });
      }
    };

    hold.addEventListener("pointerdown", onDown);
    hold.addEventListener("pointerup", onUp);
    hold.addEventListener("pointercancel", onUp);
    hold.addEventListener("lostpointercapture", onUp);
    hold.addEventListener("keydown", onHoldKey);
    hold.addEventListener("keyup", onHoldKey);
    hold.addEventListener("click", onHoldClick);
    hold.addEventListener("contextmenu", noMenu);
    skip.addEventListener("click", onSkip);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      disposed = true;
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(decodeTimer);
      cancelAnimationFrame(holdRaf);
      hold.removeEventListener("pointerdown", onDown);
      hold.removeEventListener("pointerup", onUp);
      hold.removeEventListener("pointercancel", onUp);
      hold.removeEventListener("lostpointercapture", onUp);
      hold.removeEventListener("keydown", onHoldKey);
      hold.removeEventListener("keyup", onHoldKey);
      hold.removeEventListener("click", onHoldClick);
      hold.removeEventListener("contextmenu", noMenu);
      skip.removeEventListener("click", onSkip);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      scene?.dispose();
      scene = null;
      unlock();
    };
  }, [accent, onExit]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      className="fixed inset-0 z-[100] touch-none overflow-hidden bg-[#0B0B0C] text-[#F2EFE8] select-none"
      style={{ "--intro-accent": accent } as CSSProperties}
    >
      <div ref={hostRef} className="absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]"
      />
      <div
        ref={flashRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--intro-accent),transparent_70%)] opacity-0"
      />
      <p className="sr-only">Bramha — Software Engineer</p>
      <div
        ref={roleRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[58%] min-h-[1.5em] text-center font-mono text-xs tracking-[0.4em] text-[#F2EFE8]/80 sm:text-sm"
      />
      <button
        ref={skipRef}
        type="button"
        className="absolute top-4 right-4 rounded-md px-3 py-2 font-mono text-xs tracking-widest text-[#F2EFE8]/70 transition-colors hover:text-[#F2EFE8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--intro-accent)]"
      >
        Skip intro →
      </button>
      <button
        ref={holdRef}
        type="button"
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-3xl p-3 opacity-0 transition-opacity duration-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--intro-accent)]"
      >
        <svg aria-hidden="true" viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle cx="32" cy="32" r={RING_R} fill="none" stroke="rgba(242,239,232,0.2)" strokeWidth="2" />
          <circle
            ref={ringRef}
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C}
          />
          <circle cx="32" cy="32" r="3" fill={WHITE} />
        </svg>
        <span className="font-mono text-[11px] tracking-[0.3em]">HOLD TO ENTER</span>
        <span className="font-mono text-[10px] tracking-widest text-[#F2EFE8]/50">or press Enter</span>
      </button>
    </div>
  );
}

class IntroBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Cinematic entry intro, mounted as an overlay above Home on the `/` route only. */
export function IntroGate() {
  const [active, setActive] = useState(shouldPlay);
  const [dismiss] = useState(() => () => setActive(false));
  if (!active) return null;
  return (
    <IntroBoundary onFail={dismiss}>
      <IntroOverlay onExit={dismiss} />
    </IntroBoundary>
  );
}
