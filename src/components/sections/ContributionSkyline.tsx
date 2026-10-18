import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export interface CalendarDay {
  date: string;
  count: number;
}

interface Cell {
  date: string;
  count: number;
  week: number;
  day: number;
}

const WEEKDAY_ROWS = 7;
const ENTRANCE_MS = 800;
// Geometry in "cell" units (one week column = 1): front-face width, depth
// offset of the top / right faces, per-day row shift, tallest bar height.
const G = { bw: 0.78, ox: 0.38, oy: 0.26, rowX: 0.5, rowY: 0.34, maxH: 6, padTop: 0.5, padBottom: 0.5 };

type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return [6, 182, 212];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const shade = (c: RGB, f: number): RGB => [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f)];
const rgba = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const level = (count: number, max: number) => (count <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));

function buildCells(calendar: CalendarDay[]): { cells: Cell[]; weeks: number } {
  const first = new Date(`${calendar[0].date}T00:00:00Z`).getUTCDay();
  const cells = calendar.map((d, i) => ({ ...d, week: Math.floor((i + first) / WEEKDAY_ROWS), day: (i + first) % WEEKDAY_ROWS }));
  return { cells, weeks: Math.floor((calendar.length - 1 + first) / WEEKDAY_ROWS) + 1 };
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
const countLabel = (n: number) => (n === 0 ? "No contributions" : n === 1 ? "1 contribution" : `${n} contributions`);

function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

/** Point in polygon (ray casting). */
function inside(px: number, py: number, pts: number[]) {
  let c = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i];
    const yi = pts[i + 1];
    const xj = pts[j];
    const yj = pts[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/**
 * "Last 12 months": an isometric 3D bar per day on Canvas 2D (53 weeks × 7
 * days), bar height on a sqrt scale. It draws only on resize, on hover changes
 * and during the one 800 ms entrance when it first scrolls into view — there
 * is no render loop. Below 768px it is a flat, horizontally scrolling heatmap
 * that starts on the latest weeks. The canvas is aria-hidden; a visually
 * hidden summary and a monthly table carry the same facts.
 */
export function ContributionSkyline({ calendar }: { calendar: CalendarDay[] }) {
  const reduced = useReducedMotion() ?? false;
  const wide = useWide();
  const { cells, weeks } = useMemo(() => buildCells(calendar), [calendar]);
  const max = useMemo(() => Math.max(1, ...calendar.map((d) => d.count)), [calendar]);
  const total = useMemo(() => calendar.reduce((n, d) => n + d.count, 0), [calendar]);
  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
    const out = new Map<string, number>();
    for (const d of calendar) {
      const k = fmt.format(new Date(`${d.date}T00:00:00Z`));
      out.set(k, (out.get(k) ?? 0) + d.count);
    }
    return [...out];
  }, [calendar]);

  // Canvas height follows its width through one constant ratio, so the card's
  // height is known before the canvas draws and nothing shifts.
  const unitsW = weeks - 1 + (WEEKDAY_ROWS - 1) * G.rowX + G.bw + G.ox;
  const unitsH = G.padTop + G.maxH + G.oy + (WEEKDAY_ROWS - 1) * G.rowY + G.padBottom;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const hoverRef = useRef<Cell | null>(null);
  const progressRef = useRef(reduced ? 1 : 0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // ── canvas drawing, resize, hover, entrance ──────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wide || !wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cssW = 0;
    let raf = 0;
    let entranceRaf = 0;

    const geometry = () => {
      const cell = cssW / unitsW;
      const y0 = (G.padTop + G.maxH + G.oy + (WEEKDAY_ROWS - 1) * G.rowY) * cell;
      const hOf = (count: number, p: number) => (count <= 0 ? 0.04 : Math.max(0.12, (Math.sqrt(count) / Math.sqrt(max)) * G.maxH)) * cell * p;
      const origin = (c: Cell) => ({
        x: (c.week + (WEEKDAY_ROWS - 1 - c.day) * G.rowX) * cell,
        y: y0 - (WEEKDAY_ROWS - 1 - c.day) * G.rowY * cell,
      });
      return { cell, hOf, origin };
    };

    const palette = () => {
      const cs = getComputedStyle(document.documentElement);
      const accent = hexToRgb(cs.getPropertyValue("--cyan-accent"));
      const dark = document.documentElement.classList.contains("dark");
      const empty: RGB = dark ? [148, 163, 184] : [100, 116, 139];
      const floor: RGB = dark ? [30, 41, 59] : [226, 232, 240];
      return { accent, dark, empty, floor };
    };

    const draw = () => {
      raf = 0;
      if (!cssW) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = Math.round((cssW * unitsH) / unitsW);
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, h);
      const { cell, hOf, origin } = geometry();
      const pal = palette();
      const p = progressRef.current;
      const hover = hoverRef.current;
      const bw = G.bw * cell;
      const ox = G.ox * cell;
      const oy = G.oy * cell;

      for (const c of cells.slice().sort((a, b) => a.day - b.day || a.week - b.week)) {
        const { x, y } = origin(c);
        const bh = hOf(c.count, p);
        const lv = level(c.count, max);
        let top: RGB = lv === 0 ? mix(pal.floor, pal.empty, 0.22) : mix(pal.floor, pal.accent, [0, 0.4, 0.6, 0.82, 1][lv]);
        if (hover === c) top = mix(top, [255, 255, 255], 0.35);
        // front, top and right faces
        ctx.fillStyle = rgba(shade(top, 0.78));
        ctx.fillRect(x, y - bh, bw, bh);
        ctx.fillStyle = rgba(top);
        ctx.beginPath();
        ctx.moveTo(x, y - bh);
        ctx.lineTo(x + bw, y - bh);
        ctx.lineTo(x + bw + ox, y - bh - oy);
        ctx.lineTo(x + ox, y - bh - oy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(shade(top, 0.58));
        ctx.beginPath();
        ctx.moveTo(x + bw, y);
        ctx.lineTo(x + bw, y - bh);
        ctx.lineTo(x + bw + ox, y - bh - oy);
        ctx.lineTo(x + bw + ox, y - oy);
        ctx.closePath();
        ctx.fill();
        if (hover === c) {
          ctx.strokeStyle = rgba(pal.dark ? [255, 255, 255] : [15, 23, 42], 0.9);
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x, y - bh, bw, bh);
        }
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(([entry]) => {
      cssW = Math.round(entry.contentRect.width);
      schedule();
    });
    ro.observe(wrap);
    cssW = Math.round(wrap.getBoundingClientRect().width);
    schedule();

    // The theme changes colours only: redraw once.
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Entrance: bars rise once, the first time the card is on screen.
    let io: IntersectionObserver | null = null;
    if (!reduced && progressRef.current < 1) {
      io = new IntersectionObserver(
        (entries) => {
          // Entries can arrive batched (e.g. after a deep-link jump): any one counts.
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          const t0 = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - t0) / ENTRANCE_MS);
            progressRef.current = 1 - Math.pow(1 - t, 3);
            draw();
            if (t < 1) entranceRaf = requestAnimationFrame(step);
          };
          entranceRaf = requestAnimationFrame(step);
        },
        { threshold: 0.35 },
      );
      io.observe(wrap);
    } else {
      progressRef.current = 1;
    }

    // Hover: hit-test the bars (nearest first), highlight and show the tooltip.
    const hideTip = () => {
      if (tipRef.current) tipRef.current.style.opacity = "0";
    };
    const onMove = (e: PointerEvent) => {
      if (progressRef.current < 1) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const { cell, hOf, origin } = geometry();
      const bw = G.bw * cell;
      const ox = G.ox * cell;
      const oy = G.oy * cell;
      let hit: Cell | null = null;
      for (const c of cells.slice().sort((a, b) => b.day - a.day || b.week - a.week)) {
        const { x, y } = origin(c);
        const bh = hOf(c.count, 1);
        if (inside(px, py, [x, y, x, y - bh, x + ox, y - bh - oy, x + bw + ox, y - bh - oy, x + bw + ox, y - oy, x + bw, y])) {
          hit = c;
          break;
        }
      }
      if (hit !== hoverRef.current) {
        hoverRef.current = hit;
        schedule();
      }
      const tip = tipRef.current;
      if (!tip) return;
      if (!hit) {
        hideTip();
        return;
      }
      const { x, y } = origin(hit);
      const bh = hOf(hit.count, 1);
      tip.textContent = `${formatDate(hit.date)} · ${countLabel(hit.count)}`;
      const w = tip.offsetWidth;
      const left = Math.min(Math.max(x + bw / 2 - w / 2, 4), r.width - w - 4);
      const top = Math.max(y - bh - oy - tip.offsetHeight - 8, 2);
      tip.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
      tip.style.opacity = "1";
    };
    const onLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null;
        schedule();
      }
      hideTip();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      ro.disconnect();
      mo.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(entranceRaf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [wide, cells, max, reduced, unitsH, unitsW]);

  // Mobile heatmap: start on the latest weeks (right edge).
  useEffect(() => {
    if (wide) return;
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [wide, cells]);

  const columns = useMemo(() => {
    const out: (Cell | null)[][] = Array.from({ length: weeks }, () => Array<Cell | null>(WEEKDAY_ROWS).fill(null));
    for (const c of cells) out[c.week][c.day] = c;
    return out;
  }, [cells, weeks]);

  return (
    <div className="glass-strong rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Last 12 months</h3>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{total} contributions</span>
      </div>

      <p className="sr-only">{total} contributions in the last year</p>
      <table className="sr-only">
        <caption>Contributions by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Contributions</th>
          </tr>
        </thead>
        <tbody>
          {months.map(([m, n]) => (
            <tr key={m}>
              <th scope="row">{m}</th>
              <td>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {wide ? (
        <div ref={wrapRef} className="relative mt-4 w-full" style={{ aspectRatio: `${unitsW} / ${unitsH}` }}>
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
          <div
            ref={tipRef}
            aria-hidden
            className="sky-tip glass pointer-events-none absolute top-0 left-0 rounded-lg px-2.5 py-1.5 font-mono text-xs whitespace-nowrap text-foreground"
          />
        </div>
      ) : (
        <div ref={scrollerRef} aria-hidden className="sky-scroller mt-4 overflow-x-auto pb-2 snap-x snap-proximity">
          <div className="flex w-max gap-[3px]">
            {columns.map((col, w) => (
              <div key={w} className="grid snap-end grid-rows-7 gap-[3px]">
                {col.map((c, d) => (
                  <span key={d} className="sky-cell" data-l={c ? level(c.count, max) : undefined} data-empty={c ? undefined : ""} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div aria-hidden className="mt-3 flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted-foreground">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="sky-cell" data-l={l} />
        ))}
        More
      </div>
    </div>
  );
}
