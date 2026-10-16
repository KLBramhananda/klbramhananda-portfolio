import { useRef, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { usePageTransition } from "../effects/page-transition-context";
import { usePauseAnimations } from "../effects/use-pause-animations";
import { HeroNetwork } from "../effects/hero-network";
import { RoleRotator } from "../effects/role-rotator";
import { usePointerTilt } from "../effects/use-pointer-tilt";
import { HeroSpotlight, MagneticWrap, StatCard } from "../effects/hero-interactions";
import { HeroCore, type CoreHandle } from "../effects/HeroCore";
import type { CoreWorld } from "../effects/core-scene";

const stats = [
  { value: "2+", label: "Years Experience" },
  { value: "4", label: "Enterprise Projects" },
  { value: "10+", label: "Technologies" },
];

const NAME_WORDS = ["Bramhananda", "K", "L"];
const NAME_LETTERS = NAME_WORDS.join("").length;

/** Per-letter spans carry the shared gradient slice (see `.hero-letter`). */
function AnimatedName() {
  let index = 0;
  return (
    <h1 className="text-[clamp(2.25rem,11vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
      <span className="sr-only">Bramhananda K L</span>
      <span aria-hidden>
        {NAME_WORDS.map((word, w) => (
          <span key={word + w}>
            {w > 0 && " "}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((ch) => {
                const i = index++;
                return (
                  <span
                    key={i}
                    className="hero-letter"
                    style={
                      {
                        "--i": i,
                        "--n": NAME_LETTERS,
                        "--p": `${(i / (NAME_LETTERS - 1)) * 100}%`,
                      } as CSSProperties
                    }
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </span>
        ))}
      </span>
    </h1>
  );
}

const TINT: Record<CoreWorld, string> = {
  neutral: "var(--cyan-accent)",
  eng: "var(--cyan-accent)",
  ai: "var(--ai-violet)",
};

type WorldLink = { world: "eng" | "ai"; to: "/lab" | "/lab/ai-research" };

export function Hero() {
  const heroRef = usePauseAnimations<HTMLElement>();
  const router = useRouter();
  const transition = usePageTransition();
  const navigatingRef = useRef(false);
  const coreRef = useRef<CoreHandle>(null);
  const [tiltRef, tiltStyle] = usePointerTilt<HTMLDivElement>(6);

  // Hovering / focusing a CTA morphs the Core and tints the hero glow.
  const setWorld = (world: CoreWorld) => {
    coreRef.current?.setWorld(world);
    heroRef.current?.style.setProperty("--hero-tint", TINT[world]);
  };

  // Entering a world: the Core zooms in (~500 ms, never holding navigation past
  // 600 ms), then the existing navigation runs. The Engineering World keeps its
  // cinematic portal: the flash starts in the same event as the navigation, so
  // there is never a frozen frame. Modified / middle clicks keep the browser's
  // native behaviour (open in new tab) and skip the animation.
  const enterWorld = (e: ReactMouseEvent<HTMLAnchorElement>, { world, to }: WorldLink) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    // Keyboard-activated clicks report clientX/Y = 0; burst from the button
    // center in that case so the flash never originates from a corner.
    const origin = {
      x: e.clientX !== 0 ? e.clientX : rect.left + rect.width / 2,
      y: e.clientY !== 0 ? e.clientY : rect.top + rect.height / 2,
    };
    setWorld(world);

    let went = false;
    const go = () => {
      if (went) return;
      went = true;
      if (world === "eng") transition?.enter(origin);
      void router.navigate({ to }).catch(() => {
        navigatingRef.current = false;
      });
    };
    const zoom = coreRef.current?.zoom();
    if (!zoom) {
      go();
      return;
    }
    void zoom.then(go);
    window.setTimeout(go, 600);
  };

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative overflow-hidden pt-32 pb-14 lg:pt-40 lg:pb-16"
      style={{ "--hero-tint": "var(--cyan-accent)" } as CSSProperties}
    >
      {/* Ambient blobs — static, composited once (no continuous animation).
          Two of them follow --hero-tint, which the Two Worlds morph shifts. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-20 left-[10%] h-80 w-80 rounded-full bg-[color-mix(in_oklab,var(--hero-tint)_20%,transparent)] blur-[6.875rem] transition-colors duration-700" />
        <div className="absolute bottom-10 right-[8%] h-96 w-96 rounded-full bg-blue-accent/20 blur-[8.125rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[31.25rem] w-[31.25rem] rounded-full bg-[color-mix(in_oklab,var(--hero-tint)_6%,transparent)] blur-[6.25rem] transition-colors duration-700" />
      </div>
      <HeroSpotlight />
      <HeroNetwork />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <motion.div ref={tiltRef} style={tiltStyle} data-network-avoid className="relative z-10">
            <p className="mb-3 text-lg text-muted-foreground">Hi, I'm</p>
            <AnimatedName />
            <RoleRotator className="mt-5 text-xl font-semibold tracking-tight text-cyan-accent sm:text-2xl" />
          </motion.div>

          <div className="animate-fade-up">
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Building scalable enterprise software across full-stack
              applications, ERPNext, AI-powered systems, and SAP BTP
              integrations.
            </p>

            {/* Lab entry portals — side-by-side on desktop, stacked on
                mobile. Primary (Engineering World) carries the cyan/blue
                gradient + glow; secondary (AI World) is the glass surface
                with an indigo aura. Shared hover language: a gentle lift/
                scale, a thin animated accent border sweep, a breathing glow,
                and an arrow indicator that slides forward — all in `.hero-cta`. */}
            <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:gap-4 lg:mx-0">
              <MagneticWrap className="w-full sm:flex-1">
                <Link
                  to="/lab"
                  preload="intent"
                  onClick={(e) => enterWorld(e, { world: "eng", to: "/lab" })}
                  onPointerEnter={() => setWorld("eng")}
                  onPointerLeave={() => setWorld("neutral")}
                  onFocus={() => setWorld("eng")}
                  onBlur={() => setWorld("neutral")}
                  aria-label="Enter the BK Engineering World — interactive systems playground"
                  title="BK Engineering World"
                  className="hero-cta hero-cta--primary group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:flex-1"
                >
                  <span aria-hidden className="hero-cta__icon">⚡</span>
                  Enter Engineering World
                  <span aria-hidden className="hero-cta__indicator">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </MagneticWrap>
              <MagneticWrap className="w-full sm:flex-1">
                <Link
                  to="/lab/ai-research"
                  onClick={(e) => enterWorld(e, { world: "ai", to: "/lab/ai-research" })}
                  onPointerEnter={() => setWorld("ai")}
                  onPointerLeave={() => setWorld("neutral")}
                  onFocus={() => setWorld("ai")}
                  onBlur={() => setWorld("neutral")}
                  aria-label="Enter the BK AI World — AI, agents, enterprise systems and software architecture"
                  title="BK AI World"
                  className="hero-cta hero-cta--secondary group inline-flex w-full items-center justify-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground sm:flex-1"
                >
                  <span aria-hidden className="hero-cta__icon">🧠</span>
                  Enter AI World
                  <span aria-hidden className="hero-cta__indicator">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </MagneticWrap>
            </div>

            {/* Quick stats */}
            <dl className="mt-12 flex flex-wrap justify-center gap-3 lg:justify-start">
              {stats.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} />
              ))}
            </dl>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <HeroCore ref={coreRef} />
        </div>
      </div>

      {/* Scroll hint — gently scrolls to the footer */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={scrollToFooter}
          aria-label="Scroll to footer"
          className="hero-scroll-hint flex h-10 w-10 items-center justify-center rounded-full glass text-muted-foreground transition-colors duration-200 hover:text-cyan-accent"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Terminal hint — keyboard users; hidden on touch */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("bk:terminal"))}
        className="absolute bottom-7 left-[calc(50%+2.75rem)] hidden items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground md:inline-flex pointer-coarse:hidden"
      >
        Press
        <kbd className="rounded border border-slate-900/15 bg-slate-900/[0.04] px-1.5 py-0.5 font-mono text-[0.625rem] text-foreground/80 dark:border-white/15 dark:bg-white/[0.04]">
          /
        </kbd>
        for terminal
      </button>
    </section>
  );
}

function scrollToFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  footer.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}
