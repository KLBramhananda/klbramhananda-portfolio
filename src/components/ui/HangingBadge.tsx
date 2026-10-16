import { useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { FlipHorizontal2 } from "lucide-react";
import profileImg from "@/assets/images/profile.jpeg";
import { ProfileCodeCard } from "./profile-code-card";
import { useBadgePhysics } from "./use-badge-physics";

/**
 * Hanging ID badge: a glowing pin, a cable that bends with the swing, and a
 * glass badge (portrait + name strip) that behaves like a damped pendulum —
 * drag it, throw it, hover or scroll past it. A tap (under 6px of movement) or
 * Enter/Space flips it to the `profile.ts` code card; ←/→ swing it.
 *
 * Sizing comes from container-query units on the stage, so the whole assembly
 * (pin + cable + badge + shadow) stays inside min(70svh, 560px).
 */
export function HangingBadge() {
  const reduced = useReducedMotion() ?? false;
  const [flipped, setFlipped] = useState(false);
  const [seenBack, setSeenBack] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const swing = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const cable = useRef<SVGPathElement>(null);

  const flip = () => {
    setFlipped((f) => !f);
    setSeenBack(true);
  };
  const handlers = useBadgePhysics({ stage, swing, shadow, cable, reduced, onTap: flip });

  return (
    <div
      ref={stage}
      className="relative mx-auto h-[min(70svh,470px)] w-full [--bw:min(100cqw,50cqh,260px)] [container-type:size] md:h-[min(70svh,440px)] md:[--bw:min(100cqw,50cqh,18rem)] lg:h-[min(70svh,560px)] lg:[--bw:min(100cqw,50cqh,22rem)]"
    >
      {/* Soft shadow on the "wall": pre-blurred, only translated / scaled. */}
      <div
        ref={shadow}
        aria-hidden
        className="pointer-events-none absolute bottom-[3%] left-1/2 h-[5%] -translate-x-1/2 rounded-full bg-slate-900/25 blur-xl dark:bg-black/50"
        style={{ width: "calc(var(--bw) * 0.7)" }}
      />

      {/* Pin */}
      <span
        aria-hidden
        className="absolute top-[0.9rem] left-1/2 z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-accent shadow-[0_0_14px_var(--cyan-accent)] ring-4 ring-cyan-accent/25"
      />

      {/* Swinging assembly: rotates about the pin */}
      <div
        ref={swing}
        className="absolute top-[0.9rem] left-1/2 origin-top"
        style={
          {
            width: "var(--bw)",
            height: "calc(var(--bw) * 1.63)",
            marginLeft: "calc(var(--bw) / -2)",
          } as CSSProperties
        }
      >
        <svg
          aria-hidden
          viewBox="0 0 60 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 overflow-visible"
          style={{ width: "1.8rem", height: "calc(var(--bw) * 0.25 + 0.9rem)" }}
        >
          <path
            ref={cable}
            d="M30 0 Q30 55 30 100"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-cyan-accent/70"
          />
        </svg>

        <button
          type="button"
          aria-pressed={flipped}
          aria-label="Profile badge — Enter to flip, arrow keys to swing"
          onClick={(e) => {
            // Pointer taps are handled on pointer-up; this covers Enter / Space.
            if (e.detail === 0) flip();
          }}
          {...handlers}
          className="absolute right-0 bottom-0 left-0 block cursor-grab touch-pan-y rounded-3xl select-none active:cursor-grabbing"
          style={{ top: "calc(var(--bw) * 0.25)", perspective: "1400px" }}
        >
          <span
            className={`relative block h-full w-full [transform-style:preserve-3d] ${
              reduced ? "" : "transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            }`}
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front: portrait + name strip */}
            <span className="glass-strong glow-cyan absolute inset-0 flex flex-col rounded-3xl p-2 [backface-visibility:hidden]">
              <span
                aria-hidden
                className="mx-auto mt-0.5 mb-2 block h-1.5 w-9 rounded-full bg-background/80 ring-1 ring-slate-900/15 ring-inset dark:ring-white/15"
              />
              <span className="relative block min-h-0 flex-1 overflow-hidden rounded-2xl">
                <img
                  src={profileImg}
                  alt="Bramhananda K L"
                  width={900}
                  height={1125}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="min-w-0 truncate text-[0.625rem] font-semibold tracking-wide text-foreground">
                  Bramhananda K L
                  <span className="font-normal text-muted-foreground"> · Software Engineer</span>
                </span>
                <FlipHorizontal2 aria-hidden className="size-3.5 shrink-0 text-cyan-accent" />
              </span>
            </span>

            {/* Back: the profile.ts code card */}
            <span className="glass-strong glow-cyan absolute inset-0 flex items-center justify-center rounded-3xl p-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <ProfileCodeCard active={seenBack} wrap className="w-full text-left" />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
