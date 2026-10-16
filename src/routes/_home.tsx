import { useEffect } from "react";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Hero } from "@/components/sections/hero";
import { CurrentlyBuilding } from "@/components/sections/currently-building";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Architecture } from "@/components/sections/architecture";
import { GithubSection } from "@/components/sections/github-section";
import { Contact, Footer } from "@/components/layout/contact-footer";
import { IntroGate } from "@/components/intro/IntroGate";
import { TerminalLauncher } from "@/components/layout/TerminalLauncher";
import {
  currentSectionId,
  lockSpy,
  scrollToSection,
  sectionForPath,
  spyState,
  unlockSpy,
} from "@/lib/sections";

export const Route = createFileRoute("/_home")({
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
    // Every section path is the same page: canonicalize to `/`.
    links: [{ rel: "canonical", href: `${window.location.origin}/` }],
  }),
  component: Index,
});

// The first path-driven scroll of a page load (a deep link) lands instantly.
let deepLinkHandled = false;

function Index() {
  const pathname = useLocation({ select: (l) => l.pathname });

  // Scroll to the section named by the path when it changes from outside the
  // page (deep link, Back/Forward, a link from another route). Scroll-spy and
  // nav clicks lock the spy and scroll themselves, so they never re-scroll here.
  useEffect(() => {
    const section = sectionForPath(pathname);
    if (!section) return;
    const first = !deepLinkHandled;
    deepLinkHandled = true;
    if (spyState.locked && !first) return;
    if (currentSectionId() === section.id) {
      if (first) unlockSpy();
      return;
    }
    lockSpy(1200);
    if (!first) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollToSection(section.id, reduced ? "auto" : "smooth");
      return;
    }
    // Deep link: scroll once layout has settled, then re-aim a few times while
    // late-loading content (lazy images) shifts the page, until the visitor
    // scrolls on their own. The spy stays locked for the whole settling window.
    lockSpy(2400, true);
    let landed = 0;
    const land = () => {
      scrollToSection(section.id, "instant");
      landed = window.scrollY;
    };
    requestAnimationFrame(() => requestAnimationFrame(land));
    for (const ms of [450, 1000, 1700]) {
      window.setTimeout(() => {
        if (Math.abs(window.scrollY - landed) < 4) land();
      }, ms);
    }
  }, [pathname]);

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <IntroGate />
      <TerminalLauncher />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <div aria-hidden className="page-bg" />

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
      <Outlet />
    </div>
  );
}
