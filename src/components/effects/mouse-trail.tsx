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
  fill: string;
}

/** Hard cap so the pool stays tiny even during fast flicks. */
const MAX_PARTICLES = 280;
/** Lower = longer trailing lag behind the pointer (smoother curve). */
const LERP = 0.3;
/** Minimum cursor travel (px) between spawns. */
const SPAWN_DIST = 3;
/**
 * Idle window before the render loop pauses. The loop is the only continuous
 * requestAnimationFrame in the app; pausing it when the pointer is still and
 * the trail has settled stops a full-screen canvas repainting at 60fps for no
 * visible benefit, which frees the compositor for scrolling and interaction.
 */
const IDLE_PAUSE_MS = 160;
/** Radius of the cached soft glow sprite (matches the previous radial fill). */
const GLOW_RADIUS = 18;
/**
 * Extra padding around the cleared region so the trail never leaves a smeared
 * 1px edge as the bounding box shifts between frames.
 */
const CLEAR_PAD = 3;

const CYAN_FILL = "rgb(34, 211, 238)";
const BLUE_FILL = "rgb(59, 130, 246)";
const WHITE_FILL = "rgb(255, 255, 255)";

/**
 * Pre-render the pointer's soft halo once. Creating a RadialGradient and
 * calling addColorStop is expensive; caching it as a sprite lets every frame
 * be a single cheap drawImage instead.
 */
function makeGlowSprite(radius = GLOW_RADIUS): HTMLCanvasElement {
  const size = Math.max(1, Math.round(radius * 2));
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const g = sprite.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      radius,
    );
    grad.addColorStop(0, "rgba(34, 211, 238, 0.4)");
    grad.addColorStop(1, "rgba(34, 211, 238, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return sprite;
}

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

    const glow = makeGlowSprite();

    let raf = 0;
    let running = false;
    let width = 0;
    let height = 0;
    let originX = 0;
    let originY = 0;
    let moved = false;
    let lastMoveAt = 0;
    let lastTime = 0;
    // Bounding box of the previous frame's drawing. Only this small patch is
    // cleared each frame instead of the whole full-viewport canvas, which on
    // high-DPI screens was clearing millions of pixels at 60fps.
    let hasLastBounds = false;
    let lastMinX = 0;
    let lastMinY = 0;
    let lastMaxX = 0;
    let lastMaxY = 0;

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
      // DPR capped at 1.5: the glow is soft and the particles are tiny, so the
      // sharper 2× backing store is invisible — but 2× on a retina screen
      // quadruples the pixels this canvas clears and repaints per frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      originX = rect.left;
      originY = rect.top;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Resizing wipes the canvas, so there is nothing to clear next frame.
      hasLastBounds = false;
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
      const fill = Math.random() < 0.78 ? CYAN_FILL : BLUE_FILL;
      particles.push({
        x,
        y,
        vx: dirX * drift + (Math.random() - 0.5) * 0.6,
        vy: dirY * drift + (Math.random() - 0.5) * 0.6,
        life: 1,
        decay: 0.01 + Math.random() * 0.014,
        size: 2.2 + Math.random() * 2.8,
        fill,
      });
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const frame = (now: number) => {
      // Pause once the pointer is idle AND the trail has fully settled. With
      // nothing left to draw, keeping the loop alive would repaint an empty
      // full-viewport canvas forever, stealing GPU time from scroll paint.
      if (particles.length === 0 && now - lastMoveAt > IDLE_PAUSE_MS) {
        running = false;
        return;
      }
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

      // Clear only the region drawn last frame. The trail always lives in a
      // small patch around the pointer, so this repaints a few hundred pixels
      // instead of the entire viewport-sized canvas.
      if (hasLastBounds) {
        ctx.clearRect(
          Math.floor(lastMinX - CLEAR_PAD),
          Math.floor(lastMinY - CLEAR_PAD),
          Math.ceil(lastMaxX - lastMinX + CLEAR_PAD * 2),
          Math.ceil(lastMaxY - lastMinY + CLEAR_PAD * 2),
        );
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const include = (x: number, y: number, r: number) => {
        if (x - r < minX) minX = x - r;
        if (y - r < minY) minY = y - r;
        if (x + r > maxX) maxX = x + r;
        if (y + r > maxY) maxY = y + r;
      };

      // Leading point: a compact bright core exactly at the real pointer
      // hotspot with a tight, soft halo so it reads as a signal rather than
      // a big glow. The halo is the cached sprite; the core is two small
      // rects. Drawn only after the pointer has actually moved.
      if (moved) {
        include(pointer.x, pointer.y, GLOW_RADIUS);
        ctx.globalAlpha = 1;
        ctx.drawImage(glow, pointer.x - GLOW_RADIUS, pointer.y - GLOW_RADIUS);

        ctx.fillStyle = CYAN_FILL;
        ctx.fillRect(pointer.x - 3, pointer.y - 3, 6, 6);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = WHITE_FILL;
        ctx.fillRect(pointer.x - 1.5, pointer.y - 1.5, 3, 3);
      }

      // Particles use globalAlpha + a single precomputed fill string instead
      // of building a fresh rgba() template string per particle per frame.
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
        include(p.x, p.y, size / 2 + 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.fill;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      if (minX < maxX && minY < maxY) {
        lastMinX = minX;
        lastMinY = minY;
        lastMaxX = maxX;
        lastMaxY = maxY;
        hasLastBounds = true;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
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
      lastMoveAt = performance.now();
      if (!moved) {
        moved = true;
        cursor.x = pointer.x;
        cursor.y = pointer.y;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
        lastSpawnX = pointer.x;
        lastSpawnY = pointer.y;
      }
      if (!running) start();
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      stop();
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
