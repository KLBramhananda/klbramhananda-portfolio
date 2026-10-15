import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Tilts an element toward the pointer (up to `maxDeg` on each axis) with spring
 * smoothing. Angles live in motion values, so pointer moves never re-render
 * React. Disabled on touch (`pointer: coarse`) and under reduced motion.
 *
 * Usage: `const [ref, style] = usePointerTilt<HTMLDivElement>(6)` and spread
 * `style` onto a `motion.div` that also receives `ref`.
 */
export function usePointerTilt<T extends HTMLElement>(maxDeg: number) {
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
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
      targetY.set(nx * maxDeg);
      targetX.set(-ny * maxDeg);
    };
    const onLeave = () => {
      targetX.set(0);
      targetY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [maxDeg, targetX, targetY]);

  return [ref, { rotateX, rotateY, transformPerspective: 1000 }] as const;
}
