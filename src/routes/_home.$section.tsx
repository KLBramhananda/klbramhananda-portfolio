import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SECTIONS, SECTION_REDIRECTS } from "@/lib/sections";

const findSection = (path: string) => SECTIONS.find((s) => s.path !== "" && s.path === path);

// Section paths (`/about`, `/projects`, …) render nothing of their own:
// Home stays mounted in the `_home` layout and scrolls to the section.
export const Route = createFileRoute("/_home/$section")({
  beforeLoad: ({ params }) => {
    if (params.section === "home") throw redirect({ to: "/", replace: true });
    // Removed sections (Architecture): old shared links land on a surviving one.
    const moved = SECTION_REDIRECTS[params.section];
    if (moved) throw redirect({ to: "/$section", params: { section: moved }, replace: true });
    if (!findSection(params.section)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${findSection(params.section)?.title ?? "Home"} · Bramhananda K L` }],
  }),
  component: () => null,
});
