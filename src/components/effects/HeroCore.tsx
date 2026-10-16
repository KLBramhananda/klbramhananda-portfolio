import {
  Component,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { useReducedMotion } from "framer-motion";
import { skills } from "@/data/skills";
import { detectTier, hasWebGL2, isLowEnd } from "../intro/intro-bridge";
import type { CoreScene, CoreWorld } from "./core-scene";

export interface CoreHandle {
  setWorld(world: CoreWorld): void;
  /** Push-in before navigating; resolves in ~500 ms (immediately if static). */
  zoom(): Promise<void>;
}

// Labels come from the skills already shown on the site; tooltips reuse each
// skill's own "my work" line.
const LABEL_KEYS = [
  "React",
  "TypeScript",
  "Python",
  "ERPNext",
  "SAP BTP",
  "AI",
  "REST APIs",
  "Docker",
  "Frappe",
  "Cloud",
] as const;

const WORLD_ACCENT: Record<CoreWorld, string> = {
  neutral: "var(--cyan-accent)",
  eng: "var(--cyan-accent)",
  ai: "var(--ai-violet)",
};

/**
 * Static label spots for the SVG fallback (percent offsets from the centre of
 * the host): alternating outer / inner ellipses, 36° apart, so chips never
 * collide even in a wide, short host.
 */
const FALLBACK_SPOTS = LABEL_KEYS.map((_, i) => {
  const outer = i % 2 === 0;
  const a = ((outer ? i / 2 : (i - 1) / 2) * 72 + (outer ? 0 : 36)) * (Math.PI / 180);
  const rx = outer ? 42 : 30;
  const ry = outer ? 40 : 24;
  return { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
});

function CoreInner({ handleRef, className }: { handleRef?: Ref<CoreHandle>; className: string }) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sceneRef = useRef<CoreScene | null>(null);
  const [mode, setMode] = useState<"svg" | "webgl">("svg");

  useImperativeHandle(
    handleRef,
    () => ({
      setWorld(world) {
        sceneRef.current?.setWorld(world);
        hostRef.current?.style.setProperty("--core-accent", WORLD_ACCENT[world]);
      },
      zoom() {
        if (sceneRef.current) return sceneRef.current.zoom();
        const el = svgRef.current;
        if (reduced || !el) return Promise.resolve();
        el.style.transform = "scale(1.4)";
        el.style.opacity = "0.2";
        return new Promise<void>((resolve) => window.setTimeout(resolve, 500));
      },
    }),
    [reduced],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced || isLowEnd() || !hasWebGL2()) return;
    let cancelled = false;
    let scene: CoreScene | null = null;
    const tier = detectTier();
    // A narrow viewport has no intro tier but can still run a small Core.
    const points = tier === "high" ? 6000 : tier === "mid" ? 2500 : 1500;

    const start = async () => {
      try {
        const mod = await import("./core-scene");
        if (cancelled) return;
        const labels = labelRefs.current.filter((el): el is HTMLButtonElement => el !== null);
        const created = await mod.createCore({
          host,
          points,
          labels,
          onFail: () => {
            scene?.dispose();
            scene = null;
            sceneRef.current = null;
            setMode("svg");
          },
        });
        if (cancelled) {
          created.dispose();
          return;
        }
        scene = created;
        sceneRef.current = created;
        setMode("webgl");
      } catch {
        if (!cancelled) setMode("svg");
      }
    };

    // After first paint, when the browser is idle — never blocks the H1.
    let idleId = 0;
    let timerId = 0;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => void start(), { timeout: 1500 });
    } else {
      timerId = window.setTimeout(() => void start(), 300);
    }
    return () => {
      cancelled = true;
      if (idleId) window.cancelIdleCallback(idleId);
      window.clearTimeout(timerId);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [reduced]);

  return (
    <div
      ref={hostRef}
      data-core
      className={`relative mx-auto h-[230px] w-full max-w-[40.625rem] touch-pan-y select-none sm:h-[260px] lg:aspect-square lg:h-auto lg:w-[min(100%,40.625rem,calc(100svh-11rem))] ${className}`}
      style={{ "--core-accent": "var(--cyan-accent)" } as CSSProperties}
    >
      <div
        ref={svgRef}
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-500 ${
          mode === "webgl" ? "opacity-0" : "opacity-100"
        }`}
      >
        <FallbackSphere animated={!reduced} />
      </div>

      {LABEL_KEYS.map((key, i) => {
        const skill = skills[key];
        if (!skill) return null;
        const spot = FALLBACK_SPOTS[i];
        return (
          <button
            key={key}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            className="group absolute top-1/2 left-1/2 z-10 whitespace-nowrap glass rounded-full px-2.5 py-1 text-[0.625rem] font-medium text-foreground/90 transition-colors hover:border-cyan-accent/50 hover:text-foreground focus-visible:border-cyan-accent/60"
            style={
              mode === "webgl"
                ? undefined
                : {
                    left: `${50 + spot.x}%`,
                    top: `${50 + spot.y}%`,
                    transform: "translate(-50%, -50%)",
                    opacity: 1,
                  }
            }
          >
            {skill.name}
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 w-52 -translate-x-1/2 rounded-lg glass-strong px-2.5 py-1.5 text-left text-[0.625rem] leading-snug font-normal whitespace-normal text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {skill.myWork}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** SVG Core: glowing sphere outline and two slowly turning rings (CSS only). */
function FallbackSphere({ animated }: { animated: boolean }) {
  const spin = animated ? "core-spin" : "";
  return (
    <div className="relative h-[56%] w-[56%]" style={{ perspective: "700px" }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <radialGradient id="core-fill" cx="42%" cy="38%" r="70%">
            <stop offset="0%" style={{ stopColor: "var(--core-accent)", stopOpacity: 0.35 }} />
            <stop offset="100%" style={{ stopColor: "var(--core-accent)", stopOpacity: 0.04 }} />
          </radialGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="url(#core-fill)"
          strokeWidth="1.5"
          style={{
            stroke: "var(--core-accent)",
            transition: "stroke 0.7s ease",
            filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--core-accent) 60%, transparent))",
          }}
        />
        <g fill="none" strokeWidth="0.8" style={{ stroke: "var(--core-accent)", opacity: 0.35 }}>
          <ellipse cx="100" cy="100" rx="82" ry="30" />
          <ellipse cx="100" cy="100" rx="30" ry="82" />
        </g>
      </svg>
      {[1.7, 2.1].map((scale, i) => (
        <div
          key={scale}
          className={`absolute inset-0 rounded-full border ${spin}`}
          style={
            {
              borderColor: "color-mix(in oklab, var(--core-accent) 45%, transparent)",
              transition: "border-color 0.7s ease",
              transform: `scale(${scale}) rotateX(${i === 0 ? 72 : 64}deg) rotateZ(${i === 0 ? 20 : -35}deg)`,
              animationDuration: i === 0 ? "48s" : "70s",
              animationDirection: i === 0 ? "normal" : "reverse",
              "--core-scale": scale,
              "--core-tilt": `${i === 0 ? 72 : 64}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

class CoreBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    // The hero must never break: if the Core itself fails to render, drop it.
    return this.state.failed ? null : this.props.children;
  }
}

export function HeroCore({ ref, className = "" }: { ref?: Ref<CoreHandle>; className?: string }) {
  return (
    <CoreBoundary>
      <CoreInner handleRef={ref} className={className} />
    </CoreBoundary>
  );
}
