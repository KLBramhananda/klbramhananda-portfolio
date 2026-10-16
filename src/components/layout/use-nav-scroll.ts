import { useEffect, type RefObject } from "react";
import { spyState } from "@/lib/sections";

const COMPACT_AT = 80;
const HIDE_AFTER = 200;
const DIRECTION_DELTA = 8;

type ScrollFrame = (frame: { y: number; dy: number; dt: number }) => void;
const subscribers = new Set<ScrollFrame>();

/**
 * Subscribe to the nav's single rAF-throttled scroll handler instead of adding
 * another scroll listener. Called at most once per frame while scrolling (and on
 * resize) with the scroll position, the change since the last frame and the
 * elapsed milliseconds.
 */
export function onScrollFrame(fn: ScrollFrame) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * One rAF-throttled scroll handler for the nav. It never touches React state:
 * it writes `data-compact` / `data-hidden` attributes (styled with
 * `group-data-*` utilities) and a `--nav-progress` CSS variable (0..1, read by
 * the progress line's `scaleX`) on the header element.
 *
 * - compact after 80px of scroll;
 * - after 200px the header hides on scroll down (delta > 8px) and returns on
 *   scroll up; it is always shown at the top and whenever focus is inside it.
 */
export function useNavScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let raf = 0;
    let anchorY = window.scrollY;
    let lastY = anchorY;
    let lastT = performance.now();

    const update = () => {
      raf = 0;
      const y = Math.max(0, window.scrollY);
      header.dataset.compact = String(y > COMPACT_AT);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.style.setProperty("--nav-progress", max > 0 ? String(Math.min(1, y / max)) : "0");

      const now = performance.now();
      const frameDy = y - lastY;
      const frameDt = Math.max(now - lastT, 1);
      lastY = y;
      lastT = now;
      subscribers.forEach((fn) => fn({ y, dy: frameDy, dt: frameDt }));

      const delta = y - anchorY;
      // Programmatic scrolls (nav clicks, deep links) keep the nav visible.
      if (header.contains(document.activeElement) || y <= HIDE_AFTER || spyState.locked) {
        header.dataset.hidden = "false";
        anchorY = y;
      } else if (delta > DIRECTION_DELTA) {
        header.dataset.hidden = "true";
        anchorY = y;
      } else if (delta < -DIRECTION_DELTA) {
        header.dataset.hidden = "false";
        anchorY = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onFocusIn = () => {
      header.dataset.hidden = "false";
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    header.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      header.removeEventListener("focusin", onFocusIn);
    };
  }, [ref]);
}
