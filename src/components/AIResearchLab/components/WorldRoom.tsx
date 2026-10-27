import { lazy, Suspense, useEffect, useRef, type ComponentType, type LazyExoticComponent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { ROOMS, statusLabel, type Room, type RoomSlug } from "../data/rooms";

type PanelProps = { online?: boolean };

// Each room's panel loads on demand; the panels themselves are untouched.
const PANELS: Record<RoomSlug, LazyExoticComponent<ComponentType<PanelProps>>> = {
  "digital-world": lazy(() => import("./DigitalWorld").then((m) => ({ default: m.DigitalWorld }))),
  "talk-to-ai": lazy(() => import("./VoiceChat").then((m) => ({ default: m.VoiceChat }))),
  core: lazy(() => import("./CorePanel").then((m) => ({ default: m.CorePanel }))),
  perception: lazy(() => import("./PerceptionPanel").then((m) => ({ default: m.PerceptionPanel }))),
  memory: lazy(() => import("./MemoryPanel").then((m) => ({ default: m.MemoryPanel }))),
  "tool-calling": lazy(() => import("./ToolCallingPanel").then((m) => ({ default: m.ToolCallingPanel }))),
  experiments: lazy(() => import("./ExperimentChamber").then((m) => ({ default: m.ExperimentChamber }))),
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A room: a full-screen overlay with a consistent shell (header from the
 * matching module card, the existing panel as the body, back / prev / next).
 */
export function WorldRoom({
  room,
  online,
  onClose,
  onGo,
}: {
  room: Room;
  online: boolean;
  onClose: () => void;
  onGo: (room: Room) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLButtonElement | null>(null);
  const Panel = PANELS[room.slug];
  const Icon = room.module.icon;
  const i = ROOMS.findIndex((r) => r.slug === room.slug);
  const prev = ROOMS[(i - 1 + ROOMS.length) % ROOMS.length];
  const next = ROOMS[(i + 1) % ROOMS.length];

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = 0;
  }, [room.slug]);

  // Esc closes; Tab stays inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = ref.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aw-room-title"
      className="aw-room"
    >
      <div className="aw-room__bar">
        <button ref={backRef} type="button" onClick={onClose} className="aw-btn">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to core
        </button>
        <span className="aw-room__count" aria-hidden>
          {room.n} / {ROOMS.length}
        </span>
        <div className="aw-room__nav">
          <button type="button" onClick={() => onGo(prev)} className="aw-btn" aria-label={`Previous room: ${prev.name}`}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="aw-room__navlabel">Prev</span>
          </button>
          <button type="button" onClick={() => onGo(next)} className="aw-btn" aria-label={`Next room: ${next.name}`}>
            <span className="aw-room__navlabel">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="aw-room__inner">
        <header className="aw-room__head">
          <div className="flex flex-wrap items-center gap-3">
            <span className="aw-room__icon">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="aw-room-title" className="aw-room__title">
              {room.name}
            </h2>
            <span className="ai-lab-chip ai-lab-chip--cyan">
              <span className="ai-lab-dot ai-lab-dot--cyan" />
              {statusLabel(room.module)}
            </span>
          </div>
          <p className="aw-room__desc">{room.module.description}</p>
          <ul className="aw-room__bullets">
            {room.module.comingSoon.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </header>

        <div className="aw-room__body">
          <Suspense fallback={<div className="aw-room__loading">Loading {room.name}…</div>}>
            <Panel online={online} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
