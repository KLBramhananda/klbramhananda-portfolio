import { useEffect, useRef, useSyncExternalStore } from "react";
import { ROOMS, type Room } from "../data/rooms";

export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Keys 1-7 pick the matching room (ignored while typing or with a modifier). */
export function useRoomHotkeys(enabled: boolean, onPick: (room: Room) => void) {
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const room = ROOMS.find((r) => String(r.n) === e.key);
      if (room) pick.current(room);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** Toggles `aw-paused` on `el` while it is off-screen or the tab is hidden. */
export function usePauseWhenHidden(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = true;
    const apply = () => el.classList.toggle("aw-paused", !inView || document.hidden);
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      apply();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, [ref]);
}
