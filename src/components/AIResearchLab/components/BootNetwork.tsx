import { useEffect, useRef, type CSSProperties } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  Database,
  LayoutGrid,
  ScanEye,
  Server,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type NetNode = {
  name: string;
  code: string;
  icon: LucideIcon;
  x: number;
  y: number;
};

/* Outer modules orbit the AI Core hub. Slot coordinates are percentages of
   the square net scene, matching the SVG link endpoints exactly. */
const OUTER: readonly NetNode[] = [
  { name: "Perception", code: "PER", icon: ScanEye, x: 50, y: 7 },
  { name: "Memory", code: "MEM", icon: Database, x: 83, y: 20 },
  { name: "Knowledge", code: "KNW", icon: BookOpen, x: 92.5, y: 50 },
  { name: "Agent Runtime", code: "AGT", icon: Bot, x: 83, y: 80 },
  { name: "Tool System", code: "TLS", icon: Wrench, x: 50, y: 93 },
  { name: "Backend", code: "BKE", icon: Server, x: 17, y: 80 },
  { name: "ERP Interface", code: "ERP", icon: LayoutGrid, x: 7.5, y: 50 },
];

const SIDE = [
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
] as const;

const FLING = ["l", "r", "l", "r", "l", "r", "l"] as const;

/* Subtle pointer parallax — three depth layers drift a few px against the
   cursor. Disabled on coarse pointers and under reduced motion. */
function useParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
        const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
        el.style.setProperty("--pdx", dx.toFixed(3));
        el.style.setProperty("--pdy", dy.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--pdx", "0");
      el.style.setProperty("--pdy", "0");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

export function BootNetwork({ item }: { item: number }) {
  const sceneRef = useParallax();
  const coreActive = item >= 1;
  const coreSettled = item > 1;

  return (
    <div className="ai-lab-net" aria-hidden>
      <div className="ai-lab-net__scene" ref={sceneRef}>
        <span className="ai-lab-net__orbit" />
        <i className="ai-lab-net__part ai-lab-net__part--1" />
        <i className="ai-lab-net__part ai-lab-net__part--2" />
        <i className="ai-lab-net__part ai-lab-net__part--3" />
        <i className="ai-lab-net__part ai-lab-net__part--4" />
        <i className="ai-lab-net__part ai-lab-net__part--5" />
        <i className="ai-lab-net__part ai-lab-net__part--6" />

        <svg
          className="ai-lab-net__links"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {OUTER.map((n, i) => {
            const orig = i + 1;
            const done = orig < item;
            const cur = orig === item;
            const cls = [
              "ai-lab-net__link",
              cur ? "is-now" : "",
              done ? "is-on" : "",
              done || cur ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g key={n.code} className={cls}>
                <line
                  className="ai-lab-net__link-base"
                  x1="50"
                  y1="50"
                  x2={n.x}
                  y2={n.y}
                  pathLength={1}
                />
                <line
                  className="ai-lab-net__link-flow"
                  x1="50"
                  y1="50"
                  x2={n.x}
                  y2={n.y}
                  pathLength={1}
                />
                <line
                  className="ai-lab-net__link-sweep"
                  x1="50"
                  y1="50"
                  x2={n.x}
                  y2={n.y}
                  pathLength={1}
                />
              </g>
            );
          })}
        </svg>

        <div
          className={[
            "ai-lab-net__core",
            coreActive ? "is-active" : "",
            coreSettled ? "is-on" : coreActive ? "is-now" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="ai-lab-net__core-anim">
            <span className="ai-lab-net__core-halo" />
            <span className="ai-lab-net__core-ring ai-lab-net__core-ring--a" />
            <span className="ai-lab-net__core-ring ai-lab-net__core-ring--b" />
            <span className="ai-lab-net__core-ring ai-lab-net__core-ring--c" />
            <span className="ai-lab-net__core-die">
              <Brain strokeWidth={1.5} />
              <b>NRL</b>
              <i>AI CORE</i>
            </span>
            {coreActive && (
              <span className="ai-lab-net__core-pulse" key={`pulse-${item}`} />
            )}
          </span>
        </div>

        <ul className="ai-lab-net__list">
          {OUTER.map((n, i) => {
            const orig = i + 1;
            const done = orig < item;
            const cur = orig === item;
            const Icon = n.icon;
            const cls = [
              "ai-lab-net__node",
              `is-side-${SIDE[i]}`,
              `is-fling-${FLING[i]}`,
              cur ? "is-now" : "",
              done ? "is-on" : "",
              done || cur ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <li
                key={n.code}
                className={cls}
                style={{ "--x": `${n.x}%`, "--y": `${n.y}%` } as CSSProperties}
              >
                <span className="ai-lab-net__chip">
                  <span className="ai-lab-net__glow" />
                  <Icon strokeWidth={1.5} />
                  <b>{n.name}</b>
                  <i>{n.code}</i>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}