import { useEffect, useRef, type ReactNode, type Ref } from "react";

export type ConsoleTone = "pending" | "ok" | "err";
export interface ConsoleLine {
  id: number;
  text: string;
  tone: ConsoleTone;
}

const CHAR_MS = 14;

const TONE: Record<ConsoleTone, string> = {
  pending: "text-muted-foreground",
  ok: "text-emerald-700 dark:text-emerald-300",
  err: "text-rose-600 dark:text-rose-300",
};

/**
 * The response console: fixed height, mono font. Lines are typed out one after
 * another, imperatively (a rAF loop writes `textContent`; no React state per
 * character). The typed layer is aria-hidden; a visually hidden live region
 * carries the full lines so assistive tech reads whole sentences, once.
 * Without motion the lines appear at once.
 */
export function ResponseConsole({
  lines,
  reduced,
  innerRef,
  children,
}: {
  lines: ConsoleLine[];
  reduced: boolean;
  innerRef?: Ref<HTMLDivElement>;
  /** Shown under the lines, e.g. the "Email me directly" button. */
  children?: ReactNode;
}) {
  const spans = useRef(new Map<number, HTMLSpanElement>());
  const done = useRef(new Set<number>());
  const raf = useRef(0);
  const linesRef = useRef(lines);

  useEffect(() => {
    linesRef.current = lines;
    const write = (l: ConsoleLine, n: number) => {
      const el = spans.current.get(l.id);
      if (el) el.textContent = l.text.slice(0, n);
    };
    if (reduced) {
      lines.forEach((l) => {
        write(l, l.text.length);
        done.current.add(l.id);
      });
      return;
    }
    if (raf.current || lines.every((l) => done.current.has(l.id))) return;
    let current: number | null = null;
    let t0 = 0;
    const step = (now: number) => {
      raf.current = 0;
      const pending = linesRef.current.find((l) => !done.current.has(l.id));
      if (!pending) return;
      if (current !== pending.id) {
        current = pending.id;
        t0 = now;
      }
      const n = Math.min(pending.text.length, Math.floor((now - t0) / CHAR_MS) + 1);
      write(pending, n);
      if (n >= pending.text.length) {
        done.current.add(pending.id);
        current = null;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [lines, reduced]);

  // Reset the handle too: React StrictMode re-runs effects, and a stale id would block the loop.
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );

  return (
    <div ref={innerRef} className="api-console flex flex-col rounded-2xl p-4 font-mono text-[0.8125rem] leading-relaxed">
      <div aria-hidden className="api-console__lines min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="text-muted-foreground/70"># response will appear here</div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className={`${TONE[l.tone]} break-words`}>
              <span
                ref={(el) => {
                  if (el) spans.current.set(l.id, el);
                  else spans.current.delete(l.id);
                }}
              />
            </div>
          ))
        )}
      </div>
      {children}
      <div className="sr-only" aria-live="polite">
        {lines.map((l) => (
          <p key={l.id}>{l.text}</p>
        ))}
      </div>
    </div>
  );
}
