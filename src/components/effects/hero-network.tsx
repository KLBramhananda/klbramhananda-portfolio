import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Offset from the drifting position (ripple push) and its velocity.
  ox: number;
  oy: number;
  ovx: number;
  ovy: number;
}

interface Ripple {
  x: number;
  y: number;
  t0: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LINK_DIST = 150;
const CURSOR_DIST = 140;
const RIPPLE_MS = 1100;
const RIPPLE_SPEED = 0.34; // px per ms
const AVOID_PAD = 10;

/**
 * Drifting point network behind the hero (Canvas 2D). Nodes near the cursor
 * brighten and link to it; a click or tap sends a ripple that pushes nodes
 * away and they ease back. Pauses while the hero is off-screen or the tab is
 * hidden, caps DPR at 1.5, and renders one static frame under reduced motion.
 * Elements marked `data-network-avoid` (the heading) are cut out of the
 * drawing, so nothing is ever painted where the letters sit.
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
    let ripples: Ripple[] = [];
    let avoid: Rect[] = [];
    let rgb = "6,182,212";
    let raf = 0;
    let last = 0;
    let inView = true;
    let cursor: { x: number; y: number } | null = null;

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

      const px = (n: Node) => n.x + n.ox;
      const py = (n: Node) => n.y + n.oy;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(px(a) - px(b), py(a) - py(b));
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(${rgb},${0.16 * (1 - d / LINK_DIST)})`;
            ctx.beginPath();
            ctx.moveTo(px(a), py(a));
            ctx.lineTo(px(b), py(b));
            ctx.stroke();
          }
        }
      }

      // Nodes near the cursor brighten and link to it.
      for (const n of nodes) {
        let glow = 0;
        if (cursor) {
          const d = Math.hypot(px(n) - cursor.x, py(n) - cursor.y);
          if (d < CURSOR_DIST) {
            glow = 1 - d / CURSOR_DIST;
            ctx.strokeStyle = `rgba(${rgb},${0.55 * glow})`;
            ctx.beginPath();
            ctx.moveTo(px(n), py(n));
            ctx.lineTo(cursor.x, cursor.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${rgb},${0.4 + 0.55 * glow})`;
        ctx.beginPath();
        ctx.arc(px(n), py(n), 1.4 + 1.2 * glow, 0, Math.PI * 2);
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
        ox: 0,
        oy: 0,
        ovx: 0,
        ovy: 0,
      }));
      draw();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dtMs = Math.min(now - last, 50);
      const dt = dtMs / 16.7;
      last = now;

      ripples = ripples.filter((r) => now - r.t0 < RIPPLE_MS);
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Ripple front pushes nodes outward; a soft spring eases them back.
        for (const r of ripples) {
          const age = now - r.t0;
          const dx = n.x + n.ox - r.x;
          const dy = n.y + n.oy - r.y;
          const dist = Math.hypot(dx, dy) || 1;
          const front = Math.abs(dist - age * RIPPLE_SPEED);
          if (front < 48) {
            const push = (1 - front / 48) * (1 - age / RIPPLE_MS) * 1.6 * dt;
            n.ovx += (dx / dist) * push;
            n.ovy += (dy / dist) * push;
          }
        }
        n.ovx += -n.ox * 0.04 * dt;
        n.ovy += -n.oy * 0.04 * dt;
        const damp = Math.pow(0.9, dt);
        n.ovx *= damp;
        n.ovy *= damp;
        n.ox += n.ovx * dt;
        n.oy += n.ovy * dt;
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

    // Pointer interaction is read from the window so the (non-interactive)
    // canvas never blocks the hero content above it.
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null;
    };
    const onMove = (e: PointerEvent) => {
      cursor = e.pointerType === "touch" ? null : local(e);
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      if (p && !reduced) ripples.push({ ...p, t0: performance.now() });
    };
    const onLeave = () => {
      cursor = null;
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
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
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
