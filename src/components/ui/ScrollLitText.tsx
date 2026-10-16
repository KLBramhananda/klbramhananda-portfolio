import { useEffect, useRef, type CSSProperties } from "react";
import { onScrollFrame } from "../layout/use-nav-scroll";

/**
 * A paragraph whose words light up (opacity 0.25 -> 1) as it scrolls through
 * the viewport. The paragraph carries ONE CSS variable, `--p` (0..1), updated
 * from the shared scroll loop; each word only has its index (`--i`) and the
 * word count (`--n`), and a CSS `clamp()` turns those into its opacity — no
 * per-word work in JS. It stays a single readable paragraph for screen readers,
 * and under reduced motion every word is fully visible.
 */
export function ScrollLitText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the paragraph's top reaches 90% of the viewport, 1 once its
      // bottom has passed ~50% (so it is fully lit while being read).
      const p = (vh * 0.9 - r.top) / (r.height + vh * 0.4);
      el.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
    };
    update();
    const off = onScrollFrame(update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      off();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <p ref={ref} className={className} style={{ "--p": 0, "--n": words.length } as CSSProperties}>
      {words.map((w, i) => (
        <span
          key={i}
          style={
            {
              "--i": i,
              opacity:
                "clamp(0.25, calc(0.25 + (var(--p) * (var(--n) + 3) - var(--i)) * 0.4), 1)",
            } as CSSProperties
          }
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
