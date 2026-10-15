import type { IntroScene, IntroSceneOptions } from "./IntroGate";

const WORD = "BRAMHA";
const TERMINAL = ["> init bramha.core … ok", "> loading modules … ok", "> identity verified"];
const NODE_COUNT = 72;
const FONT_FAMILY = '"Inter", "Geist", "SF Pro Display", ui-sans-serif, system-ui, sans-serif';

interface WireNode {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  delay: number;
}

function randomInSphere(): [number, number, number] {
  for (;;) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    if (x * x + y * y + z * z <= 1) return [x, y, z];
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function rgb(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** "System Boot": a rotating wireframe assembles, terminal lines type, BRAMHA is outlined. */
export function startFallback2D(opts: IntroSceneOptions): IntroScene {
  const { host, accent, white, onDegrade } = opts;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "absolute inset-0 h-full w-full";
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  host.appendChild(canvas);

  const accentRGB = rgb(accent);
  const whiteRGB = rgb(white);

  const nodes: WireNode[] = Array.from({ length: NODE_COUNT }, () => {
    const [x, y, z] = randomInSphere();
    return {
      x,
      y,
      z,
      sx: x * 3,
      sy: y * 3,
      sz: z * 3,
      delay: Math.random() * 0.9,
    };
  });
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter(({ j, d }) => j > i && d < 0.5)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ j }) => edges.push([i, j]));
  });
  const projected = nodes.map(() => ({ x: 0, y: 0, s: 1, k: 0 }));

  let width = 1;
  let height = 1;
  let resizeDirty = true;
  const applySize = () => {
    resizeDirty = false;
    width = host.clientWidth || window.innerWidth;
    height = host.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  applySize();
  const resizeObserver = new ResizeObserver(() => {
    resizeDirty = true;
  });
  resizeObserver.observe(host);

  let yawTarget = 0;
  let pitchTarget = 0;
  let yawOff = 0;
  let pitchOff = 0;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    yawTarget = (((e.clientX - r.left) / r.width) * 2 - 1) * 0.35;
    pitchTarget = (((e.clientY - r.top) / r.height) * 2 - 1) * 0.2;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let disposed = false;
  let raf = 0;
  let last = 0;
  let time = opts.startAt;
  let enterAt = -1;
  let resolveEnter: (() => void) | null = null;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (disposed) return;
    try {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      if (resizeDirty) applySize();
      const k = 1 - Math.exp(-5 * dt);
      yawOff += (yawTarget - yawOff) * k;
      pitchOff += (pitchTarget - pitchOff) * k;

      let explode = 0;
      if (enterAt >= 0) {
        explode = clamp01((time - enterAt) / 0.7);
        if (explode >= 1 && resolveEnter) {
          resolveEnter();
          resolveEnter = null;
        }
      }
      const fade = 1 - explode;

      ctx.fillStyle = "#0B0B0C";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.44;
      const radius = Math.min(width, height) * 0.34;
      const yaw = time * 0.22 + yawOff;
      const pitch = pitchOff;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      nodes.forEach((n, i) => {
        const t = easeOutCubic(clamp01((time - 0.15 - n.delay * 1.2) / 0.9));
        const x = n.sx + (n.x - n.sx) * t;
        const y = n.sy + (n.y - n.sy) * t;
        const z = n.sz + (n.z - n.sz) * t;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        const s = (1 / (1 - z2 * 0.25)) * (1 + explode * 3);
        const p = projected[i];
        p.x = cx + x1 * radius * s;
        p.y = cy + y1 * radius * s;
        p.s = s;
        p.k = t;
      });

      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const pa = projected[a];
        const pb = projected[b];
        const alpha = 0.22 * Math.min(pa.k, pb.k) * fade;
        if (alpha < 0.01) continue;
        ctx.strokeStyle = `rgba(${accentRGB},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      for (const p of projected) {
        const alpha = 0.85 * p.k * fade;
        if (alpha < 0.01) continue;
        ctx.fillStyle = `rgba(${whiteRGB},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * p.s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = `rgba(${accentRGB},${0.85 * fade})`;
      TERMINAL.forEach((line, i) => {
        const chars = Math.floor((time - (0.25 + i * 0.7)) * 50);
        if (chars > 0) ctx.fillText(line.slice(0, chars), 16, 28 + i * 18);
      });

      const wordAlpha = clamp01((time - 1.8) / 0.7) * fade;
      if (wordAlpha > 0.01) {
        ctx.save();
        ctx.font = `800 100px ${FONT_FAMILY}`;
        const size = (100 * width * 0.7) / ctx.measureText(WORD).width;
        ctx.font = `800 ${size}px ${FONT_FAMILY}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.translate(cx, cy);
        ctx.scale(1 + explode * 1.4, 1 + explode * 1.4);
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.shadowColor = accent;
        ctx.shadowBlur = 14 * wordAlpha;
        ctx.strokeStyle = `rgba(${whiteRGB},${wordAlpha})`;
        ctx.strokeText(WORD, 0, 0);
        ctx.restore();
      }
    } catch {
      if (!disposed) onDegrade();
    }
  };

  const startLoop = () => {
    if (raf || disposed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      startLoop();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  startLoop();

  return {
    enter() {
      if (enterAt < 0) enterAt = time;
      return new Promise<void>((resolve) => {
        resolveEnter = resolve;
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.remove();
      resolveEnter?.();
      resolveEnter = null;
    },
  };
}
