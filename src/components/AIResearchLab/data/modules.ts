import {
  AudioWaveform,
  Bot,
  BotMessageSquare,
  Brain,
  BrainCircuit,
  Globe,
  ScanEye,
  TestTubes,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AIResearchModule = {
  id: string;
  name: string;
  /** Short terminal designation used on the core ring nodes. */
  code: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: "cyan" | "blue";
  /** What the module will contain once it moves past its foundation. */
  comingSoon: string[];
  /** Modules with an interactive preview are marked live instead of foundation. */
  status?: "live" | "foundation";
};

export const AI_RESEARCH_MODULES: AIResearchModule[] = [
  {
    id: "ai-core",
    name: "AI Core",
    code: "CORE",
    tagline: "Reasoning & model foundations",
    description:
      "The engine room — model routing, context assembly, reasoning pipelines, and the primitives every other AI module builds on.",
    icon: BrainCircuit,
    accent: "cyan",
    comingSoon: [
      "Model routing & fallbacks",
      "Context & prompt assembly",
      "Reasoning pipeline explorer",
    ],
  },
  {
    id: "ai-perception",
    name: "AI Perception",
    code: "PERC",
    tagline: "Sight, sound & world sensing",
    description:
      "Turn raw input into structure — vision, audio, and multi-modal understanding that feed the rest of the lab.",
    icon: ScanEye,
    accent: "blue",
    comingSoon: [
      "Vision & image understanding",
      "Audio & speech input",
      "Multi-modal fusion",
    ],
  },
  {
    id: "ai-memory",
    name: "AI Memory",
    code: "MEM",
    tagline: "Short-term & long-term recall",
    description:
      "Experiment with how an AI remembers — conversations, embeddings, retrieval, and persistent knowledge stores.",
    icon: Brain,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Consolidation to long-term store",
      "Embedding & vector index",
      "Cross-module recall links",
    ],
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    code: "AGNT",
    tagline: "Planned, multi-step autonomy",
    description:
      "Compose agents that plan, reason, and act toward goals — with guardrails, toolkits, and human oversight.",
    icon: Bot,
    accent: "blue",
    comingSoon: [
      "Agent orchestration",
      "Plan & goal tracking",
      "Multi-agent collaboration",
    ],
  },
  {
    id: "ai-tool-calling",
    name: "AI Tool Calling",
    code: "TOOL",
    tagline: "Structured tool invocation",
    description:
      "Teach models to call external tools — schemas, arguments, results, and the feedback loop that keeps them on rails.",
    icon: Wrench,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Tool schema builder",
      "Multi-tool orchestration",
      "Function-calling sandbox",
    ],
  },
  {
    id: "ai-digital-world",
    name: "AI Digital World",
    code: "WRLD",
    tagline: "Simulated environments",
    description:
      "A synthetic world where AI agents observe, act, and learn in software — safe sandboxes before anything touches reality.",
    icon: Globe,
    accent: "blue",
    status: "live",
    comingSoon: [
      "Simulated environment",
      "Observation & action loop",
      "Agent behavior logs",
    ],
  },
  {
    id: "ai-experiment-chamber",
    name: "AI Experiment Chamber",
    code: "EXPT",
    tagline: "Controlled AI experiments",
    description:
      "Run, compare, and replay AI experiments — prompts, settings, and outputs side by side under repeatable conditions.",
    icon: TestTubes,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Run & replay experiments",
      "Side-by-side comparisons",
      "Metrics & trial logs",
    ],
  },
  {
    id: "robot-assistant",
    name: "Robot Assistant",
    code: "ROBO",
    tagline: "Embodied assistance",
    description:
      "The assistant layer that ties AI capabilities to practical help — an autonomous helper with personality and guardrails.",
    icon: BotMessageSquare,
    accent: "blue",
    comingSoon: [
      "Assistant behaviors",
      "Task execution loop",
      "Guardrail & safety layer",
    ],
  },
  {
    id: "voice-interaction",
    name: "Voice Interaction",
    code: "VOX",
    tagline: "Spoken input & output",
    description:
      "A voice layer for the lab — speech in, speech out, and the conversation orchestration that makes hands-free use possible.",
    icon: AudioWaveform,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Speech-to-text",
      "Text-to-speech",
      "Voice conversation loop",
    ],
  },
];