import type { CSSProperties } from "react";

export interface TimelineNode {
  hash: string;
  slug: string;
  head: boolean;
  /** Y of the commit node, px from the top of the timeline. */
  y: number;
  projects: string[];
}

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Greedy wrap at hyphens / spaces so labels stay inside the gutter. */
function wrap(text: string, max: number) {
  const parts = text.split(/(?<=[- ])/);
  const lines: string[] = [];
  let line = "";
  for (const p of parts) {
    if (line && (line + p).trimEnd().length > max) {
      lines.push(line.trimEnd());
      line = p;
    } else {
      line += p;
    }
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

/**
 * The git-branch spine: a glowing `main` line, one commit node per role and a
 * short side branch per project. Decorative (aria-hidden) — the same facts are
 * in the role panel and details as text. Drawing is driven by ONE CSS variable,
 * `--tp` (0..1) on the parent: the line's `stroke-dashoffset`, each node/branch
 * opacity and the travelling head dot are all pure CSS formulas of it.
 */
export function GitTimeline({
  nodes,
  height,
  width,
  rem,
  reduced,
}: {
  nodes: TimelineNode[];
  height: number;
  width: number;
  rem: number;
  reduced: boolean;
}) {
  const showLabels = width > rem * 6;
  const x = rem * 1.1;
  const offset = showLabels ? rem * 1.6 : rem * 0.8;
  const fontSize = rem * 0.625;
  const maxChars = Math.max(6, Math.floor((width - x - rem * 1.6) / (fontSize * 0.7)));
  const lit = (at: number) => ({
    "--at": at,
    opacity: "clamp(0.3, calc(0.3 + (var(--tp) - var(--at)) * 140), 1)",
  });

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      style={{ fontFamily: MONO }}
    >
      {/* base rail + the line that draws itself */}
      <path d={`M${x} ${rem * 0.6} V${height}`} className="stroke-slate-900/15 dark:stroke-white/15" strokeWidth={1.5} fill="none" />
      <path
        d={`M${x} ${rem * 0.6} V${height}`}
        className="stroke-cyan-accent"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: "var(--len)",
          strokeDashoffset: "calc(var(--len) * (1 - var(--tp)))",
          filter: "drop-shadow(0 0 4px color-mix(in oklab, var(--cyan-accent) 70%, transparent))",
        }}
      />
      <text x={x + rem * 0.7} y={rem * 0.95} fontSize={fontSize} className="fill-cyan-accent" fontWeight={600}>
        main
      </text>

      {nodes.map((n, i) => {
        const next = nodes[i + 1]?.y ?? height;
        const start = n.y + rem * 6;
        const avail = next - rem * 1.5 - start;
        const seg = Math.min(rem * 3.9, avail / Math.max(n.projects.length, 1));
        const span = Math.max(seg - rem * 1.2, rem * 1.4);
        return (
          <g key={n.hash}>
            <g style={lit(n.y / height) as CSSProperties}>
              <circle cx={x} cy={n.y} r={rem * (n.head ? 0.62 : 0.5)} className="fill-cyan-accent/25" />
              <circle cx={x} cy={n.y} r={rem * 0.34} className="fill-cyan-accent" />
              {showLabels && (
                <>
                  <text x={x + rem * 1.1} y={n.y + fontSize * 0.35} fontSize={fontSize} className="fill-cyan-accent" fontWeight={600}>
                    {n.hash}
                  </text>
                  {wrap(n.slug, maxChars).map((l, k) => (
                    <text
                      key={k}
                      x={x + rem * 1.1}
                      y={n.y + fontSize * 0.35 + (k + 1) * fontSize * 1.5}
                      fontSize={fontSize}
                      className="fill-muted-foreground"
                    >
                      {l}
                    </text>
                  ))}
                </>
              )}
            </g>

            {n.projects.map((name, k) => {
              const y1 = start + k * seg;
              const y2 = y1 + span;
              const h = y2 - y1;
              const d = offset;
              const path = `M${x} ${y1} C${x} ${y1 + h * 0.2} ${x + d} ${y1 + h * 0.05} ${x + d} ${y1 + h * 0.4} L${x + d} ${y2 - h * 0.4} C${x + d} ${y2 - h * 0.05} ${x} ${y2 - h * 0.2} ${x} ${y2}`;
              const lines = wrap(name, maxChars);
              return (
                <g key={name} style={lit(y1 / height) as CSSProperties}>
                  <path d={path} className="stroke-cyan-accent/70" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                  <circle cx={x} cy={y1} r={rem * 0.2} className="fill-cyan-accent" />
                  <circle cx={x} cy={y2} r={rem * 0.2} className="fill-cyan-accent" />
                  {showLabels &&
                    lines.map((l, j) => (
                      <text
                        key={j}
                        x={x + d + rem * 0.7}
                        y={(y1 + y2) / 2 + fontSize * 0.35 + (j - (lines.length - 1) / 2) * fontSize * 1.4}
                        fontSize={fontSize}
                        className="fill-foreground/80"
                      >
                        {l}
                      </text>
                    ))}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* light pulse at the head of the drawn line (follows the same variable) */}
      {!reduced && (
        <circle
          cx={x}
          cy={rem * 0.6}
          r={rem * 0.3}
          className="fill-white"
          style={{
            transform: "translateY(calc(var(--tp) * (var(--len) - 1.3rem)))",
            filter: "drop-shadow(0 0 6px var(--cyan-accent)) drop-shadow(0 0 12px var(--cyan-accent))",
            opacity: "clamp(0, calc(var(--tp) * 40), 1)",
          }}
        />
      )}
    </svg>
  );
}
