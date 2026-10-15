import { useEffect, useRef, useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Menu, X, FlaskConical } from "lucide-react";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { SystemThemeToggle } from "@/components/theme/SystemThemeToggle";
import {
  SECTIONS,
  currentSectionId,
  lockSpy,
  pathForSection,
  scrollToSection,
  sectionForId,
  sectionForPath,
  spyLineY,
  spyState,
  unlockSpy,
} from "@/lib/sections";

const links = (["home", "about", "experience", "projects", "skills", "tech", "architecture"] as const).map(
  (id) => {
    const s = sectionForId(id)!;
    return { id, label: s.title, href: pathForSection(s) };
  },
);
const NAV_IDS = new Set<string>(links.map((l) => l.id));

// Fallback length for holding a clicked nav tag active while the browser
// smooth-scrolls. `scrollend` releases it the moment the scroll really stops;
// this timeout only covers browsers without scrollend support.
const NAV_LOCK_MS = 1200;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(
    () => sectionForPath(window.location.pathname)?.id ?? "home",
  );
  const rafRef = useRef<number | null>(null);
  const router = useRouter();
  const onHome = useRouterState({
    select: (st) => st.matches.some((m) => m.routeId === "/_home"),
  });

  // Track whether the page has scrolled past the top (rAF-throttled,
  // guarded boolean so React only re-renders when the value actually flips).
  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const v = window.scrollY > 12;
      setScrolled((prev) => (prev === v ? prev : v));
    };
    const onScroll = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Section links are real paths (`/about`, …). A plain click scrolls to the
  // section's heading with a consistent offset below the fixed navbar and
  // pushes the path without remounting Home; modified clicks (Ctrl/Cmd, middle
  // button, new tab) keep the browser's native behaviour. From another route
  // (e.g. the Lab) the click is a normal router navigation to Home.
  useEffect(() => {
    const goTo = (id: string, replace: boolean) => {
      const s = sectionForId(id);
      if (!s) return Promise.resolve();
      if (s.path === "") {
        return router.navigate({ to: "/", replace, resetScroll: false });
      }
      return router.navigate({
        to: "/$section",
        params: { section: s.path },
        replace,
        resetScroll: false,
      });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.(
        'a[href^="/"]',
      ) as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.search || url.hash) return;
      const section = sectionForPath(url.pathname);
      if (!section) return;

      e.preventDefault();
      if (!document.getElementById(section.id)) {
        void goTo(section.id, false);
        return;
      }

      // The scroll is the only thing that moves the page: the spy is locked
      // until it settles, so intermediate sections never flash another tag or
      // rewrite the URL.
      lockSpy(NAV_LOCK_MS);
      // Push the entry first: the browser stores the scroll position of the
      // page being left when the entry is pushed, so scrolling afterwards keeps
      // Back returning to where the previous entry actually was.
      const pushed =
        sectionForPath(router.state.location.pathname)?.id !== section.id
          ? goTo(section.id, false)
          : Promise.resolve();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      void pushed.finally(() => scrollToSection(section.id, reduced ? "auto" : "smooth"));
      if (anchor.closest("header") && NAV_IDS.has(section.id)) setActive(section.id);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  // Scroll-spy. An IntersectionObserver watches a slim band just below the
  // fixed navbar, so a section activates the moment its top clears the header —
  // scrolling down or back up. It only fires on band crossings, never per
  // scroll frame. When the active section changes, the URL follows via a
  // `replace` navigation (no scroll reset), so Back history isn't flooded.
  //
  // Untracked navbar regions leave every tag unhighlighted. Only runs while the
  // Home layout is mounted.
  useEffect(() => {
    if (!onHome) return;
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    let observer: IntersectionObserver | null = null;

    // `syncUrl` is false for the setup pass: an effect re-run (e.g. mid-Back
    // navigation) must never rewrite a URL the router is still moving to.
    const sync = (syncUrl = true) => {
      if (spyState.locked) return;
      const id = currentSectionId();
      if (!id) return;
      setActive(NAV_IDS.has(id) ? id : null);
      if (!syncUrl) return;
      if (sectionForPath(router.state.location.pathname)?.id === id) return;
      const s = sectionForId(id);
      if (!s) return;
      if (s.path === "") {
        void router.navigate({ to: "/", replace: true, resetScroll: false });
      } else {
        void router.navigate({
          to: "/$section",
          params: { section: s.path },
          replace: true,
          resetScroll: false,
        });
      }
    };

    const connect = () => {
      observer?.disconnect();
      const marginBottom = Math.max(0, window.innerHeight - spyLineY());
      // The observer's initial delivery is not a band crossing: highlight only.
      let primed = false;
      observer = new IntersectionObserver(() => {
        sync(primed);
        primed = true;
      }, {
        root: null,
        rootMargin: `0px 0px -${marginBottom}px 0px`,
        threshold: 0,
      });
      sections.forEach((s) => observer!.observe(s));
    };

    const onScrollEnd = () => {
      if (!spyState.locked || performance.now() < spyState.holdUntil) return;
      unlockSpy();
      // The clicked/deep-linked section stays active until the visitor scrolls
      // into another one; sync once so the tag matches where the scroll landed.
      sync();
    };

    connect();
    sync(false);

    window.addEventListener("scrollend", onScrollEnd, { passive: true });
    window.addEventListener("resize", connect);

    return () => {
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", connect);
      observer?.disconnect();
    };
  }, [onHome, router]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          aria-label="Primary"
          className={`glass-nav flex items-center justify-between rounded-2xl px-4 py-3 transition-shadow duration-300 ${
            scrolled ? "shadow-[var(--shadow-nav)]" : ""
          }`}
        >
          <a
            href="/"
            className="group flex items-center gap-2 rounded-lg"
            aria-label="Bramhananda K L — back to top"
          >
            <img
              src={bkLogo}
              alt="BK logo"
              width={1254}
              height={1254}
              className="h-8 w-8 shrink-0 rounded-lg object-cover"
            />
            <span className="font-semibold tracking-tight text-foreground whitespace-nowrap">
              Bramha<span className="text-muted-foreground">nanda K L</span>
            </span>
          </a>

          <ul className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={l.href}
                    aria-current={isActive ? "true" : undefined}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-slate-900/5 text-foreground dark:bg-white/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-slate-900/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {/* Theme toggle — global preference, shared with the lab shells.
                The icon shows the ACTION (Sun = switch to light on a dark
                site, Moon = switch to dark on a light site). */}
            <SystemThemeToggle />
            <Link
              to="/lab"
              aria-label="Open the BK Engineering Lab — interactive systems playground"
              title="BK Engineering Lab"
              className="lab-nav-shortcut inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground transition-colors duration-300 hover:border-cyan-accent/40 hover:bg-slate-900/[0.06] hover:text-cyan-accent dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
              <FlaskConical className="h-[1.125rem] w-[1.125rem]" />
            </Link>
            <a
              href="/contact"
              className="group hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-900/10 bg-slate-900/[0.04] px-4 py-2 text-sm font-medium text-cyan-accent transition-all duration-300 hover:border-cyan-accent/40 hover:bg-cyan-accent/5 hover:shadow-[0_0_24px_-6px_rgba(6,182,212,0.55)] dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span
                aria-hidden
                className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent"
              />
              Let's Talk
            </a>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg glass text-foreground"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div
            id="mobile-menu"
            className="mt-2 glass-nav rounded-2xl p-2 animate-fade-up lg:hidden"
          >
            <ul className="flex flex-col">
              {links.map((l) => {
                const isActive = active === l.id;
                return (
                  <li key={l.id}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "true" : undefined}
                      className={`block rounded-lg px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-slate-900/5 text-foreground dark:bg-white/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-slate-900/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {l.label}
                    </a>
                  </li>
                );
              })}
              <li>
                <a
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm transition-colors text-cyan-accent hover:bg-slate-900/5 dark:hover:bg-white/5"
                >
                  Let's Talk
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
