import { useEffect, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import { MORE_MODULES, ROOMS, statusLabel, type Room, type RoomSlug } from "../data/rooms";
import { AI_RESEARCH_MODULES } from "../data/modules";

function RoomList({
  activeSlug,
  onOpen,
  compact,
}: {
  activeSlug: RoomSlug | null;
  onOpen: (room: Room) => void;
  compact?: boolean;
}) {
  return (
    <>
      <ul className="aw-rail__list">
        {ROOMS.map((r) => {
          const Icon = r.module.icon;
          return (
            <li key={r.slug}>
              <button
                type="button"
                title={`${r.name} — ${statusLabel(r.module)} (press ${r.n})`}
                aria-current={activeSlug === r.slug ? "true" : undefined}
                className={`aw-rail__item${activeSlug === r.slug ? " is-active" : ""}`}
                onClick={() => onOpen(r)}
              >
                <span className="aw-rail__n" aria-hidden>
                  {r.n}
                </span>
                <Icon className="aw-rail__ic" strokeWidth={1.6} aria-hidden />
                <span className={compact ? "aw-rail__label" : "aw-rail__label aw-rail__label--rail"}>{r.name}</span>
                <span
                  aria-hidden
                  className={`ai-lab-dot ${r.module.status === "live" ? "ai-lab-dot--green" : "ai-lab-dot--cyan"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className={compact ? "aw-rail__more" : "aw-rail__more aw-rail__label--rail"}>More modules</h3>
      <ul className="aw-rail__list aw-rail__list--more">
        {MORE_MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <li key={m.id} className="aw-rail__mod" title={`${m.name} — ${statusLabel(m)}`}>
              <span className="aw-rail__modhead">
                <Icon className="aw-rail__ic" strokeWidth={1.6} aria-hidden />
                <span className={compact ? "aw-rail__label" : "aw-rail__label aw-rail__label--rail"}>
                  <b>{m.name}</b>
                  <em>{statusLabel(m)}</em>
                </span>
              </span>
              <span className={compact ? "aw-rail__moddesc" : "aw-rail__moddesc aw-rail__label--rail"}>
                {m.tagline}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Desktop: a slim fixed rail (icons only on tablet). */
export function WorldRail({
  activeSlug,
  onOpen,
}: {
  activeSlug: RoomSlug | null;
  onOpen: (room: Room) => void;
}) {
  return (
    <nav aria-label="AI World rooms" className="aw-rail">
      <RoomList activeSlug={activeSlug} onOpen={onOpen} />
    </nav>
  );
}

/** Mobile: a bottom "Rooms" button that opens a sheet. */
export function RoomsSheet({
  activeSlug,
  onOpen,
}: {
  activeSlug: RoomSlug | null;
  onOpen: (room: Room) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="aw-roomsbtn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Rooms
      </button>
      {open && (
        <div className="aw-sheet" role="dialog" aria-modal="true" aria-label="Rooms">
          <button type="button" aria-label="Close rooms" className="aw-sheet__scrim" onClick={() => setOpen(false)} />
          <div className="aw-sheet__panel">
            <div className="aw-sheet__head">
              <span>Rooms</span>
              <button ref={closeRef} type="button" className="aw-btn" aria-label="Close rooms" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <RoomList
              activeSlug={activeSlug}
              compact
              onOpen={(r) => {
                setOpen(false);
                onOpen(r);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** The telemetry, as a slim fixed bar: same values as the old Telemetry section. */
export function WorldStatusBar({ online }: { online: boolean }) {
  const liveCount = AI_RESEARCH_MODULES.filter((m) => m.status === "live").length;
  return (
    <div className="aw-statusbar" role="status" aria-label="System status">
      <div className="aw-statusbar__row">
        <span className="aw-statusbar__item aw-statusbar__item--ok" title={online ? "Core status — Core ready · watching for directives" : "Core status — Idle · awaiting directives"}>
          <span className="ai-lab-dot ai-lab-dot--green" />
          {online ? "ACTIVE" : "STANDBY"}
        </span>
        <span className="aw-statusbar__item" title={`Registered modules — ${liveCount} active · interactive previews`}>
          {AI_RESEARCH_MODULES.length} modules
        </span>
        <span className="aw-statusbar__item" title="Environment — Simulated · no production data">
          Synthetic
        </span>
        <span className="aw-statusbar__item" title="Data plane — No external model egress">
          Isolated
        </span>
        <span className="aw-statusbar__item" title="Build — Foundation scaffolding">
          v0.1
        </span>
        <span className="aw-statusbar__item" title="Locale — Private sandbox network">
          Local
        </span>
        <span className="aw-statusbar__item aw-statusbar__item--nominal">All systems nominal</span>
      </div>
    </div>
  );
}
