import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BkAiAssistant } from "@/components/bk-ai/bk-ai-assistant";
import { MouseTrail } from "@/components/effects/mouse-trail";
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

  return (
    <ThemeProvider>
      {!inLab && (
        <>
          <ScrollProgress />
          <SiteNav />
        </>
      )}
      <MouseTrail />
      <BkAiAssistant />
      <Outlet />
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
