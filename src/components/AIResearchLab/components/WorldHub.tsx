import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { ROOMS, statusLabel, type Room } from "../data/rooms";
import { useMedia, usePauseWhenHidden, useRoomHotkeys } from "../lib/world-hooks";
import { WorldCore } from "./WorldCore";

const ORBIT_R = 330;
const FLY_MS = 600;
const FLY_SCALE = 2.2;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The AI World hub: the BK-AI core with the 7 rooms orbiting it on a tilted plane. */
export function WorldHub({
  roomOpen,
  onOpen,
}: {
  roomOpen: boolean;
  onOpen: (room: Room) => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const fine = useMedia("(pointer: fine)");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const flyRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const busy = useRef(false);
  const timer = useRef(0);
  const raf = useRef(0);
  const tgt = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });

  usePauseWhenHidden(rootRef);

  // Fit the 1100px-wide scene into the container.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => root.style.setProperty("--aw-s", Math.min(1, root.clientWidth / 880).toFixed(4));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  // The room closed: bring the scene back from the fly-in.
  useEffect(() => {
    if (roomOpen) return;
    const fly = flyRef.current;
    busy.current = false;
    if (!fly) return;
    fly.style.transition = "none";
    fly.style.transform = "";
    const id = requestAnimationFrame(() => {
      fly.style.transition = "";
    });
    return () => cancelAnimationFrame(id);
  }, [roomOpen]);

  const open = useCallback(
    (room: Room) => {
      if (busy.current) return;
      const stage = stageRef.current;
      const fly = flyRef.current;
      const tile = tileRefs.current[room.slug];
      if (reduced || !stage || !fly || !tile) {
        onOpen(room);
        return;
      }
      busy.current = true;
      const sr = stage.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      const dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2);
      const dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2);
      fly.style.transform = `translate(${-FLY_SCALE * dx}px, ${-FLY_SCALE * dy}px) scale(${FLY_SCALE})`;
      timer.current = window.setTimeout(() => onOpen(room), FLY_MS);
    },
    [onOpen, reduced],
  );

  useRoomHotkeys(!roomOpen, open);

  const parallax = fine && !reduced;
  // Eases the tilt toward the pointer with one rAF loop that stops when settled.
  const kick = () => {
    if (raf.current) return;
    const loop = () => {
      const dx = tgt.current.x - cur.current.x;
      const dy = tgt.current.y - cur.current.y;
      if (Math.abs(dx) < 0.002 && Math.abs(dy) < 0.002) {
        raf.current = 0;
        return;
      }
      cur.current.x += dx * 0.12;
      cur.current.y += dy * 0.12;
      const t = tiltRef.current;
      if (t) {
        t.style.setProperty("--aw-px", cur.current.x.toFixed(4));
        t.style.setProperty("--aw-py", cur.current.y.toFixed(4));
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!parallax || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tgt.current = {
      x: clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1),
      y: clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1),
    };
    kick();
  };
  const onLeave = () => {
    tgt.current = { x: 0, y: 0 };
    kick();
  };

  return (
    <div ref={rootRef} className="aw-hub" style={{ "--aw-r": `${ORBIT_R}px` } as CSSProperties}>
      <div ref={stageRef} className="aw-hubstage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div ref={flyRef} className="aw-fly">
          <div className="aw-world">
            <div className="aw-persp">
              <div ref={tiltRef} className="aw-tilt">
                <div className="aw-core3d">
                  <WorldCore />
                </div>

                <div className="aw-orbit">
                  <div className="aw-spin">
                    <div className="aw-plane" aria-hidden>
                      {ROOMS.map((r, i) => (
                        <i
                          key={r.slug}
                          className="aw-spoke"
                          style={{ "--a": `${-90 + (i * 360) / ROOMS.length}deg`, "--i": i } as CSSProperties}
                        >
                          <b />
                        </i>
                      ))}
                    </div>

                    {ROOMS.map((r, i) => {
                      const Icon = r.module.icon;
                      return (
                        <div
                          key={r.slug}
                          className="aw-st"
                          style={{ "--a": `${-90 + (i * 360) / ROOMS.length}deg` } as CSSProperties}
                        >
                          <div className="aw-st__a">
                            <button
                              type="button"
                              data-room={r.slug}
                              ref={(el) => {
                                tileRefs.current[r.slug] = el;
                              }}
                              aria-label={`${r.n}. ${r.name} — ${statusLabel(r.module)}`}
                              className="aw-tile"
                              onClick={() => open(r)}
                            >
                              <span className="aw-tile__top">
                                <span className="aw-tile__ic">
                                  <Icon strokeWidth={1.6} aria-hidden />
                                </span>
                                <span className="aw-tile__n" aria-hidden>
                                  {r.n}
                                </span>
                              </span>
                              <span className="aw-tile__name">{r.name}</span>
                              <span className="aw-tile__badge">
                                <span className="ai-lab-dot ai-lab-dot--cyan" />
                                {statusLabel(r.module)}
                              </span>
                              <span className="aw-desc">
                                <span>{r.module.description}</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile (<768px): no 3D hub. The core visual, then the 7 rooms as glowing cards. */
export function MobileRooms({ onOpen }: { onOpen: (room: Room) => void }) {
  useRoomHotkeys(true, onOpen);
  return (
    <div className="aw-mobile">
      <WorldCore className="aw-mobile__core" />
      <ul className="aw-mlist">
        {ROOMS.map((r) => {
          const Icon = r.module.icon;
          return (
            <li key={r.slug}>
              <button type="button" data-room={r.slug} className="aw-mcard" onClick={() => onOpen(r)}>
                <span className="aw-mcard__ic">
                  <Icon strokeWidth={1.6} aria-hidden />
                </span>
                <span className="aw-mcard__body">
                  <span className="aw-mcard__name">
                    {r.name}
                    <span className="aw-tile__badge">
                      <span className="ai-lab-dot ai-lab-dot--cyan" />
                      {statusLabel(r.module)}
                    </span>
                  </span>
                  <span className="aw-mcard__desc">{r.module.tagline}</span>
                </span>
                <span aria-hidden className="aw-mcard__n">
                  {r.n}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
