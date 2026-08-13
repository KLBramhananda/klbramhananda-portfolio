import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/ai-research")({
  head: () => ({
    meta: [
      {
        title: "BK AI Research Lab — Foundations of Intelligence",
      },
      {
        name: "description",
        content:
          "BK AI Research Lab — an isolated research sandbox for AI systems: reasoning cores, perception, memory, agents, tool calling, digital worlds, experiment chambers, robot assistants, and voice interaction.",
      },
    ],
  }),
  // The AI Research Lab is fully code-split behind this dynamic import. It
  // never ships in the portfolio or Engineering Lab bundles and only loads
  // when a visitor actually opens /lab/ai-research.
  component: lazyRouteComponent(
    () => import("@/components/AIResearchLab/AIResearchLab"),
    "AIResearchLab",
  ),
});