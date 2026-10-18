/**
 * Home sections addressable by a clean URL path. `id` is the DOM id of the
 * section (or nested block); order matches the page, which scroll-spy relies on.
 */
export const SECTIONS = [
  { path: "", id: "home", title: "Home" },
  { path: "about", id: "about", title: "About" },
  { path: "experience", id: "experience", title: "Experience" },
  { path: "projects", id: "projects", title: "Projects" },
  { path: "skills", id: "skills", title: "Skills" },
  { path: "stack", id: "tech", title: "Tech Stack" },
  { path: "open-source", id: "github", title: "Open Source" },
  { path: "certifications", id: "certifications", title: "Certifications" },
  { path: "contact", id: "contact", title: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

const trimPath = (pathname: string) => pathname.replace(/^\/+|\/+$/g, "");

/** Removed sections whose old URLs redirect (replace) to a surviving one. */
export const SECTION_REDIRECTS: Record<string, string> = { architecture: "projects" };

export function sectionForPath(pathname: string) {
  const p = trimPath(pathname);
  return SECTIONS.find((s) => s.path === p) ?? null;
}

export function sectionForId(id: string) {
  return SECTIONS.find((s) => s.id === id) ?? null;
}

export const pathForSection = (s: { path: string }) => `/${s.path}`;

/** Where a section heading lands below the fixed nav, in rem (scales with the root). */
const LANDING_GAP_REM = 2.5;

const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/**
 * The fixed nav's layout height. `offsetHeight` ignores transforms, so it is the
 * same whether the nav is shown, hidden (translated away) or compact (scaled),
 * and it follows the root font scale.
 */
export function navHeight() {
  const header = document.querySelector("header");
  return header instanceof HTMLElement ? header.offsetHeight : 58;
}

/** Viewport Y where a section heading lands after a nav click / deep link. */
export function landingY() {
  return navHeight() + LANDING_GAP_REM * remPx();
}

/**
 * Y of the spy line. It is the landing line: once a section's heading has
 * landed there, the section's own top (eyebrow included) is above it, so the
 * spy agrees with where a click put the page — nested blocks like Experience
 * and Tech Stack included.
 */
export function spyLineY() {
  return landingY();
}

/** Shared by the nav scroll-spy and the Home layout's path-driven scroll. */
export const spyState = {
  // Ignore `scrollend` until this time (ms, performance.now) — a deep link
  // keeps re-aiming while late content loads, so one scroll ending isn't "done".
  holdUntil: 0,
  // The section a programmatic scroll is heading to; when the scroll settles
  // it becomes the active section and URL, then scroll-spy takes over again.
  target: null as SectionId | null,
  // True while a programmatic scroll runs, so the spy never rewrites the URL.
  // A deep link starts locked: Home scrolls to the section on mount.
  locked:
    typeof window !== "undefined" &&
    // A redirected legacy path is a deep link too: Home scrolls to its target.
    ((sectionForPath(window.location.pathname)?.id ?? "home") !== "home" ||
      trimPath(window.location.pathname) in SECTION_REDIRECTS),
};

let lockTimer = 0;
let settleHandler: ((id: SectionId) => void) | null = null;

/** The nav registers how to apply a settled target (active tag + URL). */
export function onSpySettle(fn: ((id: SectionId) => void) | null) {
  settleHandler = fn;
  return () => {
    if (settleHandler === fn) settleHandler = null;
  };
}

/** Suppress scroll-spy URL/active updates while a programmatic scroll runs. */
export function lockSpy(fallbackMs: number, holdScrollEnd = false, target?: SectionId) {
  spyState.locked = true;
  if (target) spyState.target = target;
  if (holdScrollEnd) spyState.holdUntil = performance.now() + fallbackMs;
  window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(unlockSpy, fallbackMs);
}

/** Release the lock; returns true when a clicked target was applied. */
export function unlockSpy() {
  window.clearTimeout(lockTimer);
  spyState.locked = false;
  const target = spyState.target;
  spyState.target = null;
  if (!target) return false;
  settleHandler?.(target);
  return true;
}

/** Scroll so the section heading lands exactly at `landingY()` below the fixed nav. */
export function scrollToSection(id: string, behavior: ScrollBehavior) {
  const target = document.getElementById(id);
  if (!target) return false;
  let top = 0;
  if (id !== "home") {
    const heading = target.querySelector("h1, h2") ?? target;
    top = heading.getBoundingClientRect().top + window.scrollY - landingY();
  }
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

/** The section whose top has cleared the spy line (last one wins), or null. */
export function currentSectionId(): SectionId | null {
  const y = spyLineY();
  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    const r = document.getElementById(SECTIONS[i].id)?.getBoundingClientRect();
    if (r && r.top < y && r.bottom > 0) return SECTIONS[i].id;
  }
  const first = document.getElementById(SECTIONS[0].id);
  return first && first.getBoundingClientRect().top >= y ? "home" : null;
}

/** Stable DOM id of a project card in the Projects section. */
export const projectCardId = (name: string) =>
  `project-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
