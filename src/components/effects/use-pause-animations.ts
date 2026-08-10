import { useEffect, useRef } from "react";

/**
 * Pauses every decorative CSS animation inside the observed element while it
 * is outside the viewport (with a look-ahead margin). Off-screen sections
 * freeze their background loops, flowing dashes, particles, and pulsing dots
 * instead of keeping them running invisibly, and resume seamlessly on the way
 * back.
 *
 * The pause is applied imperatively via the `anim-paused` class (see
 * styles.css), so the class flip is the only DOM write — React is never
 * re-rendered during normal scrolling. An optional callback reports
 * visibility changes for components that also want to gate JS timers.
 */
export function usePauseAnimations<T extends HTMLElement>(
  onVisibilityChange?: (visible: boolean) => void,
) {
  const ref = useRef<T | null>(null);
  const visibleRef = useRef(true);
  const onChangeRef = useRef(onVisibilityChange);

  // Keep the observer's callback pointed at the latest prop without rebuilding
  // the IntersectionObserver (refs are only written inside effects).
  useEffect(() => {
    onChangeRef.current = onVisibilityChange;
  }, [onVisibilityChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (visible === visibleRef.current) return;
        visibleRef.current = visible;
        el.classList.toggle("anim-paused", !visible);
        onChangeRef.current?.(visible);
      },
      // Look-ahead margin so animations resume just before a section enters
      // the viewport, never while it is on screen.
      { rootMargin: "140px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
