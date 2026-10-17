import { useEffect, useRef, useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronDown, FlaskConical } from "lucide-react";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { SystemThemeToggle } from "@/components/theme/SystemThemeToggle";
import { MobileTabBar } from "./MobileTabBar";
import { useNavScroll } from "./use-nav-scroll";
import {
  SECTIONS,
  currentSectionId,
  lockSpy,
  onSpySettle,
  pathForSection,
  scrollToSection,
  sectionForId,
  sectionForPath,
  spyLineY,
  spyState,
  unlockSpy,
  type SectionId,
} from "@/lib/sections";

const links = (["home", "about", "experience", "projects", "skills", "tech", "architecture"] as const).map(
  (id) => {
    const s = sectionForId(id)!;
    return { id, label: s.title, href: pathForSection(s) };
  },
);
const NAV_IDS = new Set<string>(links.map((l) => l.id));
// On tablets the dock keeps the first links and folds the rest into "More".
const DOCK_MD_COUNT = 3;

// Fallback length for holding a clicked nav tag active while the browser
// smooth-scrolls. `scrollend` releases it the moment the scroll really stops;
// this timeout only covers browsers without scrollend support.
const NAV_LOCK_MS = 1200;

export function SiteNav() {
  const headerRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(
    () => sectionForPath(window.location.pathname)?.id ?? "home",
  );
  const router = useRouter();
  const onHome = useRouterState({
    select: (st) => st.matches.some((m) => m.routeId === "/_home"),
  });

  useNavScroll(headerRef);

  // Tablet "More" menu: Esc closes and returns focus; a click outside closes.
  useEffect(() => {
    if (!moreOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMoreOpen(false);
        moreRef.current?.focus({ preventScroll: true });
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !moreRef.current?.contains(t)) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [moreOpen]);

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
      lockSpy(NAV_LOCK_MS, false, section.id);
      // Push the entry first: the browser stores the scroll position of the
      // page being left when the entry is pushed, so scrolling afterwards keeps
      // Back returning to where the previous entry actually was.
      const pushed =
        sectionForPath(router.state.location.pathname)?.id !== section.id
          ? goTo(section.id, false)
          : Promise.resolve();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      void pushed.finally(() => scrollToSection(section.id, reduced ? "auto" : "smooth"));
      if (anchor.closest("header, nav") && NAV_IDS.has(section.id)) setActive(section.id);
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
      setActive(id);
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

    // A programmatic scroll ended on its target: that section becomes the
    // active tag and URL (whatever the spy would pick at this exact offset),
    // then scroll-spy takes over again.
    const applyTarget = (id: SectionId) => {
      setActive(id);
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
    const offSettle = onSpySettle(applyTarget);

    const onScrollEnd = () => {
      if (!spyState.locked || performance.now() < spyState.holdUntil) return;
      // With a clicked target the settle handler applies it; otherwise sync
      // once so the tag matches where the scroll landed.
      if (!unlockSpy()) sync();
    };

    connect();
    sync(false);

    window.addEventListener("scrollend", onScrollEnd, { passive: true });
    window.addEventListener("resize", connect);

    return () => {
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", connect);
      offSettle();
      observer?.disconnect();
    };
  }, [onHome, router]);

  const highlight = hover ?? active;
  const moreLinks = links.slice(DOCK_MD_COUNT);

  return (
    <>
      <header
        ref={headerRef}
        data-compact="false"
        data-hidden="false"
        className="group fixed inset-x-0 top-0 z-50 px-4 pt-3 transition-transform duration-300 ease-out data-[hidden=true]:-translate-y-[170%] lg:pt-4"
      >
        <div className="mx-auto max-w-7xl origin-top transition-transform duration-300 ease-out group-data-[compact=true]:scale-[0.857]">
          <nav
            aria-label="Primary"
            className="relative flex h-[3.25rem] items-center justify-between rounded-2xl px-3 shadow-[var(--shadow-nav)]"
          >
            <span
              aria-hidden
              className="glass-nav absolute inset-0 rounded-2xl opacity-90 transition-opacity duration-300 group-data-[compact=true]:opacity-100"
            />

            <a
              href="/"
              className="nav-logo group/logo relative flex items-center gap-2 rounded-lg"
              aria-label="Bramhananda K L — back to top"
            >
              <img
                src={bkLogo}
                alt="BK logo"
                width={1254}
                height={1254}
                className="nav-logo__mark h-8 w-8 shrink-0 rounded-lg object-cover"
              />
              <span className="font-semibold tracking-tight text-foreground whitespace-nowrap">
                Bramha<span className="text-muted-foreground">nanda K L</span>
              </span>
            </a>

            <ul
              className="relative hidden items-center gap-0.5 md:flex"
              onPointerLeave={() => setHover(null)}
            >
              {links.map((l, i) => {
                const lit = highlight === l.id;
                return (
                  <li key={l.id} className={i >= DOCK_MD_COUNT ? "hidden lg:block" : undefined}>
                    <a
                      href={l.href}
                      aria-current={active === l.id ? "location" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(l.id)}
                      onFocus={() => setHover(l.id)}
                      onBlur={() => setHover(null)}
                      className={`relative z-0 block rounded-lg px-2.5 py-2 text-sm transition-colors xl:px-3 ${
                        lit ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {lit && (
                        <motion.span
                          layoutId="nav-highlight"
                          aria-hidden
                          className="absolute inset-0 -z-10 rounded-lg bg-slate-900/[0.06] dark:bg-white/[0.08]"
                          transition={{ type: "spring", stiffness: 520, damping: 38 }}
                        />
                      )}
                      {l.label}
                    </a>
                  </li>
                );
              })}

              <li className="relative lg:hidden">
                <button
                  ref={moreRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                  className="relative z-0 flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  More
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                {moreOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="More sections"
                    className="glass-strong absolute top-full right-0 mt-3 w-48 rounded-2xl p-1.5 shadow-[var(--shadow-nav)]"
                  >
                    {moreLinks.map((l) => (
                      <a
                        key={l.id}
                        role="menuitem"
                        href={l.href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active === l.id ? "location" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-900/5 dark:hover:bg-white/5 ${
                          active === l.id ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            </ul>

            <div className="relative flex items-center gap-2">
              {/* Theme toggle — global preference, shared with the lab shells.
                  The icon shows the ACTION (Sun = switch to light on a dark
                  site, Moon = switch to dark on a light site). */}
              <SystemThemeToggle />
              <Link
                to="/lab"
                aria-label="Open the BK Engineering Lab — interactive systems playground"
                title="BK Engineering Lab"
                className="lab-nav-shortcut hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground transition-colors duration-300 hover:border-cyan-accent/40 hover:bg-slate-900/[0.06] hover:text-cyan-accent md:inline-flex dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <FlaskConical className="h-[1.125rem] w-[1.125rem]" />
              </Link>
              <a
                href="/contact"
                aria-current={active === "contact" ? "location" : undefined}
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-900/10 bg-slate-900/[0.04] px-3 py-2 text-xs font-medium text-cyan-accent transition-all duration-300 hover:border-cyan-accent/40 hover:bg-cyan-accent/5 hover:shadow-[0_0_24px_-6px_rgba(6,182,212,0.55)] sm:px-4 sm:text-sm dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span
                  aria-hidden
                  className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent"
                />
                Let's Talk
              </a>
            </div>

            {/* Scroll progress: scaleX driven by --nav-progress (set once per frame) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full"
            >
              <span
                className="block h-full origin-left bg-gradient-to-r from-cyan-accent to-blue-accent"
                style={{ transform: "scaleX(var(--nav-progress, 0))" }}
              />
            </span>
          </nav>
        </div>
      </header>

      <MobileTabBar active={active} />
    </>
  );
}
