import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { skills } from "@/data/skills";
import { landingY, lockSpy } from "@/lib/sections";
import { onScrollFrame } from "../layout/use-nav-scroll";
import { NO_USAGE_TEXT } from "./SkillEvidence";
import { centerIn, useRequestTrace } from "./RequestTrace";
import { usageFor, type UsageRow } from "./skill-usage";
import {
  BASE_LABEL,
  FILTERS,
  TRACE_HOPS,
  TRACE_RETURN_CAPTION,
  buildStack,
  layerOf,
  relatedBlocks,
  resolveTrace,
  type BlockDef,
  type FilterId,
  type LayerDef,
} from "./stack-layout";

type Mode = "mobile" | "tablet" | "desktop";
const PANEL_ID = "stack-panel";
const SWIPE_CLOSE_PX = 60;
const FINE = "(hover: hover) and (pointer: fine)";

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

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

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
function BlockCard({ def, layerTitle, onClose }: { def: BlockDef; layerTitle: string; onClose: () => void }) {
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
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/[0.05] px-2.5 py-1 text-[0.6875rem] text-foreground/75 dark:border-white/10 dark:bg-white/[0.04]"
              >
                {related && <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: related.color }} />}
                {related ? related.name : r}
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

interface BlockProps {
  def: BlockDef;
  mode: Mode;
  selected: boolean;
  related: boolean;
  setRef: (key: string, el: HTMLButtonElement | null) => void;
  onSelect: (key: string) => void;
  onNav: (e: ReactKeyboardEvent<HTMLButtonElement>, key: string) => void;
}

// memo: a selection change re-renders only the blocks whose state changed.
const Block = memo(function Block({ def, mode, selected, related, setRef, onSelect, onNav }: BlockProps) {
  const color = skills[def.key]?.color;
  const enter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && mode !== "mobile") onSelect(def.key);
  };
  return (
    <button
      type="button"
      ref={(el) => setRef(def.key, el)}
      data-block={def.key}
      data-sel={selected ? "" : undefined}
      data-related={related ? "" : undefined}
      aria-controls={PANEL_ID}
      aria-pressed={selected}
      onPointerEnter={enter}
      // On mobile focus must not select: closing the sheet returns focus here.
      onFocus={() => mode !== "mobile" && onSelect(def.key)}
      onClick={() => onSelect(def.key)}
      onKeyDown={(e) => onNav(e, def.key)}
      className={`stk-block ${mode === "mobile" ? "stk-block--flat" : ""}`}
    >
      <span aria-hidden className="stk-block__glow" />
      <span aria-hidden className="stk-block__dot" style={{ background: color ?? "var(--cyan-accent)" }} />
      <span className="stk-block__label">{def.key}</span>
    </button>
  );
});

/**
 * The Tech Stack as an exploded 3D layer stack: glass plates in perspective
 * (CSS transforms + a small SVG overlay, no WebGL), two side towers, a docked
 * detail panel, "Trace a request" and a layer filter. Mobile gets flat layer
 * cards and a bottom sheet instead of the 3D.
 */
export function StackLayers({ skillLabels }: { skillLabels: readonly string[] }) {
  const model = useMemo(() => buildStack(new Set(skillLabels)), [skillLabels]);
  const mode = useMode();
  const reduced = useReducedMotion() ?? false;
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<SVGGElement | null>(null);
  const blockRefs = useRef(new Map<string, HTMLButtonElement>());
  const chipRefs = useRef(new Map<FilterId, HTMLButtonElement>());
  const swipeStart = useRef<number | null>(null);

  const setRef = useCallback((key: string, el: HTMLButtonElement | null) => {
    if (el) blockRefs.current.set(key, el);
    else blockRefs.current.delete(key);
  }, []);

  const all = useMemo(() => [...model.layers, ...model.towers], [model]);
  const selDef = useMemo(() => all.flatMap((l) => l.blocks).find((b) => b.key === sel) ?? null, [all, sel]);
  const selLayer = sel ? layerOf(sel, model) : undefined;
  const relatedKeys = useMemo(() => (sel ? relatedBlocks(sel, model) : []), [sel, model]);

  const clearSel = useCallback(() => setSel(null), []);

  // ── Exploded entry: ONE variable, from the shared scroll loop ──────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty("--explode", "1");
      return;
    }
    let cur = Number(el.style.getPropertyValue("--explode")) || 0;
    let off = () => {};
    const update = () => {
      const r = (sceneRef.current ?? el).getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.4)));
      if (p > cur) {
        cur = p;
        el.style.setProperty("--explode", cur.toFixed(3));
      }
      if (cur >= 1) off();
    };
    off = onScrollFrame(update);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => {
      off();
      window.removeEventListener("resize", update);
    };
  }, [reduced, mode]);

  // ── Pointer parallax (fine pointers, motion allowed) ───────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    const tilt = tiltRef.current;
    if (!scene || !tilt || reduced || mode === "mobile") return;
    if (!window.matchMedia(FINE).matches) return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      tilt.style.setProperty("--px", nx.toFixed(3));
      tilt.style.setProperty("--py", ny.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      nx = clamp1((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      ny = clamp1((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    scene.addEventListener("pointermove", onMove, { passive: true });
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, mode]);

  // ── Related lines: drawn imperatively from layout offsets ──────────────
  const drawLines = useCallback(() => {
    const g = linesRef.current;
    const tilt = tiltRef.current;
    if (!g || !tilt) return;
    g.replaceChildren();
    if (!sel || mode === "mobile") return;
    const from = blockRefs.current.get(sel);
    if (!from) return;
    const a = centerIn(from, tilt);
    for (const k of relatedKeys) {
      const to = blockRefs.current.get(k);
      if (!to) continue;
      const b = centerIn(to, tilt);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      line.setAttribute("class", "stk-rel");
      g.appendChild(line);
    }
  }, [sel, relatedKeys, mode]);

  useEffect(() => {
    drawLines();
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        drawLines();
      });
    });
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [drawLines]);

  // ── Esc / click on the background clears the selection ─────────────────
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSel();
    };
    const onDown = (e: Event) => {
      const t = e.target;
      if (t instanceof Element && t.closest(`[data-block], #${PANEL_ID}, [data-stack-sheet], .stk-controls button`)) return;
      clearSel();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [sel, clearSel]);

  // ── Keyboard: left/right within a layer, up/down between layers ────────
  const rows = useMemo(() => all.map((l) => l.blocks.map((b) => b.key)).filter((r) => r.length), [all]);
  const onNav = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>, key: string) => {
      const r = rows.findIndex((row) => row.includes(key));
      if (r < 0) return;
      const c = rows[r].indexOf(key);
      let next: string | undefined;
      if (e.key === "ArrowRight") next = rows[r][c + 1];
      else if (e.key === "ArrowLeft") next = rows[r][c - 1];
      else if (e.key === "ArrowDown") next = rows[r + 1]?.[Math.min(c, rows[r + 1].length - 1)];
      else if (e.key === "ArrowUp") next = rows[r - 1]?.[Math.min(c, rows[r - 1].length - 1)];
      else return;
      e.preventDefault();
      if (next) blockRefs.current.get(next)?.focus();
    },
    [rows],
  );

  // ── Trace a request ────────────────────────────────────────────────────
  const trace = useMemo(() => resolveTrace(model), [model]);
  const captions = useMemo(() => TRACE_HOPS.map((h) => h.caption), []);
  const blockEl = useCallback((key: string) => blockRefs.current.get(key) ?? null, []);
  const { running, caption, start, overlay } = useRequestTrace({
    wrapRef,
    tiltRef,
    blockEl,
    keys: trace.keys,
    captions,
    returnCaption: TRACE_RETURN_CAPTION,
    packet: mode !== "mobile" && !reduced,
    reduced,
  });

  // ── Layer filter ───────────────────────────────────────────────────────
  const pickFilter = (id: FilterId) => {
    setFilter(id);
    if (mode !== "mobile" || id === "all") return;
    const el = document.getElementById(`stack-layer-${id}`);
    if (!el) return;
    reveal(el, el, reduced);
  };
  const onChipKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = FILTERS[(i + step + FILTERS.length) % FILTERS.length];
    pickFilter(next.id);
    chipRefs.current.get(next.id)?.focus();
  };

  const layerTitle = selLayer?.title ?? "";
  const swipeDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = e.clientY;
  };
  const swipeUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (s != null && e.clientY - s > SWIPE_CLOSE_PX) clearSel();
  };

  const renderBlocks = (l: LayerDef) =>
    l.blocks.map((b) => (
      <Block
        key={b.key}
        def={b}
        mode={mode}
        selected={sel === b.key}
        related={relatedKeys.includes(b.key)}
        setRef={setRef}
        onSelect={setSel}
        onNav={onNav}
      />
    ));

  const dimOf = (l: LayerDef) => (filter !== "all" && filter !== l.id ? "" : undefined);
  const focusOf = (l: LayerDef) => (filter === l.id ? "" : undefined);

  const controls = (
    <div className="stk-controls flex flex-wrap items-center gap-x-4 gap-y-3">
      <div
        role="radiogroup"
        aria-label="Filter by layer"
        className="-mx-1 flex max-w-full flex-wrap gap-1.5 px-1 py-1"
      >
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
            className="stk-chip"
          >
            {f.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={start} disabled={running} className="stk-trace-btn">
        <span aria-hidden>▶</span> Trace a request
      </button>
    </div>
  );

  const captionEl = (
    <p aria-live="polite" className="stk-caption">
      {caption || " "}
    </p>
  );

  const panel = (
    <aside
      id={PANEL_ID}
      aria-live="polite"
      aria-label="Selected block details"
      className="stk-panel glass-strong rounded-2xl p-5"
    >
      {selDef ? (
        <BlockCard def={selDef} layerTitle={layerTitle} onClose={clearSel} />
      ) : (
        <p className="text-sm text-muted-foreground">Hover or tap a block to explore</p>
      )}
    </aside>
  );

  if (mode === "mobile") {
    return (
      <div ref={wrapRef} className="stk">
        {controls}
        {captionEl}
        <div className="mt-4 space-y-3">
          {all.map((l) => (
            <section
              key={l.id}
              id={`stack-layer-${l.id}`}
              data-layer={l.id}
              aria-label={`${l.title} layer`}
              className="stk-card glass-strong relative rounded-2xl p-4"
            >
              <h4 className="font-mono text-[0.6875rem] tracking-wider text-cyan-accent uppercase">{l.title}</h4>
              <div className="mt-3 flex flex-wrap gap-2">{renderBlocks(l)}</div>
            </section>
          ))}
        </div>
        <div className="stk-baseflat glass rounded-xl px-4 py-2 text-center font-mono text-xs text-muted-foreground">
          {BASE_LABEL}
        </div>

        {selDef &&
          createPortal(
            <div
              data-stack-sheet
              role="dialog"
              aria-label={`${selDef.key} details`}
              onPointerDown={swipeDown}
              onPointerUp={swipeUp}
              className="stk-sheet glass-strong"
            >
              <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-slate-900/20 dark:bg-white/20" />
              <button
                type="button"
                onClick={clearSel}
                aria-label="Close"
                className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div id={PANEL_ID} aria-live="polite" className="pr-7">
                <BlockCard def={selDef} layerTitle={layerTitle} onClose={clearSel} />
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="stk" style={{ "--explode": reduced ? 1 : 0 } as CSSProperties}>
      {controls}
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] lg:items-start lg:gap-8">
        <div>
          <div ref={sceneRef} className="stk-scene" role="group" aria-label="Engineering technology stack">
            <div ref={tiltRef} className="stk-tilt">
              {model.towers.map((t, k) => (
                <div
                  key={t.id}
                  data-layer={t.id}
                  data-dim={dimOf(t)}
                  data-focus={focusOf(t)}
                  className={`stk-tower ${k === 0 ? "stk-tower--l" : "stk-tower--r"}`}
                >
                  <div className="stk-tower__in">
                    <span aria-hidden className="stk-tower__slab" />
                    <span className="stk-tower__name">{t.title}</span>
                    <div className="stk-col" role="group" aria-label={`${t.title} tower`}>
                      {renderBlocks(t)}
                    </div>
                  </div>
                </div>
              ))}

              {model.layers.map((l, i) => (
                <div
                  key={l.id}
                  data-layer={l.id}
                  data-dim={dimOf(l)}
                  data-focus={focusOf(l)}
                  className="stk-layer"
                  style={{ "--i": i } as CSSProperties}
                >
                  <div className="stk-layer__in">
                    <span aria-hidden className="stk-slab" />
                    <span className="stk-layer__name">{l.title}</span>
                    <div className="stk-row" role="group" aria-label={`${l.title} layer`}>
                      {renderBlocks(l)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="stk-base" aria-hidden>
                <span className="stk-slab" />
                <span className="stk-base__label">{BASE_LABEL}</span>
              </div>

              <svg className="stk-overlay" aria-hidden focusable="false">
                <g ref={linesRef} />
                {overlay}
              </svg>
            </div>
          </div>
          {captionEl}
        </div>
        <div className="mt-6 lg:sticky lg:top-[5.75rem] lg:mt-0">{panel}</div>
      </div>
    </div>
  );
}
