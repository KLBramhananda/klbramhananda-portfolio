import { useEffect } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { BkAiAssistant } from "@/components/bk-ai/bk-ai-assistant";
import { MouseTrail } from "@/components/effects/mouse-trail";
import {
  PageTransitionProvider,
} from "@/components/effects/page-transition";
import { usePageTransition } from "@/components/effects/page-transition-context";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeProvider } from "@/lib/theme-context";

function RootComponent() {
  // The Engineering Lab is a fully isolated, self-contained environment under
  // `/lab` (and future `/lab/*` module routes). It ships its own top bar,
  // "Exit Lab" navigation, and immersive layout, so the portfolio chrome
  // (navbar + scroll progress) is intentionally skipped there. All existing
  // components are untouched — they simply don't mount on the Lab route. The
  // cursor trail stays as a viewport-level overlay on every page.
  const { pathname } = useLocation();
  const inLab = pathname.startsWith("/lab");

  // index.html carries static title/description/OG tags so crawlers that
  // don't run JS still get them. Once the router owns the head, drop those
  // static copies so each page has exactly one of each tag.
  useEffect(() => {
    document
      .querySelectorAll("[data-static-head]")
      .forEach((el) => el.remove());
  }, []);

  // The cinematic transition scales the routed page surface only — fixed page
  // chrome (nav, mouse trail, BK AI eyes, scroll progress) stays outside the
  // transformed wrapper so `position: fixed` keeps behaving normally.
  const transition = usePageTransition();
  const surfaceClass =
    transition && !transition.reduced
      ? transition.phase === "flash"
        ? "bk-surface bk-surface--out"
        : transition.phase === "reveal"
          ? "bk-surface bk-surface--in"
          : "bk-surface"
      : "bk-surface";

  return (
    <ThemeProvider>
      <HeadContent />
      <PageTransitionProvider>
        {!inLab && (
          <>
            <ScrollProgress />
            <SiteNav />
          </>
        )}
        <MouseTrail />
        <BkAiAssistant />
        <div className={surfaceClass}>
          <Outlet />
        </div>
      </PageTransitionProvider>
    </ThemeProvider>
  );
}

function NotFound() {
  return (
    <main
      id="main"
      className="relative isolate flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
    >
      <title>Page not found — Bramhananda K L</title>
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-accent">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          This page doesn&rsquo;t exist
        </h1>
        <p className="mt-4 text-base text-foreground/70">
          The link may be broken or the page may have moved. Head back to the
          portfolio or open the Engineering Lab.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
          >
            Back to portfolio
          </Link>
          <Link
            to="/lab"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-foreground/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-foreground/5"
          >
            Open the Lab
          </Link>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});
