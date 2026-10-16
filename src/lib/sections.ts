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
  { path: "architecture", id: "architecture", title: "Architecture" },
  { path: "open-source", id: "github", title: "Open Source" },
  { path: "certifications", id: "certifications", title: "Certifications" },
  { path: "contact", id: "contact", title: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

const trimPath = (pathname: string) => pathname.replace(/^\/+|\/+$/g, "");

export function sectionForPath(pathname: string) {
  const p = trimPath(pathname);
  return SECTIONS.find((s) => s.path === p) ?? null;
}

export function sectionForId(id: string) {
  return SECTIONS.find((s) => s.id === id) ?? null;
}

export const pathForSection = (s: { path: string }) => `/${s.path}`;

/** Shared by the nav scroll-spy and the Home layout's path-driven scroll. */
export const spyState = {
  // Ignore `scrollend` until this time (ms, performance.now) — a deep link
  // keeps re-aiming while late content loads, so one scroll ending isn't "done".
  holdUntil: 0,
  // True while a programmatic scroll runs, so the spy never rewrites the URL.
  // A deep link starts locked: Home scrolls to the section on mount.
  locked:
    typeof window !== "undefined" &&
    (sectionForPath(window.location.pathname)?.id ?? "home") !== "home",
};

let lockTimer = 0;

/** Suppress scroll-spy URL/active updates while a programmatic scroll runs. */
export function lockSpy(fallbackMs: number, holdScrollEnd = false) {
  spyState.locked = true;
  if (holdScrollEnd) spyState.holdUntil = performance.now() + fallbackMs;
  window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(unlockSpy, fallbackMs);
}

export function unlockSpy() {
  window.clearTimeout(lockTimer);
  spyState.locked = false;
}

/** Scroll so the section heading sits a consistent distance below the fixed nav. */
export function scrollToSection(id: string, behavior: ScrollBehavior) {
  const target = document.getElementById(id);
  if (!target) return false;
  let top = 0;
  if (id !== "home") {
    const navHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const heading = target.querySelector("h1, h2") ?? target;
    // 45px ≈ 56px at the 80% root scale used across the site.
    top = heading.getBoundingClientRect().top + window.scrollY - navHeight - 45;
  }
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

/** Y of the spy line: just under the fixed header. */
export function spyLineY() {
  const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 58;
  return Math.max(headerH, 51);
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
