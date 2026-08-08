import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/hero";
import { CurrentlyBuilding } from "@/components/currently-building";
import { About } from "@/components/about";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { Architecture } from "@/components/architecture";
import { GithubSection } from "@/components/github-section";
import { Contact, Footer } from "@/components/contact-footer";
import { SystemActivityBackground } from "@/components/system-activity-background";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Bramhananda K L — Software Engineer · Full Stack · ERPNext · SAP BTP · AI",
      },
      {
        name: "description",
        content:
          "Portfolio of Bramhananda K L — Full Stack Engineer building scalable enterprise software, ERPNext solutions, AI-powered procurement platforms, and SAP BTP integrations.",
      },
      {
        property: "og:title",
        content: "Bramhananda K L — Full Stack Enterprise Software Engineer",
      },
      {
        property: "og:description",
        content:
          "Full stack, AI, ERPNext, and SAP BTP — enterprise software that ships.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      {/* Fixed ambient gradient layer (composited once — no per-frame repaint) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-ambience"
      />

      {/* Faint technical network behind all content (CSS-animated, no JS loop) */}
      <SystemActivityBackground />

      <main id="main">
        <CurrentlyBuilding />
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Architecture />
        <GithubSection />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
