import { BrainCircuit, type LucideIcon } from "lucide-react";
import { LAB_MODULES } from "./modules";

export type BuildingId = "ai-research" | "system-design" | "erp-procurement" | "production-incident";

export interface Building {
  id: BuildingId;
  name: string;
  /** Present for the three modules; the AI Research Lab has none. */
  tagline?: string;
  description: string;
  /** The lab's feature bullets, as they were on the module cards. */
  bullets: string[];
  badge: string;
  icon: LucideIcon;
  /** The AI Research Lab is the only lab with its own route. */
  route?: "/lab/ai-research";
  /** The other labs are screens inside /lab, opened by module id. */
  moduleId?: string;
  flagship?: boolean;
}

const module = (id: string) => {
  const m = LAB_MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown lab module: ${id}`);
  return m;
};

const fromModule = (id: Exclude<BuildingId, "ai-research">): Building => {
  const m = module(id);
  return {
    id,
    name: m.name,
    tagline: m.tagline,
    description: m.description,
    bullets: m.comingSoon ?? [],
    badge: m.status === "live" ? "Interactive" : "Under construction",
    icon: m.icon,
    moduleId: m.id,
  };
};

/** Display order: the flagship first (also the mobile stack order). */
export const BUILDINGS: Building[] = [
  {
    id: "ai-research",
    name: "AI Research Lab",
    description:
      "An isolated research sandbox for the AI systems I build and study - reasoning cores, perception, memory, agents, tool calling, digital worlds, and robot assistants.",
    bullets: ["9 system modules", "Synthetic · no external calls"],
    badge: "Flagship AI experience",
    icon: BrainCircuit,
    route: "/lab/ai-research",
    flagship: true,
  },
  fromModule("system-design"),
  fromModule("erp-procurement"),
  fromModule("production-incident"),
];
