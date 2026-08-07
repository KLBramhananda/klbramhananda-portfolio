import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { Architecture } from "@/components/architecture";
import { GithubSection } from "@/components/github-section";
import { Contact, Footer } from "@/components/contact-footer";
import { ScrollProgress } from "@/components/scroll-progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Bramhananda K L — Software Engineer · ERPNext · Backend · AI",
      },
      {
        name: "description",
        content:
          "Portfolio of Bramhananda K L — Software Engineer building scalable enterprise software, ERPNext solutions, AI-powered procurement platforms, and modern backend systems.",
      },
      {
        property: "og:title",
        content: "Bramhananda K L — Enterprise Software Engineer",
      },
      {
        property: "og:description",
        content:
          "Enterprise software, ERPNext, AI-powered procurement platforms, and modern backend systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <SiteNav />
      <main>
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
