import { AI_RESEARCH_MODULES, type AIResearchModule } from "./modules";

export type RoomSlug =
  | "digital-world"
  | "talk-to-ai"
  | "core"
  | "perception"
  | "memory"
  | "tool-calling"
  | "experiments";

export interface Room {
  /** 1-based; also the keyboard shortcut. */
  n: number;
  slug: RoomSlug;
  name: string;
  /** The matching module card: its text becomes the room header. */
  module: AIResearchModule;
}

const DEFS: { slug: RoomSlug; name: string; moduleId: string }[] = [
  { slug: "digital-world", name: "Digital World", moduleId: "ai-digital-world" },
  { slug: "talk-to-ai", name: "Talk to AI", moduleId: "voice-interaction" },
  { slug: "core", name: "Central AI Core", moduleId: "ai-core" },
  { slug: "perception", name: "Perception", moduleId: "ai-perception" },
  { slug: "memory", name: "Memory", moduleId: "ai-memory" },
  { slug: "tool-calling", name: "Tool Calling", moduleId: "ai-tool-calling" },
  { slug: "experiments", name: "Experiment Chamber", moduleId: "ai-experiment-chamber" },
];

export const ROOMS: Room[] = DEFS.map((d, i) => {
  const module = AI_RESEARCH_MODULES.find((m) => m.id === d.moduleId);
  if (!module) throw new Error(`Unknown AI module: ${d.moduleId}`);
  return { n: i + 1, slug: d.slug, name: d.name, module };
});

/** Modules without a room (AI Agents, Robot Assistant): listed in the side rail. */
export const MORE_MODULES: AIResearchModule[] = AI_RESEARCH_MODULES.filter(
  (m) => !ROOMS.some((r) => r.module.id === m.id),
);

export const roomBySlug = (slug: string | null | undefined) => ROOMS.find((r) => r.slug === slug) ?? null;

export const statusLabel = (m: AIResearchModule) => (m.status === "live" ? "Interactive" : "Foundation");

export const GATEWAY_KEY = "bk:ai:gateway:v1";
export const ROOM_PATH = "/lab/ai-research";

export function markGatewaySeen() {
  try {
    window.sessionStorage.setItem(GATEWAY_KEY, "1");
  } catch {
    /* private mode: the gateway simply shows again next visit */
  }
}
