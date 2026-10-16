import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The terminal UI is only fetched the first time it is opened.
const TerminalPalette = lazy(() => import("./TerminalPalette"));

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
};

/**
 * Global hotkeys for the terminal command bar: Ctrl/Cmd+K and `/` (ignored
 * while typing). The hero's "Press / for terminal" hint dispatches `bk:terminal`.
 * Never opens while the entry intro is on screen.
 */
export function TerminalLauncher() {
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => {
      if (document.querySelector('[role="dialog"][aria-label="Intro"]')) return;
      returnFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("bk:terminal", show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bk:terminal", show);
    };
  }, []);

  if (!open) return null;
  // Portaled to <body> so it sits above the fixed nav (outside Home's stacking context).
  return createPortal(
    <Suspense fallback={null}>
      <TerminalPalette
        onClose={() => {
          setOpen(false);
          returnFocus.current?.focus?.({ preventScroll: true });
        }}
      />
    </Suspense>,
    document.body,
  );
}
