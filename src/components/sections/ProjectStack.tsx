import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { onScrollFrame } from "../layout/use-nav-scroll";
import { landingY, lockSpy, navHeight } from "@/lib/sections";

const DESKTOP = "(min-width: 1024px)";

/**
 * Natural (unstuck) document top of a stacked card: the grid's top plus every
 * earlier card and gap. `getBoundingClientRect` reports the stuck position, so
 * it can't be used once the stack has started.
 */
function naturalTop(grid: HTMLElement, cards: HTMLElement[], index: number) {
  const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
  let y = grid.getBoundingClientRect().top + window.scrollY;
  for (let i = 0; i < index; i++) y += cards[i].offsetHeight + gap;
  return y;
}

/**
 * Sticky stacking showcase. Desktop (≥1024px): every card sticks below the nav
 * with a 12px offset per index, and the card underneath scales to 0.94 and
 * dims to 70% as the next one slides over it — ONE CSS variable per card
 * (`--stk`), written from the shared scroll loop and read by transform/opacity
 * only. The left index highlights the active project with a progress tick.
 * Below 1024px the cards flow normally and a dot row marks the active project.
 *
 * Children must be the cards themselves (direct grid items) so the grid is
 * their sticky containing block and the stack releases at the section end.
 */
export function ProjectStack({ names, children }: { names: string[]; children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef<HTMLOListElement | null>(null);
  const dotsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const reduced = useReducedMotion();

  useEffect(() => {
    const grid = gridRef.current;
    const index = indexRef.current;
    const dots = dotsRef.current;
    if (!grid || !index || !dots) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-stack-index]"));
    const items = Array.from(index.querySelectorAll<HTMLElement>("li"));
    const dotEls = Array.from(dots.querySelectorAll<HTMLElement>("button"));
    const desktop = window.matchMedia(DESKTOP);
    let navH = -1;
    let active = -1;
    const stk = cards.map(() => -1);
    const stacked = cards.map(() => false);

    const update = () => {
      const h = navHeight();
      if (h !== navH) {
        navH = h;
        grid.style.setProperty("--nav-h", `${h}px`);
      }
      const rects = cards.map((c) => c.getBoundingClientRect());
      const vh = window.innerHeight;

      // Active project: on desktop the last card that has reached its sticky
      // top (it is the one on top of the stack); otherwise the last card whose
      // top has passed 45% of the viewport.
      let next = 0;
      let progress = 0;

      if (desktop.matches) {
        for (let i = 0; i < rects.length; i++) if (rects[i].top <= navH + 24 + 12 * i + 1) next = i;
        for (let i = 0; i < cards.length; i++) {
          const r = rects[i];
          const below = rects[i + 1];
          // 0 while the next card is still under this one's bottom edge, 1 when
          // its top reaches this card's top.
          const p = below ? Math.min(1, Math.max(0, (r.top + r.height - below.top) / r.height)) : 0;
          if (Math.abs(p - stk[i]) > 0.002) {
            stk[i] = p;
            cards[i].style.setProperty("--stk", p.toFixed(3));
          }
          const isStacked = p > 0.02;
          if (isStacked !== stacked[i]) {
            stacked[i] = isStacked;
            if (isStacked) cards[i].dataset.stacked = "";
            else delete cards[i].dataset.stacked;
          }
          if (i === next) progress = p;
        }
      } else {
        for (let i = 0; i < rects.length; i++) if (rects[i].top <= vh * 0.45) next = i;
        for (let i = 0; i < cards.length; i++) {
          if (stk[i] !== 0) {
            stk[i] = 0;
            cards[i].style.removeProperty("--stk");
          }
          if (stacked[i]) {
            stacked[i] = false;
            delete cards[i].dataset.stacked;
          }
        }
      }

      index.style.setProperty("--ip", progress.toFixed(3));
      if (next !== active) {
        active = next;
        items.forEach((li, i) => {
          if (i === active) li.dataset.active = "";
          else delete li.dataset.active;
          li.querySelector("button")?.setAttribute("aria-current", i === active ? "true" : "false");
        });
        dotEls.forEach((d, i) => d.setAttribute("aria-current", i === active ? "true" : "false"));
      }
    };

    update();
    const off = onScrollFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(grid);
    const header = document.querySelector("header");
    if (header) ro.observe(header);
    return () => {
      off();
      ro.disconnect();
    };
  }, []);

  const goTo = (i: number) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-stack-index]"));
    if (!cards[i]) return;
    lockSpy(1500, false, "projects");
    const onProjects = window.location.pathname === "/projects";
    const go = onProjects
      ? Promise.resolve()
      : router.navigate({ to: "/$section", params: { section: "projects" }, resetScroll: false });
    void go.finally(() => {
      window.scrollTo({
        top: Math.max(0, naturalTop(grid, cards, i) - landingY()),
        behavior: reduced ? "auto" : "smooth",
      });
    });
  };

  return (
    <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
      {/* Tablet / mobile: dot indicator under the heading */}
      <div ref={dotsRef} className="mb-6 flex items-center gap-2 lg:hidden" aria-label="Project indicator">
        {names.map((n, i) => (
          <button
            key={n}
            type="button"
            aria-label={`Go to ${n}`}
            aria-current={i === 0 ? "true" : "false"}
            onClick={() => goTo(i)}
            className="pstack-dot h-2.5 w-2.5 rounded-full bg-slate-900/20 transition-[transform,background-color] duration-300 dark:bg-white/20"
          />
        ))}
      </div>

      {/* Desktop: slim sticky index on the left edge */}
      <nav aria-label="Project index" className="hidden lg:block">
        <ol ref={indexRef} className="pstack-index sticky top-[calc(50svh-6rem)] space-y-1">
          {names.map((n, i) => (
            <li key={n} data-active={i === 0 ? "" : undefined} className="pstack-item">
              <button
                type="button"
                aria-current={i === 0 ? "true" : "false"}
                onClick={() => goTo(i)}
                className="group flex w-full items-start gap-2.5 rounded-lg py-1.5 pr-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="pstack-num font-mono text-xs tabular-nums leading-5">{String(i + 1).padStart(2, "0")}</span>
                <span className="pstack-name min-w-0 leading-5">{n}</span>
              </button>
              <span aria-hidden className="pstack-tick" />
            </li>
          ))}
        </ol>
      </nav>

      <div ref={gridRef} className="pstack grid gap-6 lg:gap-8">
        {children}
      </div>
    </div>
  );
}
