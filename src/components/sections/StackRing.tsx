import "./stack-ring.css";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  Blocks,
  Bot,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Container,
  Cpu,
  Database,
  DatabaseZap,
  DoorOpen,
  Factory,
  FileCode2,
  Gauge,
  GitBranch,
  Hexagon,
  Layers,
  Leaf,
  Plug,
  RefreshCw,
  SearchCode,
  Server,
  Sparkles,
  Table2,
  Terminal,
  Webhook,
  Workflow,
  Wind,
  Zap,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import { skills } from "@/data/skills";
import { landingY, lockSpy } from "@/lib/sections";
import { NO_USAGE_TEXT } from "./SkillEvidence";
import { usageFor, type UsageRow } from "./skill-usage";
import { BASE_LABEL, FILTERS, buildStack, layerOf, type BlockDef, type FilterId } from "./stack-layout";

type Mode = "mobile" | "tablet" | "desktop";
const PANEL_ID = "stack-panel";

const readMode = (): Mode =>
  window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "mobile";

function useMode() {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => {
    const qs = [window.matchMedia("(min-width: 768px)"), window.matchMedia("(min-width: 1024px)")];
    const on = () => setMode(readMode());
    qs.forEach((q) => q.addEventListener("change", on));
    return () => qs.forEach((q) => q.removeEventListener("change", on));
  }, []);
  return mode;
}

/** Scroll a card into place below the nav and flash the existing highlight. */
function reveal(el: HTMLElement, highlight: HTMLElement, reduced: boolean) {
  window.scrollTo({
    top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - landingY()),
    behavior: reduced ? "auto" : "smooth",
  });
  highlight.classList.remove("project-targeted");
  void highlight.offsetWidth; // restart the highlight if it is already running
  highlight.classList.add("project-targeted");
  window.setTimeout(() => highlight.classList.remove("project-targeted"), 1400);
}

/** "Used in" rows (read from the Skills usage mapping): links to cards and roles. */
function UsedIn({ label, onNavigate }: { label: string; onNavigate: () => void }) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const rows = usageFor(label);

  const go = (row: UsageRow) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const section = row.kind === "project" ? "projects" : "experience";
    const el =
      row.kind === "project"
        ? document.getElementById(row.target)
        : document.querySelectorAll<HTMLElement>("#experience ol > li")[Number(row.target)];
    if (!el) return;
    const highlight = row.kind === "project" ? el : (el.querySelector<HTMLElement>(".glass-strong:last-child") ?? el);
    onNavigate();
    lockSpy(1500, false, section);
    const here = window.location.pathname === `/${section}`;
    const nav = here ? Promise.resolve() : router.navigate({ to: "/$section", params: { section }, resetScroll: false });
    void nav.finally(() => reveal(el, highlight, reduced));
  };

  return (
    <div className="mt-4">
      <p className="text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">Used in</p>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{NO_USAGE_TEXT}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.name}`}>
              <a
                href={r.kind === "project" ? "/projects" : "/experience"}
                onClick={go(r)}
                className="group flex items-center gap-2 rounded-lg border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1.5 text-sm transition-colors hover:border-cyan-accent/40 hover:bg-cyan-accent/10 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.context}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-accent opacity-70 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A block's card. Existing nodes keep the Skill Insight content exactly
 * (description, "My work", "Related", CORE tag, "View engineering context");
 * `+` blocks show only their name, layer and "Used in" rows — nothing invented.
 */
function BlockCard({
  def,
  layerTitle,
  onClose,
  hasCard,
  onRelated,
}: {
  def: BlockDef;
  layerTitle: string;
  onClose: () => void;
  hasCard: (key: string) => boolean;
  onRelated: (key: string) => void;
}) {
  const skill = skills[def.key];
  if (def.extra || !skill) {
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-cyan-accent" />
            <h3 className="text-base font-semibold text-foreground">{def.key}</h3>
          </div>
          <span className="shrink-0 text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
            {layerTitle}
          </span>
        </div>
        <UsedIn label={def.key} onNavigate={onClose} />
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: skill.color }} />
          <h3 className="text-base font-semibold text-foreground">{skill.name}</h3>
          {skill.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-accent/25 bg-cyan-accent/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-cyan-accent">
              <span aria-hidden className="h-1 w-1 rounded-full bg-cyan-accent" />
              {skill.status}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
          {skill.category}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{skill.description}</p>

      <div className="mt-4">
        <p className="text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">My work</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{skill.myWork}</p>
      </div>

      <div className="mt-4">
        <p className="text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">Related</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skill.related.map((r) => {
            const related = skills[r];
            const chip =
              "inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/[0.05] px-2.5 py-1 text-[0.6875rem] text-foreground/75 dark:border-white/10 dark:bg-white/[0.04]";
            const inner = (
              <>
                {related && <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: related.color }} />}
                {related ? related.name : r}
              </>
            );
            // A Related chip that is a card in the stack rotates the ring to it.
            return hasCard(r) ? (
              <button
                key={r}
                type="button"
                onClick={() => onRelated(r)}
                className={`${chip} cursor-pointer transition-colors hover:border-cyan-accent/40 hover:text-foreground [@media(pointer:coarse)]:min-h-[44px]`}
              >
                {inner}
              </button>
            ) : (
              <span key={r} className={chip}>
                {inner}
              </span>
            );
          })}
        </div>
      </div>

      <a
        href="/experience"
        onClick={onClose}
        className="mt-4 inline-flex items-center gap-1.5 border-t border-slate-900/10 pt-3 text-xs font-medium text-cyan-accent transition-colors hover:text-cyan-accent/80 dark:border-white/5"
      >
        View engineering context
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}

interface Card {
  def: BlockDef;
  category: string;
}

/** The artwork of each card: a glyph from the project's icon set, tinted with the skill's own colour. */
const ART: Record<string, LucideIcon> = {
  React: Atom,
  TypeScript: FileCode2,
  Vite: Zap,
  Tailwind: Wind,
  "REST APIs": Webhook,
  "API Gateway": DoorOpen,
  "Node.js": Hexagon,
  Python: Code2,
  "Spring Boot": Leaf,
  FastAPI: Gauge,
  Kafka: Workflow,
  Microservices: Boxes,
  PostgreSQL: Database,
  MongoDB: DatabaseZap,
  MySQL: Table2,
  Cloud: Cloud,
  Docker: Container,
  Linux: Terminal,
  Git: GitBranch,
  AWS: Server,
  "CI/CD": RefreshCw,
  AI: Sparkles,
  MCP: Plug,
  "LLM Integration": Bot,
  "RAG Workflows": SearchCode,
  ERPNext: Factory,
  Frappe: Blocks,
  "SAP BTP": Layers,
};

function ArtIcon({ name }: { name: string }) {
  const Icon = ART[name] ?? Cpu;
  return <Icon className="tsr-card__glyph" strokeWidth={1.5} />;
}

const AUTO_DEG_PER_S = 6;
const IDLE_RESUME_MS = 4000;
const DRAG_DEG_PER_PX = 0.3;
const DRAG_THRESHOLD_PX = 5;
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Shortest signed angle (deg) from a to b. */
const delta = (a: number, b: number) => mod(b - a + 180, 360) - 180;

/**
 * The Tech Stack as a 3D carousel ring (CSS 3D, no WebGL). The ring angle,
 * each card's opacity / scale / glow are written imperatively from one rAF
 * loop (no React state per frame); React state only changes when the front
 * card changes. Mobile swaps the ring for a scroll-snap row.
 */
export function StackRing({ skillLabels }: { skillLabels: readonly string[] }) {
  const model = useMemo(() => buildStack(new Set(skillLabels)), [skillLabels]);
  const mode = useMode();
  const reduced = useReducedMotion() ?? false;
  const [filter, setFilter] = useState<FilterId>("all");
  const [fading, setFading] = useState(false);
  const [front, setFront] = useState(0);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const cardEls = useRef<(HTMLButtonElement | null)[]>([]);
  const chipRefs = useRef(new Map<FilterId, HTMLButtonElement>());
  const timers = useRef<number[]>([]);
  const pending = useRef<string | null>(null);
  const focusFront = useRef(false);
  const st = useRef({
    angle: 0,
    target: 0,
    vel: 0,
    mode: "idle" as "idle" | "inertia" | "snap",
    down: false,
    dragging: false,
    startX: 0,
    lastX: 0,
    lastT: 0,
    hover: false,
    focus: false,
    panel: false,
    visible: true,
    lastInteract: 0,
    suppressClick: false,
    front: 0,
    pe: [] as boolean[],
  });

  const all = useMemo<Card[]>(
    () => [...model.layers, ...model.towers].flatMap((l) => l.blocks.map((def) => ({ def, category: l.title }))),
    [model],
  );
  const cards = useMemo(() => {
    if (filter === "all") return all;
    return all.filter((c) => layerOf(c.def.key, model)?.id === filter);
  }, [all, filter, model]);
  const n = cards.length;
  const step = 360 / n;
  const ringMode = mode !== "mobile";
  const cw = mode === "desktop" ? 180 : 150;
  const ch = mode === "desktop" ? 220 : 190;

  const cardCount = cards.length;
  const frontCard = cards[Math.min(front, cardCount - 1)];
  const frontKey = frontCard?.def.key;
  const hasCard = useCallback((key: string) => all.some((c) => c.def.key === key), [all]);
  const relatedSet = useMemo(
    () => new Set((frontKey && skills[frontKey]?.related.filter((r) => cards.some((c) => c.def.key === r))) || []),
    [frontKey, cards],
  );

  // ── ring geometry: radius from the card width, clamped to fit the viewport ──
  const [radius, setRadius] = useState(420);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ringMode) return;
    const compute = () => {
      const w = scene.clientWidth;
      const gap = 24;
      const ideal = (cw + gap) / (2 * Math.tan(Math.PI / Math.max(n, 3)));
      setRadius(Math.round(Math.min(Math.max(ideal, cw * 1.35), Math.max(w * 0.95, cw * 1.35))));
    };
    compute();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    });
    ro.observe(scene);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ringMode, n, cw]);

  /** Writes the ring angle and every card's depth look: custom properties only (transform / opacity). */
  const apply = useCallback(
    (angle: number) => {
      const ring = ringRef.current;
      if (!ring) return;
      ring.style.setProperty("--tsr-angle", `${angle}deg`);
      const s = st.current;
      for (let i = 0; i < cardEls.current.length; i++) {
        const el = cardEls.current[i];
        if (!el) continue;
        const rel = delta(0, i * step + angle);
        const c = Math.cos((rel * Math.PI) / 180);
        const f = Math.max(0, c);
        el.style.setProperty("--tsr-o", String(0.15 + 0.85 * Math.pow(Math.max(0, c), 3)));
        el.style.setProperty("--tsr-s", String(1 + 0.12 * Math.pow(f, 40)));
        el.style.setProperty("--tsr-g", String(Math.pow(f, 40)));
        const ok = Math.abs(rel) < 95;
        if (s.pe[i] !== ok) {
          s.pe[i] = ok;
          el.style.pointerEvents = ok ? "auto" : "none";
        }
      }
      const idx = mod(Math.round(-angle / step), n);
      if (idx !== s.front) {
        s.front = idx;
        setFront(idx);
      }
    },
    [n, step],
  );

  const goTo = useCallback(
    (i: number, instant = false) => {
      const s = st.current;
      const want = -mod(i, n) * step;
      s.lastInteract = performance.now();
      if (instant || reduced) {
        s.angle = s.target = s.angle + delta(s.angle, want);
        s.mode = "idle";
        s.vel = 0;
        apply(s.angle);
      } else {
        s.target = s.angle + delta(s.angle, want);
        s.mode = "snap";
        s.vel = 0;
      }
    },
    [apply, n, reduced, step],
  );

  // The animation loop: auto-rotation, inertia and snapping. It only runs while the ring is on screen.
  useEffect(() => {
    if (!ringMode || reduced) return;
    const s = st.current;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (s.visible && !s.dragging) {
        if (s.mode === "inertia") {
          s.angle += s.vel * dt;
          s.vel *= Math.pow(0.03, dt);
          if (Math.abs(s.vel) < 10) {
            s.mode = "snap";
            s.target = Math.round(s.angle / step) * step;
          }
          apply(s.angle);
        } else if (s.mode === "snap") {
          const d = s.target - s.angle;
          if (Math.abs(d) < 0.02) {
            s.angle = s.target;
            s.mode = "idle";
          } else s.angle += d * Math.min(1, dt * 9);
          apply(s.angle);
        } else if (!s.hover && !s.focus && !s.panel && now - s.lastInteract > IDLE_RESUME_MS) {
          s.angle -= AUTO_DEG_PER_S * dt;
          apply(s.angle);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ringMode, reduced, apply, step]);

  // Off-screen: nothing animates (the loop skips its work).
  useEffect(() => {
    const el = sceneRef.current ?? rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      st.current.visible = entries[entries.length - 1].isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ringMode]);

  // A rebuilt ring (filter change or resize of the card count) starts at the first card.
  useEffect(() => {
    const s = st.current;
    cardEls.current.length = n;
    s.pe = [];
    s.front = -1;
    const key = pending.current;
    const idx = key ? cards.findIndex((c) => c.def.key === key) : -1;
    pending.current = null;
    s.angle = s.target = -(idx >= 0 ? idx : 0) * step;
    s.mode = "idle";
    s.vel = 0;
    if (ringMode) apply(s.angle);
    else setFront(idx >= 0 ? idx : 0);
  }, [cards, n, step, ringMode, apply]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  // Keyboard focus follows the front card after an arrow key.
  useEffect(() => {
    if (focusFront.current) {
      focusFront.current = false;
      cardEls.current[front]?.focus({ preventScroll: true });
    }
  }, [front]);

  // ── filter: fade out, rebuild, fade in ──────────────────────────────────
  const pickFilter = useCallback(
    (id: FilterId, key?: string) => {
      pending.current = key ?? null;
      if (id === filter && !key) return;
      if (reduced) {
        setFilter(id);
        return;
      }
      setFading(true);
      timers.current.push(
        window.setTimeout(() => {
          setFilter(id);
          setFading(false);
        }, 180),
      );
    },
    [filter, reduced],
  );

  const goToKey = useCallback(
    (key: string) => {
      const i = cards.findIndex((c) => c.def.key === key);
      if (i >= 0) {
        if (ringMode) goTo(i);
        else rowRef.current?.children[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "center", block: "nearest" });
      } else pickFilter("all", key);
    },
    [cards, goTo, pickFilter, reduced, ringMode],
  );

  // ── drag (ring) ─────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = st.current;
    s.down = true;
    s.dragging = false;
    s.startX = s.lastX = e.clientX;
    s.lastT = performance.now();
    s.vel = 0;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.down) return;
    if (!s.dragging) {
      if (Math.abs(e.clientX - s.startX) < DRAG_THRESHOLD_PX) return;
      s.dragging = true;
      s.mode = "idle";
      sceneRef.current?.setPointerCapture(e.pointerId);
    }
    const now = performance.now();
    const dx = e.clientX - s.lastX;
    s.angle += dx * DRAG_DEG_PER_PX;
    const dt = Math.max(1, now - s.lastT) / 1000;
    s.vel = 0.7 * s.vel + 0.3 * ((dx * DRAG_DEG_PER_PX) / dt);
    s.lastX = e.clientX;
    s.lastT = now;
    s.lastInteract = now;
    apply(s.angle);
  };
  const endDrag = () => {
    const s = st.current;
    if (!s.down) return;
    s.down = false;
    if (!s.dragging) return;
    s.dragging = false;
    s.suppressClick = true;
    window.setTimeout(() => (s.suppressClick = false), 0);
    s.lastInteract = performance.now();
    if (reduced) {
      s.angle = s.target = Math.round(s.angle / step) * step;
      apply(s.angle);
    } else if (Math.abs(s.vel) > 25) s.mode = "inertia";
    else {
      s.mode = "snap";
      s.target = Math.round(s.angle / step) * step;
    }
  };

  const onCardClick = (i: number, e: ReactMouseEvent) => {
    if (st.current.suppressClick) {
      e.preventDefault();
      return;
    }
    if (ringMode) goTo(i);
    else rowRef.current?.children[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "center", block: "nearest" });
  };

  const step1 = (dir: 1 | -1, viaKeyboard = false) => {
    focusFront.current = viaKeyboard;
    if (ringMode) goTo(mod(st.current.front, n) + dir);
    else rowRef.current?.children[mod(front + dir, n)]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "center", block: "nearest" });
  };
  const onRingKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      step1(e.key === "ArrowRight" ? 1 : -1, true);
    }
  };

  // ── mobile row: the centred card is the front card ──────────────────────
  useEffect(() => {
    const row = rowRef.current;
    if (!row || ringMode) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = row.scrollLeft + row.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < row.children.length; i++) {
        const c = row.children[i] as HTMLElement;
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      setFront((f) => (f === best ? f : best));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      row.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ringMode, cards]);

  const onChipKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = FILTERS[(i + d + FILTERS.length) % FILTERS.length];
    pickFilter(next.id);
    chipRefs.current.get(next.id)?.focus();
  };

  const interact = (patch: Partial<Pick<typeof st.current, "hover" | "focus" | "panel">>) => {
    Object.assign(st.current, patch);
    st.current.lastInteract = performance.now();
  };

  const cardEl = (c: Card, i: number) => {
    const skill = skills[c.def.key];
    const isFront = i === front;
    const near = i === mod(front + 1, n) || i === mod(front - 1, n);
    return (
      <button
        key={c.def.key}
        type="button"
        ref={(el) => {
          cardEls.current[i] = el;
        }}
        data-front={isFront ? "" : undefined}
        data-related={relatedSet.has(c.def.key) ? "" : undefined}
        aria-label={`${c.def.key}, ${c.category}`}
        aria-controls={PANEL_ID}
        aria-current={isFront ? "true" : undefined}
        tabIndex={isFront || near ? 0 : -1}
        onClick={(e) => onCardClick(i, e)}
        className="tsr-card"
        style={{ "--tsr-i": i } as CSSProperties}
      >
        <span aria-hidden className="tsr-card__glow" />
        <span className="tsr-card__face glass-strong">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: skill?.color ?? "var(--cyan-accent)" }} />
            {skill?.status && (
              <span className="ml-auto rounded-full border border-cyan-accent/25 bg-cyan-accent/10 px-1.5 py-0.5 text-[0.5625rem] font-medium uppercase tracking-wider text-cyan-accent">
                {skill.status}
              </span>
            )}
          </span>
          <span aria-hidden className="tsr-card__art" style={{ "--tsr-c": skill?.color ?? "var(--cyan-accent)" } as CSSProperties}>
            <ArtIcon name={c.def.key} />
          </span>
          <span className="mt-auto block text-base font-semibold leading-tight text-foreground">{c.def.key}</span>
          <span className="mt-1 block text-[0.6875rem] uppercase tracking-widest text-muted-foreground">{c.category}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="tsr">
      <div role="radiogroup" aria-label="Filter by category" className="-mx-1 flex max-w-full flex-wrap gap-1.5 px-1 py-1">
        {FILTERS.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            tabIndex={filter === f.id ? 0 : -1}
            ref={(el) => {
              if (el) chipRefs.current.set(f.id, el);
            }}
            onClick={() => pickFilter(f.id)}
            onKeyDown={(e) => onChipKey(e, i)}
            className="tsr-chip"
          >
            {f.label}
          </button>
        ))}
      </div>

      {ringMode ? (
        <div className="tsr-stage mt-4" style={{ "--tsr-cw": `${cw}px`, "--tsr-ch": `${ch}px`, "--tsr-radius": `${radius}px`, "--tsr-step": `${step}deg` } as CSSProperties}>
          <button type="button" aria-label="Previous card" onClick={() => step1(-1)} className="tsr-arrow tsr-arrow--l">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div
            ref={sceneRef}
            className="tsr-scene"
            role="group"
            aria-label="Engineering technology ring"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerEnter={() => interact({ hover: true })}
            onPointerLeave={() => interact({ hover: false })}
            onFocus={() => interact({ focus: true })}
            onBlur={() => interact({ focus: false })}
            onKeyDown={onRingKey}
          >
            <div className={`tsr-fade ${fading ? "is-fading" : ""}`}>
              <div ref={ringRef} className="tsr-ring">
                {cards.map(cardEl)}
              </div>
            </div>
            <div aria-hidden className="tsr-floor">
              <span>{BASE_LABEL}</span>
            </div>
          </div>
          <button type="button" aria-label="Next card" onClick={() => step1(1)} className="tsr-arrow tsr-arrow--r">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : (
        <div ref={rowRef} className={`tsr-row mt-4 ${fading ? "is-fading" : ""}`} role="group" aria-label="Engineering technology cards">
          {cards.map(cardEl)}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {frontCard ? `Front card: ${frontCard.def.key}, ${frontCard.category}` : ""}
      </p>

      {/* Detail panel: fixed height, crossfades when the front card changes */}
      <aside
        id={PANEL_ID}
        aria-label="Selected technology details"
        className="tsr-panel glass-strong mt-5 rounded-2xl p-5"
        onPointerEnter={() => interact({ panel: true })}
        onPointerLeave={() => interact({ panel: false })}
      >
        {frontCard && (
          <div key={frontCard.def.key} className="tsr-panel__in">
            <BlockCard def={frontCard.def} layerTitle={frontCard.category} onClose={() => {}} hasCard={hasCard} onRelated={goToKey} />
          </div>
        )}
      </aside>
    </div>
  );
}
