import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const update = () => {
      rafRef.current = null;
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const progress = max > 0 ? root.scrollTop / max : 0;
      // transform + scaleX are compositor-friendly and never re-render React.
      bar.style.transform = `scaleX(${progress})`;
    };

    const schedule = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
      <div
        ref={barRef}
        aria-hidden
        className="h-full origin-left bg-gradient-to-r from-cyan-accent to-blue-accent shadow-[0_0_10px_rgba(6,182,212,0.7)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
