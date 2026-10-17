import { useEffect, useRef, useState, type ReactNode } from "react";

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * A glass browser window around a project screenshot. Rests with a slight 3D
 * tilt and turns flat on hover (fine pointers) or tap (touch) while the
 * screenshot previews: a slow pan to the bottom when the image is taller than
 * the window, a subtle zoom otherwise. The choice and the pan distance are
 * measured (`data-mode`, `--pan`) and everything else is CSS (`.bframe-*`).
 *
 * With `back`, a "View architecture" button flips the window (`rotateY(180°)`)
 * to show it; "Back to preview" flips back. Focus follows the flip. Under
 * reduced motion the frame is flat and the flip is an instant swap.
 */
export function BrowserFrame({
  name,
  src,
  alt,
  width,
  height,
  eager = false,
  back,
}: {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  eager?: boolean;
  back?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shotRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fitRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const frontBtnRef = useRef<HTMLButtonElement | null>(null);
  const backBtnRef = useRef<HTMLButtonElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const host = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.app`;

  // Pan vs zoom: compare the image's rendered height at the window width with
  // the window height. Re-measured on resize and once the image has loaded.
  useEffect(() => {
    const shot = shotRef.current;
    const img = imgRef.current;
    if (!shot || !img) return;
    const measure = () => {
      if (!img.naturalWidth) return;
      const imgH = (img.naturalHeight / img.naturalWidth) * shot.clientWidth;
      const taller = imgH > shot.clientHeight + 1;
      img.dataset.mode = taller ? "pan" : "zoom";
      img.style.setProperty("--pan", taller ? `${Math.round(shot.clientHeight - imgH)}px` : "0px");
    };
    measure();
    img.addEventListener("load", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(shot);
    return () => {
      img.removeEventListener("load", measure);
      ro.disconnect();
    };
  }, []);

  // Scale the back face's content down to fit the window, never scroll it.
  useEffect(() => {
    const fit = fitRef.current;
    const inner = innerRef.current;
    if (!fit || !inner) return;
    const measure = () => {
      const s = Math.min(1, fit.clientHeight / Math.max(1, inner.offsetHeight), fit.clientWidth / Math.max(1, inner.offsetWidth));
      fit.style.setProperty("--fit", s.toFixed(3));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fit);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  // Preview: hover on fine pointers, tap-toggle on touch (reset when scrolled
  // away). A DOM attribute, so pointer events never re-render React.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia(REDUCED).matches) return;
    const set = (on: boolean) => {
      if (on) root.dataset.preview = "1";
      else delete root.dataset.preview;
    };
    if (window.matchMedia(FINE).matches) {
      const enter = () => set(true);
      const leave = () => set(false);
      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointerleave", leave);
      return () => {
        root.removeEventListener("pointerenter", enter);
        root.removeEventListener("pointerleave", leave);
      };
    }
    const tap = (e: Event) => {
      if ((e.target as HTMLElement).closest("button")) return;
      set(!root.dataset.preview);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) set(false);
    });
    root.addEventListener("click", tap);
    io.observe(root);
    return () => {
      root.removeEventListener("click", tap);
      io.disconnect();
    };
  }, []);

  // Focus follows the flip: to the back's button, and back to the front's.
  const flippedOnce = useRef(false);
  useEffect(() => {
    if (flipped) {
      flippedOnce.current = true;
      backBtnRef.current?.focus();
    } else if (flippedOnce.current) {
      frontBtnRef.current?.focus();
    }
  }, [flipped]);

  const chrome = (children: ReactNode) => (
    <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-900/[0.04] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span aria-hidden className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </span>
      {children}
    </div>
  );

  const btnClass =
    "shrink-0 rounded-md border border-slate-900/10 bg-slate-900/[0.04] px-2 py-0.5 text-[0.6875rem] font-medium text-foreground/80 transition-colors hover:border-cyan-accent/40 hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <div ref={rootRef} className="bframe" data-flipped={flipped ? "1" : undefined}>
      <div className="bframe-card glass-strong rounded-2xl shadow-[var(--shadow-terminal)]">
        {/* Front: chrome + screenshot */}
        <div className="bframe-face bframe-front overflow-hidden rounded-2xl" inert={flipped} aria-hidden={flipped}>
          {chrome(
            <>
              <span className="mx-auto min-w-0 truncate rounded-md border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
                {host}
              </span>
              {back && (
                <button
                  ref={frontBtnRef}
                  type="button"
                  aria-pressed={flipped}
                  onClick={() => setFlipped(true)}
                  className={btnClass}
                >
                  View architecture
                </button>
              )}
            </>,
          )}
          <div
            ref={shotRef}
            className="bframe-shot relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 lg:aspect-[21/9] dark:from-slate-800 dark:to-slate-900"
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="bframe-img"
            />
          </div>
        </div>

        {/* Back: the architecture diagram */}
        {back && (
          <div className="bframe-face bframe-back flex flex-col overflow-hidden rounded-2xl" inert={!flipped} aria-hidden={!flipped}>
            {chrome(
              <>
                <span className="mx-auto min-w-0 truncate rounded-md border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
                  {host}/architecture
                </span>
                <button ref={backBtnRef} type="button" onClick={() => setFlipped(false)} className={btnClass}>
                  Back to preview
                </button>
              </>,
            )}
            <div ref={fitRef} className="bframe-fit relative min-h-0 flex-1">
              <div ref={innerRef} className="bframe-fit-inner">
                {back}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
