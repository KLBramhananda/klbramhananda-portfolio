import {
  Box,
  Boxes,
  Cloud,
  Cpu,
  Database,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

/**
 * Layout constants for the 3D digital world scene.
 *
 * The scene is a CSS 3D space centred on the AI Core (0,0,0):
 *   - x: right
 *   - y: down (screen convention, so the ground is below the core)
 *   - z: toward the viewer
 */
export const WORLD_RADIUS = 250;
export const WORLD_FLOOR_Y = 158;

export type WorldZone = {
  id: string;
  name: string;
  /** Short terminal designation used on the 3D beacon. */
  code: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: "cyan" | "blue";
  position: { x: number; y: number; z: number };
  role: string;
  interface_: string;
  detail: string;
  linkIn: string;
  linkOut: string;
};

const polar = (angleDeg: number, y: number): { x: number; y: number; z: number } => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * WORLD_RADIUS, y, z: Math.sin(a) * WORLD_RADIUS };
};

export const WORLD_ZONES: WorldZone[] = [
  {
    id: "ai-core",
    name: "Central AI Core",
    code: "CORE",
    tagline: "Reasoning & orchestration hub",
    description:
      "The synthesis point of the world. Routes models, assembles context and orchestrates the chain — every zone reports back through the core.",
    icon: Waypoints,
    accent: "cyan",
    position: { x: 0, y: 6, z: 0 },
    role: "Model routing · context assembly · orchestration",
    interface_: "CORE / SYNTHESIS NODE",
    detail: "Holds the routing and reasoning primitives the surrounding systems build on. All synthetic, no external calls.",
    linkIn: "Cloud (returning)",
    linkOut: "Data Center",
  },
  {
    id: "data-center",
    name: "Data Center",
    code: "DATA",
    tagline: "Stores, retrieval & persistence",
    description:
      "Vector and relational stores behind the lab — embeddings, sessions and facts in, distilled recall out.",
    icon: Database,
    accent: "blue",
    position: polar(18, -26),
    role: "Persistence & recall",
    interface_: "UPSERT / RETRIEVE",
    detail: "Synthetic tiers only: short-term, long-term and embedding indexes. Queries never leave the sandbox.",
    linkIn: "AI Core",
    linkOut: "Agent Room",
  },
  {
    id: "agent-room",
    name: "Agent Room",
    code: "AGNT",
    tagline: "Plan, reason & act",
    description:
      "Multi-step autonomy: planners, toolkits and guardrails turn a goal into finished work.",
    icon: Box,
    accent: "cyan",
    position: polar(76, 18),
    role: "Autonomy & planning",
    interface_: "EXECUTE / STEP",
    detail: "Agents pull context from the Data Center and act through the ERP Hub under an approval gate.",
    linkIn: "Data Center",
    linkOut: "ERP Hub",
  },
  {
    id: "erp-hub",
    name: "ERP Hub",
    code: "ERP",
    tagline: "Business process layer",
    description:
      "The operational spine — records, workflows and approvals that give agent work business context.",
    icon: Boxes,
    accent: "blue",
    position: polar(140, -52),
    role: "Workflows & approvals",
    interface_: "WORKFLOW / RECORD",
    detail: "Simulated records only. Provides the transactional context agent actions execute inside.",
    linkIn: "Agent Room",
    linkOut: "Backend",
  },
  {
    id: "backend",
    name: "Backend",
    code: "BE",
    tagline: "Services, APIs & wiring",
    description:
      "APIs, queues and integrations that connect the world's components behind a controlled boundary.",
    icon: Cpu,
    accent: "cyan",
    position: polar(214, 42),
    role: "Services & APIs",
    interface_: "REST / QUEUE",
    detail: "REST surface and worker queues. Isolated data plane — no external system egress.",
    linkIn: "ERP Hub",
    linkOut: "Cloud",
  },
  {
    id: "cloud",
    name: "Cloud",
    code: "CLD",
    tagline: "Elastic compute & egress",
    description:
      "Provisioned capacity, routing and safe egress. Everything external sits squarely behind the isolated data plane.",
    icon: Cloud,
    accent: "blue",
    position: polar(300, 112),
    role: "Capacity & routing",
    interface_: "PROVISION / ROUTE",
    detail: "Elastic layer that only egresses through policy. Simulated: no live cloud used.",
    linkIn: "Backend",
    linkOut: "AI Core (returning)",
  },
];

/**
 * The data-flow chain shown in the world: AI Core → Data → Agents →
 * ERP → Backend → Cloud. Ordered list of zone ids.
 */
export const WORLD_FLOW = [
  "ai-core",
  "data-center",
  "agent-room",
  "erp-hub",
  "backend",
  "cloud",
] as const;

/** Ordered pairs (sourceId, targetId) rendered as animated connectors. */
export const WORLD_LINKS: { from: string; to: string }[] = [
  { from: "ai-core", to: "data-center" },
  { from: "data-center", to: "agent-room" },
  { from: "agent-room", to: "erp-hub" },
  { from: "erp-hub", to: "backend" },
  { from: "backend", to: "cloud" },
];

const zoneById = new Map(WORLD_ZONES.map((zone) => [zone.id, zone]));

export function getZone(id: string | null): WorldZone | undefined {
  if (!id) return undefined;
  return zoneById.get(id);
}