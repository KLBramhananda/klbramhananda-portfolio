import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/hero";
import { CurrentlyBuilding } from "@/components/sections/currently-building";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Architecture } from "@/components/sections/architecture";
import { GithubSection } from "@/components/sections/github-section";
import { Contact, Footer } from "@/components/layout/contact-footer";
import { VideoBackground } from "@/components/effects/video-background";

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

      {/* Fixed ambient human-AI video behind all content (muted, looping,
          cover-fit) with a dark-navy overlay so the footage stays a subtle,
          readable backdrop and never competes with the interface. */}
      <VideoBackground />

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
