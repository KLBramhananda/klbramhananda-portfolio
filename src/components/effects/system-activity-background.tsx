import type { CSSProperties } from "react";

interface SysNode {
  x: number;
  y: number;
  blue?: boolean;
}

interface SysLink {
  a: number;
  b: number;
  blue?: boolean;
}

interface SysCluster {
  /** Extra class for staggered drift timing so sections feel varied. */
  className: string;
  style: CSSProperties;
  nodes: SysNode[];
  links: SysLink[];
  /** Link index rendered as a slow flowing dash. */
  flow?: { link: number; delay?: string };
  /** Link indices a tiny dot travels along. */
  particle?: { link: number; duration: string; delay: string };
}

/**
 * Sparse, asymmetric clusters drawn in a local 220 x 160 space. Positioned as
 * fixed, faint layers behind the page so each viewport region (hero, projects,
 * tech stack) shows a slightly different pattern. All motion is pure CSS
 * (transform/opacity + offset-path) — no JS loop, no event listeners.
 */
const CLUSTERS: SysCluster[] = [
  {
    className: "",
    style: { left: "3%", top: "6%", width: "26%" },
    nodes: [
      { x: 30, y: 38 },
      { x: 92, y: 22, blue: true },
      { x: 150, y: 58 },
      { x: 100, y: 118, blue: true },
      { x: 194, y: 128 },
    ],
    links: [
      { a: 0, b: 1 },
      { a: 1, b: 2 },
      { a: 1, b: 3, blue: true },
      { a: 2, b: 4 },
      { a: 3, b: 4, blue: true },
    ],
    flow: { link: 2, delay: "-6s" },
    particle: { link: 1, duration: "16s", delay: "2.5s" },
  },
  {
    className: "sys-cluster--b",
    style: { left: "54%", top: "8%", width: "18%" },
    nodes: [
      { x: 44, y: 30 },
      { x: 156, y: 22, blue: true },
      { x: 112, y: 94 },
    ],
    links: [
      { a: 0, b: 2 },
      { a: 2, b: 1, blue: true },
    ],
    particle: { link: 1, duration: "19s", delay: "7s" },
  },
  {
    className: "sys-cluster--c",
    style: { left: "6%", top: "46%", width: "24%" },
    nodes: [
      { x: 40, y: 44 },
      { x: 132, y: 28 },
      { x: 200, y: 86, blue: true },
      { x: 166, y: 142 },
      { x: 60, y: 138, blue: true },
    ],
    links: [
      { a: 0, b: 2, blue: true },
      { a: 2, b: 3 },
      { a: 3, b: 4, blue: true },
      { a: 0, b: 4 },
    ],
    flow: { link: 3, delay: "-12s" },
    particle: { link: 1, duration: "17s", delay: "4.5s" },
  },
  {
    className: "sys-cluster--d",
    style: { left: "52%", top: "60%", width: "26%" },
    nodes: [
      { x: 46, y: 26 },
      { x: 162, y: 36, blue: true },
      { x: 96, y: 98 },
      { x: 188, y: 124, blue: true },
      { x: 28, y: 130 },
    ],
    links: [
      { a: 0, b: 2 },
      { a: 2, b: 3, blue: true },
      { a: 2, b: 4 },
      { a: 1, b: 3 },
    ],
    flow: { link: 2, delay: "-18s" },
    particle: { link: 0, duration: "18s", delay: "9s" },
  },
];

function Cluster({ cluster }: { cluster: SysCluster }) {
  const { nodes, links } = cluster;

  return (
    <div
      className={`sys-cluster ${cluster.className}`}
      style={cluster.style}
      aria-hidden
    >
      <svg viewBox="0 0 220 160" fill="none">
        {links.map((link, i) => {
          const a = nodes[link.a];
          const b = nodes[link.b];
          const isFlow = cluster.flow?.link === i;
          return (
            <line
              key={i}
              className={`sys-link ${isFlow ? "sys-link-flow" : ""} ${link.blue ? "sys-link--blue" : ""}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              style={isFlow ? { animationDelay: cluster.flow?.delay } : undefined}
            />
          );
        })}

        {nodes.map((node, i) => (
          <circle
            key={i}
            className={`sys-node ${node.blue ? "sys-node--blue" : ""}`}
            cx={node.x}
            cy={node.y}
            r={2}
            style={{ animationDelay: `${(i % 5) * 1.4}s` }}
          />
        ))}

        {cluster.particle && (() => {
          const a = nodes[links[cluster.particle.link].a];
          const b = nodes[links[cluster.particle.link].b];
          return (
            <circle
              className="sys-particle"
              cx={a.x}
              cy={a.y}
              r={1.5}
              style={{
                offsetPath: `path("M ${a.x} ${a.y} L ${b.x} ${b.y}")`,
                offsetDistance: "0%",
                animationDuration: cluster.particle.duration,
                animationDelay: cluster.particle.delay,
              }}
            />
          );
        })()}
      </svg>
    </div>
  );
}

export function SystemActivityBackground() {
  return (
    <div className="sys-bg" aria-hidden>
      {CLUSTERS.map((cluster, i) => (
        <Cluster key={i} cluster={cluster} />
      ))}
    </div>
  );
}
