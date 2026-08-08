import { Network } from "lucide-react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, FocusEvent as ReactFocusEvent } from "react";
import { skills } from "@/data/skills";

interface TechConstellationProps {
  activeKey: string | null;
  relatedKeys: Set<string> | null;
  popupId: string;
  onOpen: (key: string, el: HTMLElement) => void;
  onLeave: () => void;
  onClick: (key: string, el: HTMLElement) => void;
}

const VIEW_W = 1000;
const VIEW_H = 600;
const CORE = { x: VIEW_W / 2, y: VIEW_H / 2 };

interface NodeDef {
  key: string;
  x: number;
  y: number;
}

/**
 * Static, balanced constellation: 16 technology nodes linked to the
 * "Enterprise Engineering" core. Positions are fixed percentages mapped onto a
 * 1000 x 600 viewBox, so the network scales cleanly at any width with no JS
 * measurement and no continuous layout work.
 */
const NODES: NodeDef[] = [
  { key: "AI", x: 500.0, y: 62.7 },
  { key: "MCP", x: 631.0, y: 107.9 },
  { key: "Cloud", x: 768.3, y: 137.0 },
  { key: "Linux", x: 826.5, y: 217.8 },
  { key: "Docker", x: 901.8, y: 300.0 },
  { key: "Git", x: 809.3, y: 377.8 },
  { key: "SAP BTP", x: 773.6, y: 466.2 },
  { key: "ERPNext", x: 633.8, y: 496.3 },
  { key: "Frappe", x: 500.0, y: 539.6 },
  { key: "Python", x: 367.6, y: 494.2 },
  { key: "PostgreSQL", x: 229.1, y: 464.6 },
  { key: "REST APIs", x: 187.2, y: 378.7 },
  { key: "Tailwind", x: 102.0, y: 300.0 },
  { key: "Vite", x: 173.5, y: 217.8 },
  { key: "TypeScript", x: 231.7, y: 137.0 },
  { key: "React", x: 363.3, y: 99.6 },
];

/** A few links carry a slow traveling particle (subtle, non-rotational). */
const PARTICLE_LINKS = ["ERPNext", "React", "MCP", "Docker"];

const PARTICLES = PARTICLE_LINKS.map((key, i) => {
  const node = NODES.find((n) => n.key === key)!;
  return {
    key,
    duration: [9, 10.5, 8, 9.5][i],
    delay: [0.8, 3.2, 5.6, 7.4][i],
    midX: (CORE.x + node.x) / 2,
    midY: (CORE.y + node.y) / 2,
    path: `path("M ${CORE.x} ${CORE.y} L ${node.x} ${node.y}")`,
  };
});

const dotDelay = (i: number) => `${(i % 6) * 0.65}s`;
const flowDelay = (i: number) => `${(i % 8) * 0.6}s`;

interface TechNodeButtonProps {
  node: NodeDef;
  index: number;
  className: string;
  style?: CSSProperties;
  activeKey: string | null;
  popupId: string;
  onOpen: (key: string, el: HTMLElement) => void;
  onLeave: () => void;
  onClick: (key: string, el: HTMLElement) => void;
}

function TechNodeButton({
  node,
  index,
  className,
  style,
  activeKey,
  popupId,
  onOpen,
  onLeave,
  onClick,
}: TechNodeButtonProps) {
  const skill = skills[node.key];
  if (!skill) return null;
  const isActive = activeKey === node.key;
  const handleMouseEnter = (e: ReactMouseEvent<HTMLButtonElement>) =>
    onOpen(node.key, e.currentTarget);
  const handleFocus = (e: ReactFocusEvent<HTMLButtonElement>) =>
    onOpen(node.key, e.currentTarget);
  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) =>
    onClick(node.key, e.currentTarget);

  return (
    <button
      type="button"
      data-skill={node.key}
      className={className}
      style={style}
      aria-label={`View details about ${skill.name}`}
      aria-expanded={isActive}
      aria-controls={isActive ? popupId : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onFocus={handleFocus}
      onBlur={onLeave}
      onClick={handleClick}
    >
      <span
        aria-hidden
        className="network-node__dot"
        style={{ backgroundColor: skill.color, animationDelay: dotDelay(index) }}
      />
      <span>{skill.key}</span>
    </button>
  );
}

export function TechConstellation({
  activeKey,
  relatedKeys,
  popupId,
  onOpen,
  onLeave,
  onClick,
}: TechConstellationProps) {
  const toneFor = (key: string): string => {
    if (activeKey === null) return "";
    if (activeKey === key) return "is-active";
    if (relatedKeys?.has(key)) return "is-related";
    return "is-dimmed";
  };

  const core = (
    <div className="network-core">
      <span className="network-core__ring" aria-hidden />
      <Network className="h-5 w-5 text-cyan-accent" aria-hidden />
      <span>Enterprise Engineering</span>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet constellation */}
      <div
        className="tech-network hidden md:block"
        role="group"
        aria-label="Engineering technology network"
      >
        <svg
          className="tech-network__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          aria-hidden="true"
          focusable="false"
        >
          {NODES.map((node, i) => {
            const tone = toneFor(node.key);
            return (
              <g key={node.key}>
                <line
                  className={`tech-link ${tone}`}
                  x1={CORE.x}
                  y1={CORE.y}
                  x2={node.x}
                  y2={node.y}
                />
                <line
                  className={`tech-link-flow ${tone}`}
                  x1={CORE.x}
                  y1={CORE.y}
                  x2={node.x}
                  y2={node.y}
                  style={{ animationDelay: flowDelay(i) }}
                />
              </g>
            );
          })}
          {PARTICLES.map((p) => (
            <circle
              key={p.key}
              className="node-particle"
              cx={p.midX}
              cy={p.midY}
              r={2.2}
              style={{
                offsetPath: p.path,
                offsetDistance: "0%",
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </svg>

        <div className="tech-network__core">{core}</div>

        {NODES.map((node, i) => (
          <TechNodeButton
            key={node.key}
            node={node}
            index={i}
            className={`network-node ${toneFor(node.key)}`}
            style={{ left: `${node.x / 10}%`, top: `${node.y / 6}%` }}
            activeKey={activeKey}
            popupId={popupId}
            onOpen={onOpen}
            onLeave={onLeave}
            onClick={onClick}
          />
        ))}
      </div>

      {/* Mobile compact network */}
      <div className="md:hidden">
        <div className="flex justify-center">{core}</div>
        <div
          className="mt-6 flex flex-wrap justify-center gap-2.5"
          role="group"
          aria-label="Engineering technology network"
        >
          {NODES.map((node, i) => (
            <TechNodeButton
              key={node.key}
              node={node}
              index={i}
              className={`tech-chip ${toneFor(node.key)}`}
              activeKey={activeKey}
              popupId={popupId}
              onOpen={onOpen}
              onLeave={onLeave}
              onClick={onClick}
            />
          ))}
        </div>
      </div>
    </>
  );
}
