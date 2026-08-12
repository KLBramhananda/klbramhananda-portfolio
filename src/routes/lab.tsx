import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      {
        title: "BK Engineering Lab — Interactive Enterprise Systems Playground",
      },
      {
        name: "description",
        content:
          "BK Engineering Lab — a hands-on playground for enterprise systems: system design, ERP/procurement workflows, and production incident simulations.",
      },
    ],
  }),
  // The entire Lab (shell, home screen, module placeholders, lab-only styles)
  // is code-split behind this dynamic import. Nothing Lab-related ships in the
  // portfolio bundle or runs until a visitor actually opens /lab.
  component: lazyRouteComponent(
    () => import("@/components/EngineeringLab/EngineeringLab"),
    "EngineeringLab",
  ),
});