import { useEffect, useRef, type CSSProperties } from "react";
import type { LabModule } from "../data/modules";
import { LabCampus } from "./LabCampus";
import "../styles/lab-campus.css";

const TITLE_WORDS = ["BK", "Engineering", "Lab"];
const TITLE_LETTERS = TITLE_WORDS.join("").length;

/** Per-letter spans reuse the home hero's chrome sweep (`.hero-letter`, unchanged). */
function ChromeTitle() {
  let index = 0;
  return (
    <h1 className="mt-5 block max-w-full text-4xl font-bold leading-[1.25] tracking-tight sm:text-6xl lg:text-7xl">
      <span className="sr-only">BK Engineering Lab</span>
      <span aria-hidden>
        {TITLE_WORDS.map((word, w) => (
          <span key={word}>
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
                        "--n": TITLE_LETTERS,
                        "--p": `${(i / (TITLE_LETTERS - 1)) * 100}%`,
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

export function LabHome({
  onOpen,
}: {
  onOpen: (module: LabModule) => void;
}) {
  const rootRef = useRef<HTMLElement | null>(null);

  // Pause every campus animation (packets, lights, scanline) while the page is
  // off-screen or the tab is hidden.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = true;
    const apply = () => el.classList.toggle("lc-paused", !inView || document.hidden);
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      apply();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return (
    <section ref={rootRef} className="lc-root mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 sm:pt-16">
      {/* Perspective grid floor receding into the distance, with a slow scanline. */}
      <div aria-hidden className="lc-backdrop">
        <div className="lc-backdrop__plane" />
        <div className="lc-scan" />
      </div>

      {/* Lab hero */}
      <div className="max-w-3xl animate-fade-up">
        <p className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
          Interactive Enterprise Systems Playground
        </p>
        <ChromeTitle />
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A hands-on playground for the systems I build professionally - design
          enterprise architectures, model ERP and source-to-pay workflows, and
          rehearse production incident response. Everything here is a synthetic
          sandbox: safe to break, explore, and learn from.
        </p>
      </div>

      {/* Status strip */}
      <div className="lc-strip-bar mt-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>
            <span className="font-medium text-foreground">Foundation:</span> live
          </span>
        </span>
        <span aria-hidden className="hidden text-foreground/30 sm:inline">
          ·
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent animate-pulse" />
          <span>
            <span className="font-medium text-foreground">Sandbox:</span> synthetic data, no external calls
          </span>
        </span>
        <span aria-hidden className="hidden text-foreground/30 sm:inline">
          ·
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-cyan-accent">
            ◐
          </span>
          <span>
            <span className="font-medium text-foreground">Early preview</span> v0.1
          </span>
        </span>
      </div>

      {/* The lab campus: four buildings, one per lab */}
      <div className="mt-6 sm:mt-4">
        <LabCampus onOpen={onOpen} />
      </div>
    </section>
  );
}
