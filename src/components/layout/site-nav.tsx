import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, FlaskConical } from "lucide-react";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { SystemThemeToggle } from "@/components/theme/SystemThemeToggle";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Tech Stack", href: "#tech" },
  { label: "Architecture", href: "#architecture" },
];

// Fallback length for holding a clicked nav tag active while the browser
// smooth-scrolls. `scrollend` releases it the moment the scroll really stops;
// this timeout only covers browsers without scrollend support.
const NAV_LOCK_MS = 1200;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>("#home");
  const rafRef = useRef<number | null>(null);
  const navLockedRef = useRef(false);
  const navLockTimerRef = useRef<number | null>(null);
  const releaseNavRef = useRef<(() => void) | null>(null);

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

  // Smooth-scroll in-page anchors to the section's heading with a consistent
  // offset below the fixed navbar. Centralized here so every section target
  // (top-level sections and nested anchors like Experience/Tech Stack) lands
  // at the same position regardless of the section's internal padding.
  //
  // The URL fragment is intentionally left untouched: writing it via
  // history.replaceState makes the browser run a native scroll-to-fragment
  // (honoring scroll-padding-top) that cancels the programmatic scroll below
  // and lands the raw section top under the navbar — leaving the section's own
  // top padding as an empty gap. Keeping the programmatic scroll as the only
  // scroll operation guarantees every heading lands at the same offset.
  useEffect(() => {
    // Scaled with the design system (56px at a 16px root ≈ 45px at 12.8px)
    // so anchored sections land at the same visual offset under the navbar.
    const HEADING_BREATHING = 45;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      const anchor = el?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();

      const header = document.querySelector("header");
      const navHeight = header?.getBoundingClientRect().height ?? 0;

      let top = 0;
      if (href !== "#home") {
        const heading = target.querySelector("h1, h2") ?? target;
        top =
          heading.getBoundingClientRect().top +
          window.scrollY -
          navHeight -
          HEADING_BREATHING;
      }

      window.scrollTo({
        top: Math.max(0, top),
        behavior: reduced ? "auto" : "smooth",
      });

      // A click on a navbar link activates its tag immediately and holds it
      // while the programmatic scroll runs, so intermediate sections crossing
      // the spy band never flash another tag during navigation. The observer
      // takes over again once the scroll settles.
      if (anchor.closest("header")) {
        setActive(href);
        navLockedRef.current = true;
        if (navLockTimerRef.current != null) {
          window.clearTimeout(navLockTimerRef.current);
        }
        navLockTimerRef.current = window.setTimeout(
          () => releaseNavRef.current?.(),
          NAV_LOCK_MS,
        );
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Highlight the section currently at the top of the reading position. An
  // IntersectionObserver watches a slim band just below the fixed navbar (not
  // the viewport center), so a nav item activates the moment its section's top
  // clears the header — whether scrolling down or back up. Picking the last
  // intersecting section keeps exactly one item active and avoids boundary
  // flicker; the observer only fires on band crossings, never per scroll frame.
  //
  // Untracked regions (sections with no matching navbar tag) leave every tag
  // unhighlighted — never falling back to Home, which would wrongly light up
  // an unrelated tag. Home only counts as active at the very top of the page,
  // where nothing has scrolled past the spy line yet.
  useEffect(() => {
    const sections = links
      .map((l) => l.href.slice(1))
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let observer: IntersectionObserver | null = null;

    const lineY = () => {
      // Activation line sits just under the fixed header: a section becomes
      // active as soon as its top edge clears the navbar.
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 58;
      return Math.max(headerH, 51);
    };

    const inBand = (el: HTMLElement) => {
      const y = lineY();
      const r = el.getBoundingClientRect();
      return r.top < y && r.bottom > 0;
    };

    const sync = () => {
      // Suppressed while a nav click is still scrolling to its target; the
      // clicked tag is held active until the scroll settles.
      if (navLockedRef.current) return;

      let current: string | null = null;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (inBand(sections[i])) {
          current = links[i].href;
          break;
        }
      }

      // If no tracked section has reached the spy line yet we're still at the
      // top of the page, so Home is the active section. Otherwise we're inside
      // an untracked region and no tag should be highlighted.
      if (current == null) {
        const y = lineY();
        const first = sections[0];
        if (first && first.getBoundingClientRect().top >= y) {
          current = links[0].href;
        }
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    const connect = () => {
      observer?.disconnect();
      const y = lineY();
      const marginBottom = Math.max(0, window.innerHeight - y);

      observer = new IntersectionObserver(sync, {
        root: null,
        rootMargin: `0px 0px -${marginBottom}px 0px`,
        threshold: 0,
      });

      sections.forEach((s) => observer!.observe(s));
    };

    const releaseNav = () => {
      if (!navLockedRef.current) return;
      navLockedRef.current = false;
      if (navLockTimerRef.current != null) {
        window.clearTimeout(navLockTimerRef.current);
        navLockTimerRef.current = null;
      }
      // Deliberately no sync here: the clicked tag stays active after landing
      // until the user scrolls into another section.
    };

    releaseNavRef.current = releaseNav;

    connect();
    sync();

    window.addEventListener("scrollend", releaseNav, { passive: true });
    window.addEventListener("resize", connect);

    return () => {
      window.removeEventListener("scrollend", releaseNav);
      window.removeEventListener("resize", connect);
      observer?.disconnect();
      if (navLockTimerRef.current != null) {
        window.clearTimeout(navLockTimerRef.current);
        navLockTimerRef.current = null;
      }
      releaseNavRef.current = null;
    };
  }, []);

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
            href="#home"
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
              const isActive = active === l.href;
              return (
                <li key={l.href}>
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
              href="#contact"
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
                const isActive = active === l.href;
                return (
                  <li key={l.href}>
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
                  href="#contact"
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
