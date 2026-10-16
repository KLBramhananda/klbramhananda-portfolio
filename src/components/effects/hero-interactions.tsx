import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePointerTilt } from "./use-pointer-tilt";

const touchOrReduced = () =>
  window.matchMedia("(pointer: coarse)").matches ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One consistent section reveal: rise 16px, blur 6px -> 0, fade in, once.
 * Plain wrapper (no animation) under reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-56px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Moves its child up to 8px toward the cursor while the cursor is within ~90px
 * of it, then eases back; `--mag` (0..1) drives a glow via `filter`. Transform
 * and filter only; off on touch and under reduced motion.
 */
export function MagneticWrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || touchOrReduced()) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    let has = false;

    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Distance from the pointer to the element's box (0 when inside it).
      const dx = Math.max(Math.abs(px - cx) - r.width / 2, 0);
      const dy = Math.max(Math.abs(py - cy) - r.height / 2, 0);
      const dist = Math.hypot(dx, dy);
      if (!has || dist > 90) {
        el.style.transform = "translate3d(0,0,0)";
        el.style.setProperty("--mag", "0");
        return;
      }
      const s = 1 - dist / 90;
      const clamp = (v: number) => Math.max(-8, Math.min(8, v));
      el.style.transform = `translate3d(${clamp((px - cx) * 0.18)}px,${clamp((py - cy) * 0.3)}px,0)`;
      el.style.setProperty("--mag", s.toFixed(2));
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      has = true;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      has = false;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), filter 0.28s ease",
        filter:
          "drop-shadow(0 0 calc(var(--mag, 0) * 16px) color-mix(in oklab, var(--cyan-accent) calc(var(--mag, 0) * 60%), transparent))",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Counts up to a value such as "2+", "4" or "10+" the first time it scrolls
 * into view; the number is parsed and the suffix kept. Fixed width + tabular
 * numerals keep the layout still; reduced motion shows the final value.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const m = /^(\d+)(.*)$/.exec(value);
    if (!el || !m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(m[1]);
    const suffix = m[2];
    el.textContent = `0${suffix}`;
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 1200);
          el.textContent = `${Math.round(target * (1 - (1 - p) ** 3))}${suffix}`;
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span
      ref={ref}
      className="inline-block tabular-nums"
      style={{ minWidth: `${value.length}ch` }}
    >
      {value}
    </span>
  );
}

/** Stat card: local 3D tilt (±8°) with a glass glare that follows the cursor. */
export function StatCard({ label, value }: { label: string; value: string }) {
  const [ref, style] = usePointerTilt<HTMLDivElement>(8, { local: true });
  return (
    <motion.div
      ref={ref}
      style={style}
      className="glass relative flex w-40 min-w-0 flex-col overflow-hidden rounded-2xl p-4 text-left sm:w-44"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),color-mix(in_oklab,var(--cyan-accent)_18%,transparent),transparent_60%)] opacity-[var(--glare,0)] transition-opacity duration-300"
      />
      <dt className="relative text-xs leading-snug text-muted-foreground">{label}</dt>
      <dd className="relative mt-2 min-h-[3.1rem] text-lg font-semibold leading-tight text-balance text-foreground">
        <CountUp value={value} />
      </dd>
    </motion.div>
  );
}

/**
 * Cursor spotlight over the hero: reveals the `.hero-blueprint` circuit pattern
 * within ~220px of the pointer. `--mx` / `--my` are written once per frame on
 * the pattern element — never through React state.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || touchOrReduced()) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      el.style.setProperty("--spot", "1");
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--spot", "0");
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} aria-hidden className="hero-blueprint -z-10" />;
}
