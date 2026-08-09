import { createRootRoute, Outlet } from "@tanstack/react-router";
import { MouseTrail } from "@/components/effects/mouse-trail";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SiteNav } from "@/components/layout/site-nav";

export const Route = createRootRoute({
  component: () => (
    <>
      {/* Global chrome, mounted once at the root layout so it persists across
          every page. The cursor trail is a viewport-level overlay rendered
          above all page content and interactive UI. */}
      <ScrollProgress />
      <SiteNav />
      <MouseTrail />
      <Outlet />
    </>
  ),
});
