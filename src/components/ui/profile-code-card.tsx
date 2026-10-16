import { useEffect, useRef } from "react";

type Kind = "kw" | "id" | "key" | "str" | "punct";
type Token = readonly [string, Kind];

const KIND_CLASS: Record<Kind, string> = {
  kw: "text-blue-accent",
  id: "text-foreground",
  key: "text-cyan-accent",
  str: "text-emerald-700 dark:text-emerald-300",
  punct: "text-muted-foreground",
};

const TOKENS: Token[] = [
  ["const", "kw"],
  [" bramha ", "id"],
  ["= {\n", "punct"],
  ["  role", "key"],
  [": ", "punct"],
  ['"Software Engineer"', "str"],
  [",\n  ", "punct"],
  ["company", "key"],
  [": ", "punct"],
  ['"HG Infotech"', "str"],
  [",\n  ", "punct"],
  ["location", "key"],
  [": ", "punct"],
  ['"Bengaluru, India"', "str"],
  [",\n  ", "punct"],
  ["focus", "key"],
  [": [", "punct"],
  ['"Full Stack"', "str"],
  [", ", "punct"],
  ['"AI"', "str"],
  [", ", "punct"],
  ['"ERPNext"', "str"],
  [", ", "punct"],
  ['"SAP BTP"', "str"],
  ["],\n  ", "punct"],
  ["status", "key"],
  [": ", "punct"],
  ['"open to opportunities"', "str"],
  [",\n};", "punct"],
];

const TOTAL = TOKENS.reduce((n, [t]) => n + t.length, 0);
const TYPE_MS = 1600;

function Tokens({ typed }: { typed?: boolean }) {
  return TOKENS.map(([text, kind], i) => (
    <span key={i} data-t={typed ? i : undefined} className={KIND_CLASS[kind]}>
      {typed ? "" : text}
    </span>
  ));
}

/**
 * `profile.ts` terminal card. The full text is laid out invisibly first so the
 * card's box never changes size; a second copy types in once, the first time
 * the card scrolls into view (written straight to the DOM — no React state).
 * Reduced motion shows the finished card immediately.
 */
export function ProfileCodeCard({
  className = "",
  active,
  wrap = false,
}: {
  className?: string;
  /** When given, typing starts the first time this becomes true (instead of on scroll-in). */
  active?: boolean;
  /** Wrap long lines (narrow hosts such as the badge back). */
  wrap?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const typed = typedRef.current;
    if (!root || !typed) return;
    const spans = Array.from(typed.querySelectorAll<HTMLElement>("[data-t]"));
    const paint = (count: number) => {
      let left = count;
      spans.forEach((span, i) => {
        const text = TOKENS[i][0];
        span.textContent = text.slice(0, Math.max(0, Math.min(left, text.length)));
        left -= text.length;
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(TOTAL);
      return;
    }

    let raf = 0;
    const type = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / TYPE_MS);
        paint(Math.round(p * TOTAL));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Driven from outside (the badge back): type once, when first shown.
    if (active !== undefined) {
      if (active) type();
      return () => cancelAnimationFrame(raf);
    }

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        type();
      },
      { threshold: 0.4 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={`rounded-2xl glass-strong shadow-[var(--shadow-terminal)] ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-900/10 px-3 py-2 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate font-mono text-[0.625rem] text-muted-foreground">
          profile.ts
        </span>
      </div>
      <div className="grid px-4 py-3 font-mono text-[0.6875rem] leading-relaxed">
        <pre
          aria-hidden
          className={`invisible col-start-1 row-start-1 ${wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre"}`}
        >
          <Tokens />
        </pre>
        <pre
          ref={typedRef}
          className={`col-start-1 row-start-1 ${wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre"}`}
        >
          <Tokens typed />
        </pre>
      </div>
    </div>
  );
}
