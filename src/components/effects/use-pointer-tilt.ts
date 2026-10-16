import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Tilts an element toward the pointer (up to `maxDeg` on each axis) with spring
 * smoothing. Angles live in motion values, so pointer moves never re-render
 * React. Disabled on touch (`pointer: coarse`) and under reduced motion.
 *
 * By default the tilt follows the pointer anywhere on the page. With
 * `local: true` it only reacts while the pointer is over the element and also
 * exposes the pointer position as `--gx` / `--gy` (percent) and `--glare`
 * (0 or 1) on the element, for a glass glare overlay.
 *
 * Usage: `const [ref, style] = usePointerTilt<HTMLDivElement>(6)` and spread
 * `style` onto a `motion.div` that also receives `ref`.
 */
export function usePointerTilt<T extends HTMLElement>(
  maxDeg: number,
  options: { local?: boolean } = {},
) {
  const { local = false } = options;
  const ref = useRef<T | null>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const rotateX = useSpring(targetX, { stiffness: 140, damping: 18, mass: 0.6 });
  const rotateY = useSpring(targetY, { stiffness: 140, damping: 18, mass: 0.6 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const blocked =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (blocked) return;

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const halfW = local ? r.width / 2 : window.innerWidth / 2;
      const halfH = local ? r.height / 2 : window.innerHeight / 2;
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / halfW);
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / halfH);
      targetY.set(nx * maxDeg);
      targetX.set(-ny * maxDeg);
      if (local) {
        el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
        el.style.setProperty("--glare", "1");
      }
    };
    const onLeave = () => {
      targetX.set(0);
      targetY.set(0);
      if (local) el.style.setProperty("--glare", "0");
    };

    const moveTarget: HTMLElement | Window = local ? el : window;
    const leaveTarget: HTMLElement = local ? el : document.documentElement;
    moveTarget.addEventListener("pointermove", onMove as EventListener, { passive: true });
    leaveTarget.addEventListener("pointerleave", onLeave);
    return () => {
      moveTarget.removeEventListener("pointermove", onMove as EventListener);
      leaveTarget.removeEventListener("pointerleave", onLeave);
    };
  }, [maxDeg, local, targetX, targetY]);

  return [ref, { rotateX, rotateY, transformPerspective: 1000 }] as const;
}
