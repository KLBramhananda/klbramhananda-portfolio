import { skills } from "@/data/skills";

export type LayerId = "frontend" | "api" | "services" | "data" | "cloud" | "ai" | "enterprise";
export type FilterId = "all" | LayerId;

export interface BlockDef {
  /** Skill key (existing node) or Skills-data label (`extra`). */
  key: string;
  /** Not an existing Tech Stack node: its card shows only name, layer and "Used in". */
  extra: boolean;
}

export interface LayerDef {
  id: LayerId;
  title: string;
  /** Filter chip label. */
  filter: string;
  tower: boolean;
  blocks: BlockDef[];
}

const own = (key: string): BlockDef => ({ key, extra: false });
const plus = (key: string): BlockDef => ({ key, extra: true });

/** Layers of the main stack, top to bottom. */
const MAIN: LayerDef[] = [
  { id: "frontend", title: "Frontend", filter: "Frontend", tower: false, blocks: [own("React"), own("TypeScript"), own("Vite"), own("Tailwind")] },
  { id: "api", title: "API", filter: "API", tower: false, blocks: [own("REST APIs"), plus("API Gateway"), plus("Node.js")] },
  {
    id: "services",
    title: "Services",
    filter: "Services",
    tower: false,
    blocks: [own("Python"), plus("Spring Boot"), plus("FastAPI"), plus("Kafka"), plus("Microservices")],
  },
  { id: "data", title: "Data", filter: "Data", tower: false, blocks: [own("PostgreSQL"), plus("MongoDB"), plus("MySQL")] },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    filter: "Cloud & DevOps",
    tower: false,
    blocks: [own("Cloud"), own("Docker"), own("Linux"), own("Git"), plus("AWS"), plus("CI/CD")],
  },
];

/** The two side towers. */
const TOWERS: LayerDef[] = [
  { id: "ai", title: "AI", filter: "AI", tower: true, blocks: [own("AI"), own("MCP"), plus("LLM Integration"), plus("RAG Workflows")] },
  { id: "enterprise", title: "Enterprise", filter: "Enterprise", tower: true, blocks: [own("ERPNext"), own("Frappe"), own("SAP BTP")] },
];

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  ...[...MAIN, ...TOWERS].map((l) => ({ id: l.id, label: l.filter })),
];

/** Label under the stack: the text that used to sit on the central hub. */
export const BASE_LABEL = "Enterprise Engineering";

export interface StackModel {
  layers: LayerDef[];
  towers: LayerDef[];
  /** `+` blocks left out because the Skills data has no such skill. */
  skipped: string[];
}

/**
 * The layer model. Existing nodes are kept when they exist in `skills`; a `+`
 * block is kept only if its label is a skill in the Skills section's data
 * (`skillLabels`).
 */
export function buildStack(skillLabels: ReadonlySet<string>): StackModel {
  const skipped: string[] = [];
  const keep = (l: LayerDef): LayerDef => ({
    ...l,
    blocks: l.blocks.filter((b) => {
      if (!b.extra) return Boolean(skills[b.key]);
      if (skillLabels.has(b.key)) return true;
      skipped.push(b.key);
      return false;
    }),
  });
  return { layers: MAIN.map(keep), towers: TOWERS.map(keep), skipped };
}

export function layerOf(key: string, model: StackModel): LayerDef | undefined {
  return [...model.layers, ...model.towers].find((l) => l.blocks.some((b) => b.key === key));
}
