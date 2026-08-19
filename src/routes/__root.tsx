import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
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

export const Route = createRootRoute({
  component: RootComponent,
});
