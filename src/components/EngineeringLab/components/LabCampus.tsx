import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BUILDINGS, type Building, type BuildingId } from "../data/campus";
import { LAB_MODULES, type LabModule } from "../data/modules";
import "../styles/lab-campus.css";

/* ── Geometry (floor coordinates, px) ─────────────────────────────────── */

interface Geo {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  cls: string;
  /** Boot order: the buildings rise one by one. */
  k: number;
}

const GEO: Record<BuildingId, Geo> = {
  "ai-research": { x: 300, y: 300, w: 160, d: 160, h: 230, cls: "lc-b--ai", k: 0 },
  "system-design": { x: 110, y: 110, w: 140, d: 140, h: 130, cls: "lc-b--sys", k: 1 },
  "erp-procurement": { x: 480, y: 520, w: 200, d: 120, h: 110, cls: "lc-b--erp", k: 2 },
  "production-incident": { x: 120, y: 600, w: 120, d: 120, h: 80, cls: "lc-b--inc", k: 3 },
};

/** Roads: grid lines between the buildings, [x1, y1, x2, y2]. */
const ROADS: [number, number, number, number][] = [
  [250, 180, 380, 180],
  [380, 180, 380, 300],
  [460, 380, 580, 380],
  [580, 380, 580, 520],
  [380, 460, 380, 680],
  [240, 680, 380, 680],
  [180, 250, 180, 600],
];

/** Glowing packets: [x1, y1, x2, y2, seconds, delay seconds]. */
const PACKETS: [number, number, number, number, number, number][] = [
  [250, 180, 380, 180, 2.6, 0],
  [460, 380, 580, 380, 3, 0.8],
  [580, 380, 580, 520, 2.8, 1.9],
  [380, 460, 380, 680, 3.6, 0.4],
  [380, 680, 240, 680, 2.4, 1.2],
  [180, 250, 180, 600, 4.2, 0.2],
];

const BOOT_KEY = "bk:lab:boot:v1";
const BOOT_MS = 1900;
const ZOOM_MS = 600;
const ZOOM_SCALE = 2.4;
const BOOT_LOG = [
  "> mounting system-design-lab … ok",
  "> mounting erp-procurement-lab … ok",
  "> mounting incident-lab … ok",
];

function shouldBoot() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (!window.matchMedia("(min-width: 768px)").matches) return false;
    return window.sessionStorage.getItem(BOOT_KEY) !== "1";
  } catch {
    return false;
  }
}

function useMedia(query: string) {
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

const urlFor = (b: Building) => (b.route ? b.route : `/lab?open=${b.moduleId}`);
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/* ── Component ───────────────────────────────────────────────────────── */

export function LabCampus({ onOpen }: { onOpen: (module: LabModule) => void }) {
  const wide = useMedia("(min-width: 768px)");
  return wide ? <Scene onOpen={onOpen} /> : <MobileStack onOpen={onOpen} />;
}

function useOpenBuilding(onOpen: (module: LabModule) => void) {
  const navigate = useNavigate();
  return useCallback(
    (b: Building) => {
      if (b.route) {
        void navigate({ to: b.route });
        return;
      }
      const m = LAB_MODULES.find((x) => x.id === b.moduleId);
      if (m) onOpen(m);
    },
    [navigate, onOpen],
  );
}

function Bullets({ items, inButton }: { items: string[]; inButton?: boolean }) {
  const dot = <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />;
  const row = "flex items-center gap-2 text-xs text-foreground/80";
  // A <button> may only hold phrasing content, so the mobile cards use spans.
  if (inButton) {
    return (
      <span className="mt-3 block space-y-1.5">
        {items.map((item) => (
          <span key={item} className={row}>
            {dot}
            {item}
          </span>
        ))}
      </span>
    );
  }
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item) => (
        <li key={item} className={row}>
          {dot}
          {item}
        </li>
      ))}
    </ul>
  );
}

function Badge({ b }: { b: Building }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${b.flagship ? "bg-cyan-accent" : "bg-emerald-500"}`} />
      {b.badge}
    </span>
  );
}

/* ── Desktop / tablet: the isometric scene ───────────────────────────── */

function Scene({ onOpen }: { onOpen: (module: LabModule) => void }) {
  const reduced = useReducedMotion() ?? false;
  const finePointer = useMedia("(pointer: fine)");
  const openNow = useOpenBuilding(onOpen);

  const [active, setActive] = useState<BuildingId | null>(null);
  const [boot, setBoot] = useState(shouldBoot);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Partial<Record<BuildingId, HTMLButtonElement | null>>>({});
  const anchorRefs = useRef<Partial<Record<BuildingId, HTMLElement | null>>>({});
  const labelRefs = useRef<Partial<Record<BuildingId, HTMLElement | null>>>({});
  const pts = useRef<Partial<Record<BuildingId, { x: number; y: number }>>>({});
  const activeRef = useRef<BuildingId | null>(null);
  const scaleRef = useRef(1);
  const closeT = useRef(0);
  const zoomT = useRef(0);
  const busy = useRef(false);
  const raf = useRef(0);
  const until = useRef(0);
  const tgt = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });

  /* Position the labels and the info card from each building's measured
     on-screen position (imperatively: nothing here is React state). */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    for (const b of BUILDINGS) {
      const a = anchorRefs.current[b.id];
      const l = labelRefs.current[b.id];
      if (!a) continue;
      const r = a.getBoundingClientRect();
      const x = r.left + r.width / 2 - sr.left;
      const y = r.top + r.height / 2 - sr.top;
      pts.current[b.id] = { x, y };
      if (l) l.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    const id = activeRef.current;
    const card = cardRef.current;
    const p = id ? pts.current[id] : undefined;
    if (card && p) {
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      const gap = 80 * scaleRef.current;
      let x = p.x + gap;
      if (x + cw > sr.width - 8) x = p.x - gap - cw;
      x = clamp(x, 8, Math.max(8, sr.width - cw - 8));
      let y = clamp(p.y - ch / 2 + 50, 8, Math.max(8, sr.height - ch - 8));
      const lo = Math.max(8, 8 - sr.top);
      const hi = Math.min(sr.height - ch - 8, window.innerHeight - 8 - sr.top - ch);
      if (hi >= lo) y = clamp(y, lo, hi);
      card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  /* A short rAF run: re-measures while something moves (parallax easing, the
     hover lift, the boot rise). Stops by itself. */
  const kick = useCallback(
    (ms: number) => {
      until.current = Math.max(until.current, performance.now() + ms);
      if (raf.current) return;
      const loop = () => {
        const t = tiltRef.current;
        const dx = tgt.current.x - cur.current.x;
        const dy = tgt.current.y - cur.current.y;
        const moving = Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002;
        if (moving) {
          cur.current.x += dx * 0.12;
          cur.current.y += dy * 0.12;
          if (t) {
            t.style.setProperty("--lc-px", cur.current.x.toFixed(4));
            t.style.setProperty("--lc-py", cur.current.y.toFixed(4));
          }
        }
        measure();
        raf.current = performance.now() < until.current || moving ? requestAnimationFrame(loop) : 0;
      };
      raf.current = requestAnimationFrame(loop);
    },
    [measure],
  );

  /* Fit the 1120px-wide world into the stage. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const s = Math.min(1, stage.clientWidth / 1000);
      scaleRef.current = s;
      stage.style.setProperty("--lc-s", s.toFixed(4));
      kick(80);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [kick]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      window.clearTimeout(closeT.current);
      window.clearTimeout(zoomT.current);
    },
    [],
  );

  useLayoutEffect(() => {
    activeRef.current = active;
    measure();
    kick(320);
  }, [active, measure, kick]);

  /* Boot-in: once per session. */
  useEffect(() => {
    if (!boot) return;
    try {
      window.sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* private mode: the boot simply plays again next time */
    }
    const t = window.setTimeout(() => setBoot(false), BOOT_MS);
    return () => window.clearTimeout(t);
  }, [boot]);

  useEffect(() => {
    if (!boot) kick(120);
  }, [boot, kick]);

  /* Esc: skips the boot, otherwise closes the info card. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (boot) setBoot(false);
      else if (active) setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boot, active]);

  const show = (id: BuildingId) => {
    window.clearTimeout(closeT.current);
    setActive(id);
  };
  const cancelClose = () => window.clearTimeout(closeT.current);
  const hideSoon = () => {
    window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setActive(null), 160);
  };

  /* Zoom the scene toward the building, then go to the lab. */
  const go = (b: Building) => {
    if (busy.current) return;
    const stage = stageRef.current;
    const zoom = zoomRef.current;
    const p = pts.current[b.id];
    if (reduced || !stage || !zoom || !p) {
      openNow(b);
      return;
    }
    busy.current = true;
    setActive(null);
    const sr = stage.getBoundingClientRect();
    zoom.style.transform = `translate(${-ZOOM_SCALE * (p.x - sr.width / 2)}px, ${-ZOOM_SCALE * (p.y - sr.height / 2)}px) scale(${ZOOM_SCALE})`;
    stage.classList.add("lc-zooming");
    zoomT.current = window.setTimeout(() => openNow(b), ZOOM_MS);
  };

  const activate = (b: Building, e: ReactMouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      window.open(urlFor(b), "_blank", "noopener");
      return;
    }
    go(b);
  };

  const onKeyNav = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = BUILDINGS[(i + dir + BUILDINGS.length) % BUILDINGS.length];
    btnRefs.current[next.id]?.focus();
  };

  const parallax = finePointer && !reduced;
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!parallax || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tgt.current = {
      x: clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1),
      y: clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1),
    };
    kick(0);
  };
  const onLeave = () => {
    tgt.current = { x: 0, y: 0 };
    kick(0);
  };

  const activeB = active ? BUILDINGS.find((b) => b.id === active) : undefined;

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className={`lc-stage ${boot ? "lc-boot" : ""}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div ref={zoomRef} className="lc-zoom">
          <div className="lc-world">
            <div className="lc-persp">
              <div ref={tiltRef} className="lc-tilt">
                <div className="lc-floor">
                  <div className="lc-plate">
                    <div className="lc-grid-h" />
                    <div className="lc-grid-v" />
                    {ROADS.map(([x1, y1, x2, y2]) => (
                      <span
                        key={`${x1}-${y1}-${x2}-${y2}`}
                        className="lc-road"
                        style={{
                          left: Math.min(x1, x2) - 1,
                          top: Math.min(y1, y2) - 1,
                          width: Math.abs(x2 - x1) + 2,
                          height: Math.abs(y2 - y1) + 2,
                        }}
                      />
                    ))}
                  </div>

                  {PACKETS.map(([x1, y1, x2, y2, dur, dl]) => (
                    <span
                      key={`${x1}-${y1}-${x2}-${y2}`}
                      aria-hidden
                      className="lc-pk"
                      style={
                        {
                          "--sx": `${x1}px`,
                          "--sy": `${y1}px`,
                          "--ex": `${x2}px`,
                          "--ey": `${y2}px`,
                          "--dur": `${dur}s`,
                          "--dl": `${dl}s`,
                        } as CSSProperties
                      }
                    />
                  ))}

                  {BUILDINGS.map((b, i) => {
                    const g = GEO[b.id];
                    return (
                      <button
                        key={b.id}
                        ref={(el) => {
                          btnRefs.current[b.id] = el;
                        }}
                        type="button"
                        aria-label={b.name}
                        data-on={active === b.id ? "" : undefined}
                        className={`lc-b ${g.cls}`}
                        style={
                          {
                            "--x": `${g.x}px`,
                            "--y": `${g.y}px`,
                            "--w": `${g.w}px`,
                            "--d": `${g.d}px`,
                            "--h": `${g.h}px`,
                            "--k": g.k,
                          } as CSSProperties
                        }
                        onPointerEnter={(e) => e.pointerType === "mouse" && show(b.id)}
                        onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
                        onFocus={() => show(b.id)}
                        onBlur={hideSoon}
                        onClick={(e) => activate(b, e)}
                        onKeyDown={(e) => onKeyNav(e, i)}
                      >
                        <span aria-hidden className="lc-pad" />
                        <span aria-hidden className="lc-f lc-f--w">
                          <span className="lc-win" />
                          {b.id === "erp-procurement" && <span className="lc-strip lc-strip--b" />}
                        </span>
                        <span aria-hidden className="lc-f lc-f--s">
                          <span className="lc-win" />
                          {b.id === "erp-procurement" && (
                            <>
                              <span className="lc-strip" />
                              <span className="lc-strip lc-strip--b" />
                            </>
                          )}
                        </span>
                        <span aria-hidden className="lc-f lc-f--top">
                          {b.id === "ai-research" && <span className="lc-orb" />}
                          {b.id === "production-incident" && <span className="lc-beacon" />}
                        </span>
                        <span
                          aria-hidden
                          className="lc-anchor"
                          ref={(el) => {
                            anchorRefs.current[b.id] = el;
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay: labels and the info card, never rotated. */}
        <div className="lc-overlay">
          {BUILDINGS.map((b) => (
            <div
              key={b.id}
              aria-hidden
              className="lc-label"
              ref={(el) => {
                labelRefs.current[b.id] = el;
              }}
            >
              <div className="-translate-x-1/2 -translate-y-full pb-2 text-center">
                {b.flagship && (
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-widest text-cyan-accent">
                    {b.badge}
                  </div>
                )}
                <div className="block text-sm font-semibold tracking-tight text-foreground [text-shadow:0_1px_10px_var(--background)]">
                  {b.name}
                </div>
              </div>
            </div>
          ))}

          {activeB && (
            <div
              ref={cardRef}
              role="group"
              aria-label={`${activeB.name} details`}
              className="lc-card glass-strong rounded-2xl p-4"
              onPointerEnter={cancelClose}
              onPointerLeave={hideSoon}
              onFocus={cancelClose}
              onBlur={hideSoon}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{activeB.name}</h3>
                  {activeB.tagline && <div className="mt-0.5 text-xs text-cyan-accent">{activeB.tagline}</div>}
                </div>
                <Badge b={activeB} />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{activeB.description}</p>
              <Bullets items={activeB.bullets} />
              <button
                type="button"
                onClick={(e) => activate(activeB, e)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-4 py-2 text-xs font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                Open playground
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {boot && (
          <>
            <button
              type="button"
              onClick={() => setBoot(false)}
              className="lc-skip rounded-md px-2 py-1 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Skip
            </button>
            <div className="lc-bootlog" aria-hidden>
              {BOOT_LOG.map((line, li) => (
                <div key={line}>
                  {[...line].map((ch, ci) => (
                    <span key={ci} className="lc-ch" style={{ animationDelay: `${150 + li * 400 + ci * 11}ms` }}>
                      {ch}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fallback for assistive tech: the four labs as plain links. */}
      <nav aria-label="Engineering Lab playgrounds" className="sr-only">
        <ul>
          {BUILDINGS.map((b) => (
            <li key={b.id}>
              {b.route ? (
                <Link to={b.route}>{b.name}</Link>
              ) : (
                <a
                  href={urlFor(b)}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    openNow(b);
                  }}
                >
                  {b.name}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/* ── Mobile: a vertical stack of tilted glass building cards ─────────── */

const M_CLS: Record<BuildingId, string> = {
  "ai-research": "lc-mcard--ai",
  "system-design": "lc-mcard--sys",
  "erp-procurement": "lc-mcard--erp",
  "production-incident": "lc-mcard--inc",
};

function MobileStack({ onOpen }: { onOpen: (module: LabModule) => void }) {
  const openNow = useOpenBuilding(onOpen);
  return (
    <div className="lc-mstack space-y-5">
      <h2 className="sr-only">Lab modules</h2>
      {BUILDINGS.map((b) => {
        const Icon = b.icon;
        return (
          <button
            key={b.id}
            type="button"
            aria-label={b.name}
            onClick={() => openNow(b)}
            className={`lc-mcard ${M_CLS[b.id]} glass-strong rounded-2xl p-5`}
          >
            <span aria-hidden className="lc-mcard__bar" />
            <span aria-hidden className="lc-mcard__win" />
            <span className="flex items-center gap-3 pr-16">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/25 to-blue-accent/15 text-cyan-accent">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight text-foreground">{b.name}</span>
                {b.tagline && <span className="block text-xs text-cyan-accent">{b.tagline}</span>}
              </span>
            </span>
            <span className="mt-3 flex">
              <Badge b={b} />
            </span>
            <span className="mt-3 block text-sm leading-relaxed text-muted-foreground">{b.description}</span>
            <Bullets items={b.bullets} inButton />
            <span className="mt-4 flex items-center gap-2 border-t border-slate-900/8 pt-3 text-sm font-medium text-foreground dark:border-white/8">
              {b.flagship ? "Enter AI Research Lab" : "Open playground"}
              <ArrowRight className="h-4 w-4 text-cyan-accent" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
