import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

/** Hard cap so the pool stays tiny even during fast flicks. */
const MAX_PARTICLES = 280;
/** Lower = longer trailing lag behind the pointer (smoother curve). */
const LERP = 0.3;
/** Minimum cursor travel (px) between spawns. */
const SPAWN_DIST = 3;

const CYAN = [34, 211, 238];
const BLUE = [59, 130, 246];

function matchMediaSafe(query: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    matchMediaSafe("(prefers-reduced-motion: reduce)"),
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function MouseTrail() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // The only intentional disable paths are reduced-motion (here) and actual
    // touch input (filtered per-event below). No pointer media query is used —
    // browsers/OSes disagree on (pointer: fine) results, so gating on one can
    // silently kill the effect on perfectly normal desktops.
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let originX = 0;
    let originY = 0;
    let moved = false;
    let lastTime = performance.now();

    // "pointer" is the real cursor (viewport coords, converted into the
    // canvas's own CSS-pixel space). "cursor" eases toward it and seeds the
    // trailing particles, so the leading dot sits exactly on the pointer
    // while the rest of the trail smoothly follows behind it.
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cursor = { x: pointer.x, y: pointer.y };
    // Previous frame's pointer position → per-frame velocity for the stretch.
    let lastPointerX = pointer.x;
    let lastPointerY = pointer.y;
    let lastSpawnX = cursor.x;
    let lastSpawnY = cursor.y;
    const particles: Particle[] = [];

    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      originX = rect.left;
      originY = rect.top;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // dirX/dirY = normalized cursor travel direction; speed = px/frame. The
    // faster the pointer, the more the spawned particles stream along the
    // motion path, so a quick flick leaves a slightly longer tail — and when
    // the pointer stops, drift collapses to nothing and the tail settles.
    const spawn = (
      x: number,
      y: number,
      dirX: number,
      dirY: number,
      speed: number,
    ) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const drift = Math.min(speed * 0.16, 2.2);
      const palette = Math.random() < 0.78 ? CYAN : BLUE;
      particles.push({
        x,
        y,
        vx: dirX * drift + (Math.random() - 0.5) * 0.6,
        vy: dirY * drift + (Math.random() - 0.5) * 0.6,
        life: 1,
        decay: 0.01 + Math.random() * 0.014,
        size: 2.2 + Math.random() * 2.8,
        r: palette[0],
        g: palette[1],
        b: palette[2],
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      // Real touch is the only excluded input — mouse and pen both animate.
      if (e.pointerType === "touch") return;
      // Convert viewport coords into the canvas coordinate system. For this
      // full-viewport fixed canvas the origin is (0, 0), but subtracting the
      // bounding-rect origin keeps the mapping exact even if a containing
      // block ever applies a transform.
      pointer.x = e.clientX - originX;
      pointer.y = e.clientY - originY;
      if (!moved) {
        moved = true;
        cursor.x = pointer.x;
        cursor.y = pointer.y;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
        lastSpawnX = pointer.x;
        lastSpawnY = pointer.y;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 16.666, 2);
      lastTime = now;

      // Frame-rate independent exponential easing for the trailing path.
      const t = 1 - Math.pow(1 - LERP, dt);
      cursor.x += (pointer.x - cursor.x) * t;
      cursor.y += (pointer.y - cursor.y) * t;

      // Instantaneous pointer speed this frame (CSS px) — drives trail length.
      const pdx = pointer.x - lastPointerX;
      const pdy = pointer.y - lastPointerY;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      const pointerSpeed = Math.hypot(pdx, pdy);

      const dx = cursor.x - lastSpawnX;
      const dy = cursor.y - lastSpawnY;
      const dist = Math.hypot(dx, dy);
      if (dist >= SPAWN_DIST) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        // More, and more elongated, spawns when moving fast.
        const count = Math.min(1 + Math.floor(pointerSpeed / 12), 3);
        for (let i = 0; i < count; i++) {
          const back = i / Math.max(count, 1);
          spawn(
            cursor.x - dx * back,
            cursor.y - dy * back,
            dirX,
            dirY,
            pointerSpeed,
          );
        }
        lastSpawnX = cursor.x;
        lastSpawnY = cursor.y;
      }

      ctx.clearRect(0, 0, width, height);

      // Leading point: a compact bright core exactly at the real pointer
      // hotspot with a tight, soft halo so it reads as a signal rather than
      // a big glow. Drawn only after the pointer has actually moved.
      if (moved) {
        const glow = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          18,
        );
        glow.addColorStop(0, `rgba(${CYAN[0]}, ${CYAN[1]}, ${CYAN[2]}, 0.4)`);
        glow.addColorStop(1, `rgba(${CYAN[0]}, ${CYAN[1]}, ${CYAN[2]}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${CYAN[0]}, ${CYAN[1]}, ${CYAN[2]}, 1)`;
        ctx.fillRect(pointer.x - 3, pointer.y - 3, 6, 6);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(pointer.x - 1.5, pointer.y - 1.5, 3, 3);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = p.life * p.life * 0.95;
        const size = p.size * (0.3 + 0.7 * p.life);
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reduced]);

  // Rendered through a portal straight onto <body> so no section, stacking
  // context, overflow rule, or transform anywhere in the app can ever clip or
  // trap it. The overlay is a true viewport-level layer above all content.
  const trail = (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[80] h-screen w-screen"
      style={reduced ? { display: "none" } : undefined}
    />
  );

  return createPortal(trail, document.body);
}
