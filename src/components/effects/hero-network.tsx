import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const LINK_DIST = 150;
const AVOID_PAD = 10;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Faint drifting point network behind the hero (Canvas 2D). Pauses while the
 * hero is off-screen or the tab is hidden, caps DPR at 1.5, and renders a
 * single static frame under reduced motion.
 */
export function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let rgb = "6,182,212";
    let avoid: Rect[] = [];
    let raf = 0;
    let last = 0;
    let inView = true;

    const readAccent = () => {
      const hex = getComputedStyle(document.documentElement)
        .getPropertyValue("--cyan-accent")
        .trim();
      const m = /^#([0-9a-f]{6})$/i.exec(hex);
      if (m) {
        const n = parseInt(m[1], 16);
        rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
      }
    };

    // Elements marked `data-network-avoid` (the heading) are cut out of the
    // drawing, so no node or line is ever painted where the letters sit.
    const measureAvoid = () => {
      const origin = canvas.getBoundingClientRect();
      avoid = Array.from(
        canvas.parentElement?.querySelectorAll("[data-network-avoid]") ?? [],
      ).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - origin.left - AVOID_PAD,
          y: r.top - origin.top - AVOID_PAD,
          w: r.width + AVOID_PAD * 2,
          h: r.height + AVOID_PAD * 2,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      for (const r of avoid) ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip("evenodd");
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(${rgb},${0.16 * (1 - d / LINK_DIST)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = `rgba(${rgb},0.4)`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureAvoid();
      const count = width < 768 ? 30 : 60;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
      draw();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 50) / 16.7;
      last = now;
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      draw();
    };

    const sync = () => {
      const run = !reduced && inView && !document.hidden;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    readAccent();
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    viewObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      readAccent();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
}
